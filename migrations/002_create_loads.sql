-- Migration: Create loads schema
-- Description: Sets up loads table for freight load postings
-- Created: 2026-02-15

-- Create enum type for load status
CREATE TYPE load_status_enum AS ENUM (
    'draft',
    'posted',
    'in_transit',
    'delivered',
    'cancelled',
    'expired'
);

-- Create loads table
CREATE TABLE loads (
    id SERIAL PRIMARY KEY,
    posted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Origin information
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 8) NOT NULL,
    origin_lng DECIMAL(11, 8) NOT NULL,

    -- Destination information
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lng DECIMAL(11, 8) NOT NULL,

    -- Schedule
    pickup_date DATE NOT NULL,
    delivery_date DATE NOT NULL,

    -- Load specifications
    weight DECIMAL(10, 2) NOT NULL, -- in pounds
    dimensions JSONB, -- {length: number, width: number, height: number} in feet
    load_type VARCHAR(100) NOT NULL, -- e.g., 'flatbed', 'dry_van', 'reefer', 'container'
    commodity VARCHAR(255) NOT NULL, -- what's being shipped

    -- Pricing and status
    price DECIMAL(10, 2) NOT NULL, -- in USD
    status load_status_enum NOT NULL DEFAULT 'draft',

    -- Additional details
    special_requirements TEXT, -- any special handling, equipment, or requirements

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_coordinates_origin CHECK (
        origin_lat BETWEEN -90 AND 90 AND
        origin_lng BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_coordinates_destination CHECK (
        destination_lat BETWEEN -90 AND 90 AND
        destination_lng BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_weight CHECK (weight > 0),
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_dates CHECK (delivery_date >= pickup_date)
);

-- Create indexes for performance
CREATE INDEX idx_loads_posted_by ON loads(posted_by);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX idx_loads_delivery_date ON loads(delivery_date);
CREATE INDEX idx_loads_created_at ON loads(created_at);
CREATE INDEX idx_loads_load_type ON loads(load_type);

-- Create composite indexes for common query patterns
CREATE INDEX idx_loads_status_pickup_date ON loads(status, pickup_date);
CREATE INDEX idx_loads_status_posted_by ON loads(status, posted_by);

-- Create spatial indexes for location-based queries
CREATE INDEX idx_loads_origin_coords ON loads(origin_lat, origin_lng);
CREATE INDEX idx_loads_destination_coords ON loads(destination_lat, destination_lng);

-- Create index on dimensions JSONB field
CREATE INDEX idx_loads_dimensions ON loads USING GIN(dimensions);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_loads_updated_at
    BEFORE UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE loads IS 'Stores freight load postings from businesses';
COMMENT ON COLUMN loads.posted_by IS 'Reference to the user (business) who posted the load';
COMMENT ON COLUMN loads.origin_address IS 'Full address of pickup location';
COMMENT ON COLUMN loads.origin_lat IS 'Latitude of origin location';
COMMENT ON COLUMN loads.origin_lng IS 'Longitude of origin location';
COMMENT ON COLUMN loads.destination_address IS 'Full address of delivery location';
COMMENT ON COLUMN loads.destination_lat IS 'Latitude of destination location';
COMMENT ON COLUMN loads.destination_lng IS 'Longitude of destination location';
COMMENT ON COLUMN loads.pickup_date IS 'Scheduled pickup date';
COMMENT ON COLUMN loads.delivery_date IS 'Scheduled delivery date';
COMMENT ON COLUMN loads.weight IS 'Weight of the load in pounds';
COMMENT ON COLUMN loads.dimensions IS 'Dimensions of the load (length, width, height) in feet, stored as JSON';
COMMENT ON COLUMN loads.load_type IS 'Type of load/trailer required (e.g., flatbed, dry_van, reefer)';
COMMENT ON COLUMN loads.commodity IS 'Description of what is being shipped';
COMMENT ON COLUMN loads.price IS 'Price offered for the load in USD';
COMMENT ON COLUMN loads.status IS 'Current status of the load';
COMMENT ON COLUMN loads.special_requirements IS 'Any special requirements, handling instructions, or equipment needs';
