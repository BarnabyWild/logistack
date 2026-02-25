import { pgTable, serial, varchar, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enum for user types
export const userTypeEnum = pgEnum('user_type_enum', ['trucker', 'business']);

// Users table schema
export const users = pgTable('users', {
  // Primary key
  id: serial('id').primaryKey(),

  // User type
  userType: userTypeEnum('user_type').notNull(),

  // Authentication fields
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),

  // Contact information
  phone: varchar('phone', { length: 20 }),

  // Business-specific fields
  companyName: varchar('company_name', { length: 255 }),
  mcNumber: varchar('mc_number', { length: 50 }),
  dotNumber: varchar('dot_number', { length: 50 }),
  insuranceInfo: jsonb('insurance_info'),

  // Additional profile data
  profileData: jsonb('profile_data').default(sql`'{}'::jsonb`).notNull(),

  // Email verification
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationToken: varchar('verification_token', { length: 255 }),

  // Password reset
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpires: timestamp('reset_password_expires', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Type for user without sensitive fields
export type PublicUser = Omit<User, 'password' | 'resetPasswordToken' | 'resetPasswordExpires' | 'verificationToken'>;
