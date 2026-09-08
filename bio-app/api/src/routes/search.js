const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { globalSearch } = require('../services/searchService');

const router = express.Router();

router.post('/global', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const payload = await globalSearch(user.id, req.body || {});
    res.json(output(payload, 1));
  } catch (error) {
    console.error('search/global failed:', error);
    res.json(output(null, 0, 'Failed to search'));
  }
});

module.exports = router;
