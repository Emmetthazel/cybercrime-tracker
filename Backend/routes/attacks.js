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
const { canAccess, canEditOwn } = require('../middleware/rolePermissions');
const { attackValidation, validate } = require('../middleware/validation');

// Public routes (with authentication) - all authenticated users can view
router.get('/', authenticate, getAllAttacks);
router.get('/statistics', authenticate, getAttackStatistics);
router.get('/:id', authenticate, getAttackById);

// Protected routes - role-based access control
// Only admin, analyst, and user can report attacks (viewer cannot)
router.post('/', authenticate, canAccess('attacks', 'write'), attackValidation, validate, createAttack);
// Admin and analyst can update any attack, users can only update their own (checked in controller)
router.put('/:id', authenticate, (req, res, next) => {
  const role = req.user.role;
  // Admin can always update
  if (role === 'admin') {
    return next();
  }
  // Analyst can update any attack
  if (role === 'analyst') {
    return next();
  }
  // Users can update (ownership will be checked in controller)
  if (role === 'user') {
    return next();
  }
  // Viewer cannot update
  return res.status(403).json({ message: 'Access denied. Viewers cannot update attacks.' });
}, updateAttack);
// Only admin can delete attacks
router.delete('/:id', authenticate, canAccess('attacks', 'delete'), deleteAttack);

module.exports = router;

