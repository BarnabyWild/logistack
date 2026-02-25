import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { routes, type NewRoute } from '@logistack/db';
import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentFiltersSchema,
  type CreateShipmentInput,
  type UpdateShipmentInput,
  type ShipmentFiltersInput,
} from '../utils/shipment-validation';
import { authenticate, requireTrucker, type AuthenticatedRequest } from '../middleware/auth';

/**
 * Shipments routes (managing trucker routes/shipments)
 */
export async function shipmentsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/shipments
   * Create a new shipment (route) - Only truckers can create routes
   */
  fastify.post<{
    Body: CreateShipmentInput;
  }>(
    '/',
    {
      preHandler: requireTrucker,
      schema: {
        description: 'Create a new shipment route',
        tags: ['shipments'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: [
            'startLocation',
            'startLat',
            'startLng',
            'endLocation',
            'endLat',
            'endLng',
            'departureDate',
            'arrivalDate',
            'availableCapacity',
            'equipmentType',
          ],
          properties: {
            startLocation: { type: 'string' },
            startLat: { type: 'number' },
            startLng: { type: 'number' },
            endLocation: { type: 'string' },
            endLat: { type: 'number' },
            endLng: { type: 'number' },
            departureDate: { type: 'string', format: 'date' },
            arrivalDate: { type: 'string', format: 'date' },
            availableCapacity: { type: 'number' },
            equipmentType: {
              type: 'string',
              enum: [
                'dry_van',
                'flatbed',
                'reefer',
                'step_deck',
                'lowboy',
                'tanker',
                'box_truck',
                'power_only',
                'hotshot',
                'container',
              ],
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled', 'expired'],
            },
          },
        },
        response: {
          201: {
            description: 'Shipment successfully created',
            type: 'object',
            properties: {
              data: { type: 'object' },
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
    async (request: FastifyRequest<{ Body: CreateShipmentInput }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const validationResult = createShipmentSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const data = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Validate dates
        const departureDate = new Date(data.departureDate);
        const arrivalDate = new Date(data.arrivalDate);

        if (arrivalDate <= departureDate) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Arrival date must be after departure date',
          });
        }

        // Create new route
        const newRoute: NewRoute = {
          truckerId: user.userId,
          startLocation: data.startLocation,
          startLat: data.startLat.toString(),
          startLng: data.startLng.toString(),
          endLocation: data.endLocation,
          endLat: data.endLat.toString(),
          endLng: data.endLng.toString(),
          departureDate: data.departureDate,
          arrivalDate: data.arrivalDate,
          availableCapacity: data.availableCapacity.toString(),
          equipmentType: data.equipmentType,
          status: data.status || 'draft',
        };

        const [createdRoute] = await fastify.db.insert(routes).values(newRoute).returning();

        return reply.status(201).send({
          data: createdRoute,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating the shipment',
        });
      }
    }
  );

  /**
   * GET /api/shipments
   * List shipments with optional filters
   */
  fastify.get<{
    Querystring: ShipmentFiltersInput;
  }>(
    '/',
    {
      preHandler: authenticate,
      schema: {
        description: 'List shipments with optional filters',
        tags: ['shipments'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled', 'expired'],
            },
            equipmentType: {
              type: 'string',
              enum: [
                'dry_van',
                'flatbed',
                'reefer',
                'step_deck',
                'lowboy',
                'tanker',
                'box_truck',
                'power_only',
                'hotshot',
                'container',
              ],
            },
            truckerId: { type: 'string' },
            limit: { type: 'string' },
            offset: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'List of shipments',
            type: 'object',
            properties: {
              data: { type: 'array' },
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
    async (request: FastifyRequest<{ Querystring: ShipmentFiltersInput }>, reply: FastifyReply) => {
      try {
        // Validate query parameters
        const validationResult = shipmentFiltersSchema.safeParse(request.query);

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

        // If user is a trucker, only show their own routes
        if (user.userType === 'trucker') {
          conditions.push(eq(routes.truckerId, user.userId));
        }

        // Apply filters
        if (filters.status) {
          conditions.push(eq(routes.status, filters.status));
        }

        if (filters.equipmentType) {
          conditions.push(eq(routes.equipmentType, filters.equipmentType));
        }

        if (filters.truckerId && user.userType === 'business') {
          // Only business users can filter by trucker ID
          conditions.push(eq(routes.truckerId, filters.truckerId));
        }

        // Build query
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)` })
          .from(routes)
          .where(whereClause);

        const total = Number(countResult.count);

        // Get paginated results
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const results = await fastify.db
          .select()
          .from(routes)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(sql`${routes.createdAt} DESC`);

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
          message: 'An error occurred while fetching shipments',
        });
      }
    }
  );

  /**
   * GET /api/shipments/:id
   * Get a single shipment by ID
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        description: 'Get a single shipment by ID',
        tags: ['shipments'],
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
            description: 'Shipment details',
            type: 'object',
            properties: {
              data: { type: 'object' },
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
            description: 'Shipment not found',
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
        const shipmentId = parseInt(request.params.id, 10);

        if (isNaN(shipmentId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid shipment ID',
          });
        }

        const user = (request as AuthenticatedRequest).user;

        // Fetch the shipment
        const [shipment] = await fastify.db
          .select()
          .from(routes)
          .where(eq(routes.id, shipmentId))
          .limit(1);

        if (!shipment) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Shipment not found',
          });
        }

        // Check authorization - truckers can only view their own routes
        if (user.userType === 'trucker' && shipment.truckerId !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to view this shipment',
          });
        }

        return reply.status(200).send({
          data: shipment,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while fetching the shipment',
        });
      }
    }
  );

  /**
   * PUT /api/shipments/:id
   * Update a shipment by ID - Only the owner trucker can update
   */
  fastify.put<{
    Params: { id: string };
    Body: UpdateShipmentInput;
  }>(
    '/:id',
    {
      preHandler: requireTrucker,
      schema: {
        description: 'Update a shipment by ID',
        tags: ['shipments'],
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
            startLocation: { type: 'string' },
            startLat: { type: 'number' },
            startLng: { type: 'number' },
            endLocation: { type: 'string' },
            endLat: { type: 'number' },
            endLng: { type: 'number' },
            departureDate: { type: 'string', format: 'date' },
            arrivalDate: { type: 'string', format: 'date' },
            availableCapacity: { type: 'number' },
            equipmentType: {
              type: 'string',
              enum: [
                'dry_van',
                'flatbed',
                'reefer',
                'step_deck',
                'lowboy',
                'tanker',
                'box_truck',
                'power_only',
                'hotshot',
                'container',
              ],
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled', 'expired'],
            },
          },
        },
        response: {
          200: {
            description: 'Shipment successfully updated',
            type: 'object',
            properties: {
              data: { type: 'object' },
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
            description: 'Shipment not found',
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
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateShipmentInput }>,
      reply: FastifyReply
    ) => {
      try {
        const shipmentId = parseInt(request.params.id, 10);

        if (isNaN(shipmentId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid shipment ID',
          });
        }

        // Validate request body
        const validationResult = updateShipmentSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: validationResult.error.errors[0].message,
            errors: validationResult.error.errors,
          });
        }

        const data = validationResult.data;
        const user = (request as AuthenticatedRequest).user;

        // Check if shipment exists and belongs to user
        const [existingShipment] = await fastify.db
          .select()
          .from(routes)
          .where(eq(routes.id, shipmentId))
          .limit(1);

        if (!existingShipment) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Shipment not found',
          });
        }

        if (existingShipment.truckerId !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to update this shipment',
          });
        }

        // Validate dates if both are provided
        if (data.departureDate && data.arrivalDate) {
          const departureDate = new Date(data.departureDate);
          const arrivalDate = new Date(data.arrivalDate);

          if (arrivalDate <= departureDate) {
            return reply.status(400).send({
              error: 'Validation Error',
              message: 'Arrival date must be after departure date',
            });
          }
        }

        // Build update object
        const updateData: Record<string, any> = {
          updatedAt: sql`NOW()`,
        };

        if (data.startLocation !== undefined) updateData.startLocation = data.startLocation;
        if (data.startLat !== undefined) updateData.startLat = data.startLat.toString();
        if (data.startLng !== undefined) updateData.startLng = data.startLng.toString();
        if (data.endLocation !== undefined) updateData.endLocation = data.endLocation;
        if (data.endLat !== undefined) updateData.endLat = data.endLat.toString();
        if (data.endLng !== undefined) updateData.endLng = data.endLng.toString();
        if (data.departureDate !== undefined) updateData.departureDate = data.departureDate;
        if (data.arrivalDate !== undefined) updateData.arrivalDate = data.arrivalDate;
        if (data.availableCapacity !== undefined)
          updateData.availableCapacity = data.availableCapacity.toString();
        if (data.equipmentType !== undefined) updateData.equipmentType = data.equipmentType;
        if (data.status !== undefined) updateData.status = data.status;

        // Update the shipment
        const [updatedShipment] = await fastify.db
          .update(routes)
          .set(updateData)
          .where(eq(routes.id, shipmentId))
          .returning();

        return reply.status(200).send({
          data: updatedShipment,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating the shipment',
        });
      }
    }
  );

  /**
   * DELETE /api/shipments/:id
   * Delete a shipment by ID - Only the owner trucker can delete
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      preHandler: requireTrucker,
      schema: {
        description: 'Delete a shipment by ID',
        tags: ['shipments'],
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
            description: 'Shipment successfully deleted',
            type: 'object',
            properties: {
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
            description: 'Shipment not found',
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
        const shipmentId = parseInt(request.params.id, 10);

        if (isNaN(shipmentId)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid shipment ID',
          });
        }

        const user = (request as AuthenticatedRequest).user;

        // Check if shipment exists and belongs to user
        const [existingShipment] = await fastify.db
          .select()
          .from(routes)
          .where(eq(routes.id, shipmentId))
          .limit(1);

        if (!existingShipment) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Shipment not found',
          });
        }

        if (existingShipment.truckerId !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to delete this shipment',
          });
        }

        // Delete the shipment
        await fastify.db.delete(routes).where(eq(routes.id, shipmentId));

        return reply.status(200).send({
          message: 'Shipment successfully deleted',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while deleting the shipment',
        });
      }
    }
  );
}
