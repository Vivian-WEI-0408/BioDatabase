const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { getDashboardData } = require('../services/dashboardService');

const router = express.Router();

router.post('/getData', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const data = await getDashboardData(user.id);
  res.json(output(data, 1));
});

module.exports = router;
