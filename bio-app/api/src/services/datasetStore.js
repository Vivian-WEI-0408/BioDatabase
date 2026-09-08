const { getTableById } = require('../data/datasetsLegacyData');
const { getBrowseRows } = require('../data/datasetBrowseData');
const { sortList } = require('../lib/sort');

const LEGACY_SORT_KEYS = new Set(['id', 'fieldA', 'fieldB', 'createdAt', 'creator']);
const BROWSE_SORT_KEYS = new Set([
  'label',
  'name',
  'sequence',
  'strength',
  'unit',
  'regulator',
  'regType',
  'species',
]);

function resolveLegacySortValue(row, sortKey) {
  switch (sortKey) {
    case 'fieldA':
      return row.fieldA;
    case 'fieldB':
      return row.fieldB;
    case 'createdAt':
      return row.createdAt;
    case 'creator':
      return row.creator?.name;
    default:
      return row.id;
  }
}

function resolveBrowseSortValue(row, sortKey) {
  return row[sortKey];
}

function filterLegacyRows(table, {
  withSharingData = false,
  search = '',
  filters = {},
} = {}) {
  let list = table.rows.map((row) => ({
    ...row,
    creator: { ...row.creator },
  }));

  if (!withSharingData) {
    list = list.filter((row) => !row.shared);
  }

  if (table.tableType === 'part') {
    const { type, enzyme, scar } = filters;
    if (type) list = list.filter((row) => row.type === type);
    if (enzyme) list = list.filter((row) => row.enzyme === enzyme);
    if (scar) list = list.filter((row) => row.scar === scar);
  } else if (table.tableType === 'backbone') {
    const { type, enzyme, resistance } = filters;
    if (type) list = list.filter((row) => row.type === type);
    if (enzyme) list = list.filter((row) => row.enzyme === enzyme);
    if (resistance) list = list.filter((row) => row.resistance === resistance);
  } else if (table.tableType === 'plasmid') {
    const { type, resistance, copyNumber } = filters;
    if (type) list = list.filter((row) => row.type === type);
    if (resistance) list = list.filter((row) => row.resistance === resistance);
    if (copyNumber) list = list.filter((row) => row.copyNumber === copyNumber);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (row) =>
        row.id.includes(q)
        || row.fieldA.toLowerCase().includes(q)
        || row.fieldB.toLowerCase().includes(q)
        || row.creator.name.toLowerCase().includes(q),
    );
  }

  return list;
}

function filterBrowseRows(rows, filters = {}) {
  let list = rows;

  ['partType', 'function', 'chassis'].forEach((groupId) => {
    const selected = filters[groupId] || [];
    if (selected.length > 0) {
      list = list.filter((row) => selected.includes(row[groupId]));
    }
  });

  return list;
}

function listLegacyRows({
  tableId,
  withSharingData = false,
  search = '',
  sortKey = 'id',
  sortDir = 'asc',
  filters = {},
} = {}) {
  const table = getTableById(tableId);
  const normalizedSortKey = LEGACY_SORT_KEYS.has(sortKey) ? sortKey : 'id';
  const filtered = filterLegacyRows(table, { withSharingData, search, filters });

  return sortList(filtered, normalizedSortKey, sortDir, resolveLegacySortValue);
}

function listBrowseRows({
  sortKey = 'name',
  sortDir = 'asc',
  filters = {},
} = {}) {
  const normalizedSortKey = BROWSE_SORT_KEYS.has(sortKey) ? sortKey : 'name';
  const filtered = filterBrowseRows(getBrowseRows(), filters);

  return sortList(filtered, normalizedSortKey, sortDir, resolveBrowseSortValue);
}

module.exports = {
  listBrowseRows,
  listLegacyRows,
};
