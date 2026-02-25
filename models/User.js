const { users } = require('../packages/db/src/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

/**
 * User Model - Provides methods for user-related database operations
 */
class User {
  /**
   * Create a new user
   * @param {object} db - Drizzle database instance
   * @param {object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} userData.userType - User type ('trucker' or 'business')
   * @returns {Promise<object>} Created user (without sensitive fields)
   */
  static async create(db, { email, password, userType, ...otherData }) {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        userType,
        ...otherData,
      })
      .returning();

    // Return user without sensitive fields
    return this.sanitizeUser(user);
  }

  /**
   * Find user by ID
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @returns {Promise<object|null>} User or null
   */
  static async findById(db, id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  /**
   * Find user by email
   * @param {object} db - Drizzle database instance
   * @param {string} email - User email
   * @returns {Promise<object|null>} User or null
   */
  static async findByEmail(db, email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  /**
   * Find user by verification token
   * @param {object} db - Drizzle database instance
   * @param {string} token - Verification token
   * @returns {Promise<object|null>} User or null
   */
  static async findByVerificationToken(db, token) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);
    return user || null;
  }

  /**
   * Find user by reset token
   * @param {object} db - Drizzle database instance
   * @param {string} token - Reset token
   * @returns {Promise<object|null>} User or null (if token is valid and not expired)
   */
  static async findByResetToken(db, token) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token))
      .limit(1);

    // Check if token is expired
    if (user && user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
      return null;
    }

    return user || null;
  }

  /**
   * Update user by ID
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|null>} Updated user or null
   */
  static async update(db, id, updates) {
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    // Update timestamp
    updates.updatedAt = new Date();

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    return user || null;
  }

  /**
   * Verify user's password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Mark email as verified
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @returns {Promise<object|null>} Updated user
   */
  static async verifyEmail(db, id) {
    return this.update(db, id, {
      emailVerified: true,
      verificationToken: null,
    });
  }

  /**
   * Set password reset token
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @param {string} token - Reset token
   * @param {Date} expiry - Token expiry date
   * @returns {Promise<object|null>} Updated user
   */
  static async setResetToken(db, id, token, expiry) {
    return this.update(db, id, {
      resetPasswordToken: token,
      resetPasswordExpires: expiry,
    });
  }

  /**
   * Clear password reset token
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @returns {Promise<object|null>} Updated user
   */
  static async clearResetToken(db, id) {
    return this.update(db, id, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  /**
   * Remove sensitive fields from user object
   * @param {object} user - User object
   * @returns {object} Sanitized user object
   */
  static sanitizeUser(user) {
    if (!user) return null;

    const { password, resetPasswordToken, resetPasswordExpires, verificationToken, ...publicUser } = user;
    return publicUser;
  }

  /**
   * Delete user by ID
   * @param {object} db - Drizzle database instance
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(db, id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}

module.exports = User;
