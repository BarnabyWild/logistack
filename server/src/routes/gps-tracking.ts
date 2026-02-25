import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { gpsLocations } from '@logistack/db';
import type { AuthenticatedRequest } from '../middleware/auth';

// Validation schema for GPS location data
const gpsLocationSchema = z.object({
  type: z.literal('location_update'),
  loadId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  deviceId: z.string().optional(),
  recordedAt: z.string().datetime(),
});

// Validation schema for connection initialization
const connectionInitSchema = z.object({
  type: z.literal('init'),
  token: z.string(),
  loadId: z.number().int().positive(),
});

// Store active WebSocket connections
// Map: loadId -> Set of connection objects
const activeConnections = new Map<number, Set<{ socket: any; userId: number; loadId: number }>>();

export async function gpsTrackingRoutes(fastify: FastifyInstance) {
  /**
   * WebSocket endpoint for real-time GPS tracking
   * Path: /api/gps/track
   *
   * Connection flow:
   * 1. Client connects to WebSocket
   * 2. Client sends 'init' message with JWT token and loadId
   * 3. Server validates token and authorizes trucker
   * 4. Client sends 'location_update' messages periodically
   * 5. Server validates and stores location data
   */
  fastify.get('/track', { websocket: true }, async (socket, request) => {
    let authenticated = false;
    let userId: number | null = null;
    let loadId: number | null = null;
    let connectionInfo: { socket: any; userId: number; loadId: number } | null = null;

    fastify.log.info('New WebSocket connection established');

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to GPS tracking server. Please send init message with token and loadId.',
    }));

    socket.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle initialization message
        if (message.type === 'init' && !authenticated) {
          const initData = connectionInitSchema.parse(message);

          // Verify JWT token
          try {
            const decoded = fastify.jwt.verify(initData.token) as {
              userId: number;
              email: string;
              userType: 'trucker' | 'business';
            };

            // Only truckers can send GPS updates
            if (decoded.userType !== 'trucker') {
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Only truckers can send GPS location updates',
              }));
              socket.close(1008, 'Unauthorized user type');
              return;
            }

            // TODO: Verify that the trucker is assigned to this load
            // This would require a database query to check load assignment

            authenticated = true;
            userId = decoded.userId;
            loadId = initData.loadId;

            // Store connection
            connectionInfo = { socket, userId, loadId };
            if (!activeConnections.has(loadId)) {
              activeConnections.set(loadId, new Set());
            }
            activeConnections.get(loadId)!.add(connectionInfo);

            socket.send(JSON.stringify({
              type: 'authenticated',
              message: 'Authentication successful. You can now send location updates.',
              userId: decoded.userId,
              loadId: initData.loadId,
            }));

            fastify.log.info({
              userId: decoded.userId,
              loadId: initData.loadId,
            }, 'WebSocket client authenticated');

          } catch (error) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Invalid authentication token',
            }));
            socket.close(1008, 'Authentication failed');
            return;
          }
        }
        // Handle location update messages
        else if (message.type === 'location_update' && authenticated) {
          const locationData = gpsLocationSchema.parse(message);

          // Verify the loadId matches the authenticated session
          if (locationData.loadId !== loadId) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Load ID mismatch',
            }));
            return;
          }

          // Insert location data into database
          try {
            await fastify.db.insert(gpsLocations).values({
              loadId: locationData.loadId,
              truckerId: userId!,
              latitude: locationData.latitude.toString(),
              longitude: locationData.longitude.toString(),
              altitude: locationData.altitude?.toString(),
              speed: locationData.speed?.toString(),
              heading: locationData.heading?.toString(),
              accuracy: locationData.accuracy?.toString(),
              deviceId: locationData.deviceId,
              recordedAt: new Date(locationData.recordedAt),
            });

            // Send acknowledgment
            socket.send(JSON.stringify({
              type: 'location_received',
              message: 'Location update recorded successfully',
              timestamp: new Date().toISOString(),
            }));

            fastify.log.info({
              userId,
              loadId,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            }, 'GPS location updated');

            // TODO: Broadcast location update to subscribed clients (businesses tracking this load)
            // This would be implemented when we add the tracking view feature

          } catch (error) {
            fastify.log.error(error, 'Failed to save GPS location');
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save location data',
            }));
          }
        }
        // Handle heartbeat/ping messages
        else if (message.type === 'ping') {
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          }));
        }
        // Handle unauthenticated or unknown messages
        else if (!authenticated) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Please authenticate first by sending an init message',
          }));
        } else {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          }));
        }

      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            errors: error.errors,
          }));
        } else {
          fastify.log.error(error, 'Error processing WebSocket message');
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Internal server error',
          }));
        }
      }
    });

    socket.on('close', () => {
      // Clean up connection
      if (connectionInfo && loadId) {
        const connections = activeConnections.get(loadId);
        if (connections) {
          connections.delete(connectionInfo);
          if (connections.size === 0) {
            activeConnections.delete(loadId);
          }
        }
      }

      fastify.log.info({
        userId,
        loadId,
        authenticated,
      }, 'WebSocket connection closed');
    });

    socket.on('error', (error: Error) => {
      fastify.log.error(error, 'WebSocket error');
    });
  });

  /**
   * REST endpoint to get latest GPS location for a load
   * GET /api/gps/location/:loadId
   */
  fastify.get<{
    Params: { loadId: string };
  }>('/location/:loadId', async (request, reply) => {
    const loadId = parseInt(request.params.loadId, 10);

    if (isNaN(loadId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid load ID',
      });
    }

    try {
      // Get the most recent location for this load
      const locations = await fastify.db
        .select()
        .from(gpsLocations)
        .where(eq(gpsLocations.loadId, loadId))
        .orderBy(desc(gpsLocations.recordedAt))
        .limit(1);

      if (locations.length === 0) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No location data found for this load',
        });
      }

      return reply.send({
        location: locations[0],
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch GPS location');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch location data',
      });
    }
  });

  /**
   * REST endpoint to get location history for a load
   * GET /api/gps/history/:loadId?limit=100
   */
  fastify.get<{
    Params: { loadId: string };
    Querystring: { limit?: string };
  }>('/history/:loadId', async (request, reply) => {
    const loadId = parseInt(request.params.loadId, 10);
    const limit = parseInt(request.query.limit || '100', 10);

    if (isNaN(loadId) || isNaN(limit) || limit < 1 || limit > 1000) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid load ID or limit parameter',
      });
    }

    try {
      const locations = await fastify.db
        .select()
        .from(gpsLocations)
        .where(eq(gpsLocations.loadId, loadId))
        .orderBy(desc(gpsLocations.recordedAt))
        .limit(limit);

      return reply.send({
        loadId,
        count: locations.length,
        locations,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch GPS location history');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch location history',
      });
    }
  });

  /**
   * REST endpoint to get active tracking sessions
   * GET /api/gps/active
   */
  fastify.get('/active', async (request, reply) => {
    const activeSessions = Array.from(activeConnections.entries()).map(([loadId, connections]) => ({
      loadId,
      connectionCount: connections.size,
      connectedTruckers: Array.from(connections).map(conn => conn.userId),
    }));

    return reply.send({
      activeSessions,
      totalConnections: activeSessions.reduce((sum, s) => sum + s.connectionCount, 0),
    });
  });
}
