/**
 * Authentication middleware for Express applications
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';

/**
 * Extended Express Request with user authentication data
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Options for authentication middleware
 */
export interface AuthenticateOptions {
  secret: string;
  headerName?: string;
  tokenPrefix?: string;
}

/**
 * Express middleware to authenticate requests using JWT tokens
 *
 * Expects the token in the Authorization header as "Bearer <token>"
 * Adds the decoded user payload to req.user if authentication succeeds
 *
 * @param options - Configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { authenticate } from '@logistack/auth';
 *
 * const app = express();
 *
 * app.use('/api/protected', authenticate({
 *   secret: process.env.JWT_SECRET
 * }));
 * ```
 */
export function authenticate(options: AuthenticateOptions) {
  const {
    secret,
    headerName = 'authorization',
    tokenPrefix = 'Bearer ',
  } = options;

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get the authorization header
      const authHeader = req.headers[headerName.toLowerCase()] as string;

      if (!authHeader) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'No authorization header provided',
        });
        return;
      }

      // Extract the token
      if (!authHeader.startsWith(tokenPrefix)) {
        res.status(401).json({
          error: 'Invalid authorization format',
          message: `Expected format: ${tokenPrefix}<token>`,
        });
        return;
      }

      const token = authHeader.slice(tokenPrefix.length);

      // Verify the token
      const payload = verifyToken(token, secret);

      // Attach user to request
      req.user = payload;

      next();
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          error: 'Authentication failed',
          message: error.message,
        });
      } else {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired token',
        });
      }
    }
  };
}

/**
 * Optional authentication middleware - does not fail if no token provided
 * but will verify and attach user if token is present
 *
 * @param options - Configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * app.use('/api/public', optionalAuthenticate({
 *   secret: process.env.JWT_SECRET
 * }));
 * ```
 */
export function optionalAuthenticate(options: AuthenticateOptions) {
  const {
    secret,
    headerName = 'authorization',
    tokenPrefix = 'Bearer ',
  } = options;

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers[headerName.toLowerCase()] as string;

      if (authHeader && authHeader.startsWith(tokenPrefix)) {
        const token = authHeader.slice(tokenPrefix.length);
        const payload = verifyToken(token, secret);
        req.user = payload;
      }

      next();
    } catch (error) {
      // Ignore authentication errors for optional auth
      next();
    }
  };
}
