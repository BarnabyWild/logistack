# Logistack API - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Database created and migrations applied

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=logistack
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your-secret-key-change-this
   ```

3. **Apply database migrations**
   ```bash
   psql -d logistack -U your_username -f migrations/001_create_users_and_auth.sql
   psql -d logistack -U your_username -f migrations/003_create_loads_updated.sql
   psql -d logistack -U your_username -f migrations/004_create_load_history.sql
   ```

## Running the Server

**Start the server:**
```bash
npm start
```

Server will start on `http://localhost:3000`

**Verify server is running:**
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Testing the Load Creation Endpoint

### Step 1: Create a Business User

First, you need a business user in the database. You can insert one manually:

```sql
INSERT INTO users (user_type, email, password_hash, company_name, email_verified)
VALUES (
  'business',
  'dispatcher@example.com',
  '$2b$12$example_hash_here', -- Use bcrypt to hash a password
  'ABC Logistics',
  true
);
```

Or use bcrypt to hash a password:
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('password123', 12).then(hash => console.log(hash));
```

### Step 2: Get a JWT Token

Create a JWT token for testing:

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 1, email: 'dispatcher@example.com', userType: 'business' },
  'your-secret-key-change-this',
  { expiresIn: '1h' }
);
console.log(token);
```

### Step 3: Create a Load

Use the token to create a load:

```bash
curl -X POST http://localhost:3000/api/loads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "123 Main St, Chicago, IL 60601",
    "destination": "456 Oak Ave, Dallas, TX 75201",
    "weight": 42000,
    "price": 2500.00,
    "pickupDate": "2026-03-15",
    "deliveryDate": "2026-03-17",
    "description": "Steel beams - requires flatbed"
  }'
```

Expected response (201 Created):
```json
{
  "data": {
    "id": 1,
    "businessId": 1,
    "origin": "123 Main St, Chicago, IL 60601",
    "destination": "456 Oak Ave, Dallas, TX 75201",
    "weight": 42000,
    "price": 2500,
    "pickupDate": "2026-03-15",
    "deliveryDate": "2026-03-17",
    "description": "Steel beams - requires flatbed",
    "status": "pending",
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

## Using the Test Script

```bash
node test-load-endpoint.js YOUR_JWT_TOKEN
```

## Common Issues

### Issue: "Cannot find module"
**Solution:** Run `npm install` to install dependencies

### Issue: "Connection refused" to database
**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep logistack`

### Issue: "Invalid token"
**Solution:**
- Verify JWT_SECRET in `.env` matches the one used to create the token
- Check token hasn't expired
- Ensure token format is `Bearer <token>`

### Issue: "You do not have permission"
**Solution:**
- Verify the user in the JWT token has `userType: 'business'`
- Only business users can create loads

### Issue: "Validation failed"
**Solution:**
- Check all required fields are present: origin, destination, weight, price, pickupDate
- Ensure pickup date is not in the past
- Ensure delivery date is on or after pickup date

## Next Steps

1. Implement user registration and login endpoints
2. Add GET endpoints to list and retrieve loads
3. Implement load assignment functionality
4. Add real-time tracking features

## Documentation

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Implementation Details:** See `LOAD_ENDPOINT_IMPLEMENTATION.md`
- **Architecture:** See `ARCHITECTURE.md`

## Support

For issues or questions, refer to the documentation files or check the implementation code in:
- `server.js` - Main server
- `routes/loads.js` - Routes
- `controllers/loadController.js` - Business logic
- `middleware/` - Authentication, authorization, validation
