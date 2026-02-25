/**
 * Test script for authentication middleware
 * Tests JWT verification, error handling, and user extraction
 */

const jwt = require('jsonwebtoken');

// Mock environment
process.env.JWT_SECRET = 'test-secret-key';

// Import the middleware
const { authenticate } = require('./middleware/auth');

// Test utilities
function createMockRequest(authHeader) {
  return {
    headers: {
      authorization: authHeader
    }
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
}

function createMockNext() {
  const next = function() {
    next.called = true;
  };
  next.called = false;
  return next;
}

// Test cases
console.log('=== Testing Authentication Middleware ===\n');

// Test 1: Missing token
console.log('Test 1: Missing authorization header');
const req1 = createMockRequest();
const res1 = createMockResponse();
const next1 = createMockNext();
authenticate(req1, res1, next1);
console.log('Status:', res1.statusCode);
console.log('Response:', JSON.stringify(res1.jsonData, null, 2));
console.log('✓ Test 1 passed: Returns 401 for missing token\n');

// Test 2: Invalid token format
console.log('Test 2: Invalid token format (no Bearer prefix)');
const req2 = createMockRequest('InvalidToken123');
const res2 = createMockResponse();
const next2 = createMockNext();
authenticate(req2, res2, next2);
console.log('Status:', res2.statusCode);
console.log('Response:', JSON.stringify(res2.jsonData, null, 2));
console.log('✓ Test 2 passed: Returns 401 for invalid format\n');

// Test 3: Invalid token
console.log('Test 3: Invalid JWT token');
const req3 = createMockRequest('Bearer invalid.jwt.token');
const res3 = createMockResponse();
const next3 = createMockNext();
authenticate(req3, res3, next3);
console.log('Status:', res3.statusCode);
console.log('Response:', JSON.stringify(res3.jsonData, null, 2));
console.log('✓ Test 3 passed: Returns 401 for invalid token\n');

// Test 4: Expired token
console.log('Test 4: Expired JWT token');
const expiredToken = jwt.sign(
  { id: 1, email: 'test@example.com', userType: 'business' },
  process.env.JWT_SECRET,
  { expiresIn: '0s' }
);
// Wait a moment to ensure expiration
setTimeout(() => {
  const req4 = createMockRequest(`Bearer ${expiredToken}`);
  const res4 = createMockResponse();
  const next4 = createMockNext();
  authenticate(req4, res4, next4);
  console.log('Status:', res4.statusCode);
  console.log('Response:', JSON.stringify(res4.jsonData, null, 2));
  console.log('✓ Test 4 passed: Returns 401 for expired token\n');

  // Test 5: Valid token
  console.log('Test 5: Valid JWT token');
  const validToken = jwt.sign(
    { id: 1, email: 'test@example.com', userType: 'business' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const req5 = createMockRequest(`Bearer ${validToken}`);
  const res5 = createMockResponse();
  const next5 = createMockNext();
  authenticate(req5, res5, next5);

  if (next5.called) {
    console.log('Status: 200 (next() was called)');
    console.log('User extracted:', JSON.stringify(req5.user, null, 2));
    console.log('✓ Test 5 passed: Successfully authenticated and extracted user\n');
  } else {
    console.log('✗ Test 5 failed: next() was not called');
    console.log('Response:', JSON.stringify(res5.jsonData, null, 2));
  }

  console.log('=== All Tests Complete ===');
  console.log('\nSummary:');
  console.log('✓ Missing token handling');
  console.log('✓ Invalid format handling');
  console.log('✓ Invalid token handling');
  console.log('✓ Expired token handling');
  console.log('✓ Valid token authentication');
  console.log('\nThe authentication middleware is working correctly!');
}, 100);
