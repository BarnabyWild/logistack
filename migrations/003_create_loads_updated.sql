-- Migration: Create updated loads schema
-- Description: Sets up loads table with business_id, trucker_id, and simplified fields
-- Created: 2026-02-15
-- Version: 003

-- Drop existing loads table and enum if they exist (from migration 002)
DROP TABLE IF EXISTS loads CASCADE;
DROP TYPE IF EXISTS load_status_enum CASCADE;

-- Create enum type for load status
CREATE TYPE load_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered'
);

-- Create loads table
CREATE TABLE loads (
    id SERIAL PRIMARY KEY,

    -- Foreign keys
    business_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trucker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Location information
    origin_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,

    -- Load specifications
    weight DECIMAL(10, 2) NOT NULL, -- in pounds
    description TEXT,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL, -- in USD

    -- Schedule
    pickup_date DATE NOT NULL,
    delivery_date DATE NOT NULL,

    -- Status
    status load_status_enum NOT NULL DEFAULT 'pending',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT valid_weight CHECK (weight > 0),
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_dates CHECK (delivery_date >= pickup_date)
);

-- Create indexes for performance
CREATE INDEX idx_loads_business_id ON loads(business_id);
CREATE INDEX idx_loads_trucker_id ON loads(trucker_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX idx_loads_delivery_date ON loads(delivery_date);
CREATE INDEX idx_loads_created_at ON loads(created_at);

-- Create composite indexes for common query patterns
CREATE INDEX idx_loads_status_pickup_date ON loads(status, pickup_date);
CREATE INDEX idx_loads_status_business_id ON loads(status, business_id);
CREATE INDEX idx_loads_trucker_id_status ON loads(trucker_id, status);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_loads_updated_at
    BEFORE UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE loads IS 'Stores freight load postings from businesses and assignments to truckers';
COMMENT ON COLUMN loads.business_id IS 'Reference to the user (business) who posted the load';
COMMENT ON COLUMN loads.trucker_id IS 'Reference to the user (trucker) assigned to the load (nullable)';
COMMENT ON COLUMN loads.origin_location IS 'Origin/pickup location address';
COMMENT ON COLUMN loads.destination_location IS 'Destination/delivery location address';
COMMENT ON COLUMN loads.weight IS 'Weight of the load in pounds';
COMMENT ON COLUMN loads.description IS 'Description of the load, cargo details, and special instructions';
COMMENT ON COLUMN loads.price IS 'Price offered for the load in USD';
COMMENT ON COLUMN loads.pickup_date IS 'Scheduled pickup date';
COMMENT ON COLUMN loads.delivery_date IS 'Scheduled delivery date';
COMMENT ON COLUMN loads.status IS 'Current status of the load (pending, assigned, in_transit, delivered)';
