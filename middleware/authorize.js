/**
 * Authorization middleware to check user roles
 * Must be used after authenticate middleware
 * @param {string[]} allowedRoles - Array of allowed user types (e.g., ['business', 'trucker'])
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          status: 401
        }
      });
    }

    // Check if user type is in allowed roles
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to perform this action',
          status: 403
        }
      });
    }

    next();
  };
};

module.exports = { authorize };
