-- Migration: Create Market Data Tables

-- Create historical prices table
CREATE TABLE IF NOT EXISTS historical_prices (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price NUMERIC(20, 10) NOT NULL,
  volume NUMERIC(20, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add unique constraint to prevent duplicates
  UNIQUE(symbol, timestamp)
);

-- Create index for historical prices
CREATE INDEX IF NOT EXISTS historical_prices_symbol_timestamp_idx ON historical_prices (symbol, timestamp);

-- Create historical market cap table
CREATE TABLE IF NOT EXISTS historical_market_cap (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  market_cap NUMERIC(30, 2) NOT NULL,
  price NUMERIC(20, 10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add unique constraint to prevent duplicates
  UNIQUE(symbol, timestamp)
);

-- Create index for historical market cap
CREATE INDEX IF NOT EXISTS historical_market_cap_symbol_timestamp_idx ON historical_market_cap (symbol, timestamp);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  target_value VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  achieved BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  next_milestone_id VARCHAR(50),
  previous_milestone_id VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for milestones
CREATE INDEX IF NOT EXISTS milestones_type_achieved_idx ON milestones (type, achieved);

-- Add foreign key constraints for milestones
ALTER TABLE milestones 
  ADD CONSTRAINT fk_next_milestone 
  FOREIGN KEY (next_milestone_id) 
  REFERENCES milestones(id) 
  ON DELETE SET NULL;

ALTER TABLE milestones 
  ADD CONSTRAINT fk_previous_milestone 
  FOREIGN KEY (previous_milestone_id) 
  REFERENCES milestones(id) 
  ON DELETE SET NULL;

-- Insert default milestones for market cap
INSERT INTO milestones (id, name, description, target_value, type, achieved)
VALUES
  ('marketcap-100k', 'First Milestone', 'Achieving $100,000 market cap', '100000', 'marketCap', FALSE),
  ('marketcap-500k', 'Growing Community', 'Reaching $500,000 market cap', '500000', 'marketCap', FALSE),
  ('marketcap-1m', 'Community Establishment', 'Crossing the $1 million market cap threshold', '1000000', 'marketCap', FALSE),
  ('marketcap-5m', 'Expansion Milestone', 'Reaching $5 million market cap', '5000000', 'marketCap', FALSE),
  ('marketcap-10m', 'Medium-term Goal', 'Crossing the $10 million market cap threshold', '10000000', 'marketCap', FALSE),
  ('marketcap-50m', 'Ambitious Target', 'Reaching $50 million market cap', '50000000', 'marketCap', FALSE),
  ('marketcap-100m', 'Long-term Vision', 'Crossing the $100 million market cap threshold', '100000000', 'marketCap', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Set up milestone relationships
UPDATE milestones SET next_milestone_id = 'marketcap-500k' WHERE id = 'marketcap-100k';
UPDATE milestones SET previous_milestone_id = 'marketcap-100k', next_milestone_id = 'marketcap-1m' WHERE id = 'marketcap-500k';
UPDATE milestones SET previous_milestone_id = 'marketcap-500k', next_milestone_id = 'marketcap-5m' WHERE id = 'marketcap-1m';
UPDATE milestones SET previous_milestone_id = 'marketcap-1m', next_milestone_id = 'marketcap-10m' WHERE id = 'marketcap-5m';
UPDATE milestones SET previous_milestone_id = 'marketcap-5m', next_milestone_id = 'marketcap-50m' WHERE id = 'marketcap-10m';
UPDATE milestones SET previous_milestone_id = 'marketcap-10m', next_milestone_id = 'marketcap-100m' WHERE id = 'marketcap-50m';
UPDATE milestones SET previous_milestone_id = 'marketcap-50m' WHERE id = 'marketcap-100m';
