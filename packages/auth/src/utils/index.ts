/**
 * Authentication utility functions
 */

// Password utilities
export {
  hashPassword,
  comparePassword,
} from './password';

// JWT utilities
export {
  generateToken,
  verifyToken,
  decodeToken,
  type TokenPayload,
  type TokenOptions,
} from './jwt';
