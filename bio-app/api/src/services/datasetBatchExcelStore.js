const fs = require('fs/promises');
const path = require('path');
const zlib = require('zlib');

class DatasetBatchExcelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatasetBatchExcelError';
  }
}

function decodeXml(value) {
  return String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function attrValue(attrs, name) {
  const match = String(attrs || '').match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function columnIndex(cellRef) {
  const letters = String(cellRef || '').replace(/[^A-Z]/gi, '').toUpperCase();
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }
  return index - 1;
}

function readZipEntries(buffer) {
  let eocdOffset = -1;
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new DatasetBatchExcelError('Batch upload only supports .xlsx template files');
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();
  let offset = centralDirOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new DatasetBatchExcelError('Invalid .xlsx file structure');
    }

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    let content;
    if (method === 0) {
      content = compressed;
    } else if (method === 8) {
      content = zlib.inflateRawSync(compressed);
    } else {
      throw new DatasetBatchExcelError('Unsupported .xlsx compression method');
    }

    entries.set(name, content);
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(xml) {
  if (!xml) {
    return [];
  }

  const strings = [];
  const siPattern = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let siMatch;
  while ((siMatch = siPattern.exec(xml))) {
    const parts = [];
    const textPattern = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    let textMatch;
    while ((textMatch = textPattern.exec(siMatch[1]))) {
      parts.push(decodeXml(textMatch[1]));
    }
    strings.push(parts.join(''));
  }
  return strings;
}

function parseWorksheetRows(xml, sharedStrings) {
  const rows = [];
  const rowPattern = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(xml))) {
    const values = [];
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowMatch[1]))) {
      const attrs = cellMatch[1];
      const cellBody = cellMatch[2];
      const index = columnIndex(attrValue(attrs, 'r'));
      const type = attrValue(attrs, 't');
      const valueMatch = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
      const inlineMatch = cellBody.match(/<t\b[^>]*>([\s\S]*?)<\/t>/i);
      let value = valueMatch ? decodeXml(valueMatch[1]) : '';
      if (type === 's') {
        value = sharedStrings[Number.parseInt(value, 10)] ?? '';
      } else if (type === 'inlineStr' && inlineMatch) {
        value = decodeXml(inlineMatch[1]);
      }
      if (index >= 0) {
        values[index] = String(value ?? '').trim();
      }
    }
    if (values.some(Boolean)) {
      rows.push(values);
    }
  }

  return rows;
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function detectDatasetType(headers) {
  const normalized = new Set(headers.map(normalizeHeader));
  if (normalized.has('partname')) {
    return 'part';
  }
  if (normalized.has('backbonename')) {
    return 'backbone';
  }
  if (normalized.has('plasmidname')) {
    return 'plasmid';
  }
  throw new DatasetBatchExcelError('Unable to detect dataset type from Excel headers');
}

function rowValue(row, headerIndex, names) {
  for (const name of names) {
    const index = headerIndex.get(normalizeHeader(name));
    if (index !== undefined) {
      return row[index] || '';
    }
  }
  return '';
}

function splitList(value) {
  return String(value || '')
    .split(/[;,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRow(datasetType, row, headerIndex) {
  if (datasetType === 'part') {
    return {
      name: rowValue(row, headerIndex, ['PartName', 'Name']),
      alias: rowValue(row, headerIndex, ['Alias']),
      sourceOrganism: rowValue(row, headerIndex, ['Species', 'SourceOrganism']),
      type: rowValue(row, headerIndex, ['Type']) || 'promoter',
      Level0Sequence: rowValue(row, headerIndex, ['Sequence', 'Level0Sequence']),
      note: rowValue(row, headerIndex, ['Note', 'Notes']),
    };
  }

  if (datasetType === 'backbone') {
    return {
      name: rowValue(row, headerIndex, ['BackboneName', 'Name']),
      alias: rowValue(row, headerIndex, ['Alias']),
      sequence: rowValue(row, headerIndex, ['Sequence']),
      species: rowValue(row, headerIndex, ['Species']),
      note: rowValue(row, headerIndex, ['Note', 'Notes']),
    };
  }

  const parentInfo = {
    parentPart: rowValue(row, headerIndex, ['ParentPart']),
    parentBackbone: rowValue(row, headerIndex, ['ParentBackbone']),
    parentPlasmid: rowValue(row, headerIndex, ['ParentPlasmid']),
    parentSourceNote: rowValue(row, headerIndex, ['ParentSourceNote']),
  };
  const customParentInformation = Object.entries(parentInfo)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return {
    name: rowValue(row, headerIndex, ['PlasmidName', 'Name']),
    alias: rowValue(row, headerIndex, ['Alias']),
    level: rowValue(row, headerIndex, ['Level']),
    sequence: rowValue(row, headerIndex, ['Sequence', 'SequenceConfirm']),
    note: rowValue(row, headerIndex, ['Note', 'Notes']),
    customParentInformation,
    ori: splitList(rowValue(row, headerIndex, ['Ori'])),
    marker: splitList(rowValue(row, headerIndex, ['Marker'])),
  };
}

async function parseBatchExcelUpload(file) {
  if (!file?.path) {
    throw new DatasetBatchExcelError('Batch upload file is missing');
  }
  if (path.extname(file.name || file.originalName || file.path).toLowerCase() !== '.xlsx') {
    throw new DatasetBatchExcelError('Batch upload only supports .xlsx template files');
  }

  const buffer = await fs.readFile(file.path);
  const entries = readZipEntries(buffer);
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) {
    throw new DatasetBatchExcelError('Excel template is missing sheet1');
  }

  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') || '');
  const rows = parseWorksheetRows(sheet.toString('utf8'), sharedStrings);
  if (rows.length < 2) {
    throw new DatasetBatchExcelError('Excel template contains no data rows');
  }

  const headers = rows[0].map((header) => String(header || '').trim());
  const datasetType = detectDatasetType(headers);
  const headerIndex = new Map(headers.map((header, index) => [normalizeHeader(header), index]));
  const records = rows.slice(1)
    .map((row) => mapRow(datasetType, row, headerIndex))
    .filter((record) => Object.values(record).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return String(value || '').trim();
    }));

  if (records.length === 0) {
    throw new DatasetBatchExcelError('Excel template contains no data rows');
  }

  return {
    datasetType,
    parserResult: {
      status: 'completed',
      result: {
        total: records.length,
        results: records.map((data) => ({ success: true, data })),
      },
    },
  };
}

module.exports = {
  DatasetBatchExcelError,
  parseBatchExcelUpload,
};
