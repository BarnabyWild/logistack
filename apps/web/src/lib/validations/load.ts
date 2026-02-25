import { z } from 'zod';

/**
 * Load validation schemas
 */

export const loadSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  weight: z.number().positive('Weight must be positive'),
  price: z.number().positive('Price must be positive'),
  description: z.string().optional(),
});

export const loadFilterSchema = z.object({
  status: z.enum(['available', 'booked', 'in_transit', 'delivered', 'cancelled']).optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  pickup_date_from: z.string().optional(),
  pickup_date_to: z.string().optional(),
});

export const bookingSchema = z.object({
  load_id: z.string().uuid('Invalid load ID'),
});

export type LoadInput = z.infer<typeof loadSchema>;
export type LoadFilterInput = z.infer<typeof loadFilterSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
