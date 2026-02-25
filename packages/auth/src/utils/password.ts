/**
 * Password hashing and verification utilities using bcrypt
 */

import * as bcrypt from 'bcrypt';

/**
 * Default salt rounds for bcrypt hashing
 */
const DEFAULT_SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 *
 * @param password - The plain text password to hash
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns Promise resolving to the hashed password
 *
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('mySecurePassword');
 * ```
 */
export async function hashPassword(
  password: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS
): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 *
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await comparePassword('myPassword', hashedPassword);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
