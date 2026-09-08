const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { getTproStats } = require('../services/tproService');

const router = express.Router();

router.post('/stats', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const speciesId = Number(req.body?.speciesId);

  if (!Number.isInteger(speciesId) || speciesId <= 0) {
    res.json(output(null, 3, 'Invalid speciesId'));
    return;
  }

  const stats = await getTproStats(speciesId, user.id);
  res.json(output({ stats }, 1));
});

module.exports = router;
