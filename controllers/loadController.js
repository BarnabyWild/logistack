const { schema } = require('../config/database');
const { loads } = schema;

/**
 * Create a new load
 * POST /api/loads
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - Only business users can create loads
 *
 * @body {string} origin - Origin location (required)
 * @body {string} destination - Destination location (required)
 * @body {number} weight - Weight in pounds (required)
 * @body {number} price - Price in USD (required)
 * @body {string} pickupDate - Pickup date in YYYY-MM-DD format (required)
 * @body {string} deliveryDate - Delivery date in YYYY-MM-DD format (optional)
 * @body {string} description - Load description (optional)
 *
 * @returns {object} 201 - Created load object
 * @returns {object} 400 - Validation error
 * @returns {object} 401 - Authentication error
 * @returns {object} 403 - Authorization error
 * @returns {object} 500 - Server error
 */
const createLoad = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.id;

    // Extract and prepare load data
    const {
      origin,
      destination,
      weight,
      price,
      pickupDate,
      deliveryDate,
      description
    } = req.body;

    // Calculate delivery date if not provided (default to 2 days after pickup)
    let finalDeliveryDate = deliveryDate;
    if (!deliveryDate) {
      const pickup = new Date(pickupDate);
      const delivery = new Date(pickup);
      delivery.setDate(delivery.getDate() + 2);
      finalDeliveryDate = delivery.toISOString().split('T')[0];
    }

    // Create new load
    const newLoad = {
      businessId: userId,
      originLocation: origin,
      destinationLocation: destination,
      weight: weight.toString(),
      price: price.toString(),
      pickupDate,
      deliveryDate: finalDeliveryDate,
      description: description || null,
      status: 'pending'
    };

    // Insert into database
    const [createdLoad] = await db
      .insert(loads)
      .values(newLoad)
      .returning();

    // Return created load with 201 status
    return res.status(201).json({
      data: {
        id: createdLoad.id,
        businessId: createdLoad.businessId,
        origin: createdLoad.originLocation,
        destination: createdLoad.destinationLocation,
        weight: parseFloat(createdLoad.weight),
        price: parseFloat(createdLoad.price),
        pickupDate: createdLoad.pickupDate,
        deliveryDate: createdLoad.deliveryDate,
        description: createdLoad.description,
        status: createdLoad.status,
        createdAt: createdLoad.createdAt,
        updatedAt: createdLoad.updatedAt
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });

  } catch (error) {
    console.error('Error creating load:', error);

    // Handle database errors
    if (error.code === '23503') {
      return res.status(400).json({
        error: {
          message: 'Invalid business ID',
          status: 400
        }
      });
    }

    return res.status(500).json({
      error: {
        message: 'Failed to create load',
        status: 500
      }
    });
  }
};

/**
 * Get loads with filters and pagination
 * GET /api/loads
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - Truckers see only their assigned loads, business users see all their loads
 *
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} status - Filter by status (pending, assigned, in_transit, delivered)
 * @query {string} origin - Filter by origin location (partial match)
 * @query {string} destination - Filter by destination location (partial match)
 * @query {string} pickupDateFrom - Filter by pickup date from (YYYY-MM-DD)
 * @query {string} pickupDateTo - Filter by pickup date to (YYYY-MM-DD)
 * @query {string} deliveryDateFrom - Filter by delivery date from (YYYY-MM-DD)
 * @query {string} deliveryDateTo - Filter by delivery date to (YYYY-MM-DD)
 * @query {number} truckerId - Filter by assigned trucker ID (business users only)
 *
 * @returns {object} 200 - Paginated loads with metadata
 * @returns {object} 401 - Authentication error
 * @returns {object} 500 - Server error
 */
const getLoads = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { eq, and, gte, lte, ilike, sql, desc } = require('drizzle-orm');

    const userId = req.user.id;
    const userType = req.user.userType;

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [];

    // Authorization: truckers see only their assigned loads, business users see their own loads
    if (userType === 'trucker') {
      conditions.push(eq(loads.truckerId, userId));
    } else if (userType === 'business') {
      conditions.push(eq(loads.businessId, userId));
    }

    // Status filter
    if (req.query.status) {
      const validStatuses = ['pending', 'assigned', 'in_transit', 'delivered'];
      if (validStatuses.includes(req.query.status)) {
        conditions.push(eq(loads.status, req.query.status));
      }
    }

    // Origin location filter (case-insensitive partial match)
    if (req.query.origin) {
      conditions.push(ilike(loads.originLocation, `%${req.query.origin}%`));
    }

    // Destination location filter (case-insensitive partial match)
    if (req.query.destination) {
      conditions.push(ilike(loads.destinationLocation, `%${req.query.destination}%`));
    }

    // Pickup date range filter
    if (req.query.pickupDateFrom) {
      conditions.push(gte(loads.pickupDate, req.query.pickupDateFrom));
    }
    if (req.query.pickupDateTo) {
      conditions.push(lte(loads.pickupDate, req.query.pickupDateTo));
    }

    // Delivery date range filter
    if (req.query.deliveryDateFrom) {
      conditions.push(gte(loads.deliveryDate, req.query.deliveryDateFrom));
    }
    if (req.query.deliveryDateTo) {
      conditions.push(lte(loads.deliveryDate, req.query.deliveryDateTo));
    }

    // Trucker filter (only for business users)
    if (req.query.truckerId && userType === 'business') {
      const truckerId = parseInt(req.query.truckerId);
      if (!isNaN(truckerId)) {
        conditions.push(eq(loads.truckerId, truckerId));
      }
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(loads)
      .where(whereClause);

    const totalItems = parseInt(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated loads
    const loadsList = await db
      .select()
      .from(loads)
      .where(whereClause)
      .orderBy(desc(loads.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedLoads = loadsList.map(load => ({
      id: load.id,
      businessId: load.businessId,
      truckerId: load.truckerId,
      origin: load.originLocation,
      destination: load.destinationLocation,
      weight: parseFloat(load.weight),
      price: parseFloat(load.price),
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      description: load.description,
      status: load.status,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt
    }));

    return res.status(200).json({
      data: formattedLoads,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });

  } catch (error) {
    console.error('Error fetching loads:', error);

    return res.status(500).json({
      error: {
        message: 'Failed to fetch loads',
        status: 500
      }
    });
  }
};

module.exports = {
  createLoad,
  getLoads
};
