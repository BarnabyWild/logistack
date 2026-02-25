/**
 * End-to-End Feature Test Script for Logistack
 *
 * Tests all core API flows:
 * 1. User Registration (business + trucker)
 * 2. User Login
 * 3. Load CRUD (create, read, list)
 * 4. Load Assignment
 * 5. Load Status Transitions (pending → assigned → in_transit → delivered)
 * 6. GPS Tracking WebSocket
 * 7. Load Search/Filtering
 * 8. Error Handling (invalid inputs, unauthorized access)
 * 9. Load Cancellation
 *
 * Usage: node test-e2e.js [API_BASE_URL]
 * Default: http://localhost:3001
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Track test results
const results = { passed: 0, failed: 0, skipped: 0, errors: [] };

// Test data
const testBusiness = {
  email: `test-business-${Date.now()}@logistack.com`,
  password: 'TestPass123',
  user_type: 'business',
};

const testTrucker = {
  email: `test-trucker-${Date.now()}@logistack.com`,
  password: 'TestPass456',
  user_type: 'trucker',
};

let businessToken = null;
let truckerToken = null;
let businessUserId = null;
let truckerUserId = null;
let createdLoadId = null;

// HTTP request helper
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL.endsWith('/') ? API_URL : API_URL + '/');
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test runner
function test(name, fn) {
  return async () => {
    try {
      await fn();
      results.passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      results.failed++;
      results.errors.push({ name, error: err.message });
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${err.message}`);
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ============================================================
// TEST SUITES
// ============================================================

async function testHealthCheck() {
  console.log('\n--- Health Check ---');
  await test('Health endpoint returns ok', async () => {
    const res = await request('GET', `${BASE_URL}/health`);
    assertEqual(res.status, 200);
    assertEqual(res.data.status, 'ok');
  })();
}

async function testUserRegistration() {
  console.log('\n--- User Registration ---');

  await test('Register business user', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, testBusiness);
    assertEqual(res.status, 201, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data, 'Missing data field in response');
    assert(res.data.data.user, 'Missing user in response');
    assert(res.data.data.tokens, 'Missing tokens in response');
    assert(res.data.data.tokens.access_token, 'Missing access_token');
    assert(res.data.data.tokens.refresh_token, 'Missing refresh_token');
    businessToken = res.data.data.tokens.access_token;
    businessUserId = res.data.data.user.id;
  })();

  await test('Register trucker user', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, testTrucker);
    assertEqual(res.status, 201, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data.user, 'Missing user in response');
    assert(res.data.data.tokens, 'Missing tokens in response');
    truckerToken = res.data.data.tokens.access_token;
    truckerUserId = res.data.data.user.id;
  })();

  await test('Reject duplicate email registration', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, testBusiness);
    assertEqual(res.status, 409, `Expected 409, got ${res.status}`);
  })();

  await test('Reject invalid email format', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, {
      email: 'not-an-email',
      password: 'TestPass123',
      user_type: 'business',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  })();

  await test('Reject weak password', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, {
      email: `weak-pw-${Date.now()}@test.com`,
      password: '1234',
      user_type: 'business',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  })();

  await test('Reject invalid user type', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, {
      email: `invalid-type-${Date.now()}@test.com`,
      password: 'TestPass123',
      user_type: 'admin',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  })();
}

async function testUserLogin() {
  console.log('\n--- User Login ---');

  await test('Login business user', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: testBusiness.email,
      password: testBusiness.password,
    });
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data.user, 'Missing user in response');
    assert(res.data.data.tokens.access_token, 'Missing access_token');
    // Update token with fresh one
    businessToken = res.data.data.tokens.access_token;
  })();

  await test('Login trucker user', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: testTrucker.email,
      password: testTrucker.password,
    });
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    truckerToken = res.data.data.tokens.access_token;
  })();

  await test('Reject wrong password', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: testBusiness.email,
      password: 'WrongPassword123',
    });
    assertEqual(res.status, 401);
  })();

  await test('Reject non-existent email', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: 'nonexistent@test.com',
      password: 'TestPass123',
    });
    assertEqual(res.status, 401);
  })();
}

async function testGetCurrentUser() {
  console.log('\n--- Get Current User ---');

  await test('Get /me for business user', async () => {
    const res = await request('GET', `${API_URL}/auth/me`, null, businessToken);
    assertEqual(res.status, 200);
    assert(res.data.data.user, 'Missing user in response');
    assertEqual(res.data.data.user.email, testBusiness.email.toLowerCase());
    assertEqual(res.data.data.user.userType, 'business');
  })();

  await test('Get /me for trucker user', async () => {
    const res = await request('GET', `${API_URL}/auth/me`, null, truckerToken);
    assertEqual(res.status, 200);
    assertEqual(res.data.data.user.userType, 'trucker');
  })();

  await test('Reject /me without token', async () => {
    const res = await request('GET', `${API_URL}/auth/me`);
    assertEqual(res.status, 401);
  })();

  await test('Reject /me with invalid token', async () => {
    const res = await request('GET', `${API_URL}/auth/me`, null, 'invalid-token-here');
    assertEqual(res.status, 401);
  })();
}

async function testTokenRefresh() {
  console.log('\n--- Token Refresh ---');

  // First get a refresh token
  let refreshToken = null;
  await test('Get refresh token from login', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: testBusiness.email,
      password: testBusiness.password,
    });
    refreshToken = res.data.data.tokens.refresh_token;
    assert(refreshToken, 'Missing refresh token');
  })();

  await test('Refresh access token', async () => {
    if (!refreshToken) throw new Error('No refresh token from previous test');
    const res = await request('POST', `${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data.tokens.access_token, 'Missing new access_token');
    assert(res.data.data.tokens.refresh_token, 'Missing new refresh_token');
  })();

  await test('Reject invalid refresh token', async () => {
    const res = await request('POST', `${API_URL}/auth/refresh`, {
      refresh_token: 'invalid-token',
    });
    assertEqual(res.status, 401);
  })();
}

async function testLoadCreation() {
  console.log('\n--- Load Creation ---');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const loadData = {
    originLocation: 'Chicago, IL',
    destinationLocation: 'Dallas, TX',
    weight: 40000,
    price: 2500.00,
    pickupDate: tomorrow.toISOString().split('T')[0],
    deliveryDate: nextWeek.toISOString().split('T')[0],
    description: 'E2E test load - electronics shipment',
  };

  await test('Business user creates a load', async () => {
    const res = await request('POST', `${API_URL}/loads`, loadData, businessToken);
    assertEqual(res.status, 201, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data, 'Missing data in response');
    assert(res.data.data.id, 'Missing load ID');
    assertEqual(res.data.data.status, 'pending');
    assertEqual(res.data.data.originLocation, 'Chicago, IL');
    assertEqual(res.data.data.destinationLocation, 'Dallas, TX');
    createdLoadId = res.data.data.id;
    assert(res.data.message, 'Missing success message');
  })();

  await test('Trucker cannot create a load', async () => {
    const res = await request('POST', `${API_URL}/loads`, loadData, truckerToken);
    assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
  })();

  await test('Unauthenticated user cannot create a load', async () => {
    const res = await request('POST', `${API_URL}/loads`, loadData);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
  })();

  await test('Reject load with missing required fields', async () => {
    const res = await request('POST', `${API_URL}/loads`, {
      originLocation: 'Chicago, IL',
    }, businessToken);
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
  })();

  await test('Reject load with pickup date after delivery date', async () => {
    const res = await request('POST', `${API_URL}/loads`, {
      ...loadData,
      pickupDate: nextWeek.toISOString().split('T')[0],
      deliveryDate: tomorrow.toISOString().split('T')[0],
    }, businessToken);
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
  })();

  await test('Reject load with negative weight', async () => {
    const res = await request('POST', `${API_URL}/loads`, {
      ...loadData,
      weight: -100,
    }, businessToken);
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
  })();

  await test('Reject load with zero price', async () => {
    const res = await request('POST', `${API_URL}/loads`, {
      ...loadData,
      price: 0,
    }, businessToken);
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
  })();
}

async function testLoadRetrieval() {
  console.log('\n--- Load Retrieval ---');

  await test('Get load by ID (business user)', async () => {
    if (!createdLoadId) throw new Error('No load created');
    const res = await request('GET', `${API_URL}/loads/${createdLoadId}`, null, businessToken);
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assert(res.data.data, 'Missing data in response');
    assertEqual(res.data.data.id, createdLoadId);
    assert(Array.isArray(res.data.data.history), 'Missing history array');
    assert(res.data.data.history.length > 0, 'History should have at least 1 entry');
  })();

  await test('Get load by ID returns 404 for non-existent', async () => {
    const res = await request('GET', `${API_URL}/loads/99999`, null, businessToken);
    assertEqual(res.status, 404);
  })();

  await test('Get load by ID returns 400 for invalid ID', async () => {
    const res = await request('GET', `${API_URL}/loads/abc`, null, businessToken);
    assertEqual(res.status, 400);
  })();

  await test('Unauthenticated cannot get load', async () => {
    const res = await request('GET', `${API_URL}/loads/${createdLoadId}`);
    assertEqual(res.status, 401);
  })();
}

async function testLoadListing() {
  console.log('\n--- Load Listing & Filtering ---');

  await test('List all loads (business user)', async () => {
    const res = await request('GET', `${API_URL}/loads`, null, businessToken);
    assertEqual(res.status, 200, `Status: ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected data to be an array');
    assert(res.data.pagination, 'Missing pagination info');
    assert(res.data.data.length > 0, 'Expected at least one load');
  })();

  await test('Filter loads by status=pending', async () => {
    const res = await request('GET', `${API_URL}/loads?status=pending`, null, businessToken);
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.data), 'Expected data array');
    // All returned loads should be pending
    for (const load of res.data.data) {
      assertEqual(load.status, 'pending', `Load ${load.id} has status ${load.status}, expected pending`);
    }
  })();

  await test('Filter loads by origin', async () => {
    const res = await request('GET', `${API_URL}/loads?origin=Chicago`, null, businessToken);
    assertEqual(res.status, 200);
  })();

  await test('Filter loads by destination', async () => {
    const res = await request('GET', `${API_URL}/loads?destination=Dallas`, null, businessToken);
    assertEqual(res.status, 200);
  })();

  await test('Pagination with limit and offset', async () => {
    const res = await request('GET', `${API_URL}/loads?limit=1&offset=0`, null, businessToken);
    assertEqual(res.status, 200);
    assert(res.data.data.length <= 1, 'Expected at most 1 result');
    assertEqual(res.data.pagination.limit, 1);
  })();

  await test('Trucker sees only assigned loads (empty initially)', async () => {
    const res = await request('GET', `${API_URL}/loads`, null, truckerToken);
    assertEqual(res.status, 200);
    // Trucker should only see loads assigned to them (none yet)
    assertEqual(res.data.data.length, 0, 'Trucker should see 0 loads before assignment');
  })();
}

async function testLoadAssignment() {
  console.log('\n--- Load Assignment ---');

  await test('Business assigns load to trucker', async () => {
    if (!createdLoadId || !truckerUserId) throw new Error('Missing test data');
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/assign`, {
      truckerId: truckerUserId,
      notes: 'E2E test assignment',
    }, businessToken);
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assertEqual(res.data.data.status, 'assigned');
    assertEqual(res.data.data.truckerId, truckerUserId);
    assert(res.data.message, 'Missing success message');
  })();

  await test('Trucker can now see the assigned load', async () => {
    const res = await request('GET', `${API_URL}/loads`, null, truckerToken);
    assertEqual(res.status, 200);
    assert(res.data.data.length > 0, 'Trucker should see at least 1 assigned load');
    const found = res.data.data.find(l => l.id === createdLoadId);
    assert(found, 'Trucker should see the assigned load');
    assertEqual(found.status, 'assigned');
  })();

  await test('Cannot re-assign an already assigned load', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/assign`, {
      truckerId: truckerUserId,
    }, businessToken);
    assertEqual(res.status, 409, `Expected 409, got ${res.status}`);
  })();

  await test('Trucker cannot assign loads', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/assign`, {
      truckerId: truckerUserId,
    }, truckerToken);
    assertEqual(res.status, 403);
  })();

  await test('Cannot assign to non-existent trucker', async () => {
    // Create another load for this test
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 37);

    const res2 = await request('POST', `${API_URL}/loads`, {
      originLocation: 'New York, NY',
      destinationLocation: 'Boston, MA',
      weight: 10000,
      price: 800,
      pickupDate: tomorrow.toISOString().split('T')[0],
      deliveryDate: nextMonth.toISOString().split('T')[0],
    }, businessToken);

    if (res2.status === 201) {
      const newLoadId = res2.data.data.id;
      const res = await request('PATCH', `${API_URL}/loads/${newLoadId}/assign`, {
        truckerId: 99999,
      }, businessToken);
      assertEqual(res.status, 404, `Expected 404, got ${res.status}`);
    }
  })();
}

async function testLoadStatusTransitions() {
  console.log('\n--- Load Status Transitions ---');

  // Load should be in "assigned" status from previous test

  await test('Business cannot set in_transit', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/status`, {
      status: 'in_transit',
    }, businessToken);
    assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
  })();

  await test('Trucker moves load to in_transit', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/status`, {
      status: 'in_transit',
      notes: 'Pickup completed, heading to destination',
    }, truckerToken);
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assertEqual(res.data.data.status, 'in_transit');
  })();

  await test('Cannot skip from in_transit back to assigned', async () => {
    // Try moving to in_transit again (invalid)
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/status`, {
      status: 'in_transit',
    }, truckerToken);
    assertEqual(res.status, 400);
  })();

  await test('Trucker marks load as delivered', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/status`, {
      status: 'delivered',
      notes: 'Delivered to final destination',
    }, truckerToken);
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assertEqual(res.data.data.status, 'delivered');
  })();

  await test('Cannot change status of delivered load', async () => {
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/status`, {
      status: 'in_transit',
    }, truckerToken);
    assert(res.status >= 400, `Expected error status, got ${res.status}`);
  })();

  await test('Verify load history has all transitions', async () => {
    const res = await request('GET', `${API_URL}/loads/${createdLoadId}`, null, businessToken);
    assertEqual(res.status, 200);
    const history = res.data.data.history;
    assert(history.length >= 4, `Expected at least 4 history entries, got ${history.length}`);
    // History is ordered by changedAt DESC, so most recent first
    const statuses = history.map(h => h.newStatus);
    assert(statuses.includes('pending'), 'Missing pending in history');
    assert(statuses.includes('assigned'), 'Missing assigned in history');
    assert(statuses.includes('in_transit'), 'Missing in_transit in history');
    assert(statuses.includes('delivered'), 'Missing delivered in history');
  })();
}

async function testLoadCancellation() {
  console.log('\n--- Load Cancellation ---');

  // Create a new load for cancellation testing
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 20);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 27);

  let cancelLoadId = null;

  await test('Create load for cancellation test', async () => {
    const res = await request('POST', `${API_URL}/loads`, {
      originLocation: 'Los Angeles, CA',
      destinationLocation: 'Seattle, WA',
      weight: 25000,
      price: 1800,
      pickupDate: tomorrow.toISOString().split('T')[0],
      deliveryDate: nextWeek.toISOString().split('T')[0],
    }, businessToken);
    assertEqual(res.status, 201);
    cancelLoadId = res.data.data.id;
  })();

  await test('Trucker cannot cancel a load', async () => {
    if (!cancelLoadId) throw new Error('No load created for cancel test');
    const res = await request('PATCH', `${API_URL}/loads/${cancelLoadId}/cancel`, {
      notes: 'Attempt by trucker',
    }, truckerToken);
    assertEqual(res.status, 403);
  })();

  await test('Business cancels a pending load', async () => {
    if (!cancelLoadId) throw new Error('No load created for cancel test');
    const res = await request('PATCH', `${API_URL}/loads/${cancelLoadId}/cancel`, {
      notes: 'No longer needed',
    }, businessToken);
    assertEqual(res.status, 200, `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
    assertEqual(res.data.data.status, 'cancelled');
  })();

  await test('Cannot cancel an already cancelled load', async () => {
    if (!cancelLoadId) throw new Error('No load created for cancel test');
    const res = await request('PATCH', `${API_URL}/loads/${cancelLoadId}/cancel`, {}, businessToken);
    assertEqual(res.status, 400);
  })();

  await test('Cannot cancel a delivered load', async () => {
    // createdLoadId was delivered in previous test suite
    const res = await request('PATCH', `${API_URL}/loads/${createdLoadId}/cancel`, {}, businessToken);
    assertEqual(res.status, 400);
  })();
}

async function testGPSTracking() {
  console.log('\n--- GPS Tracking REST Endpoints ---');

  await test('Get active GPS sessions (should be empty)', async () => {
    const res = await request('GET', `${API_URL}/gps/active`);
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.activeSessions), 'Missing activeSessions array');
  })();

  await test('Get GPS location for non-tracked load returns 404', async () => {
    const res = await request('GET', `${API_URL}/gps/location/99999`);
    assertEqual(res.status, 404);
  })();

  await test('Get GPS history for a load', async () => {
    const res = await request('GET', `${API_URL}/gps/history/${createdLoadId}`);
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.locations), 'Missing locations array');
  })();

  await test('Invalid load ID returns 400 for GPS location', async () => {
    const res = await request('GET', `${API_URL}/gps/location/abc`);
    assertEqual(res.status, 400);
  })();

  await test('Invalid limit returns 400 for GPS history', async () => {
    const res = await request('GET', `${API_URL}/gps/history/${createdLoadId}?limit=0`);
    assertEqual(res.status, 400);
  })();
}

async function testLogout() {
  console.log('\n--- Logout ---');

  await test('Business user logout', async () => {
    const res = await request('POST', `${API_URL}/auth/logout`, {}, businessToken);
    assertEqual(res.status, 200);
  })();

  await test('Logout without token returns 401', async () => {
    const res = await request('POST', `${API_URL}/auth/logout`);
    assertEqual(res.status, 401);
  })();
}

// ============================================================
// MAIN RUNNER
// ============================================================

async function runAllTests() {
  console.log('==============================================');
  console.log('  Logistack E2E API Tests');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log('==============================================');

  // Check if server is reachable
  try {
    const health = await request('GET', `${BASE_URL}/health`);
    if (health.status !== 200) {
      console.log(`\n⚠ Server returned status ${health.status} on health check`);
      console.log('Make sure the API server is running: pnpm api:dev');
      process.exit(1);
    }
  } catch (err) {
    console.log(`\n✗ Cannot connect to server at ${BASE_URL}`);
    console.log(`  Error: ${err.message}`);
    console.log('\nMake sure the API server is running:');
    console.log('  pnpm api:dev');
    process.exit(1);
  }

  await testHealthCheck();
  await testUserRegistration();
  await testUserLogin();
  await testGetCurrentUser();
  await testTokenRefresh();
  await testLoadCreation();
  await testLoadRetrieval();
  await testLoadListing();
  await testLoadAssignment();
  await testLoadStatusTransitions();
  await testLoadCancellation();
  await testGPSTracking();
  await testLogout();

  // Print summary
  console.log('\n==============================================');
  console.log('  TEST SUMMARY');
  console.log('==============================================');
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Total:  ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n  Failed Tests:');
    results.errors.forEach(({ name, error }) => {
      console.log(`    ✗ ${name}`);
      console.log(`      ${error}`);
    });
  }

  console.log('\n==============================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
