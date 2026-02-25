# Load Detail Endpoint Test Guide

## Endpoint: GET /api/loads/:id

### Purpose
Retrieve detailed information for a specific load, including:
- All load details (origin, destination, weight, price, dates, status, etc.)
- Assigned trucker information (if assigned)
- Load history (status changes and notes)

### Authorization Rules
1. **Truckers**: Can only view loads assigned to them (403 if not assigned)
2. **Business users (Dispatchers/Admins)**: Can view all loads

---

## Test Cases

### Test 1: Business User Views Any Load
```bash
# Get JWT token for business user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@example.com","password":"password123"}'

# Use the token to get load details
curl -X GET http://localhost:3001/api/loads/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "businessId": 1,
    "truckerId": 2,
    "originLocation": "New York, NY",
    "destinationLocation": "Los Angeles, CA",
    "weight": "45000.00",
    "description": "Electronics shipment",
    "price": "5000.00",
    "pickupDate": "2026-02-20",
    "deliveryDate": "2026-02-25",
    "status": "assigned",
    "createdAt": "2026-02-15T12:00:00.000Z",
    "updatedAt": "2026-02-15T12:00:00.000Z",
    "trucker": {
      "id": 2,
      "email": "trucker@example.com",
      "phone": "+1234567890",
      "companyName": "ABC Trucking",
      "mcNumber": "MC123456",
      "dotNumber": "DOT789012"
    },
    "history": [
      {
        "id": 1,
        "oldStatus": "pending",
        "newStatus": "assigned",
        "notes": "Assigned to trucker",
        "changedAt": "2026-02-15T12:00:00.000Z",
        "changedBy": 1
      }
    ]
  }
}
```

---

### Test 2: Trucker Views Their Assigned Load
```bash
# Get JWT token for trucker
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trucker@example.com","password":"password123"}'

# Use the token to get their assigned load
curl -X GET http://localhost:3001/api/loads/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200 OK):** Same as Test 1

---

### Test 3: Trucker Attempts to View Non-Assigned Load (Authorization Check)
```bash
# Using the trucker token from Test 2
# Attempt to view a load not assigned to them
curl -X GET http://localhost:3001/api/loads/999 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to view this load"
}
```

---

### Test 4: Load Not Found
```bash
# Using any valid token
curl -X GET http://localhost:3001/api/loads/999999 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Load not found"
}
```

---

### Test 5: Invalid Load ID
```bash
curl -X GET http://localhost:3001/api/loads/abc \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Validation Error",
  "message": "Invalid load ID"
}
```

---

### Test 6: Missing Authentication Token
```bash
curl -X GET http://localhost:3001/api/loads/1
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## Implementation Details

### File Location
`apps/api/src/routes/loads.ts` (lines 256-445)

### Key Features Implemented
1. ✅ Authentication middleware via `preHandler: authenticate`
2. ✅ Authorization logic for truckers (can only view their assigned loads)
3. ✅ Authorization logic for business users (can view all loads)
4. ✅ Fetches complete load details from the database
5. ✅ Includes assigned trucker information (if trucker is assigned)
6. ✅ Includes load history (status changes and notes)
7. ✅ Comprehensive error handling (400, 401, 403, 404, 500)
8. ✅ OpenAPI/Swagger documentation with full schema

### Database Queries
1. **Load fetch**: Single query with load ID
2. **Trucker info**: Conditional query if `truckerId` is not null
3. **Load history**: Query ordered by `changedAt DESC`

### Response Structure
- `data.id` - Load ID
- `data.businessId` - Business owner ID
- `data.truckerId` - Assigned trucker ID (nullable)
- `data.originLocation` - Pickup location
- `data.destinationLocation` - Delivery location
- `data.weight` - Load weight in decimal
- `data.description` - Load description (nullable)
- `data.price` - Load price in decimal
- `data.pickupDate` - Scheduled pickup date
- `data.deliveryDate` - Scheduled delivery date
- `data.status` - Current status (pending, assigned, in_transit, delivered)
- `data.createdAt` - Creation timestamp
- `data.updatedAt` - Last update timestamp
- `data.trucker` - Trucker object with contact and company info (nullable)
- `data.history` - Array of status change records with notes

---

## Verification Checklist

- [x] Endpoint defined at GET /api/loads/:id
- [x] Authentication middleware applied
- [x] Authorization check for truckers (can only view assigned loads)
- [x] Authorization allows business users to view all loads
- [x] Returns complete load details
- [x] Includes assigned trucker information
- [x] Includes load history/notes
- [x] Handles invalid load IDs (400)
- [x] Handles missing authentication (401)
- [x] Handles unauthorized access (403)
- [x] Handles non-existent loads (404)
- [x] Handles server errors (500)
- [x] OpenAPI/Swagger documentation included
- [x] Registered in main API server (index.ts)

---

## Status: ✅ COMPLETE

The load detail retrieval endpoint is fully implemented and includes all required features:
- Detailed load information retrieval
- Assigned trucker information
- Load history with status changes and notes
- Proper authorization checks for truckers and business users
- Comprehensive error handling
- Full API documentation
