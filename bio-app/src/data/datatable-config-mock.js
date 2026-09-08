const avatar = '/images/avatar.png';

function makeSharedUser(id, name, email) {
  return { id, name, email, avatar };
}

function makeTableNav(id, title) {
  return { id, title };
}

const defaultSharedUsers = [
  makeSharedUser('guest-a', 'Guest A', 'guest.1@gmail.com'),
  makeSharedUser('guest-b', 'Guest B', 'guest.2@gmail.com'),
  makeSharedUser('guest-c', 'Guest C', 'guest.2@gmail.com'),
];

export const datatableConfigSections = [
  {
    id: 'common',
    title: 'Common',
    expanded: true,
    tables: [
      makeTableNav('ds-a', 'Data Table A'),
      makeTableNav('ds-b', 'Data Table B'),
      makeTableNav('ds-c', 'Data Table C'),
      makeTableNav('ds-d', 'Data Table D'),
    ],
  },
  {
    id: 'tpro',
    title: 'T-Pro',
    expanded: false,
    tables: [
      makeTableNav('ds-g', 'Data Table G'),
      makeTableNav('ds-h', 'Data Table H'),
    ],
  },
  {
    id: 'tplot',
    title: 'TPlot',
    expanded: false,
    tables: [
      makeTableNav('ds-e', 'Data Table E'),
      makeTableNav('ds-f', 'Data Table F'),
      makeTableNav('ds-i', 'Data Table I'),
    ],
  },
];

export const defaultTableId = 'ds-a';

export const datatableConfigs = {
  'ds-a': {
    name: 'Data Table A',
    description: 'DNA Data',
    sharedUsers: defaultSharedUsers.map((user) => ({ ...user })),
  },
  'ds-b': {
    name: 'Data Table B',
    description: 'Protein expression records',
    sharedUsers: defaultSharedUsers.slice(0, 2).map((user) => ({ ...user })),
  },
  'ds-c': {
    name: 'Data Table C',
    description: 'Promoter library metadata',
    sharedUsers: [defaultSharedUsers[0]].map((user) => ({ ...user })),
  },
  'ds-d': {
    name: 'Data Table D',
    description: 'T-Pro experiment results',
    sharedUsers: defaultSharedUsers.map((user) => ({ ...user })),
  },
  'ds-e': {
    name: 'Data Table E',
    description: 'TPlot visualization data',
    sharedUsers: defaultSharedUsers.slice(1).map((user) => ({ ...user })),
  },
  'ds-f': {
    name: 'Data Table F',
    description: 'Chart series export',
    sharedUsers: defaultSharedUsers.map((user) => ({ ...user })),
  },
  'ds-g': {
    name: 'Data Table G',
    description: 'Species registry',
    sharedUsers: defaultSharedUsers.slice(0, 1).map((user) => ({ ...user })),
  },
  'ds-h': {
    name: 'Data Table H',
    description: 'Generator configurations',
    sharedUsers: defaultSharedUsers.map((user) => ({ ...user })),
  },
  'ds-i': {
    name: 'Data Table I',
    description: 'Plot annotations',
    sharedUsers: defaultSharedUsers.slice(0, 2).map((user) => ({ ...user })),
  },
};

export function cloneSections(sections) {
  return sections.map((section) => ({
    ...section,
    tables: section.tables.map((table) => ({ ...table })),
  }));
}

export function cloneConfig(config) {
  return {
    name: config.name,
    description: config.description,
    sharedUsers: config.sharedUsers.map((user) => ({ ...user })),
  };
}

export function getTableConfigById(tableId, configs = datatableConfigs) {
  const config = configs[tableId];
  if (config) {
    return cloneConfig(config);
  }
  return cloneConfig(datatableConfigs[defaultTableId]);
}

export function getTableTitleById(tableId, sections = datatableConfigSections) {
  for (const section of sections) {
    const table = section.tables.find((item) => item.id === tableId);
    if (table) {
      return table.title;
    }
  }
  return datatableConfigSections[0].tables[0].title;
}

export function findSectionForTable(tableId, sections = datatableConfigSections) {
  return sections.find((section) => section.tables.some((item) => item.id === tableId)) || null;
}

export function isKnownTableId(tableId, sections = datatableConfigSections) {
  return sections.some((section) => section.tables.some((item) => item.id === tableId));
}
