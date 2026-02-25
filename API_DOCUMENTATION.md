# Logistack API Documentation

## Load Management Endpoints

### Create Load

Creates a new load posting. Only business users (dispatchers/admins) can create loads.

**Endpoint:** `POST /api/loads`

**Authentication:** Required (JWT Bearer token)

**Authorization:** Business users only

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "origin": "123 Main St, Chicago, IL 60601",
  "destination": "456 Oak Ave, Dallas, TX 75201",
  "weight": 42000,
  "price": 2500.00,
  "pickupDate": "2026-03-01",
  "deliveryDate": "2026-03-03",
  "description": "Steel beams - requires flatbed trailer"
}
```

#### Field Specifications

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| origin | string | Yes | 3-500 characters | Pickup location address |
| destination | string | Yes | 3-500 characters | Delivery location address |
| weight | number | Yes | > 0 | Load weight in pounds |
| price | number | Yes | >= 0 | Payment amount in USD |
| pickupDate | string | Yes | YYYY-MM-DD format, not in past | Scheduled pickup date |
| deliveryDate | string | No | YYYY-MM-DD format, >= pickupDate | Scheduled delivery date (defaults to 2 days after pickup) |
| description | string | No | Max 2000 characters | Load details and special instructions |

#### Success Response (201 Created)
```json
{
  "data": {
    "id": 1,
    "businessId": 5,
    "origin": "123 Main St, Chicago, IL 60601",
    "destination": "456 Oak Ave, Dallas, TX 75201",
    "weight": 42000,
    "price": 2500.00,
    "pickupDate": "2026-03-01",
    "deliveryDate": "2026-03-03",
    "description": "Steel beams - requires flatbed trailer",
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

#### Error Responses

**400 Bad Request** - Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "status": 400,
    "details": [
      {
        "field": "origin",
        "message": "Origin location is required"
      }
    ]
  }
}
```

**401 Unauthorized** - Missing or invalid authentication token
```json
{
  "error": {
    "message": "No authorization token provided",
    "status": 401
  }
}
```

**403 Forbidden** - User is not authorized (not a business user)
```json
{
  "error": {
    "message": "You do not have permission to perform this action",
    "status": 403
  }
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": {
    "message": "Failed to create load",
    "status": 500
  }
}
```

#### Example cURL Request
```bash
curl -X POST http://localhost:3000/api/loads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "123 Main St, Chicago, IL 60601",
    "destination": "456 Oak Ave, Dallas, TX 75201",
    "weight": 42000,
    "price": 2500.00,
    "pickupDate": "2026-03-01",
    "deliveryDate": "2026-03-03",
    "description": "Steel beams - requires flatbed trailer"
  }'
```

## Authentication

The API uses JWT (JSON Web Token) authentication. To access protected endpoints:

1. Obtain a JWT token by logging in (authentication endpoint not yet implemented)
2. Include the token in the Authorization header: `Authorization: Bearer <token>`
3. The token contains user information including:
   - `id`: User ID
   - `email`: User email
   - `userType`: User type ('business' or 'trucker')

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource or endpoint not found
- `500 Internal Server Error` - Server error

## Load Status Values

Loads progress through the following statuses:

- `pending` - Load posted, awaiting trucker assignment
- `assigned` - Load assigned to a trucker
- `in_transit` - Load picked up and in transit
- `delivered` - Load delivered successfully
