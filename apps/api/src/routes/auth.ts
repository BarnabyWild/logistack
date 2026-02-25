import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { users, type NewUser } from '@logistack/db';
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from '../utils/validation';
import { hashPassword, verifyPassword, generateTokens, sanitizeUser } from '../utils/auth';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

/**
 * Authentication routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post<{
    Body: RegisterInput;
  }>(
    '/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password', 'user_type'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            user_type: { type: 'string', enum: ['trucker', 'business'] },
          },
        },
        response: {
          201: {
            description: 'User successfully registered',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  user: { type: 'object' },
                  tokens: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      refresh_token: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'Email already exists',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const validationResult = registerSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const { email, password, user_type } = validationResult.data;

        // Check if user already exists
        const existingUser = await fastify.db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (existingUser.length > 0) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'An account with this email already exists',
          });
        }

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Create new user
        const newUser: NewUser = {
          email: email.toLowerCase(),
          password: passwordHash,
          userType: user_type,
          emailVerified: false,
          profileData: {},
        };

        const [createdUser] = await fastify.db
          .insert(users)
          .values(newUser)
          .returning();

        // Remove sensitive fields
        const publicUser = sanitizeUser(createdUser);

        // Generate JWT tokens
        const tokens = generateTokens(fastify, publicUser);

        // Return success response
        return reply.status(201).send({
          data: {
            user: publicUser,
            tokens,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while registering the user',
        });
      }
    }
  );

  /**
   * POST /api/auth/login
   * Login an existing user
   */
  fastify.post<{
    Body: LoginInput;
  }>(
    '/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            description: 'Login successful',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  user: { type: 'object' },
                  tokens: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      refresh_token: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Invalid credentials',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const validationResult = loginSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const { email, password } = validationResult.data;

        // Find user by email
        const [user] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Remove sensitive fields
        const publicUser = sanitizeUser(user);

        // Generate JWT tokens
        const tokens = generateTokens(fastify, publicUser);

        return reply.status(200).send({
          data: {
            user: publicUser,
            tokens,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while logging in',
        });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Logout the current user
   */
  fastify.post(
    '/logout',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Logout the current user',
        tags: ['auth'],
        response: {
          200: {
            description: 'Logout successful',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Not authenticated',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // With stateless JWT, logout is handled client-side by discarding tokens.
        // The server acknowledges the logout request.
        return reply.status(200).send({
          message: 'Logged out successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while logging out',
        });
      }
    }
  );

  /**
   * GET /api/auth/me
   * Get current user information
   */
  fastify.get(
    '/me',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get current authenticated user profile',
        tags: ['auth'],
        response: {
          200: {
            description: 'User profile',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  user: { type: 'object' },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;

        // Fetch fresh user data from database
        const [user] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        const publicUser = sanitizeUser(user);

        return reply.status(200).send({
          data: {
            user: publicUser,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while fetching user profile',
        });
      }
    }
  );

  /**
   * POST /api/auth/refresh
   * Refresh access token using a valid refresh token
   */
  fastify.post<{
    Body: { refresh_token: string };
  }>(
    '/refresh',
    {
      schema: {
        description: 'Refresh access and refresh tokens',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Tokens refreshed successfully',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  tokens: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      refresh_token: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Missing refresh token',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Invalid or expired refresh token',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
      try {
        const { refresh_token } = request.body;

        if (!refresh_token) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Refresh token is required',
          });
        }

        // Verify the refresh token
        let decoded: { userId: number; email: string; userType: string };
        try {
          decoded = fastify.jwt.verify(refresh_token) as typeof decoded;
        } catch {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired refresh token',
          });
        }

        // Verify user still exists in database
        const [user] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User no longer exists',
          });
        }

        // Generate new token pair (rotation)
        const publicUser = sanitizeUser(user);
        const tokens = generateTokens(fastify, publicUser);

        return reply.status(200).send({
          data: {
            tokens,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while refreshing tokens',
        });
      }
    }
  );
}
