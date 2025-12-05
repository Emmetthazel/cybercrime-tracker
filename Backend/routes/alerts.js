const express = require('express');
const router = express.Router();
const {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert
} = require('../controllers/alertController');
const { authenticate, hasPermission } = require('../middleware/auth');

// Public routes (with authentication)
router.get('/', authenticate, getAllAlerts);
router.get('/:id', authenticate, getAlertById);

// Protected routes
router.post('/', authenticate, hasPermission('alerts:write'), createAlert);
router.put('/:id', authenticate, hasPermission('alerts:update'), updateAlert);
router.post('/:id/acknowledge', authenticate, acknowledgeAlert);
router.post('/:id/resolve', authenticate, resolveAlert);
router.delete('/:id', authenticate, hasPermission('alerts:delete'), deleteAlert);

module.exports = router;

