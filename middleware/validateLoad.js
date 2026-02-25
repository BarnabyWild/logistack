const { body, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a new load
 */
const validateLoadCreation = [
  body('origin')
    .trim()
    .notEmpty()
    .withMessage('Origin location is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Origin must be between 3 and 500 characters'),

  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination location is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Destination must be between 3 and 500 characters'),

  body('weight')
    .notEmpty()
    .withMessage('Weight is required')
    .isFloat({ min: 0.01 })
    .withMessage('Weight must be a positive number'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),

  body('pickupDate')
    .notEmpty()
    .withMessage('Pickup date is required')
    .isISO8601()
    .withMessage('Pickup date must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const pickupDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (pickupDate < today) {
        throw new Error('Pickup date cannot be in the past');
      }
      return true;
    }),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.body.pickupDate) {
        const deliveryDate = new Date(value);
        const pickupDate = new Date(req.body.pickupDate);

        if (deliveryDate < pickupDate) {
          throw new Error('Delivery date must be on or after pickup date');
        }
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          status: 400,
          details: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        }
      });
    }

    next();
  }
];

/**
 * Validation rules for listing loads with query parameters
 */
const validateLoadListing = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'assigned', 'in_transit', 'delivered'])
    .withMessage('Status must be one of: pending, assigned, in_transit, delivered'),

  query('origin')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Origin filter must be between 1 and 500 characters'),

  query('destination')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Destination filter must be between 1 and 500 characters'),

  query('pickupDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Pickup date from must be a valid date (YYYY-MM-DD)'),

  query('pickupDateTo')
    .optional()
    .isISO8601()
    .withMessage('Pickup date to must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.query.pickupDateFrom) {
        const dateFrom = new Date(req.query.pickupDateFrom);
        const dateTo = new Date(value);

        if (dateTo < dateFrom) {
          throw new Error('Pickup date to must be on or after pickup date from');
        }
      }
      return true;
    }),

  query('deliveryDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Delivery date from must be a valid date (YYYY-MM-DD)'),

  query('deliveryDateTo')
    .optional()
    .isISO8601()
    .withMessage('Delivery date to must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.query.deliveryDateFrom) {
        const dateFrom = new Date(req.query.deliveryDateFrom);
        const dateTo = new Date(value);

        if (dateTo < dateFrom) {
          throw new Error('Delivery date to must be on or after delivery date from');
        }
      }
      return true;
    }),

  query('truckerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trucker ID must be a positive integer'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          status: 400,
          details: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        }
      });
    }

    next();
  }
];

module.exports = { validateLoadCreation, validateLoadListing };
