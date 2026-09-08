/** Local Excel batch import for Part / Backbone / Plasmid templates. */

const XLSX = require('xlsx');
const { prisma } = require('./db');
const {
  resolvePartTypeId,
} = require('./datasetBrowseStore');

const HEADER_SIGNATURES = Object.freeze({
  part: 'PartName',
  backbone: 'BackboneName',
  plasmid: 'PlasmidName',
});

const EMPTY_SCAR = Object.freeze({
  bsmbi: '',
  bsai: '',
  bbsi: '',
  aari: '',
  sapi: '',
});

class BatchImportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BatchImportError';
  }
}

function cellToString(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return String(value).trim();
}

function truncate(value, maxLen) {
  const text = cellToString(value);
  if (!maxLen || text.length <= maxLen) {
    return text;
  }
  return text.slice(0, maxLen);
}

function parseNameList(value) {
  const text = cellToString(value);
  if (!text) {
    return [];
  }
  return [...new Set(text.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))];
}

function normalizeHeaderKey(value) {
  return cellToString(value).replace(/\s+/g, '');
}

function detectDatasetTypeFromHeaders(headers) {
  const normalized = new Set(headers.map(normalizeHeaderKey));
  if (normalized.has(HEADER_SIGNATURES.part)) {
    return 'part';
  }
  if (normalized.has(HEADER_SIGNATURES.backbone)) {
    return 'backbone';
  }
  if (normalized.has(HEADER_SIGNATURES.plasmid)) {
    return 'plasmid';
  }
  return null;
}

function buildHeaderIndex(headerRow) {
  const index = {};
  (headerRow || []).forEach((header, colIndex) => {
    const key = normalizeHeaderKey(header);
    if (key && index[key] == null) {
      index[key] = colIndex;
    }
  });
  return index;
}

function readCell(row, headerIndex, key) {
  const colIndex = headerIndex[key];
  if (colIndex == null) {
    return '';
  }
  return cellToString(row[colIndex]);
}

function isEmptyRow(row) {
  if (!Array.isArray(row) || row.length === 0) {
    return true;
  }
  return row.every((cell) => cellToString(cell) === '');
}

function mapPartRow(row, headerIndex, excelRowNumber) {
  return {
    excelRowNumber,
    name: readCell(row, headerIndex, 'PartName'),
    alias: readCell(row, headerIndex, 'Alias'),
    type: readCell(row, headerIndex, 'Type'),
    sequence: readCell(row, headerIndex, 'Sequence'),
    species: readCell(row, headerIndex, 'Species'),
    note: readCell(row, headerIndex, 'Note'),
  };
}

function mapBackboneRow(row, headerIndex, excelRowNumber) {
  return {
    excelRowNumber,
    name: readCell(row, headerIndex, 'BackboneName'),
    alias: readCell(row, headerIndex, 'Alias'),
    sequence: readCell(row, headerIndex, 'Sequence'),
    species: readCell(row, headerIndex, 'Species'),
    note: readCell(row, headerIndex, 'Note'),
  };
}

function mapPlasmidRow(row, headerIndex, excelRowNumber) {
  return {
    excelRowNumber,
    name: readCell(row, headerIndex, 'PlasmidName'),
    alias: readCell(row, headerIndex, 'Alias'),
    level: readCell(row, headerIndex, 'Level'),
    sequence: readCell(row, headerIndex, 'Sequence'),
    note: readCell(row, headerIndex, 'Note'),
    parentPart: readCell(row, headerIndex, 'ParentPart'),
    parentBackbone: readCell(row, headerIndex, 'ParentBackbone'),
    parentPlasmid: readCell(row, headerIndex, 'ParentPlasmid'),
    parentSourceNote: readCell(row, headerIndex, 'ParentSourceNote'),
  };
}

function parseBatchWorkbook(filePath) {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath, { cellDates: false, raw: false });
  } catch (error) {
    throw new BatchImportError(`Failed to read Excel file: ${error.message || 'unknown error'}`);
  }

  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    throw new BatchImportError('Excel file has no worksheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new BatchImportError('Excel sheet is empty');
  }

  const headerRow = matrix[0];
  const datasetType = detectDatasetTypeFromHeaders(headerRow);
  if (!datasetType) {
    throw new BatchImportError(
      'Unrecognized template. Expected PartName, BackboneName, or PlasmidName header.',
    );
  }

  const headerIndex = buildHeaderIndex(headerRow);
  const mapper = datasetType === 'part'
    ? mapPartRow
    : datasetType === 'backbone'
      ? mapBackboneRow
      : mapPlasmidRow;

  const rows = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i];
    if (isEmptyRow(row)) {
      continue;
    }
    rows.push(mapper(row, headerIndex, i + 1));
  }

  if (rows.length === 0) {
    throw new BatchImportError('No data rows found in Excel file');
  }

  return { datasetType, rows };
}

function resolveUploaderName(user) {
  const name = truncate(user?.name || user?.email || 'unknown', 50);
  return name || 'unknown';
}

function formatRowError(excelRowNumber, name, message) {
  const label = name ? `"${name}"` : '(unnamed)';
  return `Row ${excelRowNumber} ${label}: ${message}`;
}

async function createPartRow(row, userName, conflictPolicy) {
  const name = truncate(row.name, 100);
  if (!name) {
    throw new Error('PartName is required');
  }
  const existing = await prisma.partTable.findFirst({ where: { name } });
  if (existing && conflictPolicy === 'skip') return 'skipped';
  if (!existing && !row.type) throw new Error('Type is required');
  const typeId = row.type ? resolvePartTypeId(row.type) : null;
  if (row.type && typeId == null) {
    throw new Error('Invalid or missing Type (use Promoter, CDS, Terminator, RBS, or P+R)');
  }
  if (existing && conflictPolicy !== 'update') {
    throw new Error('Part name already exists');
  }

  const now = new Date();
  const sequence = String(row.sequence);

  if (existing) {
    const data = { updateDate: now, deletedAt: null, syncStatus: 'active' };
    if (row.alias) data.alias = truncate(row.alias, 100);
    if (row.type) data.type = typeId;
    if (row.sequence) { data.level0Sequence = sequence; data.lengthInLevel0 = sequence.length; }
    if (row.species) data.sourceOrganism = row.species;
    if (row.note) data.note = row.note;
    await prisma.partTable.update({ where: { partId: existing.partId }, data });
    return 'updated';
  }
  await prisma.$transaction(async (tx) => {
    const created = await tx.partTable.create({
      data: {
        name,
        alias: truncate(row.alias, 100) || null,
        type: typeId,
        level0Sequence: sequence,
        lengthInLevel0: sequence.length,
        sourceOrganism: row.species || null,
        note: row.note || null,
        user: truncate(userName, 50) || null,
        uploadDate: now,
        updateDate: now,
      },
    });

    await tx.partScarTable.create({
      data: {
        ...EMPTY_SCAR,
        partId: created.partId,
      },
    });
  });
  return 'created';
}

async function createBackboneRow(row, userName, conflictPolicy) {
  const name = truncate(row.name, 20);
  if (!name) {
    throw new Error('BackboneName is required');
  }
  const existing = await prisma.backboneTable.findFirst({ where: { name } });
  if (existing && conflictPolicy === 'skip') return 'skipped';
  if (existing && conflictPolicy !== 'update') {
    throw new Error('Backbone name already exists');
  }

  const now = new Date();
  const sequence = String(row.sequence);

  if (existing) {
    const data = { updateDate: now, deletedAt: null, syncStatus: 'active' };
    if (row.alias) data.alias = truncate(row.alias, 500);
    if (row.sequence) { data.sequence = sequence; data.length = sequence.length; }
    if (row.species) data.species = truncate(row.species, 50);
    if (row.note) data.notes = row.note;
    await prisma.backboneTable.update({ where: { id: existing.id }, data });
    return 'updated';
  }
  await prisma.$transaction(async (tx) => {
    const created = await tx.backboneTable.create({
      data: {
        name,
        alias: truncate(row.alias, 500) || null,
        sequence,
        length: sequence.length,
        species: truncate(row.species, 50) || null,
        notes: row.note || null,
        user: truncate(userName, 50) || 'unknown',
        uploadDate: now,
        updateDate: now,
      },
    });

    await tx.backboneScarTable.create({
      data: {
        ...EMPTY_SCAR,
        backboneId: created.id,
      },
    });
  });
  return 'created';
}

async function resolveParentIds(tx, names, model, idField, label) {
  const ids = [];
  for (const parentName of names) {
    const existing = await tx[model].findFirst({
      where: { name: parentName },
      select: { [idField]: true, name: true },
    });
    if (!existing) {
      throw new Error(`${label} not found: ${parentName}`);
    }
    ids.push(existing[idField]);
  }
  return ids;
}

async function createPlasmidRow(row, userName, conflictPolicy) {
  const name = truncate(row.name, 20);
  if (!name) {
    throw new Error('PlasmidName is required');
  }
  const existing = await prisma.plasmidNeed.findFirst({ where: { name } });
  if (existing && conflictPolicy === 'skip') return 'skipped';
  const level = truncate(row.level, 10);
  if (!existing && !level) throw new Error('Level is required');
  if (existing && conflictPolicy !== 'update') {
    throw new Error('Plasmid name already exists');
  }

  const parentPartNames = parseNameList(row.parentPart);
  const parentBackboneNames = parseNameList(row.parentBackbone);
  const parentPlasmidNames = parseNameList(row.parentPlasmid);
  const now = new Date();
  const sequence = String(row.sequence);

  await prisma.$transaction(async (tx) => {
    const partIds = await resolveParentIds(tx, parentPartNames, 'partTable', 'partId', 'ParentPart');
    const backboneIds = await resolveParentIds(
      tx,
      parentBackboneNames,
      'backboneTable',
      'id',
      'ParentBackbone',
    );
    const plasmidIds = await resolveParentIds(
      tx,
      parentPlasmidNames,
      'plasmidNeed',
      'plasmidId',
      'ParentPlasmid',
    );

    if (existing) {
      const data = { updateDate: now, deletedAt: null, syncStatus: 'active' };
      if (row.alias) data.alias = truncate(row.alias, 500);
      if (level) data.level = level;
      if (row.sequence) { data.sequenceConfirm = sequence; data.length = sequence.length; }
      if (row.note) data.note = truncate(row.note, 500);
      if (row.parentSourceNote) data.customParentInformation = row.parentSourceNote;
      await tx.plasmidNeed.update({ where: { plasmidId: existing.plasmidId }, data });
      if (row.parentPart) {
        await tx.parentPartTable.deleteMany({ where: { sonPlasmidId: existing.plasmidId } });
        if (partIds.length) await tx.parentPartTable.createMany({ data: partIds.map((parentPartId) => ({ parentPartId, sonPlasmidId: existing.plasmidId })) });
      }
      if (row.parentBackbone) {
        await tx.parentBackboneTable.deleteMany({ where: { sonPlasmidId: existing.plasmidId } });
        if (backboneIds.length) await tx.parentBackboneTable.createMany({ data: backboneIds.map((parentBackboneId) => ({ parentBackboneId, sonPlasmidId: existing.plasmidId })) });
      }
      if (row.parentPlasmid) {
        await tx.parentPlasmidTable.deleteMany({ where: { sonPlasmidId: existing.plasmidId } });
        if (plasmidIds.length) await tx.parentPlasmidTable.createMany({ data: plasmidIds.map((parentPlasmidId) => ({ parentPlasmidId, sonPlasmidId: existing.plasmidId })) });
      }
      return;
    }
    const created = await tx.plasmidNeed.create({
      data: {
        name,
        alias: truncate(row.alias, 500) || null,
        level,
        sequenceConfirm: sequence,
        length: sequence.length,
        note: truncate(row.note, 500) || null,
        customParentInformation: row.parentSourceNote || null,
        user: truncate(userName, 100) || null,
        uploadDate: now,
        updateDate: now,
      },
    });

    await tx.plasmidScarTable.create({
      data: {
        ...EMPTY_SCAR,
        plasmidId: created.plasmidId,
      },
    });

    if (partIds.length > 0) {
      await tx.parentPartTable.createMany({
        data: partIds.map((parentPartId) => ({
          parentPartId,
          sonPlasmidId: created.plasmidId,
        })),
      });
    }

    if (backboneIds.length > 0) {
      await tx.parentBackboneTable.createMany({
        data: backboneIds.map((parentBackboneId) => ({
          parentBackboneId,
          sonPlasmidId: created.plasmidId,
        })),
      });
    }

    if (plasmidIds.length > 0) {
      await tx.parentPlasmidTable.createMany({
        data: plasmidIds.map((parentPlasmidId) => ({
          parentPlasmidId,
          sonPlasmidId: created.plasmidId,
        })),
      });
    }
  });
  return existing ? 'updated' : 'created';
}

async function importBatchRows({ datasetType, rows, user, conflictPolicy = '' } = {}) {
  if (!datasetType || !['part', 'backbone', 'plasmid'].includes(datasetType)) {
    throw new BatchImportError('Invalid datasetType');
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BatchImportError('No data rows to import');
  }

  const userName = resolveUploaderName(user);
  const errors = [];
  const warnings = [];
  let created = 0;
  let failed = 0;
  let updated = 0;
  let skipped = 0;
  const seenNames = new Set();

  const createRow = datasetType === 'part'
    ? createPartRow
    : datasetType === 'backbone'
      ? createBackboneRow
      : createPlasmidRow;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const nameKey = cellToString(row.name).toLowerCase();

    try {
      if (nameKey && seenNames.has(nameKey)) {
        throw new Error('Duplicate name within the uploaded file');
      }
      const action = await createRow(row, userName, conflictPolicy);
      if (nameKey) {
        seenNames.add(nameKey);
      }
      if (action === 'updated') updated += 1;
      else if (action === 'skipped') skipped += 1;
      else {
        created += 1;
        if (!row.sequence) {
          warnings.push(formatRowError(
            row.excelRowNumber || index + 2,
            cellToString(row.name),
            'Sequence is empty; please add it later',
          ));
        }
      }
    } catch (error) {
      failed += 1;
      errors.push(formatRowError(
        row.excelRowNumber || index + 2,
        cellToString(row.name),
        error?.message || 'Import failed',
      ));
    }
  }

  const total = rows.length;
  const progress = total > 0 ? Math.round(((created + updated + skipped + failed) / total) * 100) : 100;

  return {
    datasetType,
    created,
    failed,
    updated,
    skipped,
    total,
    errors,
    warnings,
    progress,
  };
}

async function runBatchImportFromFile(filePath, user, conflictPolicy = '') {
  const { datasetType, rows } = parseBatchWorkbook(filePath);
  const result = await importBatchRows({ datasetType, rows, user, conflictPolicy });
  return result;
}

module.exports = {
  BatchImportError,
  parseBatchWorkbook,
  importBatchRows,
  runBatchImportFromFile,
};
