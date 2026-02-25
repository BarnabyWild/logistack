import { pgTable, serial, integer, decimal, timestamp, text, varchar } from 'drizzle-orm/pg-core';
import { loads } from './loads';
import { users } from './users';

// GPS Location tracking table
export const gpsLocations = pgTable('gps_locations', {
  // Primary key
  id: serial('id').primaryKey(),

  // Foreign keys
  loadId: integer('load_id').notNull().references(() => loads.id, { onDelete: 'cascade' }),
  truckerId: integer('trucker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // GPS coordinates
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),

  // Additional location data
  altitude: decimal('altitude', { precision: 10, scale: 2 }), // in meters
  speed: decimal('speed', { precision: 6, scale: 2 }), // in km/h
  heading: decimal('heading', { precision: 5, scale: 2 }), // in degrees (0-360)
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }), // in meters

  // Device information
  deviceId: varchar('device_id', { length: 255 }),

  // Timestamp - when the location was recorded
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),

  // When the record was created in our database
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript
export type GpsLocation = typeof gpsLocations.$inferSelect;
export type NewGpsLocation = typeof gpsLocations.$inferInsert;
