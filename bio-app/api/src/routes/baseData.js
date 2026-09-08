const express = require('express');
const { output } = require('../lib/response');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(output({}, 1));
});

module.exports = router;
