-- Migration: Create schedules table for job scheduling

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  queue VARCHAR(50) NOT NULL,
  job_name VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  pattern VARCHAR(100) NOT NULL, -- Cron pattern
  timezone VARCHAR(50) DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for finding due schedules
CREATE INDEX IF NOT EXISTS idx_schedules_due ON schedules (next_run_at)
WHERE enabled = TRUE;

-- Create index for finding schedules by name
CREATE INDEX IF NOT EXISTS idx_schedules_name ON schedules (name);

-- Comment on table
COMMENT ON TABLE schedules IS 'Scheduled job definitions for recurring tasks';

-- Comments on columns
COMMENT ON COLUMN schedules.id IS 'Unique identifier for the schedule';
COMMENT ON COLUMN schedules.name IS 'Human-readable name for the schedule';
COMMENT ON COLUMN schedules.queue IS 'Target queue for the scheduled job';
COMMENT ON COLUMN schedules.job_name IS 'Job type to schedule';
COMMENT ON COLUMN schedules.data IS 'Job data to pass to the scheduled job';
COMMENT ON COLUMN schedules.pattern IS 'Cron pattern defining the schedule';
COMMENT ON COLUMN schedules.timezone IS 'Timezone for the schedule';
COMMENT ON COLUMN schedules.enabled IS 'Whether the schedule is active';
COMMENT ON COLUMN schedules.last_run_at IS 'When the schedule last ran';
COMMENT ON COLUMN schedules.next_run_at IS 'When the schedule will next run';
COMMENT ON COLUMN schedules.created_at IS 'When the schedule was created';
COMMENT ON COLUMN schedules.updated_at IS 'When the schedule was last updated';
