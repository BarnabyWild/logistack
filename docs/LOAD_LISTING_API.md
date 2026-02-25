# Load Listing API Documentation

## Endpoint

**GET** `/api/loads`

List loads with pagination and filtering support.

## Authentication

Requires a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Authorization

- **Truckers**: Can only see loads assigned to them (where `truckerId` equals their user ID)
- **Business users**: Can only see loads they created (where `businessId` equals their user ID)

## Query Parameters

All query parameters are optional.

### Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (minimum: 1) |
| `limit` | integer | 10 | Items per page (minimum: 1, maximum: 100) |

### Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by load status. Valid values: `pending`, `assigned`, `in_transit`, `delivered` |
| `origin` | string | Filter by origin location (case-insensitive partial match) |
| `destination` | string | Filter by destination location (case-insensitive partial match) |
| `pickupDateFrom` | date | Filter loads with pickup date on or after this date (YYYY-MM-DD format) |
| `pickupDateTo` | date | Filter loads with pickup date on or before this date (YYYY-MM-DD format) |
| `deliveryDateFrom` | date | Filter loads with delivery date on or after this date (YYYY-MM-DD format) |
| `deliveryDateTo` | date | Filter loads with delivery date on or before this date (YYYY-MM-DD format) |
| `truckerId` | integer | Filter by assigned trucker ID (business users only) |

## Example Requests

### Basic Request (First Page)

```bash
GET /api/loads
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### With Pagination

```bash
GET /api/loads?page=2&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Filter by Status

```bash
GET /api/loads?status=pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Filter by Location

```bash
GET /api/loads?origin=Chicago&destination=Dallas
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Filter by Date Range

```bash
GET /api/loads?pickupDateFrom=2026-02-20&pickupDateTo=2026-02-28
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Business User - Filter by Trucker

```bash
GET /api/loads?truckerId=42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Combined Filters

```bash
GET /api/loads?status=in_transit&pickupDateFrom=2026-02-01&limit=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "businessId": 5,
      "truckerId": 12,
      "origin": "Chicago, IL",
      "destination": "Dallas, TX",
      "weight": 25000.00,
      "price": 3500.00,
      "pickupDate": "2026-02-20",
      "deliveryDate": "2026-02-22",
      "description": "Electronics shipment - handle with care",
      "status": "assigned",
      "createdAt": "2026-02-15T10:30:00.000Z",
      "updatedAt": "2026-02-15T14:20:00.000Z"
    },
    {
      "id": 2,
      "businessId": 5,
      "truckerId": null,
      "origin": "Los Angeles, CA",
      "destination": "Phoenix, AZ",
      "weight": 18000.00,
      "price": 2200.00,
      "pickupDate": "2026-02-21",
      "deliveryDate": "2026-02-23",
      "description": null,
      "status": "pending",
      "createdAt": "2026-02-15T09:15:00.000Z",
      "updatedAt": "2026-02-15T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "meta": {
    "timestamp": "2026-02-15T16:45:00.000Z",
    "version": "v1"
  }
}
```

### Empty Results (200 OK)

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "meta": {
    "timestamp": "2026-02-15T16:45:00.000Z",
    "version": "v1"
  }
}
```

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "error": {
    "message": "Validation failed",
    "status": 400,
    "details": [
      {
        "field": "page",
        "message": "Page must be a positive integer"
      },
      {
        "field": "status",
        "message": "Status must be one of: pending, assigned, in_transit, delivered"
      }
    ]
  }
}
```

### 401 Unauthorized - Missing Token

```json
{
  "error": {
    "message": "No authorization token provided",
    "status": 401
  }
}
```

### 401 Unauthorized - Invalid Token

```json
{
  "error": {
    "message": "Invalid token",
    "status": 401
  }
}
```

### 403 Forbidden - Insufficient Permissions

```json
{
  "error": {
    "message": "You do not have permission to perform this action",
    "status": 403
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "message": "Failed to fetch loads",
    "status": 500
  }
}
```

## Implementation Details

### Authorization Logic

The endpoint implements row-level security:

1. **Trucker users**: Automatically filtered to show only loads where `truckerId` matches their user ID
2. **Business users**: Automatically filtered to show only loads where `businessId` matches their user ID

This ensures users can only see loads they're authorized to access, regardless of filter parameters provided.

### Date Filtering

Date filters are inclusive:
- `pickupDateFrom`: Includes loads with pickup date >= specified date
- `pickupDateTo`: Includes loads with pickup date <= specified date
- Same logic applies to delivery date filters

### Location Filtering

Location filters use case-insensitive partial matching:
- Searching for "chicago" will match "Chicago, IL", "Chicago Heights", etc.
- Searching for "IL" will match any location containing "IL"

### Pagination

- Results are ordered by creation date (newest first)
- Default page size is 10 items
- Maximum page size is 100 items
- The `pagination` object in the response provides all necessary metadata for implementing pagination UI

### Performance Considerations

- All filters are applied at the database level for optimal performance
- Proper indexes should be created on frequently filtered columns (status, pickupDate, deliveryDate, truckerId, businessId)
- Date range queries use efficient comparison operators

## Security

- JWT authentication required for all requests
- Row-level authorization enforced at the controller level
- Input validation prevents SQL injection and invalid data
- Business users cannot see other businesses' loads
- Truckers cannot see loads not assigned to them
- Trucker filter is only available to business users
