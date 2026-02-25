import { pgTable, serial, integer, text, decimal, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Enum for equipment type
export const equipmentTypeEnum = pgEnum('equipment_type_enum', [
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
]);

// Enum for route status
export const routeStatusEnum = pgEnum('route_status_enum', [
  'draft',
  'active',
  'matched',
  'in_transit',
  'completed',
  'cancelled',
  'expired'
]);

// Routes table schema
export const routes = pgTable('routes', {
  // Primary key
  id: serial('id').primaryKey(),

  // Foreign key
  truckerId: integer('trucker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Start location information
  startLocation: text('start_location').notNull(),
  startLat: decimal('start_lat', { precision: 10, scale: 8 }).notNull(),
  startLng: decimal('start_lng', { precision: 11, scale: 8 }).notNull(),

  // End location information
  endLocation: text('end_location').notNull(),
  endLat: decimal('end_lat', { precision: 10, scale: 8 }).notNull(),
  endLng: decimal('end_lng', { precision: 11, scale: 8 }).notNull(),

  // Schedule
  departureDate: date('departure_date').notNull(),
  arrivalDate: date('arrival_date').notNull(),

  // Capacity and equipment
  availableCapacity: decimal('available_capacity', { precision: 10, scale: 2 }).notNull(),
  equipmentType: equipmentTypeEnum('equipment_type').notNull(),

  // Status
  status: routeStatusEnum('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
