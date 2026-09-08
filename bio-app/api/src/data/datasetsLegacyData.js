function makeRow(id, fieldA, fieldB, createdAt, creatorName, shared = false, filterFields = {}) {
  return {
    id,
    fieldA,
    fieldB,
    createdAt,
    creator: { name: creatorName, avatar: '/images/avatar.png' },
    shared,
    ...filterFields,
  };
}

const partTypes = ['Promoter', 'RBS', 'Terminator'];
const partEnzymes = ['BsaI', 'BsmBI', 'EcoRI'];
const partScars = ['GGAG', 'GCTT', 'AATG'];

const backboneTypes = ['Vector', 'Entry', 'Expression'];
const backboneEnzymes = ['BsaI', 'NotI', 'XbaI'];
const backboneResistances = ['Amp', 'Kan', 'Cam'];

const plasmidTypes = ['Cloning', 'Expression', 'Storage'];
const plasmidResistances = ['Amp', 'Kan', 'Spec'];
const plasmidCopyNumbers = ['High', 'Low', 'Medium'];

function pick(list, index) {
  return list[index % list.length];
}

function makeTypedTableRows(tableType, count = 10) {
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const num = String(i + 1).padStart(4, '0');
    let filterFields = {};

    if (tableType === 'part') {
      filterFields = {
        type: pick(partTypes, i),
        enzyme: pick(partEnzymes, i),
        scar: pick(partScars, i),
      };
    } else if (tableType === 'backbone') {
      filterFields = {
        type: pick(backboneTypes, i),
        enzyme: pick(backboneEnzymes, i),
        resistance: pick(backboneResistances, i),
      };
    } else if (tableType === 'plasmid') {
      filterFields = {
        type: pick(plasmidTypes, i),
        resistance: pick(plasmidResistances, i),
        copyNumber: pick(plasmidCopyNumbers, i),
      };
    }

    rows.push(
      makeRow(
        num,
        'Field Value',
        'Field Value',
        '12 Dec, 2020 01:17:19',
        i % 3 === 0 ? 'Me' : 'Shared User',
        i % 4 === 0,
        filterFields,
      ),
    );
  }

  return rows;
}

function makeTableRows(count = 10) {
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const num = String(i + 1).padStart(4, '0');
    rows.push(
      makeRow(
        num,
        'Field Value',
        'Field Value',
        '12 Dec, 2020 01:17:19',
        i % 3 === 0 ? 'Me' : 'Shared User',
        i % 4 === 0,
      ),
    );
  }

  return rows;
}

function makeTable(id, title, category, tableType = null) {
  return {
    id,
    title,
    category,
    tableType,
    rows: tableType ? makeTypedTableRows(tableType) : makeTableRows(),
  };
}

const datasetLegacySections = [
  {
    id: 'common',
    title: 'Common',
    expanded: true,
    tables: [
      makeTable('ds-part', '🧩  Part', 'common', 'part'),
      makeTable('ds-backbone', ' 🧬 Backbone', 'common', 'backbone'),
      makeTable('ds-plasmid', '🧪 Plasmid', 'common', 'plasmid'),
      makeTable('ds-d', 'Data Table D', 'common'),
    ],
  },
  {
    id: 'tpro',
    title: 'T-Pro',
    expanded: false,
    tables: [
      makeTable('ds-e', 'Data Table E', 'tpro'),
      makeTable('ds-f', 'Data Table F', 'tpro'),
    ],
  },
  {
    id: 'tplot',
    title: 'TPlot',
    expanded: false,
    tables: [
      makeTable('ds-g', 'Data Table G', 'tplot'),
      makeTable('ds-h', 'Data Table H', 'tplot'),
      makeTable('ds-i', 'Data Table I', 'tplot'),
    ],
  },
];

function getTableById(tableId) {
  for (const section of datasetLegacySections) {
    const table = section.tables.find((item) => item.id === tableId);
    if (table) return table;
  }

  return datasetLegacySections[0].tables[0];
}

module.exports = {
  getTableById,
};
