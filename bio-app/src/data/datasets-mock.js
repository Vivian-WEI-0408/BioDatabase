function makeDataset(id, title, category, description, itemCount, date) {
  return { id, title, category, description, itemCount, date };
}

export const datasetTabs = [
  { label: 'ALL', value: 'all' },
  { label: 'Common', value: 'common' },
  { label: 'TPlot', value: 'tplot' },
  { label: 'T-Pro', value: 'tpro' },
];

export const datasets = [
  makeDataset('ds-a', 'Data Table A', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-b', 'Data Table B', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-c', 'Data Table C', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-d', 'Data Table D', 'tpro', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-e', 'Data Table E', 'tplot', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-f', 'Data Table F', 'tplot', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-g', 'Data Table G', 'tpro', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-h', 'Data Table H', 'tplot', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-i', 'Data Table I', 'tplot', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-j', 'Data Table J', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-k', 'Data Table K', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
  makeDataset('ds-l', 'Data Table L', 'common', 'Data table description', '12.3k Items', '2025-11-05'),
];
