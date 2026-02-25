/**
 * Shared TypeScript types for Logistack
 *
 * This file exports common types used across the frontend and backend.
 */

// User types
export type UserType = 'trucker' | 'business';

export interface User {
  id: string;
  email: string;
  user_type: UserType;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Common response types
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
