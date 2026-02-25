-- Migration: Add 'cancelled' value to load_status_enum
-- Description: Adds 'cancelled' status to the load_status_enum for load cancellation support
-- Created: 2026-02-16
-- Version: 007

-- Add 'cancelled' to the load_status_enum
ALTER TYPE load_status_enum ADD VALUE IF NOT EXISTS 'cancelled';

-- Add comment for documentation
COMMENT ON TYPE load_status_enum IS 'Valid load statuses: pending, assigned, in_transit, delivered, cancelled';
