const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getAttackTrends,
  getTopCountries
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All dashboard routes require authentication
router.get('/overview', authenticate, getDashboardOverview);
router.get('/trends', authenticate, getAttackTrends);
router.get('/top-countries', authenticate, getTopCountries);

module.exports = router;

