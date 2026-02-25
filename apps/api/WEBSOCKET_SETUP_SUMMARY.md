# WebSocket GPS Tracking Setup Summary

## What Was Implemented

Successfully set up a WebSocket server for real-time GPS tracking with the following components:

### 1. Dependencies Installed
- `@fastify/websocket` v10.0.1 - Adds WebSocket support to Fastify

### 2. Database Schema
Created `packages/db/src/schema/gps-tracking.ts` with the `gps_locations` table:
- Stores GPS coordinates (latitude, longitude)
- Tracks additional metadata (altitude, speed, heading, accuracy)
- Links to loads and truckers via foreign keys
- Timestamps for when location was recorded and when record was created

### 3. Server Configuration
Updated `apps/api/src/index.ts`:
- Imported `@fastify/websocket` plugin
- Registered WebSocket support with 1MB max payload
- Added GPS tracking routes with `/api/gps` prefix

### 4. WebSocket Route (`apps/api/src/routes/gps-tracking.ts`)

#### WebSocket Endpoint: `ws://localhost:3001/api/gps/track`

**Features:**
- **Authentication**: JWT-based authentication for truckers only
- **Connection Management**: Tracks active connections per load
- **Message Validation**: Zod schemas for all message types
- **Location Storage**: Saves GPS coordinates to database
- **Heartbeat Support**: Ping/pong messages to keep connection alive

**Message Flow:**
1. Client connects
2. Server sends welcome message
3. Client sends `init` message with JWT token and load ID
4. Server authenticates and sends `authenticated` confirmation
5. Client sends `location_update` messages periodically
6. Server validates, stores, and acknowledges each update

#### REST API Endpoints

1. **GET /api/gps/location/:loadId** - Get latest location for a load
2. **GET /api/gps/history/:loadId?limit=100** - Get location history
3. **GET /api/gps/active** - Get active WebSocket connections

### 5. Documentation
Created `docs/GPS_TRACKING_WEBSOCKET.md` with:
- Complete API documentation
- Message type specifications
- Code examples (JavaScript/Node.js and Browser)
- Best practices and security considerations
- Troubleshooting guide

### 6. Test Client
Created `apps/api/test-websocket-client.js`:
- Example WebSocket client implementation
- Simulates GPS tracking along a route
- Demonstrates authentication and location updates
- Includes heartbeat mechanism

## Message Types

### Client → Server

#### 1. Init Message
```json
{
  "type": "init",
  "token": "JWT_TOKEN",
  "loadId": 123
}
```

#### 2. Location Update
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
  "deviceId": "device-id",
  "recordedAt": "2026-02-15T12:30:00.000Z"
}
```

#### 3. Ping
```json
{
  "type": "ping"
}
```

### Server → Client

#### 1. Connected
```json
{
  "type": "connected",
  "message": "Connected to GPS tracking server..."
}
```

#### 2. Authenticated
```json
{
  "type": "authenticated",
  "message": "Authentication successful...",
  "userId": 42,
  "loadId": 123
}
```

#### 3. Location Received
```json
{
  "type": "location_received",
  "message": "Location update recorded successfully",
  "timestamp": "2026-02-15T12:30:01.234Z"
}
```

#### 4. Pong
```json
{
  "type": "pong",
  "timestamp": "2026-02-15T12:30:01.234Z"
}
```

#### 5. Error
```json
{
  "type": "error",
  "message": "Error description",
  "errors": []
}
```

## Security Features

- **Authentication Required**: Only authenticated truckers can send GPS updates
- **JWT Validation**: Tokens are verified before allowing updates
- **User Type Check**: Only "trucker" accounts can send location data
- **Load ID Validation**: Updates must match the authenticated session's load
- **Message Validation**: All messages validated with Zod schemas
- **Payload Limit**: Maximum 1MB per message

## Connection Management

The server maintains a map of active connections:
- Key: Load ID
- Value: Set of connection objects (socket, userId, loadId)
- Automatically cleaned up on disconnect
- Enables future broadcast functionality

## Database Schema

```sql
CREATE TABLE gps_locations (
  id SERIAL PRIMARY KEY,
  load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  trucker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  altitude DECIMAL(10,2),
  speed DECIMAL(6,2),
  heading DECIMAL(5,2),
  accuracy DECIMAL(6,2),
  device_id VARCHAR(255),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Next Steps (Future Enhancements)

1. **Run Database Migration**
   ```bash
   cd packages/db
   npm run db:push
   ```

2. **Test the WebSocket Connection**
   - Update `test-websocket-client.js` with valid JWT token
   - Run: `node apps/api/test-websocket-client.js`

3. **Implement Broadcasting** (Future)
   - Allow businesses to subscribe to load tracking
   - Broadcast location updates to subscribed clients

4. **Add Geofencing** (Future)
   - Define geographic boundaries
   - Alert when truck enters/exits zones

5. **ETA Calculations** (Future)
   - Calculate estimated time of arrival
   - Update based on current location and speed

6. **Route Tracking** (Future)
   - Store planned routes
   - Detect route deviations
   - Provide route correction suggestions

## Usage Example

```javascript
const WebSocket = require('ws');

// Connect
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
        recordedAt: new Date().toISOString()
      }));
    }, 5000);
  }
});
```

## Files Created/Modified

### Created:
1. `packages/db/src/schema/gps-tracking.ts` - Database schema
2. `apps/api/src/routes/gps-tracking.ts` - WebSocket route handler
3. `apps/api/test-websocket-client.js` - Test client
4. `docs/GPS_TRACKING_WEBSOCKET.md` - Complete documentation
5. `apps/api/WEBSOCKET_SETUP_SUMMARY.md` - This file

### Modified:
1. `packages/db/src/schema/index.ts` - Export GPS tracking schema
2. `apps/api/package.json` - Added @fastify/websocket dependency
3. `apps/api/src/index.ts` - Registered WebSocket plugin and routes

## Testing Checklist

- [ ] Database migration completed
- [ ] Server starts without errors
- [ ] WebSocket connection establishes
- [ ] Authentication works correctly
- [ ] Location updates are stored in database
- [ ] Error handling works as expected
- [ ] Heartbeat (ping/pong) functions
- [ ] Connection cleanup on disconnect
- [ ] REST endpoints return correct data

## Known Limitations

1. **Load Assignment Verification**: Currently not checking if trucker is actually assigned to the load (TODO in code)
2. **Broadcasting**: Location updates not yet broadcast to businesses tracking the load
3. **Offline Support**: No queue for location updates when connection is lost
4. **Compression**: Location history not compressed for efficiency

These limitations are marked in the code and can be addressed in future iterations.
