-- Migration: Create routes schema
-- Description: Sets up routes table for trucker route postings and availability
-- Created: 2026-02-15
-- Version: 005

-- Create enum type for equipment type
CREATE TYPE equipment_type_enum AS ENUM (
    'dry_van',
    'flatbed',
    'reefer',
    'step_deck',
    'lowboy',
    'tanker',
    'box_truck',
    'power_only',
    'hotshot',
    'container'
);

-- Create enum type for route status
CREATE TYPE route_status_enum AS ENUM (
    'draft',
    'active',
    'matched',
    'in_transit',
    'completed',
    'cancelled',
    'expired'
);

-- Create routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    trucker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Start location information
    start_location TEXT NOT NULL,
    start_lat DECIMAL(10, 8) NOT NULL,
    start_lng DECIMAL(11, 8) NOT NULL,

    -- End location information
    end_location TEXT NOT NULL,
    end_lat DECIMAL(10, 8) NOT NULL,
    end_lng DECIMAL(11, 8) NOT NULL,

    -- Schedule
    departure_date DATE NOT NULL,
    arrival_date DATE NOT NULL,

    -- Capacity and equipment
    available_capacity DECIMAL(10, 2) NOT NULL, -- in pounds
    equipment_type equipment_type_enum NOT NULL,

    -- Status
    status route_status_enum NOT NULL DEFAULT 'draft',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_coordinates_start CHECK (
        start_lat BETWEEN -90 AND 90 AND
        start_lng BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_coordinates_end CHECK (
        end_lat BETWEEN -90 AND 90 AND
        end_lng BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_capacity CHECK (available_capacity > 0),
    CONSTRAINT valid_dates CHECK (arrival_date >= departure_date),
    CONSTRAINT trucker_user_type CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = trucker_id
            AND users.user_type = 'trucker'
        )
    )
);

-- Create indexes for performance
CREATE INDEX idx_routes_trucker_id ON routes(trucker_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_departure_date ON routes(departure_date);
CREATE INDEX idx_routes_arrival_date ON routes(arrival_date);
CREATE INDEX idx_routes_created_at ON routes(created_at);
CREATE INDEX idx_routes_equipment_type ON routes(equipment_type);

-- Create composite indexes for common query patterns
CREATE INDEX idx_routes_status_departure_date ON routes(status, departure_date);
CREATE INDEX idx_routes_status_trucker_id ON routes(status, trucker_id);
CREATE INDEX idx_routes_equipment_status ON routes(equipment_type, status);

-- Create spatial indexes for location-based queries
CREATE INDEX idx_routes_start_coords ON routes(start_lat, start_lng);
CREATE INDEX idx_routes_end_coords ON routes(end_lat, end_lng);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE routes IS 'Stores route postings from truckers indicating their available capacity and travel plans';
COMMENT ON COLUMN routes.trucker_id IS 'Reference to the user (trucker) who posted the route';
COMMENT ON COLUMN routes.start_location IS 'Full address of route starting location';
COMMENT ON COLUMN routes.start_lat IS 'Latitude of start location';
COMMENT ON COLUMN routes.start_lng IS 'Longitude of start location';
COMMENT ON COLUMN routes.end_location IS 'Full address of route ending location';
COMMENT ON COLUMN routes.end_lat IS 'Latitude of end location';
COMMENT ON COLUMN routes.end_lng IS 'Longitude of end location';
COMMENT ON COLUMN routes.departure_date IS 'Date when the trucker plans to depart';
COMMENT ON COLUMN routes.arrival_date IS 'Date when the trucker plans to arrive';
COMMENT ON COLUMN routes.available_capacity IS 'Available cargo capacity in pounds';
COMMENT ON COLUMN routes.equipment_type IS 'Type of trailer/equipment available';
COMMENT ON COLUMN routes.status IS 'Current status of the route posting';
COMMENT ON COLUMN routes.created_at IS 'Timestamp when route was created';
COMMENT ON COLUMN routes.updated_at IS 'Timestamp when route was last updated';
