const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { listApps, toggleStar } = require('../services/appStore');

const router = express.Router();

router.post('/list', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const apps = await listApps(user.id);
  res.json(output({ apps }, 1));
});

router.post('/toggleStar', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const appId = (req.body.appId || '').trim();

  if (!appId) {
    res.json(output(null, 3));
    return;
  }

  const starred = await toggleStar(user.id, appId);

  if (starred === null) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ starred }, 1));
});

module.exports = router;
