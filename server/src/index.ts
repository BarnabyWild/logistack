import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { config } from 'dotenv';
import { createDbConnection } from '@logistack/db';
import { authRoutes } from './routes/auth';
import { shipmentsRoutes } from './routes/shipments';
import { loadsRoutes } from './routes/loads';
import { gpsTrackingRoutes } from './routes/gps-tracking';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
async function registerPlugins() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  // WebSocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info: any, next: any) => {
        // Basic connection validation
        // Authentication will be handled in the WebSocket route
        next(true);
      },
    },
  });

  // Database connection
  const db = createDbConnection(process.env.DATABASE_URL!);
  fastify.decorate('db', db);

  fastify.log.info('All plugins registered successfully');
}

// Register routes
async function registerRoutes() {
  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(shipmentsRoutes, { prefix: '/api/shipments' });
  await fastify.register(loadsRoutes, { prefix: '/api/loads' });

  // WebSocket routes
  await fastify.register(gpsTrackingRoutes, { prefix: '/api/gps' });

  fastify.log.info('All routes registered successfully');
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.PORT || '8080', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info(`API available at http://${host}:${port}/api`);
    fastify.log.info(`Health check at http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  fastify.log.info(`Received signal ${signal}, closing server gracefully`);
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// TypeScript module augmentation for custom decorators
declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof createDbConnection>;
  }
}

// Start the server
start();
