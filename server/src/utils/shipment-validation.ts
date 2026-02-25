import { z } from 'zod';

/**
 * Equipment types available for shipments
 */
export const equipmentTypes = [
  'dry_van',
  'flatbed',
  'reefer',
  'step_deck',
  'lowboy',
  'tanker',
  'box_truck',
  'power_only',
  'hotshot',
  'container',
] as const;

/**
 * Route/Shipment status types
 */
export const routeStatuses = [
  'draft',
  'active',
  'matched',
  'in_transit',
  'completed',
  'cancelled',
  'expired',
] as const;

/**
 * Coordinate validation schema
 * Validates latitude and longitude values
 */
export const coordinateSchema = z.object({
  lat: z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .min(-90, 'Latitude must be greater than or equal to -90')
    .max(90, 'Latitude must be less than or equal to 90')
    .finite('Latitude must be a finite number'),
  lng: z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .min(-180, 'Longitude must be greater than or equal to -180')
    .max(180, 'Longitude must be less than or equal to 180')
    .finite('Longitude must be a finite number'),
});

export type Coordinate = z.infer<typeof coordinateSchema>;

/**
 * Location validation schema
 * Combines location name with coordinates
 */
export const locationSchema = z.object({
  location: z
    .string({
      required_error: 'Location is required',
    })
    .min(1, 'Location cannot be empty')
    .max(255, 'Location must be less than 255 characters')
    .trim(),
  lat: z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .min(-90, 'Latitude must be greater than or equal to -90')
    .max(90, 'Latitude must be less than or equal to 90')
    .finite('Latitude must be a finite number'),
  lng: z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .min(-180, 'Longitude must be greater than or equal to -180')
    .max(180, 'Longitude must be less than or equal to 180')
    .finite('Longitude must be a finite number'),
});

export type Location = z.infer<typeof locationSchema>;

/**
 * Date validation schema
 * Validates date strings in YYYY-MM-DD format
 */
export const dateStringSchema = z
  .string({
    required_error: 'Date is required',
  })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: 'Invalid date value' }
  );

/**
 * Equipment type validation schema
 */
export const equipmentTypeSchema = z.enum(equipmentTypes, {
  errorMap: () => ({
    message: `Equipment type must be one of: ${equipmentTypes.join(', ')}`,
  }),
});

export type EquipmentType = z.infer<typeof equipmentTypeSchema>;

/**
 * Route status validation schema
 */
export const routeStatusSchema = z.enum(routeStatuses, {
  errorMap: () => ({
    message: `Status must be one of: ${routeStatuses.join(', ')}`,
  }),
});

export type RouteStatus = z.infer<typeof routeStatusSchema>;

/**
 * Capacity validation schema
 * Validates cargo capacity in appropriate units (e.g., pounds, tons)
 */
export const capacitySchema = z
  .number({
    required_error: 'Capacity is required',
    invalid_type_error: 'Capacity must be a number',
  })
  .positive('Capacity must be a positive number')
  .finite('Capacity must be a finite number')
  .max(999999.99, 'Capacity cannot exceed 999,999.99');

/**
 * Create shipment/route validation schema
 * Validates all required fields for creating a new route
 */
export const createShipmentSchema = z
  .object({
    // Start location
    startLocation: z
      .string({
        required_error: 'Start location is required',
      })
      .min(1, 'Start location cannot be empty')
      .max(255, 'Start location must be less than 255 characters')
      .trim(),
    startLat: z
      .number({
        required_error: 'Start latitude is required',
        invalid_type_error: 'Start latitude must be a number',
      })
      .min(-90, 'Start latitude must be greater than or equal to -90')
      .max(90, 'Start latitude must be less than or equal to 90')
      .finite('Start latitude must be a finite number'),
    startLng: z
      .number({
        required_error: 'Start longitude is required',
        invalid_type_error: 'Start longitude must be a number',
      })
      .min(-180, 'Start longitude must be greater than or equal to -180')
      .max(180, 'Start longitude must be less than or equal to 180')
      .finite('Start longitude must be a finite number'),

    // End location
    endLocation: z
      .string({
        required_error: 'End location is required',
      })
      .min(1, 'End location cannot be empty')
      .max(255, 'End location must be less than 255 characters')
      .trim(),
    endLat: z
      .number({
        required_error: 'End latitude is required',
        invalid_type_error: 'End latitude must be a number',
      })
      .min(-90, 'End latitude must be greater than or equal to -90')
      .max(90, 'End latitude must be less than or equal to 90')
      .finite('End latitude must be a finite number'),
    endLng: z
      .number({
        required_error: 'End longitude is required',
        invalid_type_error: 'End longitude must be a number',
      })
      .min(-180, 'End longitude must be greater than or equal to -180')
      .max(180, 'End longitude must be less than or equal to 180')
      .finite('End longitude must be a finite number'),

    // Schedule
    departureDate: dateStringSchema,
    arrivalDate: dateStringSchema,

    // Capacity
    availableCapacity: capacitySchema,

    // Equipment
    equipmentType: equipmentTypeSchema,

    // Status (optional, defaults to 'draft')
    status: routeStatusSchema.optional(),
  })
  .refine(
    (data) => {
      // Validate that start and end locations are different
      return (
        data.startLocation !== data.endLocation ||
        data.startLat !== data.endLat ||
        data.startLng !== data.endLng
      );
    },
    {
      message: 'Start and end locations must be different',
      path: ['endLocation'],
    }
  )
  .refine(
    (data) => {
      // Validate that arrival date is after departure date
      const departure = new Date(data.departureDate);
      const arrival = new Date(data.arrivalDate);
      return arrival > departure;
    },
    {
      message: 'Arrival date must be after departure date',
      path: ['arrivalDate'],
    }
  )
  .refine(
    (data) => {
      // Validate that departure date is not in the past (allow today)
      const departure = new Date(data.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return departure >= today;
    },
    {
      message: 'Departure date cannot be in the past',
      path: ['departureDate'],
    }
  );

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

/**
 * Update shipment/route validation schema
 * All fields are optional for partial updates
 */
export const updateShipmentSchema = z
  .object({
    // Start location (all optional)
    startLocation: z
      .string()
      .min(1, 'Start location cannot be empty')
      .max(255, 'Start location must be less than 255 characters')
      .trim()
      .optional(),
    startLat: z
      .number()
      .min(-90, 'Start latitude must be greater than or equal to -90')
      .max(90, 'Start latitude must be less than or equal to 90')
      .finite('Start latitude must be a finite number')
      .optional(),
    startLng: z
      .number()
      .min(-180, 'Start longitude must be greater than or equal to -180')
      .max(180, 'Start longitude must be less than or equal to 180')
      .finite('Start longitude must be a finite number')
      .optional(),

    // End location (all optional)
    endLocation: z
      .string()
      .min(1, 'End location cannot be empty')
      .max(255, 'End location must be less than 255 characters')
      .trim()
      .optional(),
    endLat: z
      .number()
      .min(-90, 'End latitude must be greater than or equal to -90')
      .max(90, 'End latitude must be less than or equal to 90')
      .finite('End latitude must be a finite number')
      .optional(),
    endLng: z
      .number()
      .min(-180, 'End longitude must be greater than or equal to -180')
      .max(180, 'End longitude must be less than or equal to 180')
      .finite('End longitude must be a finite number')
      .optional(),

    // Schedule (optional)
    departureDate: dateStringSchema.optional(),
    arrivalDate: dateStringSchema.optional(),

    // Capacity (optional)
    availableCapacity: z
      .number()
      .positive('Capacity must be a positive number')
      .finite('Capacity must be a finite number')
      .max(999999.99, 'Capacity cannot exceed 999,999.99')
      .optional(),

    // Equipment (optional)
    equipmentType: equipmentTypeSchema.optional(),

    // Status (optional)
    status: routeStatusSchema.optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, validate that arrival is after departure
      if (data.departureDate && data.arrivalDate) {
        const departure = new Date(data.departureDate);
        const arrival = new Date(data.arrivalDate);
        return arrival > departure;
      }
      return true;
    },
    {
      message: 'Arrival date must be after departure date',
      path: ['arrivalDate'],
    }
  )
  .refine(
    (data) => {
      // If all start location fields are provided, ensure they form a valid location
      const hasStartLocation = data.startLocation !== undefined;
      const hasStartLat = data.startLat !== undefined;
      const hasStartLng = data.startLng !== undefined;

      if (hasStartLocation || hasStartLat || hasStartLng) {
        return hasStartLocation && hasStartLat && hasStartLng;
      }
      return true;
    },
    {
      message: 'Start location, latitude, and longitude must all be provided together',
      path: ['startLocation'],
    }
  )
  .refine(
    (data) => {
      // If all end location fields are provided, ensure they form a valid location
      const hasEndLocation = data.endLocation !== undefined;
      const hasEndLat = data.endLat !== undefined;
      const hasEndLng = data.endLng !== undefined;

      if (hasEndLocation || hasEndLat || hasEndLng) {
        return hasEndLocation && hasEndLat && hasEndLng;
      }
      return true;
    },
    {
      message: 'End location, latitude, and longitude must all be provided together',
      path: ['endLocation'],
    }
  );

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

/**
 * Shipment list filters validation schema
 * For filtering and pagination of shipments
 */
export const shipmentFiltersSchema = z.object({
  status: routeStatusSchema.optional(),
  equipmentType: equipmentTypeSchema.optional(),
  truckerId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Trucker ID must be a positive integer',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: 'Offset must be a non-negative integer',
    }),
});

export type ShipmentFiltersInput = z.infer<typeof shipmentFiltersSchema>;

/**
 * Shipment ID parameter validation schema
 */
export const shipmentIdSchema = z
  .string({
    required_error: 'Shipment ID is required',
  })
  .transform((val) => parseInt(val, 10))
  .refine((val) => !isNaN(val) && val > 0, {
    message: 'Shipment ID must be a positive integer',
  });

export type ShipmentIdInput = z.infer<typeof shipmentIdSchema>;
