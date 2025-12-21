# Role-Based Permissions System

## Overview

This document describes the role-based permission system implemented in the cybercrime tracker application. Each role has specific capabilities that control what actions users can perform.

---

## Role Definitions

### 🔴 **Admin** (`admin`)
**Full system access**
- ✅ Can perform all operations on all resources
- ✅ User management (create, edit, delete users)
- ✅ Full attack management (create, read, update, delete)
- ✅ System administration

**Default Permissions:**
- `attacks:*` (read, write, update, delete)
- `users:*` (read, write, update, delete)
- `ips:*` (read, write, update, delete)
- `reports:*` (read, write, delete)
- `alerts:*` (read, write, update, delete)
- `sources:*` (read, write, update, delete)

---

### 🟠 **Analyst** (`analyst`)
**Investigative and analysis capabilities**
- ✅ Can report attacks
- ✅ Can edit any attack (for investigation purposes)
- ✅ Can view all data
- ✅ Can create alerts and reports
- ✅ Can manage IPs and sources
- ❌ Cannot delete attacks or manage users

**Default Permissions:**
- `attacks:*` (read, write, update) - **Cannot delete**
- `users:read` - **Read-only access**
- `ips:*` (read, write, update)
- `reports:*` (read, write)
- `alerts:*` (read, write, update)
- `sources:*` (read, write, update)

**Use Case:** Security analysts investigating attacks, analyzing patterns, and creating reports.

---

### 🔵 **User** (`user`)
**Standard reporter**
- ✅ Can report new attacks
- ✅ Can view all attacks and data
- ✅ Can edit only attacks they reported
- ❌ Cannot delete attacks
- ❌ Cannot manage other users
- ❌ Cannot create reports or alerts

**Default Permissions:**
- `attacks:*` (read, write) - **Can only update own attacks**
- `users:read` - **Read-only access**
- `ips:read` - **Read-only access**
- `reports:read` - **Read-only access**
- `alerts:read` - **Read-only access**
- `sources:read` - **Read-only access**

**Use Case:** Team members who discover and report security incidents.

---

### ⚪ **Viewer** (`viewer`)
**Read-only access**
- ✅ Can view all data (attacks, users, IPs, reports, etc.)
- ❌ Cannot create, edit, or delete anything
- ❌ Cannot report attacks

**Default Permissions:**
- `attacks:read` - **Read-only**
- `users:read` - **Read-only**
- `ips:read` - **Read-only**
- `reports:read` - **Read-only**
- `alerts:read` - **Read-only**
- `sources:read` - **Read-only**

**Use Case:** Stakeholders, executives, or external parties who need visibility without modification rights.

---

## Permission Matrix

| Action | Admin | Analyst | User | Viewer |
|--------|-------|---------|------|--------|
| **Attacks** |
| View attacks | ✅ | ✅ | ✅ | ✅ |
| Report attack | ✅ | ✅ | ✅ | ❌ |
| Edit own attack | ✅ | ✅ | ✅ | ❌ |
| Edit any attack | ✅ | ✅ | ❌ | ❌ |
| Delete attack | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| View users | ✅ | ✅ | ✅ | ✅ |
| Create users | ✅ | ❌ | ❌ | ❌ |
| Edit users | ✅ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| **IPs** |
| View IPs | ✅ | ✅ | ✅ | ✅ |
| Add/Update IPs | ✅ | ✅ | ❌ | ❌ |
| Delete IPs | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| View reports | ✅ | ✅ | ✅ | ✅ |
| Generate reports | ✅ | ✅ | ❌ | ❌ |
| Delete reports | ✅ | ❌ | ❌ | ❌ |
| **Alerts** |
| View alerts | ✅ | ✅ | ✅ | ✅ |
| Create alerts | ✅ | ✅ | ❌ | ❌ |
| Update alerts | ✅ | ✅ | ❌ | ❌ |
| Delete alerts | ✅ | ❌ | ❌ | ❌ |
| **Sources** |
| View sources | ✅ | ✅ | ✅ | ✅ |
| Manage sources | ✅ | ✅ | ❌ | ❌ |

---

## Implementation Details

### Middleware

The permission system uses middleware located in `Backend/middleware/rolePermissions.js`:

1. **`canAccess(resource, action)`** - Checks if user's role allows the action on the resource
2. **Role-based defaults** - Each role has predefined permissions
3. **Fallback to permissions array** - Custom permissions can override role defaults

### Route Protection

Routes are protected using role-based middleware:

```javascript
// Example: Only admin, analyst, and user can report attacks
router.post('/', authenticate, canAccess('attacks', 'write'), createAttack);

// Example: Only admin can delete
router.delete('/:id', authenticate, canAccess('attacks', 'delete'), deleteAttack);
```

### Ownership Checks

For resources like attacks, users with the `user` role can only edit attacks they reported. This is checked in the controller:

```javascript
if (req.user.role === 'user') {
  if (attack.reported_by.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied...' });
  }
}
```

---

## Custom Permissions

While roles have default permissions, individual users can be granted additional permissions via the `permissions` array in the User model. The middleware checks role permissions first, then falls back to the permissions array.

Example:
```javascript
{
  role: 'user',
  permissions: ['attacks:update', 'reports:write'] // Overrides role defaults
}
```

---

## Best Practices

1. **Use roles for standard access levels** - Roles should cover 90% of use cases
2. **Use custom permissions sparingly** - Only for special cases
3. **Principle of least privilege** - Start with viewer, upgrade as needed
4. **Audit role changes** - All role/permission changes are logged in AuditLog
5. **Regular review** - Periodically review user roles and permissions

---

## Migration Notes

When upgrading existing users:
- Existing users keep their current permissions
- New users get default permissions based on role
- Admins can update user roles via the User Management UI

---

## Security Considerations

- ✅ All permission checks happen server-side
- ✅ Frontend UI may hide buttons, but backend enforces permissions
- ✅ Audit logging tracks all permission-related actions
- ✅ Role changes require admin privileges
- ✅ Users cannot self-promote to higher roles

