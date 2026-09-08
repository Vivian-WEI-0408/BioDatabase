export const TPRO_RESOURCES = {
  expressionDataset: {
    key: 'expressionDataset',
    label: 'Expression Dataset',
    title: 'Expression datasets',
    listType: 'tpro',
    listPath: (speciesId) => `dataset/show/expression/${speciesId}`,
    deletePath: 'dataset/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      datasetType: 'expression',
      itemIDs,
    }),
    canCreate: true,
    datasetType: 'expression',
    fileType: 'CSV',
  },
  geneDataset: {
    key: 'geneDataset',
    label: 'Gene Dataset',
    title: 'Gene datasets',
    listType: 'tpro',
    listPath: (speciesId) => `dataset/show/genes/${speciesId}`,
    deletePath: 'dataset/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      datasetType: 'genes',
      itemIDs,
    }),
    canCreate: true,
    datasetType: 'genes',
    fileType: 'CSV',
  },
  predictor: {
    key: 'predictor',
    label: 'Promoter strength<br>predictor',
    title: 'Promoter strength predictors',
    listType: 'tpro',
    listPath: (speciesId) => `predictor/show/${speciesId}`,
    deletePath: 'predictor/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      itemIDs,
    }),
    canCreate: true,
    createModal: 'create-predictor',
    taskOperation: 'predictor/register',
  },
  regulator: {
    key: 'regulator',
    label: 'Transcriptional regulator<br>',
    title: 'Transcriptional regulators',
    listType: 'tpro',
    listPath: (speciesId) => `regulator/show/${speciesId}`,
    deletePath: 'regulator/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      itemIDs,
    }),
    canCreate: true,
    createModal: 'create-regulator',
    taskOperation: 'regulator/register',
  },
  generator: {
    key: 'generator',
    label: 'Promoter  Generator',
    title: 'Promoter sequence generators',
    listType: 'tpro',
    listPath: (speciesId) => `generator/show/${speciesId}`,
    deletePath: 'generator/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      itemIDs,
    }),
    canCreate: true,
    createModal: 'create-promoter-generator',
    taskOperation: 'generator/register',
  },
  activator: {
    key: 'activator',
    label: 'Transcriptional activator',
    title: 'Transcriptional activators',
    listType: 'tpro',
    listPath: (speciesId) => `activator/show/${speciesId}`,
    deletePath: 'activator/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      itemIDs,
    }),
    canCreate: true,
    createModal: 'create-activator',
    taskOperation: 'activator/register',
  },
  reporter: {
    key: 'reporter',
    label: 'Reporter',
    title: 'Reporter proteins',
    listType: 'tpro',
    listPath: (speciesId) => `reporter/show/${speciesId}`,
    deletePath: 'reporter/delete',
    buildDeletePayload: (speciesId, itemIDs) => ({
      speciesID: speciesId,
      itemIDs,
    }),
    canCreate: true,
    createModal: 'create-reporter',
    taskOperation: 'reporter/register',
  },
  task: {
    key: 'task',
    label: 'Task',
    title: 'T-Pro tasks',
    listType: 'tasks',
    canCreate: false,
    canDelete: true,
  },
};

export const STAT_ITEMS = Object.values(TPRO_RESOURCES).map(({ key, label }) => ({
  key,
  label,
}));

export function getTproResource(key) {
  return TPRO_RESOURCES[key] || null;
}

export function parseTproError(err) {
  const data = err?.response?.data;
  if (!data) {
    return err?.message || 'Unknown error';
  }
  if (typeof data === 'string') {
    return data;
  }
  if (data.detail) {
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  }
  if (data.message) {
    return data.message;
  }
  return 'Unknown error';
}
