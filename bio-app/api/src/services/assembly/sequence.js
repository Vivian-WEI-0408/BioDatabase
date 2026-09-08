const VALID_DNA = /^[ACGTRYSWKMBDHVN]*$/i;

function normalizeSequence(value) {
  const sequence = String(value || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (!sequence || !VALID_DNA.test(sequence)) {
    throw new Error('Sequence is empty or contains unsupported symbols');
  }
  return sequence;
}

function reverseComplement(value) {
  const complements = {
    A: 'T', C: 'G', G: 'C', T: 'A', R: 'Y', Y: 'R', S: 'S', W: 'W',
    K: 'M', M: 'K', B: 'V', D: 'H', H: 'D', V: 'B', N: 'N',
  };
  return normalizeSequence(value).split('').reverse().map((base) => complements[base]).join('');
}

function circularSlice(sequence, start, end) {
  if (start < end) return sequence.slice(start, end);
  if (start > end) return sequence.slice(start) + sequence.slice(0, end);
  return sequence;
}

function findAll(sequence, motif) {
  const positions = [];
  let offset = 0;
  while (offset < sequence.length) {
    const index = sequence.indexOf(motif, offset);
    if (index < 0) break;
    positions.push(index);
    offset = index + 1;
  }
  return positions;
}

module.exports = { circularSlice, findAll, normalizeSequence, reverseComplement };
