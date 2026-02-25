/**
 * Test WebSocket Client for GPS Tracking
 *
 * This script tests the GPS tracking WebSocket connection.
 * Run: node test-websocket-client.js
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://localhost:3001/api/gps/track';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a valid trucker JWT token
const LOAD_ID = 1; // Replace with a valid load ID

// Simulate GPS coordinates (moving along a route)
const route = [
  { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  { lat: 34.0622, lng: -118.2337 },
  { lat: 34.0722, lng: -118.2237 },
  { lat: 34.0822, lng: -118.2137 },
  { lat: 34.0922, lng: -118.2037 }, // Slightly north
];

let currentPosition = 0;

// Create WebSocket connection
console.log('Connecting to WebSocket server...');
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ Connected to WebSocket server');

  // Send initialization message
  const initMessage = {
    type: 'init',
    token: JWT_TOKEN,
    loadId: LOAD_ID,
  };

  console.log('Sending init message...');
  ws.send(JSON.stringify(initMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('Received:', message);

    // After authentication, start sending location updates
    if (message.type === 'authenticated') {
      console.log('✓ Authenticated successfully');
      console.log('Starting to send location updates...');

      // Send location updates every 5 seconds
      const intervalId = setInterval(() => {
        const location = route[currentPosition];
        currentPosition = (currentPosition + 1) % route.length;

        const locationUpdate = {
          type: 'location_update',
          loadId: LOAD_ID,
          latitude: location.lat,
          longitude: location.lng,
          altitude: 100 + Math.random() * 50, // Random altitude
          speed: 60 + Math.random() * 20, // Random speed 60-80 km/h
          heading: Math.random() * 360, // Random heading
          accuracy: 5 + Math.random() * 5, // Random accuracy 5-10m
          deviceId: 'test-device-001',
          recordedAt: new Date().toISOString(),
        };

        console.log(`Sending location update: lat=${location.lat}, lng=${location.lng}`);
        ws.send(JSON.stringify(locationUpdate));
      }, 5000);

      // Send heartbeat every 30 seconds
      const heartbeatId = setInterval(() => {
        console.log('Sending heartbeat...');
        ws.send(JSON.stringify({ type: 'ping' }));
      }, 30000);

      // Clean up on close
      ws.on('close', () => {
        clearInterval(intervalId);
        clearInterval(heartbeatId);
      });
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('✗ Disconnected from WebSocket server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  ws.close();
  process.exit(0);
});
