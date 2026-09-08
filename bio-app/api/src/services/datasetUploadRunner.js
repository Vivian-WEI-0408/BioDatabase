const { prisma } = require('./db');
const {
  completeTask,
  failTask,
  parseTaskParams,
  parseTaskId,
} = require('./taskStore');
const {
  BatchImportError,
  runBatchImportFromFile,
} = require('./datasetBatchImport');
const { cleanupUploadFiles } = require('./datasetUploadFiles');
const { importParsedDatasetResults } = require('./datasetImportStore');
const { parseDatasetUpload } = require('./datasetParserClient');

const UPLOAD_OPERATIONS = new Set([
  'datasets/upload-map',
  'datasets/upload-batch',
]);

function resolveUploadKind(operation, apiParams) {
  if (apiParams.uploadKind) {
    return apiParams.uploadKind;
  }
  if (operation === 'datasets/upload-batch') {
    return 'batch';
  }
  return 'map';
}

function buildBatchSummaryMessage(result) {
  const created = Number(result.created) || 0;
  const updated = Number(result.updated) || 0;
  const skipped = Number(result.skipped) || 0;
  const failed = Number(result.failed) || 0;
  const base = failed > 0
    ? `Created ${created}, updated ${updated}, skipped ${skipped}, failed ${failed}`
    : `Created ${created}, updated ${updated}, skipped ${skipped}`;
  const missingSequence = Array.isArray(result.warnings) ? result.warnings.length : 0;
  return missingSequence > 0
    ? `${base}. ${missingSequence} new record(s) have no sequence; please add sequences later.`
    : base;
}

async function runLocalBatchUpload(task, apiParams) {
  const files = Array.isArray(apiParams.files) ? apiParams.files : [];
  const file = files[0];
  if (!file?.path) {
    throw new BatchImportError('Uploaded Excel file is missing');
  }

  const result = await runBatchImportFromFile(file.path, {
    id: task.user.id,
    name: task.user.name,
    email: task.user.email,
  }, apiParams.conflictPolicy);

  if (result.created === 0 && result.updated === 0 && result.skipped === 0) {
    const firstError = Array.isArray(result.errors) && result.errors.length > 0
      ? result.errors[0]
      : 'No records were imported';
    const detail = Array.isArray(result.errors) && result.errors.length > 1
      ? `${firstError} (and ${result.errors.length - 1} more)`
      : firstError;
    throw new BatchImportError(detail);
  }

  return {
    progress: 100,
    datasetType: result.datasetType,
    created: result.created,
    failed: result.failed,
    total: result.total,
    errors: result.errors,
    warnings: result.warnings,
    message: buildBatchSummaryMessage(result),
  };
}

async function runDatasetUploadTask(taskId) {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return;
  }

  const claimed = await prisma.task.updateMany({
    where: {
      id: numericId,
      status: 'pending',
      operation: { in: [...UPLOAD_OPERATIONS] },
    },
    data: {
      status: 'running',
      started_at: new Date(),
      finished_at: null,
      error_msg: null,
    },
  });
  if (claimed.count === 0) return;

  const task = await prisma.task.findUnique({
    where: { id: numericId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task || !UPLOAD_OPERATIONS.has(task.operation)) {
    return;
  }

  const { apiParams } = parseTaskParams(task);
  const uploadKind = resolveUploadKind(task.operation, apiParams);

  try {
    if (uploadKind === 'batch') {
      const result = await runLocalBatchUpload(task, apiParams);
      await completeTask(numericId, result);
      return;
    }

    const parserResult = await parseDatasetUpload({
      datasetType: apiParams.datasetType,
      saveFeature: Boolean(apiParams.saveFeature),
      files: Array.isArray(apiParams.files) ? apiParams.files : [],
    });
    if (parserResult.status !== 'completed') {
      const errors = Array.isArray(parserResult.errors) ? parserResult.errors : [];
      throw new Error(errors.join('; ') || 'Map parser failed');
    }
    const imported = await importParsedDatasetResults({
      datasetType: apiParams.datasetType,
      parserResult,
      saveFeature: Boolean(apiParams.saveFeature),
      user: task.user,
      conflictPolicy: apiParams.conflictPolicy,
    });
    const created = imported.filter((item) => item.action === 'created').length;
    const updated = imported.filter((item) => item.action === 'updated').length;
    const skipped = imported.filter((item) => item.action === 'skipped').length;
    await completeTask(numericId, {
      progress: 100,
      datasetType: apiParams.datasetType,
      created,
      updated,
      skipped,
      failed: 0,
      total: imported.length,
      records: imported,
      message: `Created ${created}, updated ${updated}, skipped ${skipped}`,
    });
  } catch (err) {
    let message = 'Dataset upload failed';

    if (err instanceof BatchImportError) {
      message = err.message;
    } else if (err && typeof err.message === 'string' && err.message.trim()) {
      message = err.message.trim();
    }

    await failTask(numericId, message.slice(0, 512));
  } finally {
    try {
      await cleanupUploadFiles(numericId);
    } catch (cleanupErr) {
      console.warn(`Failed to cleanup upload files for task #${numericId}:`, cleanupErr.message);
    }
  }
}

function enqueueDatasetUploadTask(taskId) {
  setImmediate(() => {
    runDatasetUploadTask(taskId).catch((err) => {
      console.error(`Failed to run dataset upload task #${taskId}:`, err);
    });
  });
}

async function reclaimDatasetUploadTasks() {
  await prisma.task.updateMany({
    where: {
      app_id: 'lab-database',
      status: 'running',
      operation: { in: [...UPLOAD_OPERATIONS] },
    },
    data: { status: 'pending', started_at: null, error_msg: null },
  });
  const pending = await prisma.task.findMany({
    where: {
      app_id: 'lab-database',
      status: 'pending',
      operation: { in: [...UPLOAD_OPERATIONS] },
    },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  pending.forEach((task) => enqueueDatasetUploadTask(task.id));
  return { requeued: pending.length };
}

module.exports = {
  enqueueDatasetUploadTask,
  reclaimDatasetUploadTasks,
  runDatasetUploadTask,
};
