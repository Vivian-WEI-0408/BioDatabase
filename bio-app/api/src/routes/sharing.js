const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { listSharing, searchShareUsers } = require('../services/sharingStore');
const { unshareTasks } = require('../services/taskStore');

const router = express.Router();

router.post('/list', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const search = (req.body.search || '').trim();
  const sharing = await listSharing(user.id, { search });

  res.json(output(sharing, 1));
});

router.post('/users', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const search = (req.body.search || '').trim();
  const users = await searchShareUsers(user.id, search);

  res.json(output({ users }, 1));
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
