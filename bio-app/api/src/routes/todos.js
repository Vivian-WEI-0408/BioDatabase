const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { toggleTodo, updateTodo } = require('../services/todoStore');

const router = express.Router();

router.post('/toggle', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const todo = await toggleTodo(user.id, req.body.id);

  if (!todo) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ todo }, 1));
});

router.post('/update', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const todo = await updateTodo(user.id, req.body || {});

  if (!todo) {
    res.json(output(null, 3));
    return;
  }

  res.json(output({ todo }, 1));
});

module.exports = router;
