/**
 * Shared Zod validation schemas for Logistack
 *
 * These schemas are used for runtime validation on both frontend and backend.
 */

import { z } from 'zod';

// User schemas
export const userTypeSchema = z.enum(['trucker', 'business']);

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Common field schemas
export const idSchema = z.string().uuid('Invalid ID format');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Date schemas
export const dateStringSchema = z.string().datetime();
