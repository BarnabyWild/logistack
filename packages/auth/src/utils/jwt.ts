/**
 * JWT token generation and verification utilities
 */

import * as jwt from 'jsonwebtoken';

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  [key: string]: any;
}

/**
 * Options for token generation
 */
export interface TokenOptions {
  expiresIn?: string;
  audience?: string;
  issuer?: string;
}

/**
 * Generate a JWT token
 *
 * @param payload - The data to encode in the token
 * @param secret - The secret key for signing the token
 * @param options - Additional token options (expiration, audience, etc.)
 * @returns The signed JWT token
 *
 * @example
 * ```typescript
 * const token = generateToken(
 *   { userId: '123', email: 'user@example.com' },
 *   process.env.JWT_SECRET,
 *   { expiresIn: '7d' }
 * );
 * ```
 */
export function generateToken(
  payload: TokenPayload,
  secret: string,
  options: TokenOptions = {}
): string {
  const {
    expiresIn = '7d',
    audience,
    issuer = 'logistack',
  } = options;

  const signOptions: jwt.SignOptions = {
    issuer,
  };

  if (expiresIn !== undefined) {
    signOptions.expiresIn = expiresIn as jwt.SignOptions['expiresIn'];
  } else {
    signOptions.expiresIn = '7d';
  }

  if (audience) {
    signOptions.audience = audience;
  }

  return jwt.sign(payload, secret, signOptions);
}

/**
 * Verify and decode a JWT token
 *
 * @param token - The JWT token to verify
 * @param secret - The secret key used to sign the token
 * @returns The decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyToken(token, process.env.JWT_SECRET);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 * ```
 */
export function verifyToken(
  token: string,
  secret: string
): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}

/**
 * Decode a JWT token without verification (use with caution)
 *
 * @param token - The JWT token to decode
 * @returns The decoded token payload or null if invalid
 *
 * @example
 * ```typescript
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', payload.exp);
 * }
 * ```
 */
export function decodeToken(token: string): TokenPayload | null {
  return jwt.decode(token) as TokenPayload | null;
}
