const express = require('express');
const router = express.Router();
const {
  getAllReports,
  getReportById,
  generateReport,
  deleteReport
} = require('../controllers/reportController');
const { authenticate, hasPermission } = require('../middleware/auth');

// Public routes (with authentication)
router.get('/', authenticate, getAllReports);
router.get('/:id', authenticate, getReportById);

// Protected routes
router.post('/generate', authenticate, hasPermission('reports:write'), generateReport);
router.delete('/:id', authenticate, hasPermission('reports:delete'), deleteReport);

module.exports = router;

