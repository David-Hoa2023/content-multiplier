# Publishing Analytics API - Testing Guide

This guide explains how to test the Publishing Analytics API endpoints that were implemented in Tasks 1-12.

## Prerequisites

1. **Database Running**: PostgreSQL database must be running and accessible
2. **Migrations Applied**: All migrations including `004_publishing_analytics.sql` must be applied
3. **Test Data**: Publishing events data must exist in the database
4. **API Server Running**: The Fastify API server must be running on port 3001

## Setup Steps

### 1. Apply Database Migration

If not already applied, run the analytics migration:

```bash
psql $DATABASE_URL -f infra/migrations/004_publishing_analytics.sql
```

### 2. Seed Test Data

Insert test publishing events into the database:

```bash
psql $DATABASE_URL -f scripts/seed-analytics-data.sql
```

This will create approximately 280 publishing events across 9 platforms with realistic success rates and durations.

### 3. Aggregate Metrics

Run the aggregation job to populate the daily metrics table:

```bash
cd apps/api
pnpm aggregate-metrics range 2024-01-01 2025-12-31
```

Or aggregate just yesterday's data:

```bash
pnpm aggregate-metrics
```

Check aggregation status:

```bash
pnpm aggregate-metrics:status
```

### 4. Start API Server

```bash
cd apps/api
pnpm dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

All endpoints support optional date range query parameters:
- `start_date`: ISO date string (YYYY-MM-DD), defaults to 30 days ago
- `end_date`: ISO date string (YYYY-MM-DD), defaults to today

### Endpoint 1: Success Rates

**GET** `/api/analytics/publishing/success-rates`

Returns success/failure rates by platform and overall success rate.

**Test Command:**
```bash
# Last 30 days (default)
curl http://localhost:3001/api/analytics/publishing/success-rates

# Specific date range
curl "http://localhost:3001/api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31"
```

**Expected Response:**
```json
{
  "start_date": "2024-11-10",
  "end_date": "2024-12-10",
  "overall_success_rate": 89.25,
  "by_platform": [
    {
      "platform": "twitter",
      "total_attempts": 50,
      "successful": 48,
      "failed": 2,
      "success_rate": 96.0
    },
    {
      "platform": "linkedin",
      "total_attempts": 40,
      "successful": 37,
      "failed": 3,
      "success_rate": 92.5
    }
  ]
}
```

### Endpoint 2: Average Publishing Times

**GET** `/api/analytics/publishing/average-times`

Returns average publishing duration per platform, with fastest and slowest platforms identified.

**Test Command:**
```bash
curl http://localhost:3001/api/analytics/publishing/average-times
```

**Expected Response:**
```json
{
  "start_date": "2024-11-10",
  "end_date": "2024-12-10",
  "fastest_platform": "sendgrid",
  "slowest_platform": "youtube",
  "by_platform": [
    {
      "platform": "sendgrid",
      "avg_duration_ms": 850,
      "avg_duration_seconds": 0.85,
      "total_publishes": 29
    },
    {
      "platform": "twitter",
      "avg_duration_ms": 1200,
      "avg_duration_seconds": 1.2,
      "total_publishes": 48
    },
    {
      "platform": "youtube",
      "avg_duration_ms": 17500,
      "avg_duration_seconds": 17.5,
      "total_publishes": 15
    }
  ]
}
```

### Endpoint 3: Time Distribution

**GET** `/api/analytics/publishing/time-distribution`

Returns publishing distribution by hour of day and day of week, with the most popular hour.

**Test Command:**
```bash
curl http://localhost:3001/api/analytics/publishing/time-distribution
```

**Expected Response:**
```json
{
  "start_date": "2024-11-10",
  "end_date": "2024-12-10",
  "most_popular_hour": 14,
  "by_hour": [
    { "hour": 0, "count": 5 },
    { "hour": 1, "count": 8 },
    { "hour": 14, "count": 25 }
  ],
  "by_day_of_week": [
    { "day_of_week": 0, "day_name": "Sunday", "count": 12 },
    { "day_of_week": 1, "day_name": "Monday", "count": 45 },
    { "day_of_week": 2, "day_name": "Tuesday", "count": 38 }
  ]
}
```

### Endpoint 4: Platform Usage

**GET** `/api/analytics/publishing/platform-usage`

Returns platform usage statistics with percentages and last publish timestamp.

**Test Command:**
```bash
curl http://localhost:3001/api/analytics/publishing/platform-usage
```

**Expected Response:**
```json
{
  "start_date": "2024-11-10",
  "end_date": "2024-12-10",
  "most_used_platform": "twitter",
  "platforms": [
    {
      "platform": "twitter",
      "total_publishes": 48,
      "usage_percentage": 19.2,
      "last_published_at": "2024-12-09T14:30:00Z"
    },
    {
      "platform": "linkedin",
      "total_publishes": 37,
      "usage_percentage": 14.8,
      "last_published_at": "2024-12-08T10:15:00Z"
    }
  ]
}
```

## Testing Checklist

Use this checklist to verify all functionality:

### Database Layer
- [ ] Migration 004 creates `publishing_events` table
- [ ] Migration 004 creates `publishing_daily_metrics` table
- [ ] Migration 004 creates all 9 indexes
- [ ] Test data seeding script runs without errors
- [ ] Events are inserted with various timestamps across 30 days

### Aggregation Job
- [ ] `pnpm aggregate-metrics` runs without errors
- [ ] Daily metrics are populated in `publishing_daily_metrics` table
- [ ] `pnpm aggregate-metrics:status` shows aggregated dates
- [ ] Range aggregation works: `pnpm aggregate-metrics range 2024-01-01 2024-12-31`
- [ ] Cleanup command works: `pnpm aggregate-metrics:cleanup 90`

### Analytics Service
- [ ] `getSuccessRates()` returns correct calculations
- [ ] `getOverallSuccessRate()` returns correct percentage
- [ ] `getAveragePublishingTimes()` returns sorted by speed (ASC)
- [ ] `getPublishingTimeExtremes()` identifies fastest and slowest correctly
- [ ] `getPublishingByHour()` returns 24-hour distribution
- [ ] `getPublishingByDayOfWeek()` returns 7-day distribution with names
- [ ] `getMostPopularHour()` identifies peak hour correctly
- [ ] `getPlatformUsageStats()` calculates percentages correctly
- [ ] `getMostUsedPlatform()` returns highest volume platform

### API Endpoints
- [ ] All endpoints return 200 status code
- [ ] All endpoints return valid JSON
- [ ] Date range filtering works correctly
- [ ] Default to last 30 days when no dates provided
- [ ] Invalid date formats are handled gracefully
- [ ] Empty data scenarios return appropriate empty arrays/nulls

### Edge Cases
- [ ] No data: endpoints handle empty database gracefully
- [ ] Single platform: percentages and comparisons work
- [ ] All failures: success rate shows 0%
- [ ] All successes: success rate shows 100%
- [ ] Division by zero: handled with NULLIF in SQL queries

## Manual SQL Queries for Verification

Check raw event counts:
```sql
SELECT platform, status, COUNT(*)
FROM publishing_events
GROUP BY platform, status
ORDER BY platform, status;
```

Check aggregated metrics:
```sql
SELECT date, platform, total_attempts, successful, failed, avg_duration_ms
FROM publishing_daily_metrics
ORDER BY date DESC, platform;
```

Verify success rate calculation:
```sql
SELECT
  platform,
  SUM(successful)::DECIMAL / NULLIF(SUM(total_attempts), 0) * 100 AS success_rate
FROM publishing_daily_metrics
WHERE date >= CURRENT_DATE - 30
GROUP BY platform;
```

## Troubleshooting

### Issue: No data returned
- Verify events exist: `SELECT COUNT(*) FROM publishing_events;`
- Verify metrics aggregated: `SELECT COUNT(*) FROM publishing_daily_metrics;`
- Check date range matches your data

### Issue: Aggregation job fails
- Check DATABASE_URL is set correctly
- Verify all migrations are applied
- Check for SQL syntax errors in console output

### Issue: API returns 500 error
- Check API logs for specific error
- Verify database connection is working
- Check that analytics routes are registered in index.ts

### Issue: Wrong calculations
- Re-run aggregation job to refresh metrics
- Verify SQL queries in publishing-analytics.ts
- Check for timezone issues in date filtering

## Next Steps

After verifying the backend API works correctly:

1. **Tasks 13-23**: Build the frontend React dashboard
2. **Tasks 24-25**: Write comprehensive tests
3. **Production**: Set up scheduled aggregation job (daily cron)
4. **Monitoring**: Add alerting for aggregation failures

## API Architecture Summary

```
┌─────────────────────┐
│ Publishing Flow     │
│ (orchestrator.ts)   │
└──────┬──────────────┘
       │
       │ logs events
       ↓
┌─────────────────────┐
│ publishing_events   │  ← Raw event log (every publish)
│ (database table)    │
└──────┬──────────────┘
       │
       │ aggregated by
       ↓
┌─────────────────────┐
│ Aggregation Job     │
│ (cron: daily)       │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ publishing_daily_   │  ← Pre-aggregated metrics
│ metrics (table)     │     (one row per platform per day)
└──────┬──────────────┘
       │
       │ queried by
       ↓
┌─────────────────────┐
│ Analytics Service   │
│ (publishing-        │
│  analytics.ts)      │
└──────┬──────────────┘
       │
       │ exposed via
       ↓
┌─────────────────────┐
│ REST API Endpoints  │
│ /api/analytics/*    │
└─────────────────────┘
```

This two-tier storage strategy ensures:
- Complete audit trail (raw events)
- Fast dashboard queries (pre-aggregated metrics)
- Historical data retention (cleanup old raw events, keep metrics)
