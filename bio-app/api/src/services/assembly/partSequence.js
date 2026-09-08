const { normalizeSequence } = require('./sequence');

const LAC_SEQUENCE = 'aattaaattaattgtgagcggataacaatt';

function rbsBody(sequence, prefix, suffix, alias, name, plant) {
  let value = sequence;
  if (value.includes(LAC_SEQUENCE)) {
    value = `${prefix}${plant ? 'tatt' : 'atca'}${value}`;
    return value.endsWith('aa') ? `${value}tg${suffix}` : value.endsWith('a') ? `${value}atg${suffix}` : `${value}aatg${suffix}`;
  }
  const bcd = String(name).includes('BCD') || String(alias).includes('BCD');
  const desired = plant ? 'tatt' : 'atca';
  if (value.startsWith(desired)) value = prefix + value;
  else if (value.startsWith(plant ? 'tt' : 'ca')) value = `${prefix}${plant ? 'ta' : 'at'}${value}`;
  else value = prefix + desired + value;
  if (bcd && value.endsWith('aa')) return `${value}tg${suffix}`;
  return value.endsWith('a') ? `${value}atg${suffix}` : `${value}aatg${suffix}`;
}

/** Exact Node port of the active branches in legacy __process_part_sequence. */
function processPartSequence({ sequence, type, enzyme, source, alias = '', name = '', startScar = '', endScar = '' }) {
  const original = normalizeSequence(sequence).toLowerCase();
  const partType = String(type || '').toLowerCase();
  const organism = String(source || '').toLowerCase();
  const selected = enzyme === 'BsaI' ? 'BsaI' : 'BbsI';
  const prefix = selected === 'BsaI' ? 'ggtctca' : 'gaagacct';
  const suffix = selected === 'BsaI' ? 'agagacc' : 'aggtcttc';
  if (startScar && endScar) return normalizeSequence(prefix + startScar + original + endScar + suffix);

  const yeast = organism.includes('saccharomyces');
  const plant = organism.includes('plant');
  let value = original;
  if (partType === 'promoter') value = prefix + (plant ? 'tttt' : 'gtgc') + value + (plant ? 'tatt' : yeast ? 'aatg' : 'atca') + suffix;
  else if (partType === 'terminator') value = prefix + 'taaa' + value + 'cctc' + suffix;
  else if (partType === 'cds') value = prefix + 'a' + (value.startsWith('atg') ? value : `atg${value}`) + 'taaa' + suffix;
  else if (partType === 'rbs') value = rbsBody(value, prefix, suffix, alias, name, plant);
  else if (partType === 'p+r') value = prefix + (plant ? 'tttt' : 'gtgc') + value + 'aatg' + suffix;
  else throw new Error(`Unsupported Part type for sequence preprocessing: ${type}`);

  // Legacy behavior: when only one scar is supplied, replace only that end.
  const originalStart = value.indexOf(original, prefix.length);
  if (originalStart >= 0 && Boolean(startScar) !== Boolean(endScar)) {
    const originalEnd = originalStart + original.length;
    value = startScar ? prefix + startScar + value.slice(originalStart) : value.slice(0, originalEnd) + endScar + suffix;
  }
  return normalizeSequence(value);
}

module.exports = { processPartSequence };
