# Loads API Endpoint Documentation

## Overview
The `/api/loads` endpoint provides functionality to list and retrieve freight loads with comprehensive filtering, pagination, and role-based authorization.

## Endpoints

### 1. GET /api/loads
List loads with optional filters and pagination.

#### Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

#### Authorization Rules
- **Truckers**: Can only see loads assigned to them (filtered by `truckerId`)
- **Business Users**: Can see all loads in the system

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by load status | `pending`, `assigned`, `in_transit`, `delivered` |
| `origin` | string | No | Filter by origin location (partial, case-insensitive match) | `Chicago` |
| `destination` | string | No | Filter by destination location (partial, case-insensitive match) | `Los Angeles` |
| `pickupDateFrom` | string | No | Filter by pickup date (from) in YYYY-MM-DD format | `2026-02-15` |
| `pickupDateTo` | string | No | Filter by pickup date (to) in YYYY-MM-DD format | `2026-02-28` |
| `deliveryDateFrom` | string | No | Filter by delivery date (from) in YYYY-MM-DD format | `2026-03-01` |
| `deliveryDateTo` | string | No | Filter by delivery date (to) in YYYY-MM-DD format | `2026-03-15` |
| `truckerId` | string | No | Filter by assigned trucker ID (business users only) | `123` |
| `businessId` | string | No | Filter by business ID (business users only) | `456` |
| `limit` | string | No | Number of results per page (default: 50) | `25` |
| `offset` | string | No | Number of results to skip (default: 0) | `0` |

#### Response Format

**Success (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "businessId": 10,
      "truckerId": 5,
      "originLocation": "Chicago, IL",
      "destinationLocation": "Los Angeles, CA",
      "weight": "25000.00",
      "description": "Freight shipment",
      "price": "3500.00",
      "pickupDate": "2026-02-20",
      "deliveryDate": "2026-02-25",
      "status": "assigned",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Validation Error (400 Bad Request)**
```json
{
  "error": "Validation Error",
  "message": "Date must be in YYYY-MM-DD format",
  "errors": [...]
}
```

**Unauthorized (401 Unauthorized)**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### Example Requests

**List all loads (business user)**
```bash
curl -X GET "http://localhost:3001/api/loads" \
  -H "Authorization: Bearer <jwt_token>"
```

**Filter by status**
```bash
curl -X GET "http://localhost:3001/api/loads?status=assigned" \
  -H "Authorization: Bearer <jwt_token>"
```

**Filter by origin and destination**
```bash
curl -X GET "http://localhost:3001/api/loads?origin=Chicago&destination=Los Angeles" \
  -H "Authorization: Bearer <jwt_token>"
```

**Filter by date range**
```bash
curl -X GET "http://localhost:3001/api/loads?pickupDateFrom=2026-02-15&pickupDateTo=2026-02-28" \
  -H "Authorization: Bearer <jwt_token>"
```

**Pagination**
```bash
curl -X GET "http://localhost:3001/api/loads?limit=25&offset=0" \
  -H "Authorization: Bearer <jwt_token>"
```

**Combined filters**
```bash
curl -X GET "http://localhost:3001/api/loads?status=assigned&origin=Chicago&pickupDateFrom=2026-02-15&limit=10" \
  -H "Authorization: Bearer <jwt_token>"
```

---

### 2. GET /api/loads/:id
Get a single load by ID.

#### Authentication
Requires valid JWT token in Authorization header.

#### Authorization Rules
- **Truckers**: Can only view loads assigned to them
- **Business Users**: Can view any load

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Load ID |

#### Response Format

**Success (200 OK)**
```json
{
  "data": {
    "id": 1,
    "businessId": 10,
    "truckerId": 5,
    "originLocation": "Chicago, IL",
    "destinationLocation": "Los Angeles, CA",
    "weight": "25000.00",
    "description": "Freight shipment",
    "price": "3500.00",
    "pickupDate": "2026-02-20",
    "deliveryDate": "2026-02-25",
    "status": "assigned",
    "createdAt": "2026-02-15T10:00:00Z",
    "updatedAt": "2026-02-15T10:00:00Z",
    "trucker": {
      "id": 5,
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
        "changedAt": "2026-02-15T10:00:00Z",
        "changedBy": 10
      }
    ]
  }
}
```

**Validation Error (400 Bad Request)**
```json
{
  "error": "Validation Error",
  "message": "Invalid load ID"
}
```

**Unauthorized (401 Unauthorized)**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Forbidden (403 Forbidden)**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to view this load"
}
```

**Not Found (404 Not Found)**
```json
{
  "error": "Not Found",
  "message": "Load not found"
}
```

#### Example Request

```bash
curl -X GET "http://localhost:3001/api/loads/1" \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Implementation Details

### Files Created/Modified

1. **apps/api/src/routes/loads.ts** (NEW)
   - Contains the load listing and detail endpoints
   - Implements role-based authorization
   - Supports comprehensive filtering and pagination

2. **apps/api/src/utils/validation.ts** (MODIFIED)
   - Added `loadFiltersSchema` for query parameter validation
   - Added `LoadFiltersInput` type export

3. **apps/api/src/index.ts** (MODIFIED)
   - Imported `loadsRoutes`
   - Registered loads routes at `/api/loads` prefix

### Database Schema

The endpoint uses the existing `loads` table from `@logistack/db`:

```typescript
{
  id: number;
  businessId: number;
  truckerId: number | null;
  originLocation: string;
  destinationLocation: string;
  weight: string;
  description: string | null;
  price: string;
  pickupDate: string;
  deliveryDate: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  createdAt: string;
  updatedAt: string;
}
```

### Security Features

1. **JWT Authentication**: All endpoints require valid authentication
2. **Role-Based Authorization**:
   - Truckers can only access their assigned loads
   - Business users can access all loads
3. **Input Validation**: All query parameters are validated using Zod schemas
4. **SQL Injection Prevention**: Uses Drizzle ORM parameterized queries

### Performance Considerations

1. **Pagination**: Default limit of 50 results per page
2. **Indexed Queries**: Leverages database indexes on:
   - `truckerId` for trucker filtering
   - `status` for status filtering
   - `pickupDate` and `deliveryDate` for date range queries
3. **Count Query**: Separate count query for accurate pagination totals

## Testing

To test the endpoints:

1. Start the API server:
   ```bash
   npm run dev
   ```

2. Authenticate to get a JWT token:
   ```bash
   curl -X POST "http://localhost:3001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password"}'
   ```

3. Use the token to access the loads endpoints as shown in the examples above.
