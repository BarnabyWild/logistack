import { pgTable, serial, integer, varchar, text, decimal, date, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// Enum for load status
export const loadStatusEnum = pgEnum('load_status_enum', ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']);

// Loads table schema
export const loads = pgTable('loads', {
  // Primary key
  id: serial('id').primaryKey(),

  // Foreign keys
  businessId: integer('business_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  truckerId: integer('trucker_id').references(() => users.id, { onDelete: 'set null' }),

  // Location information
  originLocation: text('origin_location').notNull(),
  destinationLocation: text('destination_location').notNull(),

  // Load specifications
  weight: decimal('weight', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),

  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),

  // Schedule
  pickupDate: date('pickup_date').notNull(),
  deliveryDate: date('delivery_date').notNull(),

  // Status
  status: loadStatusEnum('status').notNull().default('pending'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Load history table for tracking status changes
export const loadHistory = pgTable('load_history', {
  // Primary key
  id: serial('id').primaryKey(),

  // Foreign key to loads table
  loadId: integer('load_id').notNull().references(() => loads.id, { onDelete: 'cascade' }),

  // Status change tracking
  oldStatus: loadStatusEnum('old_status'),
  newStatus: loadStatusEnum('new_status').notNull(),

  // User who made the change (optional - could be system-triggered)
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),

  // Additional context about the change
  notes: text('notes'),

  // Timestamp
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript
export type Load = typeof loads.$inferSelect;
export type NewLoad = typeof loads.$inferInsert;

export type LoadHistory = typeof loadHistory.$inferSelect;
export type NewLoadHistory = typeof loadHistory.$inferInsert;
