const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGenbank, featureLocation, safeFilename } = require('../src/services/datasetMapExport');

test('exports an annotated GenBank map from a dataset sequence', () => {
  const text = buildGenbank({
    name: 'pTest', datasetType: 'plasmid', topology: 'circular', sequence: 'ATGCGT',
    features: [{ featureStart: 0, featureEnd: 3, featureType: 'CDS', featureLabel: 'gene A', featureColor: '#ff0000', featureApeinfo: '#ff0000' }],
  });
  assert.match(text, /LOCUS\s+pTest\s+6 bp\s+DNA\s+circular/);
  assert.match(text, /CDS\s+1\.\.3/);
  assert.match(text, /\/label="gene A"/);
  assert.match(text, /ORIGIN\n\s+1 atgcgt\n\/\//);
});

test('rejects records without sequence and sanitizes filenames', () => {
  assert.throws(() => buildGenbank({ name: 'empty', sequence: '' }), /no sequence/i);
  assert.equal(safeFilename('bad/name:*'), 'bad_name__');
  assert.equal(featureLocation({ featureStart: 2, featureEnd: 5 }, 10), '3..5');
});
