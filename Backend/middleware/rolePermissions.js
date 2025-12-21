/**
 * Role-based permission helper
 * Defines what each role can do by default
 */

const ROLE_PERMISSIONS = {
  admin: {
    attacks: ['read', 'write', 'update', 'delete'],
    users: ['read', 'write', 'update', 'delete'],
    ips: ['read', 'write', 'update', 'delete'],
    reports: ['read', 'write', 'delete'],
    alerts: ['read', 'write', 'update', 'delete'],
    sources: ['read', 'write', 'update', 'delete'],
  },
  analyst: {
    attacks: ['read', 'write', 'update'], // Can report and edit, but not delete
    users: ['read'], // Can view users but not manage them
    ips: ['read', 'write', 'update'], // Can add and update IPs
    reports: ['read', 'write'], // Can view and generate reports
    alerts: ['read', 'write', 'update'], // Can manage alerts
    sources: ['read', 'write', 'update'], // Can manage sources
  },
  user: {
    attacks: ['read', 'write'], // Can report attacks but only edit own
    users: ['read'], // Can view users (but not own profile details)
    ips: ['read'], // Can view IPs
    reports: ['read'], // Can view reports
    alerts: ['read'], // Can view alerts
    sources: ['read'], // Can view sources
  },
  viewer: {
    attacks: ['read'], // Read-only
    users: ['read'], // Read-only
    ips: ['read'], // Read-only
    reports: ['read'], // Read-only
    alerts: ['read'], // Read-only
    sources: ['read'], // Read-only
  }
};

/**
 * Check if a role has a specific permission
 */
exports.roleCan = (role, resource, action) => {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }
  
  const resourcePermissions = ROLE_PERMISSIONS[role][resource] || [];
  return resourcePermissions.includes(action);
};

/**
 * Middleware to check role-based permissions
 * This checks the role first, then falls back to permissions array if role check fails
 */
exports.canAccess = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const role = req.user.role;

    // Admin has all permissions
    if (role === 'admin') {
      return next();
    }

    // Check role-based permissions first
    if (exports.roleCan(role, resource, action)) {
      return next();
    }

    // Fall back to permissions array (for custom permissions)
    const permission = `${resource}:${action}`;
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      message: `Access denied. ${role} role cannot ${action} ${resource}.` 
    });
  };
};

/**
 * Check if user can edit their own resource
 */
exports.canEditOwn = (resource, userIdField = 'reported_by') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const role = req.user.role;

    // Admin can edit anything
    if (role === 'admin') {
      return next();
    }

    // For analyst and user roles, check if they can update
    if (role === 'analyst' && exports.roleCan(role, resource, 'update')) {
      // Analysts can update any attack
      return next();
    }

    // For users, they can only edit their own
    if (role === 'user' && exports.roleCan(role, resource, 'write')) {
      // We'll need to check in the controller if the resource belongs to them
      // For now, allow the request and check in controller
      req.requireOwnership = true;
      req.userIdField = userIdField;
      return next();
    }

    return res.status(403).json({ 
      message: `Access denied. You can only edit your own ${resource}.` 
    });
  };
};

/**
 * Get default permissions for a role
 */
exports.getDefaultPermissions = (role) => {
  if (!ROLE_PERMISSIONS[role]) {
    return [];
  }

  const permissions = [];
  Object.keys(ROLE_PERMISSIONS[role]).forEach(resource => {
    ROLE_PERMISSIONS[role][resource].forEach(action => {
      permissions.push(`${resource}:${action}`);
    });
  });

  return permissions;
};

module.exports = exports;

