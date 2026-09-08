const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { getPage, getTree } = require('../services/documentStore');

const router = express.Router();

router.post('/getTree', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const tree = await getTree();
  res.json(output(tree, 1));
});

router.post('/getPage', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const page = await getPage(req.body.pageId);

  if (!page) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ page }, 1));
});

module.exports = router;
