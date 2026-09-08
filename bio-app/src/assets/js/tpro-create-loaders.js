export async function loadExpressionDatasets(speciesId) {
  const res = await tpro.get(`dataset/show/expression/${speciesId}`);
  return res.status === 200 && Array.isArray(res.data) ? res.data : [];
}

export async function loadPredictors(speciesId) {
  const res = await tpro.get(`predictor/show/${speciesId}`);
  return res.status === 200 && Array.isArray(res.data) ? res.data : [];
}

export async function loadActivators(speciesId) {
  const res = await tpro.get(`activator/show/${speciesId}`);
  return res.status === 200 && Array.isArray(res.data) ? res.data : [];
}

export async function loadRegulators(speciesId) {
  const res = await tpro.get(`regulator/show/${speciesId}`);
  return res.status === 200 && Array.isArray(res.data) ? res.data : [];
}

export async function loadGenerators(speciesId) {
  const res = await tpro.get(`generator/show/${speciesId}`);
  return res.status === 200 && Array.isArray(res.data) ? res.data : [];
}

export function selectLatestItem(list, selectRef) {
  if (!list?.length || !selectRef?.onSelect) {
    return null;
  }

  const item = list[list.length - 1];
  selectRef.onSelect(item);
  return item;
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function emptyRegulatorComponent() {
  return {
    name: '',
    sequence: '',
    condition1: '',
    condition2: '',
    useInduction: false,
    inductionDatasets: [],
    scaling: 1,
  };
}

export async function loadConditionNames(datasetIDs) {
  if (!datasetIDs?.length) {
    return [];
  }

  const res = await tpro.post('dataset/view/field/conditionNames', { datasetIDs });
  const lists = res.status === 200 && Array.isArray(res.data) ? res.data : [];
  const names = new Set();

  lists.flat().forEach((name) => {
    if (name) {
      names.add(name);
    }
  });

  return [...names].map((name) => ({ ID: name, name }));
}
