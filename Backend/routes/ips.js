const express = require('express');
const router = express.Router();
const {
  getAllIPs,
  getIPById,
  getIPByAddress,
  createOrUpdateIP,
  updateIP,
  deleteIP,
  getTopDangerousIPs,
  enrichIP
} = require('../controllers/ipController');
const { authenticate, hasPermission } = require('../middleware/auth');
const { ipValidation, validate } = require('../middleware/validation');

// Public routes (with authentication)
router.get('/', authenticate, getAllIPs);
router.get('/top-dangerous', authenticate, getTopDangerousIPs);
router.get('/address/:address', authenticate, getIPByAddress);
router.get('/:id', authenticate, getIPById);

// Protected routes
router.post('/', authenticate, hasPermission('ips:write'), ipValidation, validate, createOrUpdateIP);
router.put('/:id', authenticate, hasPermission('ips:update'), updateIP);
router.delete('/:id', authenticate, hasPermission('ips:delete'), deleteIP);
router.post('/:id/enrich', authenticate, hasPermission('ips:update'), enrichIP);

module.exports = router;

