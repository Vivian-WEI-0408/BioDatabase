const { circularSlice, findAll, normalizeSequence, reverseComplement } = require('./sequence');

// Type IIS cut definitions use the conventional recognition(offset/offset) notation.
const ENZYMES = Object.freeze({
  BsaI: { site: 'GGTCTC', top: 7, bottom: 11 },
  BsmBI: { site: 'CGTCTC', top: 7, bottom: 11 },
  BbsI: { site: 'GAAGAC', top: 8, bottom: 12 },
  AarI: { site: 'CACCTGC', top: 11, bottom: 15 },
  SapI: { site: 'GCTCTTC', top: 8, bottom: 11 },
});

function normalizeEnzyme(value) {
  const wanted = String(value || 'auto').toLowerCase();
  if (wanted === 'auto') return null;
  const name = Object.keys(ENZYMES).find((item) => item.toLowerCase() === wanted);
  if (!name) throw new Error(`Unsupported Type IIS enzyme: ${value}`);
  return name;
}

function cutEvents(sequence, enzymeName) {
  const config = ENZYMES[enzymeName];
  const reverseSite = reverseComplement(config.site);
  const events = [];
  for (const index of findAll(sequence, config.site)) {
    const top = (index + config.top) % sequence.length;
    const bottom = (index + config.bottom) % sequence.length;
    events.push({ recognitionStart: index, recognitionEnd: index + config.site.length, top, bottom, orientation: 1, overhang: circularSlice(sequence, top, bottom) });
  }
  for (const index of findAll(sequence, reverseSite)) {
    const top = (index - (config.bottom - config.site.length) + sequence.length) % sequence.length;
    const bottom = (index - (config.top - config.site.length) + sequence.length) % sequence.length;
    events.push({ recognitionStart: index, recognitionEnd: index + reverseSite.length, top, bottom, orientation: -1, overhang: circularSlice(sequence, top, bottom) });
  }
  const unique = new Map();
  for (const event of events) unique.set(`${event.top}:${event.bottom}:${event.overhang}`, event);
  return [...unique.values()].sort((a, b) => a.top - b.top);
}

function digestRecord(record, enzymeName) {
  const sequence = normalizeSequence(record.sequence);
  const events = cutEvents(sequence, enzymeName);
  if (events.length < 2) {
    throw new Error(`${record.name} has fewer than two ${enzymeName} cut sites`);
  }
  return events.map((event, index) => {
    const next = events[(index + 1) % events.length];
    return {
      recordId: record.id,
      recordName: record.name,
      kind: record.kind,
      source: record,
      sequence: circularSlice(sequence, event.top, next.top),
      left: event.overhang,
      right: next.overhang,
      start: event.top,
      end: next.top,
    };
  });
}

function chooseEnzyme(records, requested) {
  const explicit = normalizeEnzyme(requested);
  if (explicit) return explicit;
  const scores = Object.keys(ENZYMES).map((name) => ({
    name,
    usable: records.filter((record) => cutEvents(normalizeSequence(record.sequence), name).length >= 2).length,
  }));
  scores.sort((a, b) => b.usable - a.usable);
  if (!scores[0] || scores[0].usable !== records.length) {
    throw new Error('No Type IIS enzyme cuts every input record at least twice');
  }
  return scores[0].name;
}

// Ends are canonicalized as the 5' sequence on the assembled top strand.
function stickyEndsCompatible(left, right) {
  return Boolean(left) && left === right;
}

function solveCircularAssembly(records, enzymeName, selectFragments) {
  const allCandidates = records.map((record) => digestRecord(record, enzymeName));
  const candidates = selectFragments ? allCandidates.map((items, index) => selectFragments(records[index], items)) : allCandidates;
  candidates.forEach((items, index) => {
    if (!Array.isArray(items) || items.length !== 1) {
      const error = new Error(`${records[index].name} does not have exactly one valid assembly fragment`);
      error.details = {
        record: records[index].name,
        candidates: Array.isArray(items) ? items.map((item) => ({ length: item.sequence.length, left: item.left, right: item.right, role: item.role })) : [],
      };
      throw error;
    }
  });
  const used = new Set();
  const path = [];
  const solutions = [];

  function search(firstLeft) {
    if (path.length === records.length) {
      if (stickyEndsCompatible(path[path.length - 1].right, firstLeft)) solutions.push([...path]);
      return;
    }
    for (let recordIndex = 0; recordIndex < candidates.length; recordIndex += 1) {
      if (used.has(recordIndex)) continue;
      for (const fragment of candidates[recordIndex]) {
        if (path.length && !stickyEndsCompatible(path[path.length - 1].right, fragment.left)) continue;
        used.add(recordIndex);
        path.push(fragment);
        search(firstLeft || fragment.left);
        path.pop();
        used.delete(recordIndex);
      }
    }
  }

  search('');
  const canonical = new Map();
  for (const solution of solutions) {
    const ids = solution.map((fragment) => `${fragment.recordId}:${fragment.start}:${fragment.end}`);
    const rotations = ids.map((_, index) => [...ids.slice(index), ...ids.slice(0, index)].join('|'));
    const key = rotations.sort()[0];
    if (!canonical.has(key)) canonical.set(key, solution);
  }
  const uniqueSolutions = [...canonical.values()];
  if (!uniqueSolutions.length) {
    const details = candidates.map((items) => ({
      record: items[0]?.recordName,
      overhangs: items.map((item) => `${item.left || '-'}>${item.right || '-'}`),
    }));
    const error = new Error('No circular assembly uses every input record exactly once');
    error.details = details;
    throw error;
  }
  if (uniqueSolutions.length !== 1) {
    const error = new Error(`Assembly is ambiguous: ${uniqueSolutions.length} distinct circular products were found`);
    error.details = uniqueSolutions.map((items) => items.map((item) => `${item.recordName}:${item.left}>${item.right}`));
    throw error;
  }
  const selectedPath = uniqueSolutions[0];
  return {
    enzyme: enzymeName,
    sequence: selectedPath.map((fragment) => fragment.sequence).join(''),
    fragments: selectedPath,
    unusedFragments: allCandidates.flat().filter((candidate) => !selectedPath.includes(candidate)),
  };
}

function simulateGoldenGate(records, requestedEnzyme = 'auto', options = {}) {
  if (!Array.isArray(records) || records.length < 2) {
    throw new Error('Assembly requires at least two input records');
  }
  const enzyme = chooseEnzyme(records, requestedEnzyme);
  return solveCircularAssembly(records, enzyme, options.selectFragments);
}

module.exports = { ENZYMES, cutEvents, digestRecord, simulateGoldenGate, stickyEndsCompatible };
