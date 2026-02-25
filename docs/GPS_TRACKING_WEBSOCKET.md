# GPS Tracking WebSocket API Documentation

## Overview

The GPS Tracking WebSocket API provides real-time location tracking for loads in transit. Truckers can send GPS coordinates while delivering loads, and businesses can track their shipments in real-time.

## WebSocket Endpoint

```
ws://localhost:3001/api/gps/track
```

## Connection Flow

1. Client establishes WebSocket connection
2. Server sends welcome message
3. Client sends `init` message with JWT token and load ID
4. Server authenticates and authorizes the user
5. Server sends `authenticated` confirmation
6. Client sends `location_update` messages periodically
7. Server validates, stores, and acknowledges each location update

## Message Types

### 1. Client Messages

#### Init Message
Sent immediately after connection to authenticate.

```json
{
  "type": "init",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "loadId": 123
}
```

**Fields:**
- `type`: Must be `"init"`
- `token`: Valid JWT token (must be a trucker account)
- `loadId`: ID of the load being tracked

#### Location Update Message
Sent periodically to update GPS location.

```json
{
  "type": "location_update",
  "loadId": 123,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "altitude": 150.5,
  "speed": 65.0,
  "heading": 270.5,
  "accuracy": 8.2,
  "deviceId": "device-12345",
  "recordedAt": "2026-02-15T12:30:00.000Z"
}
```

**Fields:**
- `type`: Must be `"location_update"`
- `loadId`: ID of the load (must match authenticated session)
- `latitude`: Latitude in degrees (-90 to 90)
- `longitude`: Longitude in degrees (-180 to 180)
- `altitude`: Altitude in meters (optional)
- `speed`: Speed in km/h (optional, must be >= 0)
- `heading`: Direction in degrees (optional, 0-360)
- `accuracy`: GPS accuracy in meters (optional, must be >= 0)
- `deviceId`: Device identifier (optional)
- `recordedAt`: ISO 8601 timestamp when location was recorded

#### Ping Message
Heartbeat to keep connection alive.

```json
{
  "type": "ping"
}
```

### 2. Server Messages

#### Connected Message
Sent immediately after connection is established.

```json
{
  "type": "connected",
  "message": "Connected to GPS tracking server. Please send init message with token and loadId."
}
```

#### Authenticated Message
Sent after successful authentication.

```json
{
  "type": "authenticated",
  "message": "Authentication successful. You can now send location updates.",
  "userId": 42,
  "loadId": 123
}
```

#### Location Received Message
Acknowledgment for each location update.

```json
{
  "type": "location_received",
  "message": "Location update recorded successfully",
  "timestamp": "2026-02-15T12:30:01.234Z"
}
```

#### Pong Message
Response to ping messages.

```json
{
  "type": "pong",
  "timestamp": "2026-02-15T12:30:01.234Z"
}
```

#### Error Message
Sent when an error occurs.

```json
{
  "type": "error",
  "message": "Invalid message format",
  "errors": [...]
}
```

**Common Error Messages:**
- "Only truckers can send GPS location updates" - Non-trucker trying to connect
- "Invalid authentication token" - JWT verification failed
- "Load ID mismatch" - Location update for wrong load
- "Please authenticate first by sending an init message" - Message sent before authentication
- "Invalid message format" - Validation error (includes Zod error details)
- "Unknown message type" - Unrecognized message type

## REST API Endpoints

### Get Latest Location

```http
GET /api/gps/location/:loadId
```

Returns the most recent GPS location for a load.

**Response:**
```json
{
  "location": {
    "id": 1,
    "loadId": 123,
    "truckerId": 42,
    "latitude": "34.0522000",
    "longitude": "-118.2437000",
    "altitude": "150.50",
    "speed": "65.00",
    "heading": "270.50",
    "accuracy": "8.20",
    "deviceId": "device-12345",
    "recordedAt": "2026-02-15T12:30:00.000Z",
    "createdAt": "2026-02-15T12:30:01.234Z"
  }
}
```

### Get Location History

```http
GET /api/gps/history/:loadId?limit=100
```

Returns historical GPS locations for a load.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100, max: 1000)

**Response:**
```json
{
  "loadId": 123,
  "count": 50,
  "locations": [
    {
      "id": 50,
      "loadId": 123,
      "truckerId": 42,
      "latitude": "34.0522000",
      "longitude": "-118.2437000",
      "recordedAt": "2026-02-15T12:30:00.000Z",
      ...
    },
    ...
  ]
}
```

### Get Active Tracking Sessions

```http
GET /api/gps/active
```

Returns information about active WebSocket connections.

**Response:**
```json
{
  "activeSessions": [
    {
      "loadId": 123,
      "connectionCount": 1,
      "connectedTruckers": [42]
    }
  ],
  "totalConnections": 1
}
```

## Database Schema

### gps_locations table

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| load_id | integer | Foreign key to loads table |
| trucker_id | integer | Foreign key to users table |
| latitude | decimal(10,7) | Latitude in degrees |
| longitude | decimal(10,7) | Longitude in degrees |
| altitude | decimal(10,2) | Altitude in meters (optional) |
| speed | decimal(6,2) | Speed in km/h (optional) |
| heading | decimal(5,2) | Direction in degrees (optional) |
| accuracy | decimal(6,2) | GPS accuracy in meters (optional) |
| device_id | varchar(255) | Device identifier (optional) |
| recorded_at | timestamp | When location was recorded |
| created_at | timestamp | When record was created |

## Example Usage

### JavaScript/Node.js

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/api/gps/track');

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'init',
    token: 'your-jwt-token',
    loadId: 123
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'authenticated') {
    // Start sending location updates
    setInterval(() => {
      ws.send(JSON.stringify({
        type: 'location_update',
        loadId: 123,
        latitude: 34.0522,
        longitude: -118.2437,
        speed: 65.0,
        recordedAt: new Date().toISOString()
      }));
    }, 5000); // Every 5 seconds
  }
});
```

### Browser

```javascript
const ws = new WebSocket('ws://localhost:3001/api/gps/track');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'init',
    token: localStorage.getItem('jwt_token'),
    loadId: 123
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send location update
navigator.geolocation.watchPosition((position) => {
  ws.send(JSON.stringify({
    type: 'location_update',
    loadId: 123,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude,
    speed: position.coords.speed,
    heading: position.coords.heading,
    accuracy: position.coords.accuracy,
    recordedAt: new Date().toISOString()
  }));
});
```

## Best Practices

1. **Authentication**: Always send the `init` message immediately after connecting
2. **Update Frequency**: Send location updates every 5-30 seconds depending on accuracy needs
3. **Heartbeat**: Send ping messages every 30 seconds to keep connection alive
4. **Error Handling**: Always handle error messages and reconnect if needed
5. **Cleanup**: Close the connection gracefully when tracking ends
6. **Data Validation**: Ensure GPS coordinates are valid before sending
7. **Device ID**: Include a unique device identifier for debugging

## Security

- Only authenticated truckers can send GPS updates
- JWT tokens are required for all connections
- Each trucker can only send updates for loads they're assigned to
- All messages are validated using Zod schemas
- Maximum payload size is 1MB

## Troubleshooting

### Connection Refused
- Ensure the API server is running on port 3001
- Check firewall settings

### Authentication Failed
- Verify JWT token is valid and not expired
- Ensure the user is a trucker account
- Check the token is sent in the `init` message

### Load ID Mismatch
- Verify the load ID in location updates matches the authenticated session
- Each WebSocket connection is tied to a single load

### Location Not Saving
- Check latitude is between -90 and 90
- Check longitude is between -180 and 180
- Verify the `recordedAt` timestamp is in ISO 8601 format
- Check server logs for database errors

## Future Enhancements

- [ ] Broadcast location updates to subscribed clients (businesses tracking loads)
- [ ] Add geofencing alerts
- [ ] Implement route deviation detection
- [ ] Add ETA calculations
- [ ] Support multiple simultaneous load tracking
- [ ] Add location update history compression
- [ ] Implement offline queue for location updates
