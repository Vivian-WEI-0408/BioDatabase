const path = require('path');
const { prisma } = require('./db');
const { normalizeDatasetType } = require('./datasetBrowseStore');
const {
  createTask,
  getTaskDetail,
  parseTaskId,
} = require('./taskStore');
const { enqueueDatasetUploadTask } = require('./datasetUploadRunner');
const {
  cleanupUploadFiles,
  cleanupMulterStagingFiles,
  getFileExtension,
  persistUploadedFiles,
} = require('./datasetUploadFiles');
const { parseBatchWorkbook } = require('./datasetBatchImport');

const LAB_DATABASE_APP_ID = 'lab-database';

const MAP_EXTENSIONS = new Set(['.fasta', '.fa', '.gb', '.gbk', '.ape', '.str', '.dna']);
const BATCH_EXTENSIONS = new Set(['.xlsx']);

const UPLOAD_OPERATIONS = new Set([
  'datasets/upload-map',
  'datasets/upload-batch',
]);

const TEMPLATE_FILES = Object.freeze({
  part: 'part_template.xlsx',
  backbone: 'backbone_template.xlsx',
  plasmid: 'plasmid_template.xlsx',
});

const TEMPLATE_DOWNLOAD_NAMES = Object.freeze({
  part: 'part_template.xlsx',
  backbone: 'backbone_template.xlsx',
  plasmid: 'plasmid_template.xlsx',
});

function resolveTemplateDir() {
  return process.env.DATASET_UPLOAD_TEMPLATE_DIR
    || path.resolve(__dirname, '../../res/templates');
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function normalizeConflictPolicy(value) {
  return ['update', 'skip'].includes(String(value || '').toLowerCase())
    ? String(value).toLowerCase() : '';
}

async function existingNames(datasetType, names) {
  const config = {
    part: ['partTable', 100], backbone: ['backboneTable', 20], plasmid: ['plasmidNeed', 20],
  }[datasetType];
  if (!config) return [];
  const normalized = [...new Set(names.map((name) => truncateName(name, config[1])).filter(Boolean))];
  if (!normalized.length) return [];
  const rows = await prisma[config[0]].findMany({ where: { name: { in: normalized } }, select: { name: true } });
  return rows.map((row) => row.name);
}

function truncateName(value, length) {
  return String(value || '').trim().slice(0, length);
}

function validateMapFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return 'At least one file is required';
  }

  for (const file of files) {
    const ext = getFileExtension(file.originalname || file.filename);
    if (!MAP_EXTENSIONS.has(ext)) {
      return `Unsupported file type: ${ext || '(none)'}`;
    }
    if (!file.size || file.size <= 0) {
      return `File is empty: ${file.originalname || file.filename}`;
    }
  }

  return null;
}

function validateBatchFile(file) {
  if (!file) {
    return 'File is required';
  }

  const ext = getFileExtension(file.originalname || file.filename);
  if (!BATCH_EXTENSIONS.has(ext)) {
    return `Unsupported file type: ${ext || '(none)'}; please upload an .xlsx template file`;
  }
  if (!file.size || file.size <= 0) {
    return 'File is empty';
  }

  return null;
}

function buildMapTaskName(datasetType, fileCount) {
  const label = datasetType.charAt(0).toUpperCase() + datasetType.slice(1);
  return `Upload ${label}: ${fileCount} file${fileCount === 1 ? '' : 's'}`;
}

function buildBatchTaskName(filename) {
  return `Batch upload: ${filename}`;
}

function extractProgress(taskDetail) {
  if (taskDetail.result && typeof taskDetail.result.progress === 'number') {
    return taskDetail.result.progress;
  }

  switch (taskDetail.status) {
    case 'completed':
      return 100;
    case 'failed':
      return taskDetail.result?.progress ?? 0;
    case 'running':
    case 'pending':
    default:
      return 0;
  }
}

function extractStatusMessage(taskDetail) {
  if (taskDetail.status === 'failed') {
    return taskDetail.errorMsg || 'Upload failed';
  }
  if (taskDetail.status === 'completed') {
    const result = taskDetail.result || {};
    let message = '';
    if (typeof result.message === 'string' && result.message.trim()) {
      message = result.message.trim();
    } else if (typeof result.created === 'number') {
      const failed = Number(result.failed) || 0;
      if (failed > 0) {
        message = `Created ${result.created}, failed ${failed}`;
      } else {
        message = `Created ${result.created} record${result.created === 1 ? '' : 's'}`;
      }
    } else {
      message = 'Upload completed';
    }

    if (Array.isArray(result.errors) && result.errors.length > 0 && Number(result.failed) > 0) {
      const preview = result.errors.slice(0, 3).join('; ');
      const more = result.errors.length > 3 ? ` (+${result.errors.length - 3} more)` : '';
      return `${message}. ${preview}${more}`;
    }

    return message;
  }
  if (taskDetail.status === 'running') {
    return 'Upload in progress';
  }
  return 'Upload pending';
}

async function createMapUploadTask(user, { datasetType, saveFeature = false, files = [], conflictPolicy } = {}) {
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    throw new Error('Invalid datasetType');
  }

  const fileError = validateMapFiles(files);
  if (fileError) {
    throw new Error(fileError);
  }
  const conflicts = await existingNames(normalizedType, files.map((file) => path.parse(file.originalname || file.filename || '').name.slice(0, 20)));
  const policy = normalizeConflictPolicy(conflictPolicy);
  if (conflicts.length && !policy) return { requiresConfirmation: true, conflicts, datasetType: normalizedType };

  const skippedFiles = policy === 'skip' ? files.filter((file) => conflicts.includes(
    path.parse(file.originalname || file.filename || '').name.slice(0, 20),
  )) : [];
  const pendingFiles = files.filter((file) => !skippedFiles.includes(file));
  const skippedRecords = skippedFiles.map((file) => ({
    name: path.parse(file.originalname || file.filename || '').name.slice(0, 20),
    action: 'skipped',
  }));
  await cleanupMulterStagingFiles(skippedFiles);

  const task = await createTask(user.id, {
    appId: LAB_DATABASE_APP_ID,
    name: buildMapTaskName(normalizedType, files.length),
    operation: 'datasets/upload-map',
    params: {
      uploadKind: 'map',
      datasetType: normalizedType,
      saveFeature: parseBoolean(saveFeature),
      files: [], conflictPolicy: policy,
    },
  });

  if (!task) {
    throw new Error('Failed to create upload task');
  }

  const taskId = parseTaskId(task.id);
  const persistedFiles = await persistUploadedFiles(taskId, pendingFiles);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      params_json: JSON.stringify({
        apiParams: {
          uploadKind: 'map',
          datasetType: normalizedType,
          saveFeature: parseBoolean(saveFeature),
          files: persistedFiles, conflictPolicy: policy, skippedRecords,
        },
      }),
    },
  });

  enqueueDatasetUploadTask(taskId);

  return {
    taskId,
    task,
    message: 'Upload task created',
  };
}

async function createBatchUploadTask(user, { file, conflictPolicy } = {}) {
  const fileError = validateBatchFile(file);
  if (fileError) {
    throw new Error(fileError);
  }
  const parsed = parseBatchWorkbook(file.path);
  const conflicts = await existingNames(parsed.datasetType, parsed.rows.map((row) => row.name));
  const policy = normalizeConflictPolicy(conflictPolicy);
  if (conflicts.length && !policy) return { requiresConfirmation: true, conflicts, datasetType: parsed.datasetType };

  const originalName = file.originalname || file.filename || 'batch.xlsx';
  const task = await createTask(user.id, {
    appId: LAB_DATABASE_APP_ID,
    name: buildBatchTaskName(originalName),
    operation: 'datasets/upload-batch',
    params: {
      uploadKind: 'batch',
      datasetType: null,
      saveFeature: false,
      files: [], conflictPolicy: policy,
    },
  });

  if (!task) {
    throw new Error('Failed to create upload task');
  }

  const taskId = parseTaskId(task.id);
  const persistedFiles = await persistUploadedFiles(taskId, [file]);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      params_json: JSON.stringify({
        apiParams: {
          uploadKind: 'batch',
          datasetType: null,
          saveFeature: false,
          files: persistedFiles, conflictPolicy: policy,
        },
      }),
    },
  });

  enqueueDatasetUploadTask(taskId);

  return {
    taskId,
    task,
    message: 'Upload task created',
  };
}

async function getUploadTaskStatus(userId, taskId) {
  const numericId = parseTaskId(taskId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const task = await prisma.task.findFirst({
    where: {
      id: numericId,
      user_id: userId,
    },
    select: {
      operation: true,
    },
  });

  if (!task || !UPLOAD_OPERATIONS.has(task.operation)) {
    return null;
  }

  const taskDetail = await getTaskDetail(userId, numericId);
  if (!taskDetail) {
    return null;
  }

  const apiParams = taskDetail.params?.apiParams || taskDetail.params || {};
  const uploadKind = apiParams.uploadKind
    || (task.operation === 'datasets/upload-batch' ? 'batch' : 'map');

  return {
    taskId: numericId,
    status: taskDetail.status,
    progress: extractProgress(taskDetail),
    message: extractStatusMessage(taskDetail),
    errorMsg: taskDetail.errorMsg || '',
    uploadKind,
    datasetType: apiParams.datasetType ?? null,
    result: taskDetail.result || null,
  };
}

function resolveTemplatePath(datasetType) {
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType || !TEMPLATE_FILES[normalizedType]) {
    return null;
  }

  return path.join(resolveTemplateDir(), TEMPLATE_FILES[normalizedType]);
}

function resolveTemplateDownloadName(datasetType) {
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    return null;
  }
  return TEMPLATE_DOWNLOAD_NAMES[normalizedType] || `${normalizedType}_template.xlsx`;
}

module.exports = {
  createBatchUploadTask,
  createMapUploadTask,
  cleanupUploadFiles,
  getUploadTaskStatus,
  resolveTemplateDownloadName,
  resolveTemplatePath,
};
