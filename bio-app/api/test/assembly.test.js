const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const XLSX = require('xlsx');
const { processPartSequence } = require('../src/services/assembly/partSequence');
const { cutEvents, simulateGoldenGate, stickyEndsCompatible } = require('../src/services/assembly/goldenGate');
const { writeReports } = require('../src/services/assembly/artifacts');
const { parseAssemblyWorkbook } = require('../src/services/assembly/excel');
const { CCDB_SEQUENCE, determineTargetEnzyme } = require('../src/services/assembly/targetEnzyme');
const { containsEnzymeRecognitionSite, selectAssemblyFragments } = require('../src/services/assembly/assemblyService');

async function testDirectory(prefix) {
  const base = path.join(__dirname, '.tmp');
  await fs.mkdir(base, { recursive: true });
  return fs.mkdtemp(path.join(base, prefix));
}

test('legacy BbsI preprocessing and circular Golden Gate assembly', () => {
  const wrap = (sequence, startScar, endScar) => processPartSequence({
    sequence, type: 'cds', enzyme: 'BbsI', startScar, endScar,
  });
  const records = [
    { id: 'a', name: 'part-a', kind: 'part', sequence: wrap('cccc', 'aaaa', 'tttt') },
    { id: 'b', name: 'part-b', kind: 'part', sequence: wrap('gggg', 'tttt', 'aaaa') },
  ];
  assert.equal(cutEvents(records[0].sequence, 'BbsI').length, 2);
  const result = simulateGoldenGate(records, 'BbsI', {
    selectFragments: (record, fragments) => fragments.filter((fragment) =>
      fragment.sequence.includes(record.id === 'a' ? 'CCCC' : 'GGGG')),
  });
  assert.equal(result.sequence, 'AAAACCCCTTTTGGGG');
});

test('sticky ends use the canonical assembled-strand orientation', () => {
  assert.equal(stickyEndsCompatible('AATG', 'AATG'), true);
  assert.equal(stickyEndsCompatible('AATG', 'CATT'), false);
});

test('backbone target enzyme is selected around ccdB', () => {
  const backbone = processPartSequence({ sequence: CCDB_SEQUENCE, type: 'cds', enzyme: 'BsaI', startScar: 'CCTC', endScar: 'GTGC' });
  assert.equal(determineTargetEnzyme(backbone).enzyme, 'BsaI');
  assert.throws(() => determineTargetEnzyme(backbone.replace(CCDB_SEQUENCE, 'A'.repeat(CCDB_SEQUENCE.length))), /ccdB sequence was not detected/);
});

test('part and plasmid main fragments do not require parent metadata', () => {
  const main = { sequence: 'AAAACCCCTTTT' };
  const nonMain = { sequence: 'AAAAGGTCTCTTTT' };
  assert.equal(containsEnzymeRecognitionSite(nonMain.sequence, 'BsaI'), true);
  assert.equal(containsEnzymeRecognitionSite('AAAAGAGACCTTTT', 'BsaI'), true);
  assert.deepEqual(selectAssemblyFragments({
    kind: 'plasmid', name: 'plasmid-a', assemblyEnzyme: 'BsaI',
  }, [nonMain, main]), [main]);
  assert.equal(main.role, 'plasmid-main');
  assert.equal(nonMain.role, 'plasmid-non-main');
});

test('multiple distinct circular products are rejected', () => {
  const records = ['a', 'b', 'c'].map((id) => ({
    id, name: id, kind: 'part',
    sequence: processPartSequence({ sequence: id === 'a' ? 'CCCC' : id === 'b' ? 'GGGG' : 'TTTT', type: 'cds', enzyme: 'BbsI', startScar: 'AAAA', endScar: 'AAAA' }),
  }));
  assert.throws(() => simulateGoldenGate(records, 'BbsI', {
    selectFragments: (record, fragments) => fragments.filter((fragment) => fragment.sequence.includes(record.id === 'a' ? 'CCCC' : record.id === 'b' ? 'GGGG' : 'TTTT')),
  }), /Assembly is ambiguous/);
});

test('writes the legacy report file set and ZIP archive', async () => {
  const root = await testDirectory('reports-');
  try {
    const result = { enzyme: 'BbsI', sequence: 'AAAACCCCTTTTGGGG', fragments: [
      { recordName: 'a', kind: 'part', sequence: 'AAAACCCC', left: 'AAAA', right: 'TTTT' },
      { recordName: 'b', kind: 'part', sequence: 'TTTTGGGG', left: 'TTTT', right: 'AAAA' },
    ] };
    const files = await writeReports(root, 'demo', result);
    for (const file of Object.values(files)) assert.ok((await fs.stat(file)).size > 0, file);
  } finally { await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {}); }
});

test('parses the original Excel batch headings and orders levels', async () => {
  const root = await testDirectory('xlsx-');
  const file = path.join(root, 'assembly.xlsx');
  try {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([
      { AssemblyName: 'second', Level: 2, Plasmid: 'first', Backbone: 'bb2' },
      { AssemblyName: 'first', Level: 1, Part: 'p1', Backbone: 'bb1', 'Part Start Scar': 'AAAA', 'Part End Scar': 'TTTT' },
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Assembly');
    XLSX.writeFile(workbook, file);
    const specs = parseAssemblyWorkbook(file);
    assert.deepEqual(specs.map((item) => item.name), ['first', 'second']);
    assert.deepEqual(specs[0].part_start_scar, ['AAAA']);
  } finally { await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {}); }
});
