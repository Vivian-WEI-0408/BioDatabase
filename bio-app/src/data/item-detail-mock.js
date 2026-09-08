export const itemDetailSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'test-data', label: 'Test Data' },
  { id: 'sequence', label: 'Sequence' },
  { id: 'reference', label: 'Reference' },
];

export const defaultItemId = 'pllac-001';

const items = [
  {
    id: 'pllac-001',
    categoryLabel: 'Promoter',
    title: 'Pllac - Inducible Promoter',
    description: 'description of item.',
    overview: {
      fields: [
        { label: 'Type', value: 'Inducible Promoter' },
        { label: 'Regulator', value: 'Lacl' },
        { label: 'Function', value: 'Hardwire' },
        { label: 'Regulated Type', value: 'Repressor' },
        { label: 'Inducer', value: 'IPTG' },
        { label: 'Upload User', value: 'admin' },
      ],
    },
    testData: {
      parameterTable: {
        columns: ['Parameter', 'Max Output', 'Leakiness', 'Dynamic range'],
        rows: [
          { label: 'Value', values: ['0.00227', '0.00012', '18.9'] },
          { label: 'Unit', values: ['RPU', 'RPU', 'fold'] },
        ],
      },
      environmentTable: {
        rows: [
          { label: 'Strain', value: 'ECint035' },
          { label: 'Plasmid', value: 'XRHL3-1151' },
          { label: 'Origin', value: 'p15A' },
          { label: 'Resistance', value: 'KanR' },
        ],
      },
      circuitImage: '/images/item-detail/circuit.png',
      methodDescription:
        'Cultures of E.coli DH5α transformed with pSB1C3-GFP were grown in M9 minimal media supplemented with 0.4% glucose and 34 μg/mL choramphenicil at 37℃. Induction was performed at OD600 = 0.4 with 1mM IPTG for 6 hours. Fluorescence was measured using a plare reader (ex: 485nm, em:520nm) and normalized to OD600 to caculate RPU.',
      resultImage: '/images/item-detail/result-charts.png',
    },
    sequence: 'aattgtgagcggataacaattgacattgtgagcggataacaagatactgagcaca',
    reference: {
      text: 'Davis, J. H., Rubin, A. J. & Sauer, R. T. Design, construction and characterization of a set of insulated bacterial promoters. Nucleic Acids Res. 39, 1131–1141 (2011).',
      url: 'https://doi.org/10.1093/nar/gkq810',
    },
  },
];

export function getItemById(id) {
  return items.find((item) => item.id === id) || null;
}
