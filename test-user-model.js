/**
 * Test script for User model and database schema
 * Usage: node test-user-model.js
 */

require('dotenv').config();
const { createDbConnection } = require('./config/database');
const User = require('./models/User');

async function testUserModel() {
  console.log('Testing User Model and Database Schema...\n');

  // Create database connection
  const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  const db = createDbConnection(connectionString);

  try {
    // Test 1: Create a new user
    console.log('Test 1: Creating a new user...');
    const newUser = await User.create(db, {
      email: 'test@example.com',
      password: 'Test123!@#',
      userType: 'trucker',
      phone: '555-0100',
    });
    console.log('✓ User created successfully:', {
      id: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    });

    // Test 2: Find user by email
    console.log('\nTest 2: Finding user by email...');
    const foundUser = await User.findByEmail(db, 'test@example.com');
    console.log('✓ User found:', foundUser ? 'Yes' : 'No');

    // Test 3: Verify password
    console.log('\nTest 3: Verifying password...');
    const isValidPassword = await User.verifyPassword('Test123!@#', foundUser.password);
    console.log('✓ Password valid:', isValidPassword);

    // Test 4: Update user
    console.log('\nTest 4: Updating user...');
    const updatedUser = await User.update(db, newUser.id, {
      phone: '555-0200',
    });
    console.log('✓ User updated:', updatedUser.phone);

    // Test 5: Set verification token
    console.log('\nTest 5: Setting verification token...');
    const userWithToken = await User.update(db, newUser.id, {
      verificationToken: 'test-token-123',
    });
    console.log('✓ Verification token set');

    // Test 6: Find by verification token
    console.log('\nTest 6: Finding user by verification token...');
    const userByToken = await User.findByVerificationToken(db, 'test-token-123');
    console.log('✓ User found by token:', userByToken ? 'Yes' : 'No');

    // Test 7: Verify email
    console.log('\nTest 7: Verifying email...');
    await User.verifyEmail(db, newUser.id);
    const verifiedUser = await User.findById(db, newUser.id);
    console.log('✓ Email verified:', verifiedUser.emailVerified);

    // Test 8: Set password reset token
    console.log('\nTest 8: Setting password reset token...');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    await User.setResetToken(db, newUser.id, 'reset-token-123', resetExpiry);
    const userWithResetToken = await User.findByResetToken(db, 'reset-token-123');
    console.log('✓ Reset token set:', userWithResetToken ? 'Yes' : 'No');

    // Test 9: Clear reset token
    console.log('\nTest 9: Clearing reset token...');
    await User.clearResetToken(db, newUser.id);
    const userWithoutResetToken = await User.findById(db, newUser.id);
    console.log('✓ Reset token cleared:', !userWithoutResetToken.resetPasswordToken);

    // Test 10: Delete user
    console.log('\nTest 10: Deleting user...');
    const deleted = await User.delete(db, newUser.id);
    console.log('✓ User deleted:', deleted);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run tests
testUserModel();
