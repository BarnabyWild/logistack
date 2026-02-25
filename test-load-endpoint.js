/**
 * Test script for Load Creation Endpoint
 *
 * This script demonstrates how to test the POST /api/loads endpoint
 *
 * Prerequisites:
 * 1. Server must be running (npm start)
 * 2. Database must be set up with migrations applied
 * 3. You need a valid JWT token for a business user
 *
 * Usage:
 * node test-load-endpoint.js <jwt_token>
 */

const jwt = require('jsonwebtoken');

// Sample test data
const testLoad = {
  origin: "123 Main St, Chicago, IL 60601",
  destination: "456 Oak Ave, Dallas, TX 75201",
  weight: 42000,
  price: 2500.00,
  pickupDate: "2026-03-15",
  deliveryDate: "2026-03-17",
  description: "Steel beams - requires flatbed trailer"
};

// Function to create a test JWT token (for testing purposes only)
function createTestToken() {
  const payload = {
    id: 1,
    email: "test@business.com",
    userType: "business"
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-here', {
    expiresIn: '1h'
  });
}

// Function to test the endpoint
async function testCreateLoad(token) {
  const url = 'http://localhost:3000/api/loads';

  console.log('\n=== Testing POST /api/loads ===\n');
  console.log('Request URL:', url);
  console.log('Request Body:', JSON.stringify(testLoad, null, 2));
  console.log('\nSending request...\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLoad)
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('\n✅ SUCCESS: Load created successfully!');
    } else {
      console.log('\n❌ FAILED: Load creation failed');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('\n========================================');
  console.log('  Load Creation Endpoint Test Suite');
  console.log('========================================');

  // Get token from command line or create test token
  const token = process.argv[2] || createTestToken();

  if (!process.argv[2]) {
    console.log('\n⚠️  No JWT token provided. Using test token.');
    console.log('For real testing, run: node test-load-endpoint.js <your_jwt_token>\n');
  }

  await testCreateLoad(token);

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

// Execute tests
runTests();
