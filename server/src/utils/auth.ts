import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import type { PublicUser } from '@logistack/db';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(
  fastify: FastifyInstance,
  user: PublicUser
): { access_token: string; refresh_token: string } {
  const payload = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
  };

  // Generate access token (short-lived)
  const access_token = fastify.jwt.sign(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  // Generate refresh token (long-lived)
  const refresh_token = fastify.jwt.sign(payload, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { access_token, refresh_token };
}

/**
 * Remove sensitive fields from user object
 */
export function sanitizeUser(user: any): PublicUser {
  const { password, resetPasswordToken, resetPasswordExpires, verificationToken, ...publicUser } = user;
  return publicUser as PublicUser;
}
