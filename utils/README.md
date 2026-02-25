# JWT Utilities

Comprehensive JWT (JSON Web Token) utility functions for authentication and authorization in the Logistack project.

## Features

- ✅ Generate access tokens with configurable expiration
- ✅ Generate refresh tokens with longer expiration times
- ✅ Verify tokens with comprehensive error handling
- ✅ Decode tokens without verification
- ✅ Check token expiration status
- ✅ Extract token expiration dates
- ✅ Generate token pairs (access + refresh)
- ✅ Support for Bearer token format
- ✅ Environment-based configuration

## Installation

The required dependencies are already included in the project:

```bash
npm install jsonwebtoken dotenv
```

## Configuration

Set the following environment variables in your `.env` file:

```env
JWT_SECRET=your-secret-key-here        # Required: Secret key for signing tokens
JWT_EXPIRES_IN=7d                      # Optional: Access token expiration (default: 7d)
JWT_REFRESH_EXPIRES_IN=30d             # Optional: Refresh token expiration (default: 30d)
```

⚠️ **Important**: Never commit your actual `JWT_SECRET` to version control. Use a strong, random secret in production.

## Usage

### Import the utilities

```javascript
const jwt = require('./utils/jwt');
```

### Generate an Access Token

```javascript
const accessToken = jwt.generateAccessToken({
  userId: '12345',
  email: 'user@example.com',
  role: 'admin'
});

console.log(accessToken);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Generate a Refresh Token

```javascript
const refreshToken = jwt.generateRefreshToken({
  userId: '12345'
});

console.log(refreshToken);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Generate Both Tokens at Once

```javascript
const { accessToken, refreshToken } = jwt.generateTokenPair({
  userId: '12345',
  email: 'user@example.com',
  role: 'admin'
});

// Note: Refresh token only contains userId for security
```

### Verify a Token

```javascript
try {
  const decoded = jwt.verifyToken(token);
  console.log('User ID:', decoded.userId);
  console.log('Email:', decoded.email);
} catch (error) {
  console.error('Token verification failed:', error.message);
  // Possible errors:
  // - "Token has expired"
  // - "Invalid token"
  // - "Token not yet active"
}
```

### Verify Bearer Token

```javascript
// Automatically handles "Bearer " prefix
const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

try {
  const decoded = jwt.verifyToken(authHeader);
  console.log('User authenticated:', decoded.userId);
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

### Decode Token (Without Verification)

```javascript
// ⚠️ Warning: This does NOT verify the token signature
// Use only for debugging or when verification is not required

const decoded = jwt.decodeToken(token);

if (decoded) {
  console.log('Token payload:', decoded);
} else {
  console.log('Invalid token format');
}
```

### Check if Token is Expired

```javascript
const isExpired = jwt.isTokenExpired(token);

if (isExpired) {
  console.log('Token has expired, please refresh');
} else {
  console.log('Token is still valid');
}
```

### Get Token Expiration Date

```javascript
const expirationDate = jwt.getTokenExpiration(token);

if (expirationDate) {
  console.log('Token expires at:', expirationDate.toISOString());
  console.log('Time until expiration:', expirationDate - new Date());
}
```

## API Reference

### `generateAccessToken(payload, options)`

Generates an access token for user authentication.

**Parameters:**
- `payload` (Object) - User data to encode in the token
  - `userId` (string) - Required
  - `email` (string) - Recommended
  - `role` (string) - Optional
  - Additional custom fields as needed
- `options` (Object) - Optional
  - `expiresIn` (string) - Token expiration time (e.g., '7d', '1h', '30m')
  - Additional JWT sign options

**Returns:** `string` - Signed JWT token

**Throws:** Error if payload is invalid or JWT_SECRET is not configured

---

### `generateRefreshToken(payload, options)`

Generates a refresh token with longer expiration time.

**Parameters:**
- `payload` (Object) - Minimal user data (typically just userId)
- `options` (Object) - Optional JWT sign options

**Returns:** `string` - Signed JWT refresh token

**Throws:** Error if payload is invalid or JWT_SECRET is not configured

---

### `verifyToken(token, options)`

Verifies a JWT token and returns the decoded payload.

**Parameters:**
- `token` (string) - JWT token to verify (supports "Bearer " prefix)
- `options` (Object) - Optional JWT verify options

**Returns:** `Object` - Decoded token payload

**Throws:**
- `"Token has expired"` - Token expiration time has passed
- `"Invalid token"` - Token signature is invalid
- `"Token not yet active"` - Token nbf (not before) claim is in the future

---

### `decodeToken(token, options)`

Decodes a JWT token without verifying its signature.

**Parameters:**
- `token` (string) - JWT token to decode

**Returns:** `Object|null` - Decoded payload or null if invalid format

⚠️ **Warning:** This does not validate the token. Always use `verifyToken()` for secure operations.

---

### `isTokenExpired(token)`

Checks if a token has expired without throwing an error.

**Parameters:**
- `token` (string) - JWT token to check

**Returns:** `boolean` - True if expired, false otherwise

---

### `getTokenExpiration(token)`

Extracts the expiration date from a token.

**Parameters:**
- `token` (string) - JWT token

**Returns:** `Date|null` - Expiration date or null if not available

---

### `generateTokenPair(payload)`

Generates both access and refresh tokens for a user.

**Parameters:**
- `payload` (Object) - User data to include in access token

**Returns:** `Object`
```javascript
{
  accessToken: string,   // Full payload with configured expiration
  refreshToken: string   // Minimal payload (userId only) with longer expiration
}
```

## Error Handling

All functions include comprehensive error handling:

```javascript
try {
  const decoded = jwt.verifyToken(token);
  // Token is valid
} catch (error) {
  if (error.message === 'Token has expired') {
    // Handle expired token - request refresh
  } else if (error.message === 'Invalid token') {
    // Handle invalid token - request login
  } else if (error.message.includes('JWT_SECRET is not configured')) {
    // Configuration error
  } else {
    // Other errors
  }
}
```

## Security Best Practices

1. **Secret Key**: Use a strong, random secret key (minimum 32 characters)
2. **HTTPS Only**: Always transmit tokens over HTTPS in production
3. **Storage**: Store tokens securely (httpOnly cookies or secure storage)
4. **Expiration**: Use short expiration times for access tokens (1-15 minutes recommended)
5. **Refresh Tokens**: Use longer expiration for refresh tokens (7-30 days)
6. **Minimal Payload**: Keep refresh token payload minimal (userId only)
7. **Rotation**: Implement token rotation for refresh tokens
8. **Blacklisting**: Consider implementing token blacklisting for logout

## Example: Express Middleware

```javascript
const jwt = require('./utils/jwt');

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected data', userId: req.user.userId });
});
```

## Example: Token Refresh Flow

```javascript
const jwt = require('./utils/jwt');

// Refresh token endpoint
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verifyToken(refreshToken);

    // Get user from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new token pair
    const tokens = jwt.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

## Testing

Run the included tests to verify functionality:

```bash
JWT_SECRET='test-secret' node -e "const jwt = require('./utils/jwt'); console.log(jwt.generateAccessToken({ userId: '123' }));"
```

## License

Part of the Logistack project.
