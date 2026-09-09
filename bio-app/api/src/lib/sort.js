function compareValues(av, bv, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1;
  const aStr = String(av ?? '');
  const bStr = String(bv ?? '');

  if (aStr < bStr) return -1 * dir;
  if (aStr > bStr) return 1 * dir;
  return 0;
}

function sortList(list, sortKey, sortDir, resolveValue) {
  const sorted = [...list];

  sorted.sort((a, b) => compareValues(
    resolveValue(a, sortKey),
    resolveValue(b, sortKey),
    sortDir,
  ));

  return sorted;
}

module.exports = {
  compareValues,
  sortList,
};
