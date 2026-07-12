const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const veteranRegistrationRules = [
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('service_number').trim().notEmpty().withMessage('service_number is required'),
  body('national_id').trim().notEmpty().withMessage('national_id is required')
];

const veteranLoginRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const adminLoginRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const adminRegisterRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn([
    'doc-verifier',
    'pension-committee',
    'healthcare-committee',
    'education-committee',
    'super-admin'
  ]).withMessage('Invalid admin role')
];

const applicationRules = [
  body('service_type').isIn(['pension', 'healthcare', 'education']).withMessage('Invalid service_type'),
  body('coverage_value').optional({ nullable: true }).isString()
];

module.exports = {
  handleValidationErrors,
  veteranRegistrationRules,
  veteranLoginRules,
  adminLoginRules,
  adminRegisterRules,
  applicationRules
};
