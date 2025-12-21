const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../../Configuration/config/config');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Check if user has required permission (checks role first, then permissions array)
exports.hasPermission = (...permissions) => {
  const { roleCan } = require('./rolePermissions');
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check role-based permissions first
    const hasRolePermission = permissions.some(permission => {
      const [resource, action] = permission.split(':');
      if (resource && action) {
        return roleCan(req.user.role, resource, action);
      }
      return false;
    });

    if (hasRolePermission) {
      return next();
    }

    // Fall back to permissions array (for custom permissions)
    if (req.user.permissions && req.user.permissions.length > 0) {
      const hasCustomPermission = permissions.some(permission => 
        req.user.permissions.includes(permission)
      );

      if (hasCustomPermission) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  };
};

