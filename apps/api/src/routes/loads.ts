import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq, and, sql, gte, lte, like } from 'drizzle-orm';
import { loads, loadHistory, users } from '@logistack/db';
import { loadFiltersSchema, type LoadFiltersInput, createLoadSchema, type CreateLoadInput, assignLoadSchema, type AssignLoadInput, updateLoadStatusSchema, type UpdateLoadStatusInput, cancelLoadSchema, type CancelLoadInput } from '../utils/validation';
import { authenticate, type AuthenticatedRequest, requireBusiness } from '../middleware/auth';

/**
 * Loads routes (managing freight loads)
 */
export async function loadsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/loads
   * List loads with optional filters and pagination
   *
   * Authorization:
   * - Truckers: See only loads assigned to them
   * - Business users: See all loads (or filter by businessId if needed)
   */
  fastify.get<{
    Querystring: LoadFiltersInput;
  }>(
    '/',
    {
      preHandler: authenticate,
      schema: {
        description: 'List loads with optional filters and pagination',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
              description: 'Filter by load status',
            },
            origin: {
              type: 'string',
              description: 'Filter by origin location (partial match)',
            },
            destination: {
              type: 'string',
              description: 'Filter by destination location (partial match)',
            },
            pickupDateFrom: {
              type: 'string',
              format: 'date',
              description: 'Filter by pickup date (from)',
            },
            pickupDateTo: {
              type: 'string',
              format: 'date',
              description: 'Filter by pickup date (to)',
            },
            deliveryDateFrom: {
              type: 'string',
              format: 'date',
              description: 'Filter by delivery date (from)',
            },
            deliveryDateTo: {
              type: 'string',
              format: 'date',
              description: 'Filter by delivery date (to)',
            },
            truckerId: {
              type: 'string',
              description: 'Filter by assigned trucker ID',
            },
            businessId: {
              type: 'string',
              description: 'Filter by business ID (business users only)',
            },
            limit: {
              type: 'string',
              description: 'Number of results per page (default: 50)',
            },
            offset: {
              type: 'string',
              description: 'Number of results to skip (default: 0)',
            },
          },
        },
        response: {
          200: {
            description: 'List of loads with pagination',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    businessId: { type: 'number' },
                    truckerId: { type: 'number', nullable: true },
                    originLocation: { type: 'string' },
                    destinationLocation: { type: 'string' },
                    weight: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    price: { type: 'string' },
                    pickupDate: { type: 'string' },
                    deliveryDate: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  total: { type: 'number' },
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
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: LoadFiltersInput }>, reply: FastifyReply) => {
      try {
        // Validate query parameters
        const validationResult = loadFiltersSchema.safeParse(request.query);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const filters = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Build where conditions
        const conditions = [];

        // Authorization: Truckers can only see loads assigned to them
        if (user.userType === 'trucker') {
          conditions.push(eq(loads.truckerId, user.userId));
        }

        // Apply status filter
        if (filters.status) {
          conditions.push(eq(loads.status, filters.status));
        }

        // Apply origin location filter (case-insensitive partial match)
        if (filters.origin) {
          conditions.push(
            sql`LOWER(${loads.originLocation}) LIKE LOWER(${`%${filters.origin}%`})`
          );
        }

        // Apply destination location filter (case-insensitive partial match)
        if (filters.destination) {
          conditions.push(
            sql`LOWER(${loads.destinationLocation}) LIKE LOWER(${`%${filters.destination}%`})`
          );
        }

        // Apply pickup date range filters
        if (filters.pickupDateFrom) {
          conditions.push(gte(loads.pickupDate, filters.pickupDateFrom));
        }
        if (filters.pickupDateTo) {
          conditions.push(lte(loads.pickupDate, filters.pickupDateTo));
        }

        // Apply delivery date range filters
        if (filters.deliveryDateFrom) {
          conditions.push(gte(loads.deliveryDate, filters.deliveryDateFrom));
        }
        if (filters.deliveryDateTo) {
          conditions.push(lte(loads.deliveryDate, filters.deliveryDateTo));
        }

        // Apply trucker filter (business users can filter by trucker)
        if (filters.truckerId && user.userType === 'business') {
          conditions.push(eq(loads.truckerId, filters.truckerId));
        }

        // Apply business filter (business users can filter by their own ID)
        if (filters.businessId && user.userType === 'business') {
          conditions.push(eq(loads.businessId, filters.businessId));
        }

        // Build the where clause
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(loads)
          .where(whereClause);

        const total = Number(countResult.count);

        // Get paginated results
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const results = await fastify.db
          .select()
          .from(loads)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(sql`${loads.createdAt} DESC`);

        return reply.status(200).send({
          data: results,
          pagination: {
            limit,
            offset,
            total,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while fetching loads',
        });
      }
    }
  );

  /**
   * GET /api/loads/:id
   * Get a single load by ID
   *
   * Authorization:
   * - Truckers: Can only view loads assigned to them
   * - Business users: Can view all loads
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        description: 'Get a single load by ID',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Load details with trucker information and history',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  businessId: { type: 'number' },
                  truckerId: { type: 'number', nullable: true },
                  originLocation: { type: 'string' },
                  destinationLocation: { type: 'string' },
                  weight: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  price: { type: 'string' },
                  pickupDate: { type: 'string' },
                  deliveryDate: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  trucker: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'number' },
                      email: { type: 'string' },
                      phone: { type: 'string', nullable: true },
                      companyName: { type: 'string', nullable: true },
                      mcNumber: { type: 'string', nullable: true },
                      dotNumber: { type: 'string', nullable: true },
                    },
                  },
                  history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        oldStatus: { type: 'string', nullable: true },
                        newStatus: { type: 'string' },
                        notes: { type: 'string', nullable: true },
                        changedAt: { type: 'string' },
                        changedBy: { type: 'number', nullable: true },
                      },
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
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Load not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const loadId = parseInt(request.params.id, 10);

        if (isNaN(loadId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid load ID',
          });
        }

        const user = (request as AuthenticatedRequest).user;

        // Fetch the load
        const [load] = await fastify.db
          .select()
          .from(loads)
          .where(eq(loads.id, loadId))
          .limit(1);

        if (!load) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Load not found',
          });
        }

        // Authorization: Truckers can only view loads assigned to them
        if (user.userType === 'trucker' && load.truckerId !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to view this load',
          });
        }

        // Fetch assigned trucker information (if assigned)
        let truckerInfo = null;
        if (load.truckerId) {
          const [trucker] = await fastify.db
            .select({
              id: users.id,
              email: users.email,
              phone: users.phone,
              companyName: users.companyName,
              mcNumber: users.mcNumber,
              dotNumber: users.dotNumber,
            })
            .from(users)
            .where(eq(users.id, load.truckerId))
            .limit(1);

          truckerInfo = trucker || null;
        }

        // Fetch load history (status changes and notes)
        const history = await fastify.db
          .select({
            id: loadHistory.id,
            oldStatus: loadHistory.oldStatus,
            newStatus: loadHistory.newStatus,
            notes: loadHistory.notes,
            changedAt: loadHistory.changedAt,
            changedBy: loadHistory.changedBy,
          })
          .from(loadHistory)
          .where(eq(loadHistory.loadId, loadId))
          .orderBy(sql`${loadHistory.changedAt} DESC`);

        // Build the detailed response
        const detailedLoad = {
          ...load,
          trucker: truckerInfo,
          history: history,
        };

        return reply.status(200).send({
          data: detailedLoad,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while fetching the load',
        });
      }
    }
  );

  /**
   * POST /api/loads
   * Create a new load
   *
   * Authorization:
   * - Only business users can create loads
   */
  fastify.post<{
    Body: CreateLoadInput;
  }>(
    '/',
    {
      preHandler: requireBusiness,
      schema: {
        description: 'Create a new load',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['originLocation', 'destinationLocation', 'weight', 'price', 'pickupDate', 'deliveryDate'],
          properties: {
            originLocation: { type: 'string', description: 'Origin location' },
            destinationLocation: { type: 'string', description: 'Destination location' },
            weight: { type: 'number', description: 'Load weight' },
            description: { type: 'string', description: 'Load description', nullable: true },
            price: { type: 'number', description: 'Load price' },
            pickupDate: { type: 'string', format: 'date', description: 'Pickup date (YYYY-MM-DD)' },
            deliveryDate: { type: 'string', format: 'date', description: 'Delivery date (YYYY-MM-DD)' },
          },
        },
        response: {
          201: {
            description: 'Load created successfully',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  businessId: { type: 'number' },
                  truckerId: { type: 'number', nullable: true },
                  originLocation: { type: 'string' },
                  destinationLocation: { type: 'string' },
                  weight: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  price: { type: 'string' },
                  pickupDate: { type: 'string' },
                  deliveryDate: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
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
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden - Only business users can create loads',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateLoadInput }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const validationResult = createLoadSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const loadData = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Validate that pickup date is before delivery date
        if (loadData.pickupDate >= loadData.deliveryDate) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Pickup date must be before delivery date',
          });
        }

        // Insert the load into the database
        const [createdLoad] = await fastify.db
          .insert(loads)
          .values({
            businessId: user.userId,
            originLocation: loadData.originLocation,
            destinationLocation: loadData.destinationLocation,
            weight: String(loadData.weight),
            description: loadData.description || null,
            price: String(loadData.price),
            pickupDate: loadData.pickupDate,
            deliveryDate: loadData.deliveryDate,
            status: 'pending',
          })
          .returning();

        // Create initial load history entry
        await fastify.db.insert(loadHistory).values({
          loadId: createdLoad.id,
          oldStatus: null,
          newStatus: 'pending',
          changedBy: user.userId,
          notes: 'Load created',
        });

        return reply.status(201).send({
          data: createdLoad,
          message: 'Load created successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating the load',
        });
      }
    }
  );

  /**
   * PATCH /api/loads/:id/assign
   * Assign a load to a trucker
   *
   * Authorization:
   * - Only business users (dispatchers/admins) can assign loads
   */
  fastify.patch<{
    Params: { id: string };
    Body: AssignLoadInput;
  }>(
    '/:id/assign',
    {
      preHandler: requireBusiness,
      schema: {
        description: 'Assign a load to a trucker',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['truckerId'],
          properties: {
            truckerId: { type: 'number', description: 'ID of the trucker to assign the load to' },
            notes: { type: 'string', description: 'Optional notes about the assignment' },
          },
        },
        response: {
          200: {
            description: 'Load successfully assigned',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  businessId: { type: 'number' },
                  truckerId: { type: 'number' },
                  originLocation: { type: 'string' },
                  destinationLocation: { type: 'string' },
                  weight: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  price: { type: 'string' },
                  pickupDate: { type: 'string' },
                  deliveryDate: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
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
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden - Only business users can assign loads',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Load or trucker not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'Conflict - Load already assigned or trucker unavailable',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AssignLoadInput }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate load ID
        const loadId = parseInt(request.params.id, 10);

        if (isNaN(loadId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid load ID',
          });
        }

        // Validate request body
        const validationResult = assignLoadSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const { truckerId, notes } = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Fetch the load
        const [load] = await fastify.db
          .select()
          .from(loads)
          .where(eq(loads.id, loadId))
          .limit(1);

        if (!load) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Load not found',
          });
        }

        // Check if load is already assigned
        if (load.truckerId && load.status !== 'pending') {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Load is already assigned to a trucker',
          });
        }

        // Validate trucker exists and is a trucker type user
        const [trucker] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.id, truckerId))
          .limit(1);

        if (!trucker) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Trucker not found',
          });
        }

        if (trucker.userType !== 'trucker') {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'User is not a trucker',
          });
        }

        // Check if trucker has any conflicting loads during the same time period
        const conflictingLoads = await fastify.db
          .select()
          .from(loads)
          .where(
            and(
              eq(loads.truckerId, truckerId),
              sql`${loads.status} IN ('assigned', 'in_transit')`,
              sql`(
                (${loads.pickupDate} <= ${load.deliveryDate} AND ${loads.deliveryDate} >= ${load.pickupDate})
              )`
            )
          );

        if (conflictingLoads.length > 0) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Trucker is not available during this time period',
          });
        }

        // Update load with trucker assignment and status
        const [updatedLoad] = await fastify.db
          .update(loads)
          .set({
            truckerId: truckerId,
            status: 'assigned',
            updatedAt: sql`NOW()`,
          })
          .where(eq(loads.id, loadId))
          .returning();

        // Create load history entry
        await fastify.db.insert(loadHistory).values({
          loadId: loadId,
          oldStatus: load.status,
          newStatus: 'assigned',
          changedBy: user.userId,
          notes: notes || `Load assigned to trucker ${trucker.email}`,
        });

        // TODO: Send notification to trucker
        // This is a placeholder for the notification system
        // In a production system, this would send an email, SMS, or push notification
        fastify.log.info({
          event: 'load_assigned',
          loadId: loadId,
          truckerId: truckerId,
          truckerEmail: trucker.email,
          assignedBy: user.userId,
        });

        return reply.status(200).send({
          data: updatedLoad,
          message: `Load successfully assigned to ${trucker.email}`,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while assigning the load',
        });
      }
    }
  );

  /**
   * PATCH /api/loads/:id/status
   * Update the status of a load
   *
   * Authorization:
   * - Truckers: Can update to in_transit/delivered for loads assigned to them
   * - Business users: Can cancel their own loads
   */
  fastify.patch<{
    Params: { id: string };
    Body: UpdateLoadStatusInput;
  }>(
    '/:id/status',
    {
      preHandler: authenticate,
      schema: {
        description: 'Update the status of a load',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['in_transit', 'delivered', 'cancelled'],
              description: 'New status for the load',
            },
            notes: { type: 'string', description: 'Optional notes about the status change' },
          },
        },
        response: {
          200: {
            description: 'Load status updated successfully',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  businessId: { type: 'number' },
                  truckerId: { type: 'number', nullable: true },
                  originLocation: { type: 'string' },
                  destinationLocation: { type: 'string' },
                  weight: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  price: { type: 'string' },
                  pickupDate: { type: 'string' },
                  deliveryDate: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Validation error or invalid status transition',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden - insufficient permissions',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Load not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateLoadStatusInput }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate load ID
        const loadId = parseInt(request.params.id, 10);

        if (isNaN(loadId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid load ID',
          });
        }

        // Validate request body
        const validationResult = updateLoadStatusSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const { status: newStatus, notes } = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Fetch the load
        const [load] = await fastify.db
          .select()
          .from(loads)
          .where(eq(loads.id, loadId))
          .limit(1);

        if (!load) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Load not found',
          });
        }

        // Authorization and status transition validation
        if (user.userType === 'trucker') {
          // Truckers can only update loads assigned to them
          if (load.truckerId !== user.userId) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'You can only update loads assigned to you',
            });
          }

          // Truckers can only set in_transit or delivered
          if (newStatus === 'cancelled') {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Truckers cannot cancel loads',
            });
          }

          // Validate trucker status transitions: assigned -> in_transit -> delivered
          if (newStatus === 'in_transit' && load.status !== 'assigned') {
            return reply.status(400).send({
              error: 'Invalid Status Transition',
              message: 'Load must be in "assigned" status to move to "in_transit"',
            });
          }

          if (newStatus === 'delivered' && load.status !== 'in_transit') {
            return reply.status(400).send({
              error: 'Invalid Status Transition',
              message: 'Load must be in "in_transit" status to mark as "delivered"',
            });
          }
        } else if (user.userType === 'business') {
          // Business users can only cancel their own loads
          if (newStatus === 'cancelled') {
            if (load.businessId !== user.userId) {
              return reply.status(403).send({
                error: 'Forbidden',
                message: 'You can only cancel your own loads',
              });
            }

            // Cannot cancel loads that are already delivered or cancelled
            if (load.status === 'delivered' || load.status === 'cancelled') {
              return reply.status(400).send({
                error: 'Invalid Status Transition',
                message: `Cannot cancel a load that is already "${load.status}"`,
              });
            }
          } else {
            // Business users cannot set in_transit or delivered
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Business users can only cancel loads, not update transit status',
            });
          }
        }

        // Update the load status
        const [updatedLoad] = await fastify.db
          .update(loads)
          .set({
            status: newStatus,
            updatedAt: sql`NOW()`,
          })
          .where(eq(loads.id, loadId))
          .returning();

        // Create load history entry for audit trail
        await fastify.db.insert(loadHistory).values({
          loadId: loadId,
          oldStatus: load.status,
          newStatus: newStatus,
          changedBy: user.userId,
          notes: notes || `Status changed from "${load.status}" to "${newStatus}"`,
        });

        fastify.log.info({
          event: 'load_status_updated',
          loadId: loadId,
          oldStatus: load.status,
          newStatus: newStatus,
          changedBy: user.userId,
        });

        return reply.status(200).send({
          data: updatedLoad,
          message: `Load status updated to "${newStatus}"`,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating the load status',
        });
      }
    }
  );

  /**
   * PATCH /api/loads/:id/cancel
   * Cancel a load (convenience endpoint for business users)
   *
   * Authorization:
   * - Only business users can cancel their own loads
   */
  fastify.patch<{
    Params: { id: string };
    Body: CancelLoadInput;
  }>(
    '/:id/cancel',
    {
      preHandler: requireBusiness,
      schema: {
        description: 'Cancel a load',
        tags: ['loads'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            notes: { type: 'string', description: 'Optional reason for cancellation' },
          },
        },
        response: {
          200: {
            description: 'Load cancelled successfully',
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  businessId: { type: 'number' },
                  truckerId: { type: 'number', nullable: true },
                  originLocation: { type: 'string' },
                  destinationLocation: { type: 'string' },
                  weight: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  price: { type: 'string' },
                  pickupDate: { type: 'string' },
                  deliveryDate: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Validation error or invalid cancellation',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden - not the load owner',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Load not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: CancelLoadInput }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate load ID
        const loadId = parseInt(request.params.id, 10);

        if (isNaN(loadId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid load ID',
          });
        }

        // Validate request body
        const validationResult = cancelLoadSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const { notes } = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Fetch the load
        const [load] = await fastify.db
          .select()
          .from(loads)
          .where(eq(loads.id, loadId))
          .limit(1);

        if (!load) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Load not found',
          });
        }

        // Only the business owner can cancel
        if (load.businessId !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only cancel your own loads',
          });
        }

        // Cannot cancel loads that are already delivered or cancelled
        if (load.status === 'delivered' || load.status === 'cancelled') {
          return reply.status(400).send({
            error: 'Invalid Status Transition',
            message: `Cannot cancel a load that is already "${load.status}"`,
          });
        }

        // Update the load status to cancelled
        const [updatedLoad] = await fastify.db
          .update(loads)
          .set({
            status: 'cancelled',
            updatedAt: sql`NOW()`,
          })
          .where(eq(loads.id, loadId))
          .returning();

        // Create load history entry for audit trail
        await fastify.db.insert(loadHistory).values({
          loadId: loadId,
          oldStatus: load.status,
          newStatus: 'cancelled',
          changedBy: user.userId,
          notes: notes || 'Load cancelled by business user',
        });

        fastify.log.info({
          event: 'load_cancelled',
          loadId: loadId,
          oldStatus: load.status,
          cancelledBy: user.userId,
        });

        return reply.status(200).send({
          data: updatedLoad,
          message: 'Load has been cancelled',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while cancelling the load',
        });
      }
    }
  );
}
