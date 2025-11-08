# Migration 004: Publishing Analytics

**Created**: 2025-11-08
**Status**: Ready for deployment

## Purpose

This migration creates the database schema for the Publishing Analytics Dashboard, enabling tracking and analysis of publishing performance across all platforms.

## Tables Created

### 1. `publishing_events`

Detailed log of every publishing attempt with timing and status information.

**Columns:**
- `event_id` (BIGSERIAL, PK) - Auto-incrementing event identifier
- `pack_id` (TEXT, FK) - References content_packs.pack_id
- `platform` (TEXT) - Publishing platform (twitter, linkedin, facebook, etc.)
- `status` (TEXT) - Event status (pending, processing, published, failed)
- `started_at` (TIMESTAMPTZ) - When publishing started
- `completed_at` (TIMESTAMPTZ) - When publishing completed
- `duration_ms` (INTEGER) - Publishing duration in milliseconds
- `error_message` (TEXT) - Error details if failed
- `retry_count` (SMALLINT) - Number of retry attempts
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

**Indexes:**
- `idx_publishing_events_pack` - On pack_id
- `idx_publishing_events_platform` - On platform
- `idx_publishing_events_status` - On status
- `idx_publishing_events_created` - On created_at
- `idx_publishing_events_platform_date` - Composite on (platform, created_at)
- `idx_publishing_events_success` - Partial index on successful publishes

### 2. `publishing_daily_metrics`

Pre-aggregated daily metrics for fast dashboard queries.

**Columns:**
- `id` (SERIAL, PK) - Auto-incrementing identifier
- `date` (DATE) - Metric date
- `platform` (TEXT) - Publishing platform
- `total_attempts` (INTEGER) - Total publishing attempts
- `successful` (INTEGER) - Successful publishes
- `failed` (INTEGER) - Failed publishes
- `avg_duration_ms` (INTEGER) - Average duration of successful publishes
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- `idx_daily_metrics_date` - On date
- `idx_daily_metrics_platform` - On platform
- `idx_daily_metrics_date_platform` - Composite on (date, platform)

**Unique Constraint:**
- (date, platform) - One record per platform per day

## Usage

### Running the Migration

```bash
# Automatic (via migration runner)
pnpm --filter @cm/api run migrate

# Manual (if needed)
psql $DATABASE_URL -f infra/migrations/004_publishing_analytics.sql
```

### Rollback (Manual)

```sql
DROP TABLE IF EXISTS publishing_daily_metrics;
DROP TABLE IF EXISTS publishing_events;
```

## Data Flow

1. **Real-time Logging**: Publishing events are logged to `publishing_events` as they occur
2. **Daily Aggregation**: A background job aggregates data into `publishing_daily_metrics` (Task 4)
3. **Dashboard Queries**: Dashboard reads from `publishing_daily_metrics` for fast performance

## Performance Considerations

- **Events Table**: Will grow large over time. Consider partitioning by date if > 10M rows
- **Daily Metrics**: Small table, fast queries. ~365 rows per platform per year
- **Indexes**: Optimized for:
  - Date range queries
  - Platform filtering
  - Status filtering
  - Success rate calculations

## Related Tasks

- Task 2: Create Event Logger Service (uses `publishing_events`)
- Task 4: Create Daily Aggregation Job (populates `publishing_daily_metrics`)
- Tasks 5-8: Analytics Query Services (read from `publishing_daily_metrics`)
- Tasks 9-12: API Endpoints (expose analytics data)

## Testing

After running migration:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('publishing_events', 'publishing_daily_metrics');

-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('publishing_events', 'publishing_daily_metrics');

-- Test insert
INSERT INTO publishing_events (pack_id, platform, status, started_at)
VALUES ('test-pack', 'twitter', 'processing', now())
RETURNING event_id;

-- Test daily metrics
INSERT INTO publishing_daily_metrics (date, platform, total_attempts, successful)
VALUES (CURRENT_DATE, 'twitter', 10, 9);
```

## Notes

- Foreign key to `content_packs` with CASCADE delete
- Partial index on successful publishes for performance
- Comments added for documentation
- Follows existing migration naming convention (001, 002, 003, 004)
