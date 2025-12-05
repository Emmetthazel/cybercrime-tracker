const express = require('express');
const router = express.Router();
const {
  getAllAttacks,
  getAttackById,
  createAttack,
  updateAttack,
  deleteAttack,
  getAttackStatistics
} = require('../controllers/attackController');
const { authenticate, hasPermission } = require('../middleware/auth');
const { attackValidation, validate } = require('../middleware/validation');

// Public routes (with authentication)
router.get('/', authenticate, getAllAttacks);
router.get('/statistics', authenticate, getAttackStatistics);
router.get('/:id', authenticate, getAttackById);

// Protected routes
router.post('/', authenticate, hasPermission('attacks:write'), attackValidation, validate, createAttack);
router.put('/:id', authenticate, hasPermission('attacks:update'), updateAttack);
router.delete('/:id', authenticate, hasPermission('attacks:delete'), deleteAttack);

module.exports = router;

