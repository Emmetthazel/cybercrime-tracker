const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

// All search routes require authentication
router.use(authenticate);

// Search endpoints
router.get('/', searchController.unifiedSearch);
router.get('/attacks', searchController.searchAttacks);
router.get('/ips', searchController.searchIPs);
router.get('/ip/:ipAddress/attacks', searchController.searchAttacksByIP);
router.get('/filters', searchController.getFilterOptions);

module.exports = router;

