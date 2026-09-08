const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const {
  listNotifications,
  markAllRead,
  markRead,
} = require('../services/notificationStore');

const router = express.Router();

router.post('/list', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const filter = req.body.filter || 'all';
  const search = (req.body.search || '').trim();
  const notifications = await listNotifications(user.id, { filter, search });

  res.json(output({ notifications }, 1));
});

router.post('/markRead', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const notification = await markRead(user.id, req.body.id);

  if (!notification) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ notification }, 1));
});

router.post('/markAllRead', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const updated = await markAllRead(user.id);
  res.json(output({ updated }, 1));
});

module.exports = router;
