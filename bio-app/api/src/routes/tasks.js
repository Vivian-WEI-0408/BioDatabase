const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const {
  createTask,
  deleteTasks,
  getTaskDetail,
  listTasks,
  parseTaskId,
  shareTasks,
  unshareTasks,
  updateTask,
} = require('../services/taskStore');
const { createNotification } = require('../services/notificationStore');
const { validateOperation } = require('../services/tproService');
const { enqueueTproTask, requestCancelTask } = require('../services/taskRunner');

const router = express.Router();

router.post('/list', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const scope = req.body.scope || 'all';
  const search = (req.body.search || '').trim();
  const sortKey = req.body.sortKey || 'id';
  const sortDir = req.body.sortDir || 'asc';
  const tasks = await listTasks(user.id, {
    scope,
    search,
    sortKey,
    sortDir,
    sharedByUserId: req.body.sharedByUserId,
    sharedWithUserId: req.body.sharedWithUserId,
  });

  res.json(output({ tasks }, 1));
});

router.post('/create', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const {
    appId = 't-pro',
    name,
    operation,
    params,
    displayMeta,
  } = req.body || {};

  if (!validateOperation(operation)) {
    res.json(output(null, 3, 'Invalid operation'));
    return;
  }

  const task = await createTask(user.id, {
    appId,
    name,
    operation,
    params,
    displayMeta,
  });

  if (!task) {
    res.json(output(null, 3, 'Failed to create task'));
    return;
  }

  enqueueTproTask(parseTaskId(task.id));

  res.json(output({ task }, 1));
});

router.post('/detail', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const task = await getTaskDetail(user.id, req.body?.id);

  if (!task) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ task }, 1));
});

router.post('/delete', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];

  if (ids.length === 0) {
    res.json(output(null, 3));
    return;
  }

  await Promise.all(ids.map((id) => requestCancelTask(id).catch(() => null)));

  const deleted = await deleteTasks(user.id, ids);
  res.json(output({ deleted }, 1));
});

router.post('/cancel', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const taskId = parseTaskId(req.body?.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    res.json(output(null, 3, 'Invalid task id'));
    return;
  }

  const owned = await getTaskDetail(user.id, taskId);

  if (!owned || !owned.isMine) {
    res.json(output(null, 3, 'Task not found'));
    return;
  }

  const result = await requestCancelTask(taskId);

  if (!result.ok) {
    res.json(output({ status: result.status || owned.status }, 3, 'Task cannot be cancelled'));
    return;
  }

  const task = await getTaskDetail(user.id, taskId);
  res.json(output({ task }, 1));
});

router.post('/update', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const task = await updateTask(user.id, req.body || {});

  if (!task) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ task }, 1));
});

router.post('/share', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const taskIds = Array.isArray(req.body.taskIds) ? req.body.taskIds : [];
  const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
  const result = await shareTasks(user.id, {
    taskIds,
    userIds,
    permission: req.body.permission || 'read',
  });

  if (result.shared === 0) {
    res.json(output(null, 3, 'No tasks were shared'));
    return;
  }

  const firstTask = result.tasks[0];
  await Promise.all(result.users.map((target) => createNotification(target.id, {
    tag: 'Sharing',
    tagColor: '#605bff',
    taskId: firstTask?.id,
    fromUser: user.name || user.email,
    message: `${user.name || user.email} shared ${result.tasks.length} task(s) with you.`,
  })));

  res.json(output(result, 1));
});

router.post('/unshare', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const deleted = await unshareTasks(user.id, {
    taskIds: Array.isArray(req.body.taskIds) ? req.body.taskIds : [],
    userIds: Array.isArray(req.body.userIds) ? req.body.userIds : [],
  });

  res.json(output({ deleted }, 1));
});

module.exports = router;
