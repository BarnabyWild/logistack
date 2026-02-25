# Authentication & Authorization Middleware

This directory contains middleware for protecting routes and controlling access in the Logistack application.

## Overview

The authentication system uses JWT (JSON Web Tokens) to verify user identity and protect API routes. It consists of two main middleware functions:

1. **authenticate** - Verifies JWT tokens and extracts user information
2. **authorize** - Checks user roles/permissions (must be used after authenticate)

## authenticate Middleware

Located in `middleware/auth.js`

### Purpose

Verifies JWT tokens from the Authorization header, extracts user information, and adds it to the request object for use by subsequent middleware and route handlers.

### Usage

```javascript
const { authenticate } = require('./middleware/auth');

// Protect a route
router.get('/protected', authenticate, (req, res) => {
  // req.user is now available
  res.json({ user: req.user });
});
```

### How it Works

1. **Extracts token** from Authorization header
2. **Validates format** (must be "Bearer <token>")
3. **Verifies token** using JWT_SECRET from environment
4. **Extracts user data** and adds to `req.user`
5. **Calls next()** if successful, or returns error response if not

### Request Requirements

- **Header**: `Authorization: Bearer <jwt_token>`

### Success Response

- Status: Continues to next middleware
- Adds `req.user` object with:
  ```javascript
  {
    id: number,        // User ID
    email: string,     // User email
    userType: string   // 'business' or 'trucker'
  }
  ```

### Error Responses

#### Missing Token
```json
{
  "error": {
    "message": "No authorization token provided",
    "status": 401
  }
}
```

#### Invalid Format
```json
{
  "error": {
    "message": "Invalid token format. Use: Bearer <token>",
    "status": 401
  }
}
```

#### Invalid Token
```json
{
  "error": {
    "message": "Invalid token",
    "status": 401
  }
}
```

#### Expired Token
```json
{
  "error": {
    "message": "Token expired",
    "status": 401
  }
}
```

#### Server Error
```json
{
  "error": {
    "message": "Authentication error",
    "status": 500
  }
}
```

## authorize Middleware

Located in `middleware/authorize.js`

### Purpose

Checks if the authenticated user has the required role/permission to access a route. Must be used after the `authenticate` middleware.

### Usage

```javascript
const { authenticate } = require('./middleware/auth');
const { authorize } = require('./middleware/authorize');

// Only allow business users
router.post('/loads',
  authenticate,
  authorize(['business']),
  createLoad
);

// Allow both business and trucker users
router.get('/loads',
  authenticate,
  authorize(['business', 'trucker']),
  getLoads
);
```

### How it Works

1. **Checks req.user exists** (set by authenticate middleware)
2. **Compares user type** against allowed roles
3. **Calls next()** if authorized, or returns 403 error if not

### Parameters

- `allowedRoles` (string[]): Array of user types that can access the route
  - `'business'` - Business users (dispatchers/admins)
  - `'trucker'` - Trucker users (drivers)

### Error Responses

#### Not Authenticated
```json
{
  "error": {
    "message": "Authentication required",
    "status": 401
  }
}
```

#### Not Authorized
```json
{
  "error": {
    "message": "You do not have permission to perform this action",
    "status": 403
  }
}
```

## Environment Configuration

The authentication middleware requires the following environment variables:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

See `.env.example` for full configuration options.

## Example Route Protection

### Full Example with Both Middleware

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { createLoad, getLoads } = require('../controllers/loadController');

/**
 * GET /api/loads
 * List loads - accessible to both business and trucker users
 */
router.get(
  '/',
  authenticate,                          // 1. Verify token
  authorize(['business', 'trucker']),    // 2. Check user type
  getLoads                               // 3. Handle request
);

/**
 * POST /api/loads
 * Create load - only business users can create loads
 */
router.post(
  '/',
  authenticate,                          // 1. Verify token
  authorize(['business']),               // 2. Only business users
  createLoad                             // 3. Handle request
);

module.exports = router;
```

## Testing

Run the test suite to verify middleware functionality:

```bash
node test-auth-middleware.js
```

The test suite verifies:
- ✓ Missing token handling
- ✓ Invalid format handling
- ✓ Invalid token handling
- ✓ Expired token handling
- ✓ Valid token authentication
- ✓ User data extraction

## Security Considerations

1. **Token Storage**: Clients should store JWT tokens securely (httpOnly cookies or secure storage)
2. **Secret Key**: Use a strong, randomly generated JWT_SECRET in production
3. **Token Expiration**: Tokens expire based on JWT_EXPIRES_IN configuration
4. **HTTPS**: Always use HTTPS in production to protect tokens in transit
5. **Error Messages**: Error messages are intentionally generic to avoid information leakage

## Common Issues

### "No authorization token provided"
- Ensure the Authorization header is included in the request
- Header format: `Authorization: Bearer <token>`

### "Invalid token format"
- Token must be prefixed with "Bearer "
- Example: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`

### "Token expired"
- User needs to obtain a new token (login again)
- Token lifetime is configured via JWT_EXPIRES_IN

### "Invalid token"
- Token signature doesn't match JWT_SECRET
- Token has been tampered with
- Token was generated with a different secret
