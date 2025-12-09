const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const validations = {
  // User registration validation
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone is required')
      .matches(/^05\d{8}$/).withMessage('Must be a valid Saudi phone number (05xxxxxxxx)'),
    body('nationalId')
      .trim()
      .notEmpty().withMessage('National ID is required')
      .matches(/^\d{10}$/).withMessage('National ID must be 10 digits'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],

  // User login validation
  login: [
    body('identifier')
      .trim()
      .notEmpty().withMessage('Email or National ID is required'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  // Profile update validation
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Must be a valid email'),
    body('phone')
      .optional()
      .trim()
      .matches(/^05\d{8}$/).withMessage('Must be a valid Saudi phone number'),
    body('favoriteTeam')
      .optional()
      .isIn(['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب'])
      .withMessage('Invalid team')
  ],

  // Match creation validation
  createMatch: [
    body('homeTeam')
      .notEmpty().withMessage('Home team is required')
      .isIn(['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب'])
      .withMessage('Invalid home team'),
    body('awayTeam')
      .notEmpty().withMessage('Away team is required')
      .isIn(['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب'])
      .withMessage('Invalid away team'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Must be a valid date'),
    body('time')
      .notEmpty().withMessage('Time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
    body('stadium')
      .notEmpty().withMessage('Stadium is required'),
    body('basePrice')
      .notEmpty().withMessage('Base price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number')
  ],

  // Ticket booking validation
  bookTicket: [
    body('matchId')
      .notEmpty().withMessage('Match ID is required')
      .isMongoId().withMessage('Invalid match ID'),
    body('seatInfo.zone')
      .notEmpty().withMessage('Seat zone is required')
      .isIn(['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan'])
      .withMessage('Invalid zone'),
    body('seatInfo.areaNumber')
      .notEmpty().withMessage('Area number is required')
  ],

  // MongoDB ID validation
  mongoId: [
    param('id')
      .isMongoId().withMessage('Invalid ID format')
  ]
};

module.exports = { validate, validations };


