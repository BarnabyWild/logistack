import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * JWT Authentication middleware
 * Verifies the JWT token and attaches user info to request
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}

/**
 * Type guard for authenticated requests
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: number;
    email: string;
    userType: 'trucker' | 'business';
    iat?: number;
    exp?: number;
  };
}

/**
 * Middleware to ensure user is a trucker
 */
export async function requireTrucker(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  const user = (request as AuthenticatedRequest).user;

  if (user.userType !== 'trucker') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'This endpoint is only accessible to truckers',
    });
  }
}

/**
 * Middleware to ensure user is a business
 */
export async function requireBusiness(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  const user = (request as AuthenticatedRequest).user;

  if (user.userType !== 'business') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'This endpoint is only accessible to business users',
    });
  }
}
