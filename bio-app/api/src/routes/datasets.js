const fs = require('fs/promises');
const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { uploadBatchMiddleware, uploadMapMiddleware } = require('../middleware/uploadMulter');
const { listLegacyRows } = require('../services/datasetStore');
const {
  buildBrowseResponse,
  getBrowseDetail,
  listBrowseFilterOptions,
  normalizeDatasetType,
  updateBrowseItem,
  deleteBrowseItem,
} = require('../services/datasetBrowseStore');
const { cleanupMulterStagingFiles } = require('../services/datasetUploadFiles');
const {
  createBatchUploadTask,
  createMapUploadTask,
  getUploadTaskStatus,
  resolveTemplateDownloadName,
  resolveTemplatePath,
} = require('../services/datasetUploadStore');
const { canManageDatasetRows } = require('../constants/roles');
const { getDatasetMap } = require('../services/datasetMapExport');

const router = express.Router();

function runUploadMiddleware(middleware, req, res) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function formatMulterError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return 'File exceeds maximum upload size';
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return error.message || 'Too many files uploaded';
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return error.message || 'Unexpected upload field';
  }
  return error.message || 'Upload failed';
}

function canManageBrowseRows(user) {
  return canManageDatasetRows(user?.role);
}

router.post('/legacy/rows', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const {
    tableId,
    withSharingData = false,
    search = '',
    sortKey = 'id',
    sortDir = 'asc',
    filters = {},
  } = req.body || {};

  const rows = listLegacyRows({
    tableId,
    withSharingData,
    search: String(search).trim(),
    sortKey,
    sortDir,
    filters,
  });

  res.json(output({ rows }, 1));
});

router.post('/browse/rows', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const {
    datasetType,
    sortKey = 'name',
    sortDir = 'asc',
    filters = {},
    search = '',
    page = 1,
    pageSize = 10,
  } = req.body || {};

  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const payload = await buildBrowseResponse(normalizedType, {
      filters,
      search: String(search).trim(),
      sortKey,
      sortDir,
      page,
      pageSize,
    });

    res.json(output(payload, 1));
  } catch (error) {
    console.error('browse/rows failed:', error);
    res.json(output(null, 0, 'Failed to load browse rows'));
  }
});

router.post('/browse/options', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const { datasetType, enzyme = '' } = req.body || {};
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const options = await listBrowseFilterOptions(normalizedType, { enzyme });
    res.json(output({ options }, 1));
  } catch (error) {
    console.error('browse/options failed:', error);
    res.json(output(null, 0, 'Failed to load browse filter options'));
  }
});

router.post('/browse/detail', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const { datasetType, id } = req.body || {};
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const detail = await getBrowseDetail(normalizedType, id);
    if (!detail) {
      res.json(output(null, 0, 'Record not found'));
      return;
    }

    res.json(output({ datasetType: normalizedType, detail }, 1));
  } catch (error) {
    console.error('browse/detail failed:', error);
    res.json(output(null, 0, 'Failed to load record detail'));
  }
});

router.get('/browse/map/:datasetType/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const datasetType = normalizeDatasetType(req.params.datasetType);
  if (!datasetType) {
    res.status(400).json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const file = await getDatasetMap(datasetType, req.params.id);
    if (!file) {
      res.status(404).json(output(null, 0, 'Record not found'));
      return;
    }
    res.setHeader('Content-Type', 'application/genbank; charset=utf-8');
    res.attachment(file.filename);
    res.send(file.content);
  } catch (error) {
    const message = error?.message || 'Failed to export map';
    const status = /no sequence|invalid sequence/i.test(message) ? 422 : 500;
    res.status(status).json(output(null, 0, message));
  }
});

router.post('/browse/update', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (!canManageBrowseRows(user)) {
    res.json(output(null, 0, 'Permission denied'));
    return;
  }

  const { datasetType, id, values = {} } = req.body || {};
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const result = await updateBrowseItem(normalizedType, id, values);
    if (!result.ok) {
      res.json(output(null, 0, result.msg || 'Failed to update record'));
      return;
    }

    res.json(output({
      datasetType: normalizedType,
      detail: result.detail,
    }, 1));
  } catch (error) {
    console.error('browse/update failed:', error);
    res.json(output(null, 0, 'Failed to update record'));
  }
});

router.post('/browse/delete', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (!canManageBrowseRows(user)) {
    res.json(output(null, 0, 'Permission denied'));
    return;
  }

  const { datasetType, id } = req.body || {};
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  try {
    const result = await deleteBrowseItem(normalizedType, id);
    if (!result.ok) {
      res.json(output(null, 0, result.msg || 'Failed to delete record'));
      return;
    }

    res.json(output({ datasetType: normalizedType, id }, 1));
  } catch (error) {
    console.error('browse/delete failed:', error);
    res.json(output(null, 0, 'Failed to delete record'));
  }
});

router.post('/browse/upload-map', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    await runUploadMiddleware(uploadMapMiddleware, req, res);
  } catch (error) {
    res.json(output(null, 0, formatMulterError(error)));
    return;
  }

  const { datasetType, saveFeature, conflictPolicy } = req.body || {};
  const files = Array.isArray(req.files) ? req.files : [];

  try {
    const payload = await createMapUploadTask(user, {
      datasetType,
      saveFeature,
      files,
      conflictPolicy,
    });
    if (payload.requiresConfirmation) await cleanupMulterStagingFiles(files);
    res.json(output(payload, 1));
  } catch (error) {
    await cleanupMulterStagingFiles(files);
    console.error('browse/upload-map failed:', error);
    res.json(output(null, 0, error.message || 'Failed to create upload task'));
  }
});

router.post('/browse/upload-batch', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (!canManageBrowseRows(user)) {
    res.json(output(null, 0, 'Permission denied'));
    return;
  }

  try {
    await runUploadMiddleware(uploadBatchMiddleware, req, res);
  } catch (error) {
    res.json(output(null, 0, formatMulterError(error)));
    return;
  }

  const file = req.file || null;

  try {
    const payload = await createBatchUploadTask(user, { file, conflictPolicy: req.body?.conflictPolicy });
    if (payload.requiresConfirmation) await cleanupMulterStagingFiles(file);
    res.json(output(payload, 1));
  } catch (error) {
    await cleanupMulterStagingFiles(file);
    console.error('browse/upload-batch failed:', error);
    res.json(output(null, 0, error.message || 'Failed to create upload task'));
  }
});

router.post('/browse/upload-status', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const { taskId } = req.body || {};

  try {
    const status = await getUploadTaskStatus(user.id, taskId);
    if (!status) {
      res.json(output(null, 0, 'Task not found'));
      return;
    }

    res.json(output(status, 1));
  } catch (error) {
    console.error('browse/upload-status failed:', error);
    res.json(output(null, 0, 'Failed to load upload status'));
  }
});

router.get('/browse/upload-template', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (!canManageBrowseRows(user)) {
    res.json(output(null, 0, 'Permission denied'));
    return;
  }

  const datasetType = req.query.datasetType || req.query.type || '';
  const normalizedType = normalizeDatasetType(datasetType);
  if (!normalizedType) {
    res.json(output(null, 0, 'Invalid datasetType'));
    return;
  }

  const templatePath = resolveTemplatePath(normalizedType);
  if (!templatePath) {
    res.json(output(null, 0, 'Template not found'));
    return;
  }

  try {
    await fs.access(templatePath);
    const downloadName = resolveTemplateDownloadName(normalizedType);
    res.download(templatePath, downloadName);
  } catch (error) {
    res.json(output(null, 0, 'Template not found'));
  }
});

module.exports = router;
