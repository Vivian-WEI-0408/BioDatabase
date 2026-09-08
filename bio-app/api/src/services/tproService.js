const { prisma } = require('./db');
const { buildTaskWhere } = require('./taskStore');

const TPRO_API_URL = String(process.env.TPRO_API_URL || '').trim().replace(/\/?$/, '/');
const DEFAULT_TPRO_TIMEOUT_MS = 600000;

function assertTproApiConfigured() {
  if (!TPRO_API_URL) {
    throw new Error('TPRO_API_URL is not configured');
  }
}

function getTproRequestTimeoutMs() {
  const parsed = Number(process.env.TPRO_REQUEST_TIMEOUT_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_TPRO_TIMEOUT_MS;
}

const OPERATIONS = new Set([
  'promoter/generate',
  'promoter/predict',
  'library/generate',
  'regulation/design',
  'regulation/optimize',
  'reporter/register',
  'generator/register',
  'activator/register',
  'predictor/register',
  'regulator/register',
]);

const RETRYABLE_OPERATIONS = new Set([
  'promoter/generate',
  'promoter/predict',
  'library/generate',
  'regulation/design',
  'regulation/optimize',
]);

const REGISTER_ID_KEYS = {
  'reporter/register': 'reporterID',
  'generator/register': 'generatorID',
  'activator/register': 'activatorID',
  'predictor/register': 'predictorID',
  'regulator/register': 'regulatorID',
};

function buildCharactersTooltipDict(item) {
  const dict = {};

  if (!item || !Array.isArray(item.subregions)) {
    return dict;
  }

  item.subregions.forEach((sr) => {
    sr.positions.forEach((p) => {
      if (!dict[p]) {
        dict[p] = sr.bindingEnergy != null
          ? `<b style='color:${sr.color}'>${sr.name}</b> <br> Binding: ${sr.bindingEnergy.toFixed(2)}  <i>k</i><sub>B</sub><i>T</i> (${sr.source})`
          : `<b style='color:${sr.color}'>${sr.name}</b>`;
      }
    });
  });

  return dict;
}

function enrichResult(operation, data, displayMeta = {}) {
  const result = { ...data };

  if (operation === 'promoter/generate' || operation === 'promoter/predict') {
    if (!Array.isArray(result.resultList)) {
      throw new Error('Generated content is empty');
    }

    if (operation === 'promoter/generate' && (!result.regions || result.regions.length === 0)) {
      throw new Error('Generated content is empty');
    }

    result.resultList = result.resultList.map((item) => ({
      ...item,
      charactersTooltipDict: buildCharactersTooltipDict(item),
    }));
  }

  if (operation === 'library/generate') {
    if (!result.combinationList || result.combinationList.length === 0) {
      throw new Error('Generated content is empty');
    }

    if (displayMeta.spLabels) {
      result.spLabels = displayMeta.spLabels;
    }
  }

  if (operation === 'regulation/design' || operation === 'regulation/optimize') {
    if (!result.optimizedConditions || result.optimizedConditions.length === 0) {
      throw new Error(result.message || 'Optimization failed');
    }

    if (displayMeta.form) {
      result.form = displayMeta.form;
    }

    if (operation === 'regulation/design' && result.sequence) {
      result.sequence = {
        ...result.sequence,
        charactersTooltipDict: buildCharactersTooltipDict(result.sequence),
      };
    }
  }

  const idKey = REGISTER_ID_KEYS[operation];
  if (idKey) {
    if (!result[idKey] || result[idKey] <= 0) {
      throw new Error(result.message || 'Registration failed');
    }

    if (displayMeta.label) {
      result.label = displayMeta.label;
    }
  }

  return result;
}

function validateOperation(operation) {
  return OPERATIONS.has(operation);
}

function isRetryableOperation(operation) {
  return RETRYABLE_OPERATIONS.has(operation);
}

function isTransientNetworkError(err) {
  if (!err) {
    return false;
  }

  if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
    return false;
  }

  const message = String(err.message || err.cause?.message || '');
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|fetch failed|network/i.test(message);
}

function createTimeoutSignal(timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error('T-Pro request timeout'));
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason || new Error('T-Pro request cancelled'));
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}

async function parseTproResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || response.statusText || 'T-Pro API request failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}

async function callTproApi(operation, params, { signal } = {}) {
  assertTproApiConfigured();
  const timeoutMs = getTproRequestTimeoutMs();
  const { signal: requestSignal, cleanup } = createTimeoutSignal(timeoutMs, signal);

  try {
    const response = await fetch(`${TPRO_API_URL}${operation}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: requestSignal,
    });

    return parseTproResponse(response);
  } catch (err) {
    if (err?.name === 'AbortError' || requestSignal.aborted) {
      const reason = requestSignal.reason || err;
      const message = reason?.message || err.message || 'T-Pro request aborted';
      if (/timeout/i.test(message)) {
        throw new Error('T-Pro request timeout');
      }
      throw new Error(message.includes('cancelled') ? 'T-Pro request cancelled' : message);
    }
    throw err;
  } finally {
    cleanup();
  }
}

function decodeBase64File(filePayload) {
  if (!filePayload?.contentBase64) {
    return null;
  }

  const buffer = Buffer.from(filePayload.contentBase64, 'base64');
  return new Blob([buffer], { type: 'text/plain' });
}

async function callTproActivatorRegister(params, { signal } = {}) {
  assertTproApiConfigured();
  const {
    sequenceFile,
    backgroundFile,
    ...meta
  } = params;

  const form = new FormData();
  form.append('speciesID', String(meta.speciesID));
  form.append('name', meta.name || '');
  form.append('protein', meta.protein || '');
  form.append('consensus', meta.consensus ?? 'TTGACA--------------TGNTATAAT');
  form.append('shift', String(meta.shift ?? -35));
  form.append('globalShift', String(meta.globalShift ?? -20));

  const sequenceBlob = decodeBase64File(sequenceFile);
  if (!sequenceBlob) {
    throw new Error('Sequence file not provided');
  }
  form.append('sequenceFile', sequenceBlob, sequenceFile.fileName || 'promoter.txt');

  const backgroundBlob = decodeBase64File(backgroundFile);
  if (backgroundBlob) {
    form.append('backgroundFile', backgroundBlob, backgroundFile.fileName || 'background.txt');
  }

  const timeoutMs = getTproRequestTimeoutMs();
  const { signal: requestSignal, cleanup } = createTimeoutSignal(timeoutMs, signal);

  try {
    const response = await fetch(`${TPRO_API_URL}activator/register`, {
      method: 'POST',
      body: form,
      signal: requestSignal,
    });

    return parseTproResponse(response);
  } catch (err) {
    if (err?.name === 'AbortError' || requestSignal.aborted) {
      const reason = requestSignal.reason || err;
      const message = reason?.message || err.message || 'T-Pro request aborted';
      if (/timeout/i.test(message)) {
        throw new Error('T-Pro request timeout');
      }
      throw new Error(message.includes('cancelled') ? 'T-Pro request cancelled' : message);
    }
    throw err;
  } finally {
    cleanup();
  }
}

async function fetchTproGet(path, { signal } = {}) {
  assertTproApiConfigured();
  const timeoutMs = getTproRequestTimeoutMs();
  const { signal: requestSignal, cleanup } = createTimeoutSignal(timeoutMs, signal);

  try {
    const response = await fetch(`${TPRO_API_URL}${path}`, {
      signal: requestSignal,
    });

    let data = null;

    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const message = data?.detail || data?.message || response.statusText || 'T-Pro API request failed';
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err?.name === 'AbortError' || requestSignal.aborted) {
      const reason = requestSignal.reason || err;
      const message = reason?.message || err.message || 'T-Pro request aborted';
      if (/timeout/i.test(message)) {
        throw new Error('T-Pro request timeout');
      }
      throw new Error(message.includes('cancelled') ? 'T-Pro request cancelled' : message);
    }
    throw err;
  } finally {
    cleanup();
  }
}

async function countTproList(path) {
  try {
    const data = await fetchTproGet(path);
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.warn(`Failed to fetch T-Pro stats from ${path}:`, err.message);
    return 0;
  }
}

async function getTproStats(speciesId, userId) {
  const id = String(speciesId);
  const [
    expressionDataset,
    geneDataset,
    predictor,
    regulator,
    generator,
    activator,
    reporter,
    task,
  ] = await Promise.all([
    countTproList(`dataset/show/expression/${id}`),
    countTproList(`dataset/show/genes/${id}`),
    countTproList(`predictor/show/${id}`),
    countTproList(`regulator/show/${id}`),
    countTproList(`generator/show/${id}`),
    countTproList(`activator/show/${id}`),
    countTproList(`reporter/show/${id}`),
    prisma.task.count({
      where: {
        AND: [
          buildTaskWhere(userId, 'all'),
          { app_id: 't-pro' },
        ],
      },
    }),
  ]);

  return {
    expressionDataset,
    geneDataset,
    predictor,
    regulator,
    generator,
    activator,
    reporter,
    task,
  };
}

module.exports = {
  OPERATIONS,
  buildCharactersTooltipDict,
  callTproApi,
  callTproActivatorRegister,
  enrichResult,
  fetchTproGet,
  getTproRequestTimeoutMs,
  getTproStats,
  isRetryableOperation,
  isTransientNetworkError,
  validateOperation,
};
