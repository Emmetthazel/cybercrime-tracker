const express = require('express');
const router = express.Router();
const {
  getAllSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
  syncSource,
  syncAllSources,
  getIngestionStats,
  getActiveSources
} = require('../controllers/sourceController');
const { authenticate, hasPermission } = require('../middleware/auth');

// Public routes (with authentication)
router.get('/', authenticate, getAllSources);
router.get('/:id', authenticate, getSourceById);

// Protected routes
router.post('/', authenticate, hasPermission('sources:write'), createSource);
router.put('/:id', authenticate, hasPermission('sources:update'), updateSource);
router.delete('/:id', authenticate, hasPermission('sources:delete'), deleteSource);
router.post('/:id/sync', authenticate, hasPermission('sources:update'), syncSource);
router.post('/sync/all', authenticate, hasPermission('sources:update'), syncAllSources);

// Statistics and monitoring
router.get('/stats/ingestion', authenticate, getIngestionStats);
router.get('/stats/active', authenticate, getActiveSources);

module.exports = router;

