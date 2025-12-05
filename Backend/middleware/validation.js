const { body, validationResult } = require('express-validator');

// Validation result handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
exports.attackValidation = [
  body('type').notEmpty().withMessage('Attack type is required'),
  body('source_ip').notEmpty().withMessage('Source IP is required'),
  body('target_country').notEmpty().withMessage('Target country is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('severity').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid severity level')
];

exports.userValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.ipValidation = [
  body('ip_address').notEmpty().withMessage('IP address is required'),
  body('ip_address').matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).withMessage('Invalid IP address format')
];

