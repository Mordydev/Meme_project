-- Migration: Create job_history table for tracking job execution

-- Create job_history table
CREATE TABLE IF NOT EXISTS job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue VARCHAR(50) NOT NULL,
  job_id VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  options JSONB NOT NULL,
  result JSONB,
  error JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  processing_time INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_job_history_queue ON job_history (queue);
CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_history (job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_name ON job_history (name);
CREATE INDEX IF NOT EXISTS idx_job_history_status ON job_history (status);
CREATE INDEX IF NOT EXISTS idx_job_history_started_at ON job_history (started_at);
CREATE INDEX IF NOT EXISTS idx_job_history_finished_at ON job_history (finished_at);

-- Comment on table
COMMENT ON TABLE job_history IS 'History of job executions for analytics and debugging';

-- Comments on columns
COMMENT ON COLUMN job_history.id IS 'Unique identifier for the history entry';
COMMENT ON COLUMN job_history.queue IS 'Queue the job was processed in';
COMMENT ON COLUMN job_history.job_id IS 'ID of the job';
COMMENT ON COLUMN job_history.name IS 'Type/name of the job';
COMMENT ON COLUMN job_history.data IS 'Job data (sanitized)';
COMMENT ON COLUMN job_history.options IS 'Job options';
COMMENT ON COLUMN job_history.result IS 'Job result (for completed jobs)';
COMMENT ON COLUMN job_history.error IS 'Error information (for failed jobs)';
COMMENT ON COLUMN job_history.started_at IS 'When the job processing started';
COMMENT ON COLUMN job_history.finished_at IS 'When the job processing finished';
COMMENT ON COLUMN job_history.processing_time IS 'Processing time in milliseconds';
COMMENT ON COLUMN job_history.attempts IS 'Number of attempts for this job';
COMMENT ON COLUMN job_history.status IS 'Final status of the job';
COMMENT ON COLUMN job_history.created_at IS 'When this history entry was created';
