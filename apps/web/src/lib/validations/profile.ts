import { z } from 'zod';

/**
 * Profile validation schemas
 */

export const truckerProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').optional(),
  mc_number: z.string().regex(/^\d{6,}$/, 'Invalid MC number').optional(),
  dot_number: z.string().regex(/^\d{7}$/, 'DOT number must be 7 digits').optional(),
  truck_type: z.string().optional(),
});

export const businessProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  phone_number: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').optional(),
  address: z.string().optional(),
});

export type TruckerProfileInput = z.infer<typeof truckerProfileSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
