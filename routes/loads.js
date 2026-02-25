const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateLoadCreation, validateLoadListing } = require('../middleware/validateLoad');
const { createLoad, getLoads } = require('../controllers/loadController');

/**
 * GET /api/loads
 * List loads with filters and pagination
 *
 * Middleware chain:
 * 1. authenticate - Verify JWT token
 * 2. authorize(['business', 'trucker']) - Both business and trucker can list loads
 * 3. validateLoadListing - Validate query parameters
 * 4. getLoads - Controller to fetch loads (applies authorization internally)
 */
router.get(
  '/',
  authenticate,
  authorize(['business', 'trucker']),
  validateLoadListing,
  getLoads
);

/**
 * POST /api/loads
 * Create a new load
 *
 * Middleware chain:
 * 1. authenticate - Verify JWT token
 * 2. authorize(['business']) - Ensure user is a business (dispatcher/admin)
 * 3. validateLoadCreation - Validate request body
 * 4. createLoad - Controller to create the load
 */
router.post(
  '/',
  authenticate,
  authorize(['business']),
  validateLoadCreation,
  createLoad
);

module.exports = router;
