import { z } from 'zod';

/**
 * Register request validation schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  user_type: z.enum(['trucker', 'business'], {
    errorMap: () => ({ message: 'User type must be either "trucker" or "business"' })
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Shipment (Route) creation validation schema
 */
export const createShipmentSchema = z.object({
  startLocation: z.string().min(1, 'Start location is required'),
  startLat: z.number().min(-90).max(90, 'Invalid start latitude'),
  startLng: z.number().min(-180).max(180, 'Invalid start longitude'),
  endLocation: z.string().min(1, 'End location is required'),
  endLat: z.number().min(-90).max(90, 'Invalid end latitude'),
  endLng: z.number().min(-180).max(180, 'Invalid end longitude'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  availableCapacity: z.number().positive('Available capacity must be positive'),
  equipmentType: z.enum([
    'dry_van',
    'flatbed',
    'reefer',
    'step_deck',
    'lowboy',
    'tanker',
    'box_truck',
    'power_only',
    'hotshot',
    'container'
  ], {
    errorMap: () => ({ message: 'Invalid equipment type' })
  }),
  status: z.enum(['draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled', 'expired']).optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

/**
 * Shipment (Route) update validation schema
 */
export const updateShipmentSchema = createShipmentSchema.partial();

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

/**
 * Shipment list filters validation schema
 */
export const shipmentFiltersSchema = z.object({
  status: z.enum(['draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled', 'expired']).optional(),
  equipmentType: z.enum([
    'dry_van',
    'flatbed',
    'reefer',
    'step_deck',
    'lowboy',
    'tanker',
    'box_truck',
    'power_only',
    'hotshot',
    'container'
  ]).optional(),
  truckerId: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export type ShipmentFiltersInput = z.infer<typeof shipmentFiltersSchema>;

/**
 * Load list filters validation schema
 */
export const loadFiltersSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  pickupDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  pickupDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  deliveryDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  deliveryDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  truckerId: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  businessId: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export type LoadFiltersInput = z.infer<typeof loadFiltersSchema>;

/**
 * Create load validation schema
 */
export const createLoadSchema = z.object({
  originLocation: z.string().min(1, 'Origin location is required'),
  destinationLocation: z.string().min(1, 'Destination location is required'),
  weight: z.number().positive('Weight must be a positive number'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number'),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pickup date must be in YYYY-MM-DD format'),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be in YYYY-MM-DD format'),
});

export type CreateLoadInput = z.infer<typeof createLoadSchema>;

/**
 * Assign load validation schema
 */
export const assignLoadSchema = z.object({
  truckerId: z.number().positive('Trucker ID must be a positive number'),
  notes: z.string().optional(),
});

export type AssignLoadInput = z.infer<typeof assignLoadSchema>;

/**
 * Update load status validation schema
 */
export const updateLoadStatusSchema = z.object({
  status: z.enum(['in_transit', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: in_transit, delivered, cancelled' }),
  }),
  notes: z.string().optional(),
});

export type UpdateLoadStatusInput = z.infer<typeof updateLoadStatusSchema>;

/**
 * Cancel load validation schema
 */
export const cancelLoadSchema = z.object({
  notes: z.string().optional(),
});

export type CancelLoadInput = z.infer<typeof cancelLoadSchema>;
