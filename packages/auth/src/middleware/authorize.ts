/**
 * Authorization middleware for role-based access control
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate';

/**
 * Express middleware to authorize requests based on user roles
 *
 * Must be used after the authenticate middleware
 * Checks if the authenticated user has one of the required roles
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import { authenticate, authorize } from '@logistack/auth';
 *
 * app.post('/api/admin/users',
 *   authenticate({ secret: process.env.JWT_SECRET }),
 *   authorize(['admin', 'super_admin']),
 *   (req, res) => {
 *     // Only admin or super_admin can access this route
 *   }
 * );
 * ```
 */
export function authorize(allowedRoles: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource',
        });
        return;
      }

      // Check if user has a role
      const userRole = req.user.role;

      if (!userRole) {
        res.status(403).json({
          error: 'Authorization failed',
          message: 'User does not have a role assigned',
        });
        return;
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          error: 'Authorization failed',
          message: `User role '${userRole}' is not authorized to access this resource`,
          requiredRoles: allowedRoles,
        });
        return;
      }

      // User is authorized
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking authorization',
      });
    }
  };
}

/**
 * Check if a user has a specific permission
 *
 * @param user - The authenticated user object
 * @param permission - The required permission
 * @returns True if user has the permission, false otherwise
 *
 * @example
 * ```typescript
 * if (hasPermission(req.user, 'users:write')) {
 *   // User can modify users
 * }
 * ```
 */
export function hasPermission(
  user: { permissions?: string[] } | undefined,
  permission: string
): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  return user.permissions.includes(permission);
}

/**
 * Check if a user has any of the specified roles
 *
 * @param user - The authenticated user object
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles, false otherwise
 *
 * @example
 * ```typescript
 * if (hasAnyRole(req.user, ['admin', 'moderator'])) {
 *   // User is either admin or moderator
 * }
 * ```
 */
export function hasAnyRole(
  user: { role?: string } | undefined,
  roles: string[]
): boolean {
  if (!user || !user.role) {
    return false;
  }

  return roles.includes(user.role);
}
