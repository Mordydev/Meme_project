-- Initialize database for Success Kid Community Platform

-- Create test database for running tests
CREATE DATABASE "successKidPlatform_test";
GRANT ALL PRIVILEGES ON DATABASE "successKidPlatform_test" TO dev;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create essential schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Switch to public schema for table creation
SET search_path TO public;

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('active', 'deleted', 'flagged');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM ('text', 'image', 'link', 'poll');
    END IF;
END $$;

-- The core tables will be managed by the backend API using migrations
-- This script only creates the necessary extensions and schemas
