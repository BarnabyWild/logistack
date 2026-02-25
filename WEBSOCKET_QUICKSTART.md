# WebSocket GPS Tracking - Quick Start Guide

## Overview
Real-time GPS tracking has been added to Logistack, allowing truckers to send location updates via WebSocket connections.

## 🚀 Quick Start

### 1. Run Database Migration
Before using the GPS tracking feature, update your database:

```bash
cd packages/db
npm run db:push
```

### 2. Start the API Server
```bash
cd apps/api
npm run dev
```

Server will be available at: `http://localhost:3001`
WebSocket endpoint: `ws://localhost:3001/api/gps/track`

### 3. Test the Connection

#### Option A: Use the Test Client
```bash
# Edit test-websocket-client.js and add your JWT token
node apps/api/test-websocket-client.js
```

#### Option B: Use Browser Console
```javascript
const ws = new WebSocket('ws://localhost:3001/api/gps/track');

ws.onopen = () => {
  // Send init message
  ws.send(JSON.stringify({
    type: 'init',
    token: 'YOUR_JWT_TOKEN',
    loadId: 1
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

// After authenticated, send location
ws.send(JSON.stringify({
  type: 'location_update',
  loadId: 1,
  latitude: 34.0522,
  longitude: -118.2437,
  recordedAt: new Date().toISOString()
}));
```

## 📡 WebSocket API

### Connection URL
```
ws://localhost:3001/api/gps/track
```

### Authentication Flow
1. Connect to WebSocket
2. Send `init` message with JWT token
3. Receive `authenticated` confirmation
4. Start sending `location_update` messages

### Message Examples

**Initialize Connection:**
```json
{
  "type": "init",
  "token": "your-jwt-token",
  "loadId": 123
}
```

**Send Location:**
```json
{
  "type": "location_update",
  "loadId": 123,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "speed": 65.0,
  "heading": 270.0,
  "recordedAt": "2026-02-15T12:30:00.000Z"
}
```

**Heartbeat:**
```json
{
  "type": "ping"
}
```

## 🔌 REST API Endpoints

### Get Latest Location
```bash
curl http://localhost:3001/api/gps/location/123
```

### Get Location History
```bash
curl http://localhost:3001/api/gps/history/123?limit=50
```

### Get Active Connections
```bash
curl http://localhost:3001/api/gps/active
```

## 📱 Mobile App Integration

### React Native Example
```javascript
import { useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';

function GPSTracker({ token, loadId }) {
  const ws = useRef(null);

  useEffect(() => {
    // Connect
    ws.current = new WebSocket('ws://localhost:3001/api/gps/track');

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        type: 'init',
        token,
        loadId
      }));
    };

    ws.current.onmessage = (e) => {
      const message = JSON.parse(e.data);
      if (message.type === 'authenticated') {
        startTracking();
      }
    };

    return () => ws.current?.close();
  }, []);

  const startTracking = () => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        ws.current?.send(JSON.stringify({
          type: 'location_update',
          loadId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
          recordedAt: new Date().toISOString()
        }));
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => Geolocation.clearWatch(watchId);
  };

  return null;
}
```

## 🔒 Security

- **Authentication Required**: Only truckers can send GPS updates
- **JWT Validation**: All connections must provide valid token
- **Load Validation**: Updates must match authenticated load ID
- **Message Validation**: All messages validated with Zod schemas

## 📊 Data Stored

Each location update stores:
- GPS coordinates (latitude, longitude)
- Optional metadata (altitude, speed, heading, accuracy)
- Device ID
- Trucker ID and Load ID
- Timestamp (when recorded & when stored)

## ⚡ Best Practices

1. **Update Frequency**: Send updates every 5-30 seconds
2. **Heartbeat**: Send ping every 30 seconds
3. **Error Handling**: Always handle connection errors and reconnect
4. **Battery Optimization**: Adjust frequency based on battery level
5. **Offline Queue**: Cache updates when connection is lost

## 🐛 Troubleshooting

### Connection Refused
- Check server is running on port 3001
- Verify WebSocket URL is correct

### Authentication Failed
- Ensure JWT token is valid and not expired
- Verify user account is type "trucker"
- Check token is sent in init message

### Location Not Saving
- Verify latitude is between -90 and 90
- Verify longitude is between -180 and 180
- Check `recordedAt` is valid ISO 8601 format
- Review server logs for database errors

## 📚 Documentation

- **Complete API Docs**: `docs/GPS_TRACKING_WEBSOCKET.md`
- **Setup Summary**: `apps/api/WEBSOCKET_SETUP_SUMMARY.md`
- **Test Client**: `apps/api/test-websocket-client.js`

## 🎯 Next Steps

1. Run database migration
2. Test WebSocket connection
3. Integrate with mobile app
4. Implement business tracking view
5. Add geofencing alerts (future)
6. Add ETA calculations (future)

## 💡 Tips

- Use the test client to verify setup
- Monitor active connections via `/api/gps/active`
- Check location history via `/api/gps/history/:loadId`
- Review server logs for debugging

---

For questions or issues, refer to the complete documentation in `docs/GPS_TRACKING_WEBSOCKET.md`
