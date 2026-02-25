const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 * Handles token generation, verification, and decoding
 */

// JWT Configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Validates that JWT_SECRET is configured
 * @throws {Error} If JWT_SECRET is not set
 */
const validateJWTConfig = () => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set it in your environment variables.');
  }
};

/**
 * Generates an access token for a user
 * @param {Object} payload - User data to include in token (e.g., { userId, email, role })
 * @param {Object} options - Optional JWT sign options
 * @returns {string} Signed JWT access token
 * @throws {Error} If token generation fails or JWT_SECRET is not configured
 */
const generateAccessToken = (payload, options = {}) => {
  try {
    validateJWTConfig();

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a valid object');
    }

    const tokenOptions = {
      expiresIn: options.expiresIn || JWT_EXPIRES_IN,
      ...options
    };

    return jwt.sign(payload, JWT_SECRET, tokenOptions);
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
};

/**
 * Generates a refresh token for a user
 * Refresh tokens typically have longer expiration times
 * @param {Object} payload - User data to include in token (usually minimal, e.g., { userId })
 * @param {Object} options - Optional JWT sign options
 * @returns {string} Signed JWT refresh token
 * @throws {Error} If token generation fails or JWT_SECRET is not configured
 */
const generateRefreshToken = (payload, options = {}) => {
  try {
    validateJWTConfig();

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a valid object');
    }

    const tokenOptions = {
      expiresIn: options.expiresIn || JWT_REFRESH_EXPIRES_IN,
      ...options
    };

    return jwt.sign(payload, JWT_SECRET, tokenOptions);
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error.message}`);
  }
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param {string} token - JWT token to verify
 * @param {Object} options - Optional JWT verify options
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or verification fails
 */
const verifyToken = (token, options = {}) => {
  try {
    validateJWTConfig();

    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a valid string');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    return jwt.verify(cleanToken, JWT_SECRET, options);
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet active');
    }

    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Decodes a JWT token without verifying its signature
 * Warning: This does not validate the token. Use verifyToken() for secure operations.
 * Useful for extracting payload data when verification is not required (e.g., debugging)
 * @param {string} token - JWT token to decode
 * @param {Object} options - Optional JWT decode options
 * @returns {Object|null} Decoded token payload or null if invalid format
 */
const decodeToken = (token, options = {}) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    return jwt.decode(cleanToken, options);
  } catch (error) {
    return null;
  }
};

/**
 * Checks if a token is expired without throwing an error
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

/**
 * Extracts the expiration date from a token
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null if not available
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Generates both access and refresh tokens for a user
 * @param {Object} payload - User data to include in tokens
 * @returns {Object} Object containing accessToken and refreshToken
 * @throws {Error} If token generation fails
 */
const generateTokenPair = (payload) => {
  try {
    // For access token, include full user data
    const accessToken = generateAccessToken(payload);

    // For refresh token, only include minimal data (userId)
    const refreshPayload = { userId: payload.userId };
    const refreshToken = generateRefreshToken(refreshPayload);

    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    throw new Error(`Failed to generate token pair: ${error.message}`);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  generateTokenPair
};
