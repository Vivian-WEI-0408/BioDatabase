/** Browse queries and metadata for legacy component-library datasets (Part / Backbone / Plasmid). */

const { prisma } = require('./db');
const { sortList } = require('../lib/sort');

const DATASET_TYPES = Object.freeze(['part', 'backbone', 'plasmid']);

const PART_TYPE_BY_ID = Object.freeze({
  1: 'Promoter',
  2: 'CDS',
  3: 'Terminator',
  4: 'RBS',
  5: 'P+R',
});

const PART_TYPE_BY_LABEL = Object.freeze(
  Object.fromEntries(Object.entries(PART_TYPE_BY_ID).map(([id, label]) => [label.toLowerCase(), Number(id)])),
);

/** Display enzyme name -> Prisma scar-table field name. */
const SCAR_ENZYME_FIELDS = Object.freeze({
  BsmBI: 'bsmbi',
  BsaI: 'bsai',
  BbsI: 'bbsi',
  AarI: 'aari',
  SapI: 'sapi',
});

const SCAR_ENZYME_NAMES = Object.freeze(Object.keys(SCAR_ENZYME_FIELDS));

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const BROWSE_META = Object.freeze({
  part: {
    browseLabel: 'Parts',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'alias', label: 'Alias' },
      { key: 'type', label: 'Type' },
      { key: 'sourceOrganism', label: 'Source Organism' },
      { key: 'reference', label: 'Reference' },
      { key: 'tag', label: 'Tag' },
    ],
    sortKeys: ['name', 'alias', 'type', 'sourceOrganism', 'reference', 'tag'],
    filterGroupDefs: [
      { id: 'type', title: 'Part Type', expanded: true },
      { id: 'enzyme', title: 'Enzyme', expanded: true },
      { id: 'scar', title: 'Scar', expanded: true },
    ],
    defaultFilters: { type: [], enzyme: [], scar: [] },
  },
  backbone: {
    browseLabel: 'Backbones',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'alias', label: 'Alias' },
      { key: 'marker', label: 'Marker' },
      { key: 'ori', label: 'Ori' },
      { key: 'species', label: 'Species' },
      { key: 'scar', label: 'Scar' },
      { key: 'tag', label: 'Tag' },
    ],
    sortKeys: ['name', 'alias', 'marker', 'ori', 'species', 'scar', 'tag'],
    filterGroupDefs: [
      { id: 'ori', title: 'Ori', expanded: true },
      { id: 'marker', title: 'Marker', expanded: true },
      { id: 'enzyme', title: 'Enzyme', expanded: true },
      { id: 'scar', title: 'Scar', expanded: true },
    ],
    defaultFilters: { ori: [], marker: [], enzyme: [], scar: [] },
  },
  plasmid: {
    browseLabel: 'Plasmids',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'alias', label: 'Alias' },
      { key: 'oriInfo', label: 'Ori' },
      { key: 'markerInfo', label: 'Marker' },
      { key: 'level', label: 'Level' },
      { key: 'scar', label: 'Scar' },
      { key: 'tag', label: 'Tag' },
    ],
    sortKeys: ['name', 'alias', 'oriInfo', 'markerInfo', 'level', 'scar', 'tag'],
    filterGroupDefs: [
      { id: 'ori', title: 'Ori', expanded: true },
      { id: 'marker', title: 'Marker', expanded: true },
      { id: 'enzyme', title: 'Enzyme', expanded: true },
      { id: 'scar', title: 'Scar', expanded: true },
    ],
    defaultFilters: { ori: [], marker: [], enzyme: [], scar: [] },
  },
});

const SCAR_MODEL_BY_DATASET_TYPE = Object.freeze({
  part: 'partScarTable',
  backbone: 'backboneScarTable',
  plasmid: 'plasmidScarTable',
});

const SCAR_ID_FIELD_BY_DATASET_TYPE = Object.freeze({
  part: 'partId',
  backbone: 'backboneId',
  plasmid: 'plasmidId',
});

const CULTURE_MODEL_BY_DATASET_TYPE = Object.freeze({
  backbone: 'backboneCultureFunction',
  plasmid: 'plasmidCultureFunction',
});

const CULTURE_PARENT_FIELD_BY_DATASET_TYPE = Object.freeze({
  backbone: 'backboneId',
  plasmid: 'plasmidId',
});

function normalizeDatasetType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!DATASET_TYPES.includes(normalized)) {
    return null;
  }
  return normalized;
}

function resolvePartTypeLabel(typeId) {
  return PART_TYPE_BY_ID[typeId] || null;
}

function resolvePartTypeId(label) {
  if (label == null || label === '') {
    return null;
  }
  if (typeof label === 'number' && PART_TYPE_BY_ID[label]) {
    return label;
  }
  const numeric = Number(label);
  if (Number.isInteger(numeric) && PART_TYPE_BY_ID[numeric]) {
    return numeric;
  }
  return PART_TYPE_BY_LABEL[String(label).trim().toLowerCase()] ?? null;
}

function resolveScarFieldForEnzyme(enzymeName) {
  return SCAR_ENZYME_FIELDS[enzymeName] || null;
}

function isScarEnzymeName(enzymeName) {
  return Object.prototype.hasOwnProperty.call(SCAR_ENZYME_FIELDS, enzymeName);
}

function resolvePrismaModelName(datasetType) {
  const normalized = normalizeDatasetType(datasetType);
  const map = {
    part: 'partTable',
    backbone: 'backboneTable',
    plasmid: 'plasmidNeed',
  };
  return normalized ? map[normalized] : null;
}

function pickFilterValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value == null) {
    return [];
  }
  const normalized = String(value).trim();
  return normalized ? [normalized] : [];
}

function pickFilterValue(value) {
  const values = pickFilterValues(value);
  return values[0] || '';
}

function resolvePartTypeIds(filters = {}) {
  const rawValues = pickFilterValues(filters.type);
  const ids = rawValues
    .map((value) => resolvePartTypeId(value))
    .filter((value) => value != null);
  return [...new Set(ids)];
}

function splitSearchKeywords(search) {
  return String(search || '').trim().split(/\s+/).filter(Boolean);
}

function buildNameSearchWhere(search) {
  const keywords = splitSearchKeywords(search);
  if (keywords.length === 0) {
    return null;
  }

  return {
    AND: keywords.map((keyword) => ({
      OR: [
        { name: { contains: keyword } },
        { alias: { contains: keyword } },
      ],
    })),
  };
}

function intersectIdLists(...lists) {
  const active = lists.filter((list) => list != null);
  if (active.length === 0) {
    return null;
  }

  let result = new Set(active[0]);
  for (let index = 1; index < active.length; index += 1) {
    const next = new Set(active[index]);
    result = new Set([...result].filter((id) => next.has(id)));
  }

  return [...result];
}

function unionIdLists(...lists) {
  const active = lists.filter((list) => list != null);
  if (active.length === 0) {
    return null;
  }

  const result = new Set();
  active.forEach((list) => {
    list.forEach((id) => result.add(id));
  });
  return [...result];
}

function formatDefaultScar(scarRecord) {
  if (!scarRecord) {
    return 'No Sequence';
  }
  return `${scarRecord.bsai}/${scarRecord.bbsi}`;
}

function extractCultureValues(cultureFunctions, functionType) {
  return cultureFunctions
    .filter((item) => item.functionType === functionType)
    .map((item) => item.functionContent)
    .filter(Boolean);
}

function normalizeSortDir(sortDir) {
  return sortDir === 'desc' ? 'desc' : 'asc';
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : DEFAULT_PAGE;
}

function normalizePageSize(value) {
  const pageSize = Number.parseInt(value, 10);
  return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
}

function buildPagination(page, pageSize, totalCount) {
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const offset = (page - 1) * pageSize;

  return {
    currentPage: page,
    totalPages,
    totalCount,
    pageSize,
    offset,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

function getBrowseConfig(datasetType) {
  const normalized = normalizeDatasetType(datasetType);
  if (!normalized) {
    return null;
  }

  const meta = BROWSE_META[normalized];
  return {
    datasetType: normalized,
    browseLabel: meta.browseLabel,
    columns: meta.columns.map((column) => ({ ...column })),
    filterGroups: meta.filterGroupDefs.map((group) => ({
      ...group,
      options: [],
    })),
    defaultFilters: { ...meta.defaultFilters },
    sortKeys: [...meta.sortKeys],
  };
}

async function getDistinctScarValues(datasetType, enzyme) {
  const normalized = normalizeDatasetType(datasetType);
  const scarModel = SCAR_MODEL_BY_DATASET_TYPE[normalized];
  const field = resolveScarFieldForEnzyme(enzyme);
  if (!scarModel || !field) {
    return [];
  }

  const rows = await prisma[scarModel].findMany({
    select: { [field]: true },
    distinct: [field],
    orderBy: { [field]: 'asc' },
  });

  return rows
    .map((row) => row[field])
    .filter((value) => value != null && String(value).trim() !== '');
}

async function getDistinctCultureValues(datasetType, functionType) {
  const normalized = normalizeDatasetType(datasetType);
  const cultureModel = CULTURE_MODEL_BY_DATASET_TYPE[normalized];
  if (!cultureModel) {
    return [];
  }

  const rows = await prisma[cultureModel].findMany({
    where: { functionType },
    select: { functionContent: true },
    distinct: ['functionContent'],
    orderBy: { functionContent: 'asc' },
  });

  return rows
    .map((row) => row.functionContent)
    .filter((value) => value != null && String(value).trim() !== '');
}

async function listBrowseFilterOptions(datasetType, options = {}) {
  const normalized = normalizeDatasetType(datasetType);
  if (!normalized) {
    return null;
  }

  const enzyme = pickFilterValue(options.enzyme);
  const meta = BROWSE_META[normalized];
  const result = {};

  meta.filterGroupDefs.forEach((group) => {
    result[group.id] = [];
  });

  if (normalized === 'part') {
    result.type = Object.values(PART_TYPE_BY_ID);
    result.enzyme = [...SCAR_ENZYME_NAMES];
    result.scar = await getDistinctScarValues(normalized, enzyme || 'BsaI');
    return result;
  }

  result.enzyme = [...SCAR_ENZYME_NAMES];
  result.ori = await getDistinctCultureValues(normalized, 'ori');
  result.marker = await getDistinctCultureValues(normalized, 'marker');
  result.scar = await getDistinctScarValues(normalized, enzyme || 'BsaI');
  return result;
}

async function getScarFilteredIds(datasetType, enzyme, scar) {
  if (!enzyme) {
    return null;
  }

  const normalized = normalizeDatasetType(datasetType);
  const scarModel = SCAR_MODEL_BY_DATASET_TYPE[normalized];
  const idField = SCAR_ID_FIELD_BY_DATASET_TYPE[normalized];
  const field = resolveScarFieldForEnzyme(enzyme);
  if (!scarModel || !field) {
    return [];
  }

  const rows = await prisma[scarModel].findMany({
    where: { [field]: scar ?? '' },
    select: { [idField]: true },
  });

  return rows.map((row) => row[idField]);
}

async function getCultureFilteredIds(datasetType, filters = {}) {
  const normalized = normalizeDatasetType(datasetType);
  const cultureModel = CULTURE_MODEL_BY_DATASET_TYPE[normalized];
  const parentField = CULTURE_PARENT_FIELD_BY_DATASET_TYPE[normalized];
  if (!cultureModel) {
    return null;
  }

  const oriValues = pickFilterValues(filters.ori);
  const markerValues = pickFilterValues(filters.marker);
  let oriIds = null;
  let markerIds = null;

  if (oriValues.length > 0) {
    const rows = await prisma[cultureModel].findMany({
      where: {
        functionType: 'ori',
        functionContent: { in: oriValues },
      },
      select: { [parentField]: true },
    });
    oriIds = [...new Set(rows.map((row) => row[parentField]))];
  }

  if (markerValues.length > 0) {
    const rows = await prisma[cultureModel].findMany({
      where: {
        functionType: 'marker',
        functionContent: { in: markerValues },
      },
      select: { [parentField]: true },
    });
    markerIds = [...new Set(rows.map((row) => row[parentField]))];
  }

  if (oriValues.length > 0 && markerValues.length > 0) {
    return intersectIdLists(oriIds, markerIds);
  }

  return unionIdLists(oriIds, markerIds);
}

function formatPartRow(row, scarOverride) {
  return {
    id: row.partId,
    partId: row.partId,
    name: row.name ?? '',
    alias: row.alias ?? '',
    type: resolvePartTypeLabel(row.type) ?? String(row.type ?? ''),
    sourceOrganism: row.sourceOrganism ?? '',
    reference: row.reference ?? '',
    tag: row.tag ?? '',
    scar: scarOverride ?? formatDefaultScar(row.scar),
  };
}

function formatBackboneRow(row, scarOverride) {
  const cultureFunctions = row.cultureFunctions || [];
  return {
    id: row.id,
    name: row.name ?? '',
    alias: row.alias ?? '',
    marker: extractCultureValues(cultureFunctions, 'marker'),
    ori: extractCultureValues(cultureFunctions, 'ori'),
    species: row.species ?? '',
    scar: scarOverride ?? formatDefaultScar(row.scar),
    tag: row.tag ?? '',
  };
}

function formatPlasmidRow(row, scarOverride) {
  const cultureFunctions = row.cultureFunctions || [];
  return {
    id: row.plasmidId,
    plasmidId: row.plasmidId,
    name: row.name ?? '',
    alias: row.alias ?? '',
    oriInfo: extractCultureValues(cultureFunctions, 'ori'),
    markerInfo: extractCultureValues(cultureFunctions, 'marker'),
    level: row.level ?? '',
    scar: scarOverride ?? formatDefaultScar(row.scar),
    tag: row.tag ?? '',
  };
}

function resolveSortValue(row, sortKey) {
  const value = row[sortKey];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

async function listPartBrowseRows({
  filters = {},
  search = '',
  sortKey = 'name',
  sortDir = 'asc',
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const meta = BROWSE_META.part;
  const normalizedSortKey = meta.sortKeys.includes(sortKey) ? sortKey : 'name';
  const normalizedSortDir = normalizeSortDir(sortDir);
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);

  const enzyme = pickFilterValue(filters.enzyme);
  const scar = pickFilterValue(filters.scar);
  const typeIds = resolvePartTypeIds(filters);
  const scarIds = await getScarFilteredIds('part', enzyme, scar);

  if (enzyme && scarIds.length === 0) {
    return {
      rows: [],
      pagination: buildPagination(normalizedPage, normalizedPageSize, 0),
    };
  }

  const whereParts = [{ deletedAt: null }];
  const nameSearchWhere = buildNameSearchWhere(search);
  if (nameSearchWhere) {
    whereParts.push(nameSearchWhere);
  }
  if (typeIds.length > 0) {
    whereParts.push({ type: { in: typeIds } });
  }
  if (scarIds != null) {
    whereParts.push({ partId: { in: scarIds } });
  }

  const where = whereParts.length > 0 ? { AND: whereParts } : undefined;
  const scarOverride = enzyme ? scar : null;

  const records = await prisma.partTable.findMany({
    where,
    include: { scar: true },
    orderBy: { name: 'asc' },
  });

  const formattedRows = records.map((row) => formatPartRow(row, scarOverride));
  const sortedRows = sortList(formattedRows, normalizedSortKey, normalizedSortDir, resolveSortValue);
  const totalCount = sortedRows.length;
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const rows = sortedRows.slice(offset, offset + normalizedPageSize);

  return {
    rows,
    pagination: buildPagination(normalizedPage, normalizedPageSize, totalCount),
  };
}

async function listBackboneBrowseRows({
  filters = {},
  search = '',
  sortKey = 'name',
  sortDir = 'asc',
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const meta = BROWSE_META.backbone;
  const normalizedSortKey = meta.sortKeys.includes(sortKey) ? sortKey : 'name';
  const normalizedSortDir = normalizeSortDir(sortDir);
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);

  const enzyme = pickFilterValue(filters.enzyme);
  const scar = pickFilterValue(filters.scar);
  const scarIds = await getScarFilteredIds('backbone', enzyme, scar);
  const cultureIds = await getCultureFilteredIds('backbone', filters);

  if (enzyme && scarIds.length === 0) {
    return {
      rows: [],
      pagination: buildPagination(normalizedPage, normalizedPageSize, 0),
    };
  }

  if (
    (pickFilterValues(filters.ori).length > 0 || pickFilterValues(filters.marker).length > 0)
    && Array.isArray(cultureIds)
    && cultureIds.length === 0
  ) {
    return {
      rows: [],
      pagination: buildPagination(normalizedPage, normalizedPageSize, 0),
    };
  }

  const whereParts = [{ deletedAt: null }];
  const nameSearchWhere = buildNameSearchWhere(search);
  if (nameSearchWhere) {
    whereParts.push(nameSearchWhere);
  }

  const idLists = [scarIds, cultureIds].filter((list) => list != null);
  const finalIds = intersectIdLists(...idLists);
  if (finalIds != null) {
    whereParts.push({ id: { in: finalIds } });
  }

  const where = whereParts.length > 0 ? { AND: whereParts } : undefined;
  const scarOverride = enzyme ? scar : null;

  const records = await prisma.backboneTable.findMany({
    where,
    include: {
      scar: true,
      cultureFunctions: true,
    },
    orderBy: { name: 'asc' },
  });

  const formattedRows = records.map((row) => formatBackboneRow(row, scarOverride));
  const sortedRows = sortList(formattedRows, normalizedSortKey, normalizedSortDir, resolveSortValue);
  const totalCount = sortedRows.length;
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const rows = sortedRows.slice(offset, offset + normalizedPageSize);

  return {
    rows,
    pagination: buildPagination(normalizedPage, normalizedPageSize, totalCount),
  };
}

async function listPlasmidBrowseRows({
  filters = {},
  search = '',
  sortKey = 'name',
  sortDir = 'asc',
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const meta = BROWSE_META.plasmid;
  const normalizedSortKey = meta.sortKeys.includes(sortKey) ? sortKey : 'name';
  const normalizedSortDir = normalizeSortDir(sortDir);
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);

  const enzyme = pickFilterValue(filters.enzyme);
  const scar = pickFilterValue(filters.scar);
  const scarIds = await getScarFilteredIds('plasmid', enzyme, scar);
  const cultureIds = await getCultureFilteredIds('plasmid', filters);

  if (enzyme && scarIds.length === 0) {
    return {
      rows: [],
      pagination: buildPagination(normalizedPage, normalizedPageSize, 0),
    };
  }

  if (
    (pickFilterValues(filters.ori).length > 0 || pickFilterValues(filters.marker).length > 0)
    && Array.isArray(cultureIds)
    && cultureIds.length === 0
  ) {
    return {
      rows: [],
      pagination: buildPagination(normalizedPage, normalizedPageSize, 0),
    };
  }

  const whereParts = [{ deletedAt: null }];
  const nameSearchWhere = buildNameSearchWhere(search);
  if (nameSearchWhere) {
    whereParts.push(nameSearchWhere);
  }

  const idLists = [scarIds, cultureIds].filter((list) => list != null);
  const finalIds = intersectIdLists(...idLists);
  if (finalIds != null) {
    whereParts.push({ plasmidId: { in: finalIds } });
  }

  const where = whereParts.length > 0 ? { AND: whereParts } : undefined;
  const scarOverride = enzyme ? scar : null;

  const records = await prisma.plasmidNeed.findMany({
    where,
    include: {
      scar: true,
      cultureFunctions: true,
    },
    orderBy: { name: 'asc' },
  });

  const formattedRows = records.map((row) => formatPlasmidRow(row, scarOverride));
  const sortedRows = sortList(formattedRows, normalizedSortKey, normalizedSortDir, resolveSortValue);
  const totalCount = sortedRows.length;
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const rows = sortedRows.slice(offset, offset + normalizedPageSize);

  return {
    rows,
    pagination: buildPagination(normalizedPage, normalizedPageSize, totalCount),
  };
}

async function listBrowseRows({
  datasetType,
  filters = {},
  search = '',
  sortKey = 'name',
  sortDir = 'asc',
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const normalized = normalizeDatasetType(datasetType);
  if (!normalized) {
    return null;
  }

  const params = {
    filters,
    search: String(search || '').trim(),
    sortKey,
    sortDir,
    page,
    pageSize,
  };

  if (normalized === 'part') {
    return listPartBrowseRows(params);
  }
  if (normalized === 'backbone') {
    return listBackboneBrowseRows(params);
  }
  return listPlasmidBrowseRows(params);
}

async function buildBrowseResponse(datasetType, query = {}) {
  const normalized = normalizeDatasetType(datasetType);
  if (!normalized) {
    return null;
  }

  const config = getBrowseConfig(normalized);
  const filterOptions = await listBrowseFilterOptions(normalized, {
    enzyme: pickFilterValue(query.filters?.enzyme),
  });
  const filterGroups = config.filterGroups.map((group) => ({
    ...group,
    options: filterOptions[group.id] || [],
  }));

  const listResult = await listBrowseRows({
    datasetType: normalized,
    filters: query.filters || {},
    search: query.search,
    sortKey: query.sortKey,
    sortDir: query.sortDir,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    rows: listResult.rows,
    columns: config.columns,
    filterGroups,
    defaultFilters: config.defaultFilters,
    browseLabel: config.browseLabel,
    pagination: listResult.pagination,
  };
}

function formatDateTime(value) {
  if (!(value instanceof Date)) {
    return value ?? '';
  }

  const pad = (number) => number.toString().padStart(2, '0');
  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join('-') + ' ' + [
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join(':');
}

function parseRecordId(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function formatScarForResponse(scarRecord) {
  if (!scarRecord) {
    return null;
  }

  return {
    BsmBI: scarRecord.bsmbi ?? '',
    BsaI: scarRecord.bsai ?? '',
    BbsI: scarRecord.bbsi ?? '',
    AarI: scarRecord.aari ?? '',
    SapI: scarRecord.sapi ?? '',
  };
}

function normalizeScarInput(scar) {
  if (!scar || typeof scar !== 'object') {
    return null;
  }

  return {
    bsmbi: String(scar.bsmbi ?? scar.BsmBI ?? '').trim(),
    bsai: String(scar.bsai ?? scar.BsaI ?? '').trim(),
    bbsi: String(scar.bbsi ?? scar.BbsI ?? '').trim(),
    aari: String(scar.aari ?? scar.AarI ?? '').trim(),
    sapi: String(scar.sapi ?? scar.SapI ?? '').trim(),
  };
}

function parseStringList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (value == null || value === '') {
    return [];
  }
  return [...new Set(String(value).split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))];
}

function formatFeatureRows(features = []) {
  return features.map((feature) => ({
    start: feature.featureStart,
    end: feature.featureEnd,
    type: feature.featureType ?? '',
    label: feature.featureLabel ?? '',
    color: feature.featureColor ?? '',
  }));
}

function isUniqueConstraintError(error) {
  return Boolean(error && error.code === 'P2002');
}

function isForeignKeyConstraintError(error) {
  return Boolean(error && error.code === 'P2003');
}

function isMissingTableError(error) {
  if (!error) {
    return false;
  }
  const message = String(error.message || error.meta?.message || '');
  return error.code === 'P2010'
    && (/1146|doesn't exist|does not exist|unknown table/i.test(message));
}

async function tryDeleteUserFileAddress(tx, tableName, idColumn, recordId) {
  try {
    await tx.$executeRawUnsafe(
      `DELETE FROM \`${tableName}\` WHERE \`${idColumn}\` = ?`,
      recordId,
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw error;
  }
}

function resolveDeleteErrorMessage(error, label) {
  if (isForeignKeyConstraintError(error)) {
    return `Cannot delete ${label}: it is still referenced by other records.`;
  }
  if (error && error.message) {
    return error.message;
  }
  return `Failed to delete ${label}`;
}

async function isNameTaken(datasetType, name, excludeId) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return false;
  }

  if (datasetType === 'part') {
    const existing = await prisma.partTable.findFirst({
      where: {
        name: trimmed,
        NOT: { partId: excludeId },
      },
      select: { partId: true },
    });
    return Boolean(existing);
  }

  if (datasetType === 'backbone') {
    const existing = await prisma.backboneTable.findFirst({
      where: {
        name: trimmed,
        NOT: { id: excludeId },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  const existing = await prisma.plasmidNeed.findFirst({
    where: {
      name: trimmed,
      NOT: { plasmidId: excludeId },
    },
    select: { plasmidId: true },
  });
  return Boolean(existing);
}

function formatPartDetail(row) {
  return {
    id: row.partId,
    name: row.name ?? '',
    alias: row.alias ?? '',
    type: resolvePartTypeLabel(row.type) ?? String(row.type ?? ''),
    typeId: row.type,
    user: row.user ?? '',
    sourceOrganism: row.sourceOrganism ?? '',
    lengthInLevel0: row.lengthInLevel0 ?? 0,
    note: row.note ?? '',
    reference: row.reference ?? '',
    level0Sequence: row.level0Sequence ?? '',
    updateDate: formatDateTime(row.updateDate),
    scar: formatScarForResponse(row.scar),
    features: formatFeatureRows(row.features),
  };
}

function formatBackboneDetail(row) {
  const cultureFunctions = row.cultureFunctions || [];
  return {
    id: row.id,
    name: row.name ?? '',
    alias: row.alias ?? '',
    user: row.user ?? '',
    length: row.length ?? 0,
    copyNumber: row.copyNumber ?? '',
    species: row.species ?? '',
    notes: row.notes ?? '',
    sequence: row.sequence ?? '',
    updateDate: formatDateTime(row.updateDate),
    scar: formatScarForResponse(row.scar),
    ori: extractCultureValues(cultureFunctions, 'ori'),
    marker: extractCultureValues(cultureFunctions, 'marker'),
    features: formatFeatureRows(row.features),
  };
}

function formatPlasmidDetail(row) {
  const cultureFunctions = row.cultureFunctions || [];
  return {
    id: row.plasmidId,
    name: row.name ?? '',
    alias: row.alias ?? '',
    user: row.user ?? '',
    level: row.level ?? '',
    length: row.length ?? 0,
    note: row.note ?? '',
    sequenceConfirm: row.sequenceConfirm ?? '',
    updateDate: formatDateTime(row.updateDate),
    scar: formatScarForResponse(row.scar),
    oriInfo: extractCultureValues(cultureFunctions, 'ori'),
    markerInfo: extractCultureValues(cultureFunctions, 'marker'),
    parentPart: (row.parentPartLinks || []).map((link) => ({
      id: link.parentPart?.partId,
      name: link.parentPart?.name ?? '',
    })).filter((item) => item.id != null),
    parentBackbone: (row.parentBackboneLinks || []).map((link) => ({
      id: link.parentBackbone?.id,
      name: link.parentBackbone?.name ?? '',
    })).filter((item) => item.id != null),
    parentPlasmid: (row.parentPlasmidAsChild || []).map((link) => ({
      id: link.parentPlasmid?.plasmidId,
      name: link.parentPlasmid?.name ?? '',
    })).filter((item) => item.id != null),
    features: formatFeatureRows(row.features),
  };
}

async function getPartDetail(recordId) {
  const row = await prisma.partTable.findUnique({
    where: { partId: recordId },
    include: {
      scar: true,
      features: true,
    },
  });
  return row && !row.deletedAt ? formatPartDetail(row) : null;
}

async function getBackboneDetail(recordId) {
  const row = await prisma.backboneTable.findUnique({
    where: { id: recordId },
    include: {
      scar: true,
      cultureFunctions: true,
      features: true,
    },
  });
  return row && !row.deletedAt ? formatBackboneDetail(row) : null;
}

async function getPlasmidDetail(recordId) {
  const row = await prisma.plasmidNeed.findUnique({
    where: { plasmidId: recordId },
    include: {
      scar: true,
      cultureFunctions: true,
      features: true,
      parentPartLinks: {
        include: { parentPart: true },
      },
      parentBackboneLinks: {
        include: { parentBackbone: true },
      },
      parentPlasmidAsChild: {
        include: { parentPlasmid: true },
      },
    },
  });
  return row && !row.deletedAt ? formatPlasmidDetail(row) : null;
}

async function getBrowseDetail(datasetType, id) {
  const normalized = normalizeDatasetType(datasetType);
  const recordId = parseRecordId(id);
  if (!normalized || recordId == null) {
    return null;
  }

  if (normalized === 'part') {
    return getPartDetail(recordId);
  }
  if (normalized === 'backbone') {
    return getBackboneDetail(recordId);
  }
  return getPlasmidDetail(recordId);
}

async function upsertScarRecord(tx, datasetType, parentId, scarValues) {
  if (!scarValues) {
    return;
  }

  const scarModel = SCAR_MODEL_BY_DATASET_TYPE[datasetType];
  const idField = SCAR_ID_FIELD_BY_DATASET_TYPE[datasetType];
  const existing = await tx[scarModel].findUnique({
    where: { [idField]: parentId },
  });

  if (existing) {
    await tx[scarModel].update({
      where: { [idField]: parentId },
      data: scarValues,
    });
    return;
  }

  await tx[scarModel].create({
    data: {
      ...scarValues,
      [idField]: parentId,
    },
  });
}

async function replaceCultureFunctions(tx, datasetType, parentId, values = {}) {
  const cultureModel = CULTURE_MODEL_BY_DATASET_TYPE[datasetType];
  const parentField = CULTURE_PARENT_FIELD_BY_DATASET_TYPE[datasetType];
  if (!cultureModel) {
    return;
  }

  const oriValues = parseStringList(values.ori ?? values.oriInfo);
  const markerValues = parseStringList(values.marker ?? values.markerInfo);

  await tx[cultureModel].deleteMany({
    where: {
      [parentField]: parentId,
      functionType: { in: ['ori', 'marker'] },
    },
  });

  const rows = [
    ...oriValues.map((functionContent) => ({
      [parentField]: parentId,
      functionType: 'ori',
      functionContent,
    })),
    ...markerValues.map((functionContent) => ({
      [parentField]: parentId,
      functionType: 'marker',
      functionContent,
    })),
  ];

  if (rows.length > 0) {
    await tx[cultureModel].createMany({ data: rows });
  }
}

async function updatePartRecord(recordId, values = {}) {
  const existing = await prisma.partTable.findUnique({
    where: { partId: recordId },
    select: { partId: true, name: true },
  });
  if (!existing) {
    return { ok: false, msg: 'Part not found' };
  }

  const data = {};
  if (Object.prototype.hasOwnProperty.call(values, 'name')) {
    const name = String(values.name ?? '').trim();
    if (!name) {
      return { ok: false, msg: 'Name is required' };
    }
    if (name !== existing.name && await isNameTaken('part', name, recordId)) {
      return { ok: false, msg: 'Part name already exists' };
    }
    data.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(values, 'alias')) {
    data.alias = String(values.alias ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'type')) {
    const typeId = resolvePartTypeId(values.type);
    if (typeId == null) {
      return { ok: false, msg: 'Invalid part type' };
    }
    data.type = typeId;
  }
  if (Object.prototype.hasOwnProperty.call(values, 'sourceOrganism')) {
    data.sourceOrganism = String(values.sourceOrganism ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(values, 'note')) {
    data.note = String(values.note ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(values, 'reference')) {
    data.reference = String(values.reference ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(values, 'level0Sequence')) {
    const sequence = String(values.level0Sequence ?? '');
    data.level0Sequence = sequence;
    data.lengthInLevel0 = sequence.length;
  }

  const scarValues = normalizeScarInput(values.scar);
  data.updateDate = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.partTable.update({
          where: { partId: recordId },
          data,
        });
      }
      await upsertScarRecord(tx, 'part', recordId, scarValues);
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, msg: 'Part name already exists' };
    }
    throw error;
  }

  return { ok: true, detail: await getPartDetail(recordId) };
}

async function updateBackboneRecord(recordId, values = {}) {
  const existing = await prisma.backboneTable.findUnique({
    where: { id: recordId },
    select: { id: true, name: true },
  });
  if (!existing) {
    return { ok: false, msg: 'Backbone not found' };
  }

  const data = {};
  if (Object.prototype.hasOwnProperty.call(values, 'name')) {
    const name = String(values.name ?? '').trim();
    if (!name) {
      return { ok: false, msg: 'Name is required' };
    }
    if (name !== existing.name && await isNameTaken('backbone', name, recordId)) {
      return { ok: false, msg: 'Backbone name already exists' };
    }
    data.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(values, 'alias')) {
    data.alias = String(values.alias ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'copyNumber')) {
    data.copyNumber = String(values.copyNumber ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'species')) {
    data.species = String(values.species ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'notes')) {
    data.notes = String(values.notes ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(values, 'sequence')) {
    const sequence = String(values.sequence ?? '');
    data.sequence = sequence;
    data.length = sequence.length;
  }

  const scarValues = normalizeScarInput(values.scar);
  const hasCultureUpdate = Object.prototype.hasOwnProperty.call(values, 'ori')
    || Object.prototype.hasOwnProperty.call(values, 'marker');
  data.updateDate = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.backboneTable.update({
          where: { id: recordId },
          data,
        });
      }
      await upsertScarRecord(tx, 'backbone', recordId, scarValues);
      if (hasCultureUpdate) {
        await replaceCultureFunctions(tx, 'backbone', recordId, values);
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, msg: 'Backbone name already exists' };
    }
    throw error;
  }

  return { ok: true, detail: await getBackboneDetail(recordId) };
}

async function updatePlasmidRecord(recordId, values = {}) {
  const existing = await prisma.plasmidNeed.findUnique({
    where: { plasmidId: recordId },
    select: { plasmidId: true, name: true },
  });
  if (!existing) {
    return { ok: false, msg: 'Plasmid not found' };
  }

  const data = {};
  if (Object.prototype.hasOwnProperty.call(values, 'name')) {
    const name = String(values.name ?? '').trim();
    if (!name) {
      return { ok: false, msg: 'Name is required' };
    }
    if (name !== existing.name && await isNameTaken('plasmid', name, recordId)) {
      return { ok: false, msg: 'Plasmid name already exists' };
    }
    data.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(values, 'alias')) {
    data.alias = String(values.alias ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'level')) {
    data.level = String(values.level ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(values, 'note')) {
    data.note = String(values.note ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(values, 'sequenceConfirm')) {
    const sequence = String(values.sequenceConfirm ?? '');
    data.sequenceConfirm = sequence;
    data.length = sequence.length;
  }

  const scarValues = normalizeScarInput(values.scar);
  const hasCultureUpdate = Object.prototype.hasOwnProperty.call(values, 'oriInfo')
    || Object.prototype.hasOwnProperty.call(values, 'markerInfo');
  data.updateDate = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.plasmidNeed.update({
          where: { plasmidId: recordId },
          data,
        });
      }
      await upsertScarRecord(tx, 'plasmid', recordId, scarValues);
      if (hasCultureUpdate) {
        await replaceCultureFunctions(tx, 'plasmid', recordId, values);
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, msg: 'Plasmid name already exists' };
    }
    throw error;
  }

  return { ok: true, detail: await getPlasmidDetail(recordId) };
}

async function updateBrowseItem(datasetType, id, values = {}) {
  const normalized = normalizeDatasetType(datasetType);
  const recordId = parseRecordId(id);
  if (!normalized || recordId == null) {
    return { ok: false, msg: 'Invalid datasetType or id' };
  }

  if (normalized === 'part') {
    return updatePartRecord(recordId, values);
  }
  if (normalized === 'backbone') {
    return updateBackboneRecord(recordId, values);
  }
  return updatePlasmidRecord(recordId, values);
}

async function deletePartRecord(recordId) {
  const existing = await prisma.partTable.findUnique({
    where: { partId: recordId },
    select: { partId: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) {
    return { ok: false, msg: 'Part not found' };
  }

  try {
    await prisma.partTable.update({ where: { partId: recordId }, data: {
      deletedAt: new Date(), syncStatus: 'deleted', updateDate: new Date(),
    } });
  } catch (error) {
    return { ok: false, msg: resolveDeleteErrorMessage(error, 'part') };
  }

  return { ok: true };
}

async function deleteBackboneRecord(recordId) {
  const existing = await prisma.backboneTable.findUnique({
    where: { id: recordId },
    select: { id: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) {
    return { ok: false, msg: 'Backbone not found' };
  }

  try {
    await prisma.backboneTable.update({ where: { id: recordId }, data: {
      deletedAt: new Date(), syncStatus: 'deleted', updateDate: new Date(),
    } });
  } catch (error) {
    return { ok: false, msg: resolveDeleteErrorMessage(error, 'backbone') };
  }

  return { ok: true };
}

async function deletePlasmidRecord(recordId) {
  const existing = await prisma.plasmidNeed.findUnique({
    where: { plasmidId: recordId },
    select: { plasmidId: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) {
    return { ok: false, msg: 'Plasmid not found' };
  }

  try {
    await prisma.plasmidNeed.update({ where: { plasmidId: recordId }, data: {
      deletedAt: new Date(), syncStatus: 'deleted', updateDate: new Date(),
    } });
  } catch (error) {
    return { ok: false, msg: resolveDeleteErrorMessage(error, 'plasmid') };
  }

  return { ok: true };
}

async function deleteBrowseItem(datasetType, id) {
  const normalized = normalizeDatasetType(datasetType);
  const recordId = parseRecordId(id);
  if (!normalized || recordId == null) {
    return { ok: false, msg: 'Invalid datasetType or id' };
  }

  if (normalized === 'part') {
    return deletePartRecord(recordId);
  }
  if (normalized === 'backbone') {
    return deleteBackboneRecord(recordId);
  }
  return deletePlasmidRecord(recordId);
}

module.exports = {
  DATASET_TYPES,
  PART_TYPE_BY_ID,
  PART_TYPE_BY_LABEL,
  SCAR_ENZYME_FIELDS,
  SCAR_ENZYME_NAMES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  normalizeDatasetType,
  resolvePartTypeLabel,
  resolvePartTypeId,
  resolveScarFieldForEnzyme,
  isScarEnzymeName,
  resolvePrismaModelName,
  isNameTaken,
  getBrowseConfig,
  listBrowseFilterOptions,
  listBrowseRows,
  buildBrowseResponse,
  getBrowseDetail,
  updateBrowseItem,
  deleteBrowseItem,
};
