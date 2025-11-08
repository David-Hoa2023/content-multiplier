-- Publishing Analytics Schema
-- Migration: 004_publishing_analytics
-- Description: Tables for tracking publishing performance and generating analytics

-- Publishing events log
-- Records every publishing attempt with timing and status information
CREATE TABLE publishing_events (
  event_id BIGSERIAL PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,  -- pending, processing, published, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,  -- Time to publish in milliseconds
  error_message TEXT,
  retry_count SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_publishing_events_pack ON publishing_events(pack_id);
CREATE INDEX idx_publishing_events_platform ON publishing_events(platform);
CREATE INDEX idx_publishing_events_status ON publishing_events(status);
CREATE INDEX idx_publishing_events_created ON publishing_events(created_at);

-- Composite index for date range queries by platform
CREATE INDEX idx_publishing_events_platform_date ON publishing_events(platform, created_at);

-- Index for filtering successful publishes
CREATE INDEX idx_publishing_events_success ON publishing_events(status, completed_at) WHERE status = 'published';

-- Aggregated daily metrics (for performance)
-- Pre-computed rollups for faster dashboard queries
CREATE TABLE publishing_daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, platform)
);

-- Indexes for daily metrics
CREATE INDEX idx_daily_metrics_date ON publishing_daily_metrics(date);
CREATE INDEX idx_daily_metrics_platform ON publishing_daily_metrics(platform);

-- Composite index for date range + platform queries
CREATE INDEX idx_daily_metrics_date_platform ON publishing_daily_metrics(date, platform);

-- Comments for documentation
COMMENT ON TABLE publishing_events IS 'Detailed log of every publishing attempt with timing and status';
COMMENT ON TABLE publishing_daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard queries';

COMMENT ON COLUMN publishing_events.duration_ms IS 'Publishing duration in milliseconds (from started_at to completed_at)';
COMMENT ON COLUMN publishing_events.retry_count IS 'Number of retry attempts (0 for first attempt)';
COMMENT ON COLUMN publishing_daily_metrics.avg_duration_ms IS 'Average publishing duration for successful publishes only';
