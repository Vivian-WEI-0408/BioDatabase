const { ENZYMES, cutEvents } = require('./goldenGate');
const { normalizeSequence, reverseComplement } = require('./sequence');

// Same ccdB reference used by the legacy _determine_target_enzyme function.
const CCDB_SEQUENCE = normalizeSequence(
  'ggcttactaaaagccagataacagtatgcatatttgcgcgctgatttttgcggtataagaatatatactgatatgtatacccgaagtatgtcaaaaagaggtatgctatgaagcagcgtattacagtgacagttgacagcgacagctatcagttgctcaaggcatatatgatgtcaatatctccggtctggtaagcacaaccatgcagaatgaagcccgtcgtctgcgtgccgaacgctggaaagcggaaaatcaggaagggatggctgaggtcgcccggtttattgaaatgaacggctcttttgctgacgagaacaggggctggtgaaatgcagtttaaggtttacacctataaaagagagagccgttatcgtctgtttgtggatgtacagagtgatattattgacacgcccgggcgacggatggtgatccccctggccagtgcacgtctgctgtcagataaagtctcccgtgaactttacccggtggtgcatatcggggatgaaagctggcgcatgatgaccaccgatatggccagtgtgccggtttccgttatcggggaagaagtggctgatctcagccaccgcgaaaatgacatcaaaaacgccattaacctgatgttctggggaatataa'
);

function locateCcdb(sequence) {
  const normalized = normalizeSequence(sequence);
  const forward = normalized.indexOf(CCDB_SEQUENCE);
  if (forward >= 0) return { start: forward, end: forward + CCDB_SEQUENCE.length, orientation: 1, sequence: CCDB_SEQUENCE };
  const reverse = reverseComplement(CCDB_SEQUENCE);
  const reverseIndex = normalized.indexOf(reverse);
  if (reverseIndex >= 0) return { start: reverseIndex, end: reverseIndex + reverse.length, orientation: -1, sequence: reverse };
  return null;
}

function determineTargetEnzyme(sequence) {
  const normalized = normalizeSequence(sequence);
  const ccdb = locateCcdb(normalized);
  if (!ccdb) throw new Error('Backbone is invalid: ccdB sequence was not detected');
  const candidates = [];
  const legacyOrder = ['BsmBI', 'BsaI', 'BbsI', 'AarI', 'SapI'];
  for (const [priority, enzyme] of legacyOrder.entries()) {
    const events = cutEvents(normalized, enzyme);
    // Match ScarIdentify.enzyme_position_fit: odd site counts are rejected;
    // the legacy selector compares the first two sites when there are more.
    if (events.length < 2 || events.length % 2 !== 0) continue;
    const positions = events.map((event) => event.recognitionStart).sort((a, b) => a - b);
    const score = Math.abs(Math.min(ccdb.start, ccdb.end) - positions[0])
      + Math.abs(Math.max(ccdb.start, ccdb.end) - positions[1]);
    candidates.push({ enzyme, score, priority, positions, events });
  }
  candidates.sort((a, b) => a.score - b.score || a.priority - b.priority);
  if (!candidates.length) throw new Error('Backbone is invalid: no Type IIS enzyme has an even pair of sites around ccdB');
  return { enzyme: candidates[0].enzyme, ccdb, candidates: candidates.map(({ enzyme, score, positions }) => ({ enzyme, score, positions })) };
}

module.exports = { CCDB_SEQUENCE, determineTargetEnzyme, locateCcdb };
