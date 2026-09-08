const { listBrowseRows } = require('./datasetBrowseStore');
const { searchDocuments } = require('./documentStore');
const { listTasks } = require('./taskStore');
const { listUserFiles } = require('./userFileStore');

const SEARCH_TYPES = Object.freeze([
  'tasks',
  'parts',
  'backbones',
  'plasmids',
  'files',
  'documents',
]);

function normalizeLimit(value) {
  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    return 5;
  }
  return Math.min(limit, 20);
}

function normalizeQuery(query) {
  return String(query || '').trim();
}

function truncateText(value, maxLength = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
}

function toTypeList(types) {
  if (!Array.isArray(types) || types.length === 0) {
    return SEARCH_TYPES;
  }
  const requested = types.map((type) => String(type).trim()).filter(Boolean);
  return SEARCH_TYPES.filter((type) => requested.includes(type));
}

function buildResultBlock(label, items, total) {
  return {
    label,
    total,
    items,
  };
}

function formatTaskResult(task) {
  return {
    id: task.id,
    type: 'task',
    title: task.name,
    subtitle: `${task.app || 'Task'} · ${task.status || 'unknown'}`,
    description: [
      task.operation ? `Operation: ${task.operation}` : '',
      task.date ? `Created: ${task.date}` : '',
      task.creator?.name ? `Creator: ${task.creator.name}` : '',
    ].filter(Boolean).join(' · '),
    route: `/tasks/${task.id}`,
    meta: {
      status: task.status,
      scope: task.scope,
    },
  };
}

function formatDatasetResult(datasetType, row) {
  const typeLabels = {
    part: 'Part',
    backbone: 'Backbone',
    plasmid: 'Plasmid',
  };
  const subtitleParts = [
    typeLabels[datasetType],
    row.type,
    Array.isArray(row.marker) ? row.marker.join(', ') : '',
    Array.isArray(row.markerInfo) ? row.markerInfo.join(', ') : '',
    row.level ? `Level ${row.level}` : '',
  ].filter(Boolean);

  return {
    id: row.id,
    type: datasetType,
    title: row.name || `#${row.id}`,
    subtitle: subtitleParts.join(' · '),
    description: truncateText([
      row.alias ? `Alias: ${row.alias}` : '',
      row.sourceOrganism ? `Source: ${row.sourceOrganism}` : '',
      row.reference ? `Reference: ${row.reference}` : '',
      row.scar ? `Scar: ${row.scar}` : '',
    ].filter(Boolean).join(' · ')),
    route: `/datasets/${datasetType}/${row.id}/detail`,
    meta: {
      datasetType,
      tag: row.tag || '',
    },
  };
}

function formatFileResult(file) {
  return {
    id: file.id,
    type: 'file',
    title: file.originalName,
    subtitle: `${file.category || 'file'} · ${file.extension || 'unknown'}`,
    description: `${file.sizeMB} MB · Uploaded ${file.createdAt || ''}`.trim(),
    route: '',
    meta: {
      originalName: file.originalName,
      mimeType: file.mimeType,
      extension: file.extension,
      category: file.category,
      sizeBytes: file.sizeBytes,
      sizeMB: file.sizeMB,
      createdAt: file.createdAt,
      downloadUrl: `/api/files/download/${file.id}`,
    },
  };
}

function formatDocumentResult(document) {
  return {
    id: document.id,
    type: 'document',
    title: document.title,
    subtitle: document.subtitle,
    description: truncateText(document.description),
    route: document.route,
    meta: {
      pageId: document.id,
    },
  };
}

async function searchTaskBlock(userId, query, limit) {
  const tasks = await listTasks(userId, {
    scope: 'all',
    search: query,
    sortKey: 'date',
    sortDir: 'desc',
  });

  return buildResultBlock(
    'Tasks',
    tasks.slice(0, limit).map(formatTaskResult),
    tasks.length,
  );
}

async function searchDatasetBlock(datasetType, label, query, limit) {
  const result = await listBrowseRows({
    datasetType,
    search: query,
    sortKey: 'name',
    sortDir: 'asc',
    page: 1,
    pageSize: limit,
  });

  return buildResultBlock(
    label,
    (result?.rows || []).map((row) => formatDatasetResult(datasetType, row)),
    result?.pagination?.totalCount || 0,
  );
}

async function searchFileBlock(userId, query, limit) {
  const result = await listUserFiles(userId, {
    keyword: query,
    page: 1,
    pageSize: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return buildResultBlock(
    'Files',
    (result.files || []).map(formatFileResult),
    result.pagination?.totalCount || 0,
  );
}

async function searchDocumentBlock(query, limit) {
  const result = await searchDocuments(query, { limit });

  return buildResultBlock(
    'Documents',
    (result.items || []).map(formatDocumentResult),
    result.total || 0,
  );
}

async function globalSearch(userId, { query, limit, types } = {}) {
  const normalizedQuery = normalizeQuery(query);
  const safeLimit = normalizeLimit(limit);
  const requestedTypes = toTypeList(types);
  const emptyBlocks = Object.fromEntries(SEARCH_TYPES.map((type) => [
    type,
    buildResultBlock(type, [], 0),
  ]));

  if (!normalizedQuery) {
    return {
      query: '',
      limit: safeLimit,
      blocks: emptyBlocks,
      totalCount: 0,
    };
  }

  const blockLoaders = {
    tasks: () => searchTaskBlock(userId, normalizedQuery, safeLimit),
    parts: () => searchDatasetBlock('part', 'Parts', normalizedQuery, safeLimit),
    backbones: () => searchDatasetBlock('backbone', 'Backbones', normalizedQuery, safeLimit),
    plasmids: () => searchDatasetBlock('plasmid', 'Plasmids', normalizedQuery, safeLimit),
    files: () => searchFileBlock(userId, normalizedQuery, safeLimit),
    documents: () => searchDocumentBlock(normalizedQuery, safeLimit),
  };

  const entries = await Promise.all(requestedTypes.map(async (type) => [
    type,
    await blockLoaders[type](),
  ]));
  const blocks = {
    ...emptyBlocks,
    ...Object.fromEntries(entries),
  };

  return {
    query: normalizedQuery,
    limit: safeLimit,
    blocks,
    totalCount: Object.values(blocks).reduce((sum, block) => sum + (block.total || 0), 0),
  };
}

module.exports = {
  globalSearch,
};
