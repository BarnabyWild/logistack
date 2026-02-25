/**
 * Authentication and authorization middleware
 */

// Authentication middleware
export {
  authenticate,
  optionalAuthenticate,
  type AuthenticatedRequest,
  type AuthenticateOptions,
} from './authenticate';

// Authorization middleware
export {
  authorize,
  hasPermission,
  hasAnyRole,
} from './authorize';
