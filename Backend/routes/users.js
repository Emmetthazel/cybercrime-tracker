const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  refreshToken,
  logout
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidation, validate } = require('../middleware/validation');
// Temporarily disable DB ready check - let Mongoose handle connection
// const ensureDBReady = require('../middleware/dbReady');

// Public routes
router.post('/register', userValidation, validate, register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;

