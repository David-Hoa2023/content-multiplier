# Publishing Analytics Dashboard - AI Agent Task Breakdown

**Feature**: Publishing Analytics Dashboard (from Phase 1)
**Total Estimate**: 5 days → Broken into 25 atomic tasks
**Difficulty**: Medium

---

## Overview

This feature tracks and visualizes publishing performance across all platforms. It consists of:
- Backend: Data collection, aggregation, and API endpoints
- Frontend: Dashboard UI with charts and metrics
- Database: Analytics tables and queries

---

## Task Dependencies Graph

```
[Task 1] Database Schema
    ↓
[Task 2-4] Data Collection Layer
    ↓
[Task 5-8] Aggregation & Metrics Calculation
    ↓
[Task 9-12] API Endpoints
    ↓
[Task 13-16] Frontend Components
    ↓
[Task 17-20] Charts & Visualizations
    ↓
[Task 21-23] Dashboard Integration
    ↓
[Task 24-25] Testing & Polish
```

---

## Backend Tasks (Tasks 1-12)

### Task 1: Create Publishing Analytics Database Schema
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: None

**Objective**: Create database tables to store publishing analytics data.

**File to create**: `infra/migrations/004_publishing_analytics.sql`

**Implementation**:
```sql
-- Publishing events log
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publishing_events_pack ON publishing_events(pack_id);
CREATE INDEX idx_publishing_events_platform ON publishing_events(platform);
CREATE INDEX idx_publishing_events_status ON publishing_events(status);
CREATE INDEX idx_publishing_events_created ON publishing_events(created_at);

-- Aggregated daily metrics (for performance)
CREATE TABLE publishing_daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform)
);

CREATE INDEX idx_daily_metrics_date ON publishing_daily_metrics(date);
CREATE INDEX idx_daily_metrics_platform ON publishing_daily_metrics(platform);
```

**Acceptance Criteria**:
- [ ] Migration file created
- [ ] Tables have proper indexes
- [ ] Foreign keys are correct
- [ ] Can run migration without errors

---

### Task 2: Create Publishing Event Logger Service
**Estimate**: 1.5 hours
**Difficulty**: Easy
**Dependencies**: Task 1

**Objective**: Create a service to log publishing events to the database.

**File to create**: `apps/api/src/services/analytics/publishing-events.ts`

**Implementation**:
```typescript
import { query } from '../../db';

interface PublishingEventData {
  pack_id: string;
  platform: string;
  status: 'pending' | 'processing' | 'published' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  error_message?: string;
  retry_count?: number;
}

export class PublishingEventLogger {
  /**
   * Log a publishing event
   */
  async logEvent(data: PublishingEventData): Promise<string> {
    const result = await query(
      `INSERT INTO publishing_events
       (pack_id, platform, status, started_at, completed_at, duration_ms, error_message, retry_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING event_id`,
      [
        data.pack_id,
        data.platform,
        data.status,
        data.started_at,
        data.completed_at,
        data.duration_ms,
        data.error_message,
        data.retry_count || 0
      ]
    );

    return result.rows[0].event_id;
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    event_id: string,
    updates: Partial<PublishingEventData>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    if (fields.length === 0) return;

    values.push(event_id);
    await query(
      `UPDATE publishing_events SET ${fields.join(', ')} WHERE event_id = $${paramCount}`,
      values
    );
  }

  /**
   * Mark event as started
   */
  async markStarted(pack_id: string, platform: string): Promise<string> {
    return this.logEvent({
      pack_id,
      platform,
      status: 'processing',
      started_at: new Date()
    });
  }

  /**
   * Mark event as successful
   */
  async markSuccess(event_id: string, duration_ms: number): Promise<void> {
    await this.updateEvent(event_id, {
      status: 'published',
      completed_at: new Date(),
      duration_ms
    });
  }

  /**
   * Mark event as failed
   */
  async markFailed(
    event_id: string,
    error_message: string,
    retry_count: number = 0
  ): Promise<void> {
    await this.updateEvent(event_id, {
      status: 'failed',
      completed_at: new Date(),
      error_message,
      retry_count
    });
  }
}

export const publishingEventLogger = new PublishingEventLogger();
```

**Acceptance Criteria**:
- [ ] Service can log new events
- [ ] Service can update existing events
- [ ] Helper methods work (markStarted, markSuccess, markFailed)
- [ ] TypeScript types are correct
- [ ] No TypeScript errors

**Usage Example**:
```typescript
// In publishing service
const eventId = await publishingEventLogger.markStarted(pack_id, 'twitter');
try {
  await publishToTwitter(content);
  await publishingEventLogger.markSuccess(eventId, 2500); // 2.5 seconds
} catch (error) {
  await publishingEventLogger.markFailed(eventId, error.message, 0);
}
```

---

### Task 3: Integrate Event Logging into Publishing Queue
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 2

**Objective**: Add event logging to the existing publishing orchestrator.

**File to modify**: `apps/api/src/services/publishing/orchestrator.ts`

**Implementation**:
Add logging at key points in the publishing flow:

```typescript
import { publishingEventLogger } from '../analytics/publishing-events';

export class PublishingOrchestrator {
  async publish(pack_id: string, platforms: string[]): Promise<void> {
    for (const platform of platforms) {
      // Log start
      const eventId = await publishingEventLogger.markStarted(pack_id, platform);
      const startTime = Date.now();

      try {
        // Existing publishing logic
        await this.publishToPlatform(pack_id, platform);

        // Log success
        const duration = Date.now() - startTime;
        await publishingEventLogger.markSuccess(eventId, duration);
      } catch (error) {
        // Log failure
        await publishingEventLogger.markFailed(
          eventId,
          error.message,
          0 // retry count handled elsewhere
        );
        throw error;
      }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Events logged on publish start
- [ ] Events logged on publish success
- [ ] Events logged on publish failure
- [ ] Duration calculated correctly
- [ ] No breaking changes to existing code

---

### Task 4: Create Daily Metrics Aggregation Job
**Estimate**: 2 hours
**Difficulty**: Medium
**Dependencies**: Task 2

**Objective**: Create a background job to aggregate daily metrics for performance.

**File to create**: `apps/api/src/jobs/aggregate-publishing-metrics.ts`

**Implementation**:
```typescript
import { query } from '../db';

/**
 * Aggregate publishing events into daily metrics
 * Run this daily (e.g., via cron at midnight)
 */
export async function aggregatePublishingMetrics(date?: Date): Promise<void> {
  const targetDate = date || new Date();
  const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Aggregating publishing metrics for ${dateStr}...`);

  // Aggregate by platform
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'medium', 'wordpress'];

  for (const platform of platforms) {
    const result = await query(
      `SELECT
         COUNT(*) as total_attempts,
         COUNT(*) FILTER (WHERE status = 'published') as successful,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         AVG(duration_ms) FILTER (WHERE status = 'published') as avg_duration_ms
       FROM publishing_events
       WHERE platform = $1
         AND DATE(created_at) = $2`,
      [platform, dateStr]
    );

    const stats = result.rows[0];

    // Upsert into daily metrics
    await query(
      `INSERT INTO publishing_daily_metrics
       (date, platform, total_attempts, successful, failed, avg_duration_ms, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (date, platform)
       DO UPDATE SET
         total_attempts = EXCLUDED.total_attempts,
         successful = EXCLUDED.successful,
         failed = EXCLUDED.failed,
         avg_duration_ms = EXCLUDED.avg_duration_ms,
         updated_at = NOW()`,
      [
        dateStr,
        platform,
        stats.total_attempts || 0,
        stats.successful || 0,
        stats.failed || 0,
        Math.round(stats.avg_duration_ms || 0)
      ]
    );
  }

  console.log(`✅ Metrics aggregated for ${dateStr}`);
}

// If run directly
if (require.main === module) {
  aggregatePublishingMetrics()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
```

**Acceptance Criteria**:
- [ ] Aggregates data for all platforms
- [ ] Upserts (doesn't duplicate) daily metrics
- [ ] Handles missing data gracefully
- [ ] Can be run manually or via cron
- [ ] Logs progress

**Add to package.json**:
```json
{
  "scripts": {
    "aggregate-metrics": "tsx src/jobs/aggregate-publishing-metrics.ts"
  }
}
```

---

### Task 5: Create Analytics Query Service - Success Rate
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 4

**Objective**: Create service to query success/failure rates.

**File to create**: `apps/api/src/services/analytics/publishing-analytics.ts`

**Implementation**:
```typescript
import { query } from '../../db';

export interface SuccessRateMetrics {
  platform: string;
  total_attempts: number;
  successful: number;
  failed: number;
  success_rate: number; // percentage
}

export class PublishingAnalytics {
  /**
   * Get success/failure rates by platform for a date range
   */
  async getSuccessRates(
    startDate: Date,
    endDate: Date
  ): Promise<SuccessRateMetrics[]> {
    const result = await query(
      `SELECT
         platform,
         SUM(total_attempts) as total_attempts,
         SUM(successful) as successful,
         SUM(failed) as failed,
         ROUND(
           (SUM(successful)::DECIMAL / NULLIF(SUM(total_attempts), 0) * 100)::NUMERIC,
           2
         ) as success_rate
       FROM publishing_daily_metrics
       WHERE date >= $1 AND date <= $2
       GROUP BY platform
       ORDER BY total_attempts DESC`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    return result.rows.map(row => ({
      platform: row.platform,
      total_attempts: parseInt(row.total_attempts),
      successful: parseInt(row.successful),
      failed: parseInt(row.failed),
      success_rate: parseFloat(row.success_rate) || 0
    }));
  }

  /**
   * Get overall success rate (all platforms)
   */
  async getOverallSuccessRate(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await query(
      `SELECT
         ROUND(
           (SUM(successful)::DECIMAL / NULLIF(SUM(total_attempts), 0) * 100)::NUMERIC,
           2
         ) as success_rate
       FROM publishing_daily_metrics
       WHERE date >= $1 AND date <= $2`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    return parseFloat(result.rows[0]?.success_rate) || 0;
  }
}

export const publishingAnalytics = new PublishingAnalytics();
```

**Acceptance Criteria**:
- [ ] Returns success rates by platform
- [ ] Calculates percentages correctly
- [ ] Handles date ranges
- [ ] Returns empty array for no data
- [ ] TypeScript types are correct

---

### Task 6: Create Analytics Query Service - Average Publishing Time
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 5

**Objective**: Add method to query average publishing time per platform.

**File to modify**: `apps/api/src/services/analytics/publishing-analytics.ts`

**Implementation**:
Add this method to the `PublishingAnalytics` class:

```typescript
export interface PublishingTimeMetrics {
  platform: string;
  avg_duration_ms: number;
  avg_duration_seconds: number;
  total_publishes: number;
}

export class PublishingAnalytics {
  // ... existing methods ...

  /**
   * Get average publishing time per platform
   */
  async getAveragePublishingTimes(
    startDate: Date,
    endDate: Date
  ): Promise<PublishingTimeMetrics[]> {
    const result = await query(
      `SELECT
         platform,
         ROUND(AVG(avg_duration_ms)) as avg_duration_ms,
         SUM(successful) as total_publishes
       FROM publishing_daily_metrics
       WHERE date >= $1 AND date <= $2
       GROUP BY platform
       HAVING SUM(successful) > 0
       ORDER BY avg_duration_ms ASC`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    return result.rows.map(row => ({
      platform: row.platform,
      avg_duration_ms: parseInt(row.avg_duration_ms),
      avg_duration_seconds: parseFloat((parseInt(row.avg_duration_ms) / 1000).toFixed(2)),
      total_publishes: parseInt(row.total_publishes)
    }));
  }

  /**
   * Get fastest and slowest platforms
   */
  async getPublishingTimeExtremes(
    startDate: Date,
    endDate: Date
  ): Promise<{ fastest: string; slowest: string }> {
    const times = await this.getAveragePublishingTimes(startDate, endDate);

    if (times.length === 0) {
      return { fastest: 'N/A', slowest: 'N/A' };
    }

    return {
      fastest: times[0].platform, // Already sorted ASC
      slowest: times[times.length - 1].platform
    };
  }
}
```

**Acceptance Criteria**:
- [ ] Returns average time per platform
- [ ] Converts milliseconds to seconds
- [ ] Excludes failed publishes from average
- [ ] Sorts by speed (fastest first)
- [ ] Handles empty data

---

### Task 7: Create Analytics Query Service - Popular Publishing Times
**Estimate**: 1.5 hours
**Difficulty**: Medium
**Dependencies**: Task 5

**Objective**: Add method to query most popular publishing times (hour of day, day of week).

**File to modify**: `apps/api/src/services/analytics/publishing-analytics.ts`

**Implementation**:
```typescript
export interface PublishingTimeDistribution {
  hour: number; // 0-23
  count: number;
}

export interface DayDistribution {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  day_name: string;
  count: number;
}

export class PublishingAnalytics {
  // ... existing methods ...

  /**
   * Get publishing distribution by hour of day
   */
  async getPublishingByHour(
    startDate: Date,
    endDate: Date
  ): Promise<PublishingTimeDistribution[]> {
    const result = await query(
      `SELECT
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as count
       FROM publishing_events
       WHERE status = 'published'
         AND created_at >= $1
         AND created_at <= $2
       GROUP BY hour
       ORDER BY hour`,
      [startDate, endDate]
    );

    return result.rows.map(row => ({
      hour: parseInt(row.hour),
      count: parseInt(row.count)
    }));
  }

  /**
   * Get publishing distribution by day of week
   */
  async getPublishingByDayOfWeek(
    startDate: Date,
    endDate: Date
  ): Promise<DayDistribution[]> {
    const result = await query(
      `SELECT
         EXTRACT(DOW FROM created_at) as day_of_week,
         COUNT(*) as count
       FROM publishing_events
       WHERE status = 'published'
         AND created_at >= $1
         AND created_at <= $2
       GROUP BY day_of_week
       ORDER BY day_of_week`,
      [startDate, endDate]
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return result.rows.map(row => ({
      day_of_week: parseInt(row.day_of_week),
      day_name: dayNames[parseInt(row.day_of_week)],
      count: parseInt(row.count)
    }));
  }

  /**
   * Get most popular publishing time (hour)
   */
  async getMostPopularHour(startDate: Date, endDate: Date): Promise<number | null> {
    const distribution = await this.getPublishingByHour(startDate, endDate);

    if (distribution.length === 0) return null;

    return distribution.reduce((max, curr) =>
      curr.count > max.count ? curr : max
    ).hour;
  }
}
```

**Acceptance Criteria**:
- [ ] Returns hourly distribution (0-23)
- [ ] Returns day of week distribution with names
- [ ] Finds most popular hour
- [ ] Only counts successful publishes
- [ ] Handles timezones correctly

---

### Task 8: Create Analytics Query Service - Platform Usage Stats
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 5

**Objective**: Add method to query platform usage statistics.

**File to modify**: `apps/api/src/services/analytics/publishing-analytics.ts`

**Implementation**:
```typescript
export interface PlatformUsageStats {
  platform: string;
  total_publishes: number;
  usage_percentage: number;
  last_published_at: Date | null;
}

export class PublishingAnalytics {
  // ... existing methods ...

  /**
   * Get platform usage statistics
   */
  async getPlatformUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<PlatformUsageStats[]> {
    const result = await query(
      `WITH totals AS (
         SELECT SUM(successful) as grand_total
         FROM publishing_daily_metrics
         WHERE date >= $1 AND date <= $2
       )
       SELECT
         pdm.platform,
         SUM(pdm.successful) as total_publishes,
         ROUND(
           (SUM(pdm.successful)::DECIMAL / NULLIF(totals.grand_total, 0) * 100)::NUMERIC,
           2
         ) as usage_percentage,
         MAX(pe.completed_at) as last_published_at
       FROM publishing_daily_metrics pdm
       CROSS JOIN totals
       LEFT JOIN publishing_events pe ON pe.platform = pdm.platform AND pe.status = 'published'
       WHERE pdm.date >= $1 AND pdm.date <= $2
       GROUP BY pdm.platform, totals.grand_total
       ORDER BY total_publishes DESC`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    return result.rows.map(row => ({
      platform: row.platform,
      total_publishes: parseInt(row.total_publishes),
      usage_percentage: parseFloat(row.usage_percentage) || 0,
      last_published_at: row.last_published_at ? new Date(row.last_published_at) : null
    }));
  }

  /**
   * Get most used platform
   */
  async getMostUsedPlatform(startDate: Date, endDate: Date): Promise<string | null> {
    const stats = await this.getPlatformUsageStats(startDate, endDate);
    return stats.length > 0 ? stats[0].platform : null;
  }
}
```

**Acceptance Criteria**:
- [ ] Returns usage stats for all platforms
- [ ] Calculates percentage of total
- [ ] Shows last published timestamp
- [ ] Sorts by usage (most used first)
- [ ] Handles zero publishes

---

### Task 9: Create API Endpoint - Get Success Rates
**Estimate**: 0.5 hours
**Difficulty**: Easy
**Dependencies**: Task 5

**Objective**: Create REST API endpoint to get success rates.

**File to create**: `apps/api/src/routes/analytics.ts`

**Implementation**:
```typescript
import { FastifyInstance } from 'fastify';
import { publishingAnalytics } from '../services/analytics/publishing-analytics';

export async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/analytics/publishing/success-rates
   * Get success/failure rates by platform
   */
  fastify.get('/publishing/success-rates', async (request, reply) => {
    const { start_date, end_date } = request.query as {
      start_date?: string;
      end_date?: string;
    };

    // Default to last 30 days
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date
      ? new Date(start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const successRates = await publishingAnalytics.getSuccessRates(startDate, endDate);
    const overallRate = await publishingAnalytics.getOverallSuccessRate(startDate, endDate);

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      overall_success_rate: overallRate,
      by_platform: successRates
    };
  });
}
```

**Register in** `apps/api/src/index.ts`:
```typescript
import { analyticsRoutes } from './routes/analytics';

// Register routes
fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
```

**Acceptance Criteria**:
- [ ] Endpoint responds to GET requests
- [ ] Accepts date range query parameters
- [ ] Defaults to last 30 days
- [ ] Returns JSON response
- [ ] Returns 200 status code

**Test with curl**:
```bash
curl http://localhost:3001/api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31
```

---

### Task 10: Create API Endpoint - Get Publishing Times
**Estimate**: 0.5 hours
**Difficulty**: Easy
**Dependencies**: Task 6

**Objective**: Create REST API endpoint for average publishing times.

**File to modify**: `apps/api/src/routes/analytics.ts`

**Implementation**:
Add this route to the `analyticsRoutes` function:

```typescript
/**
 * GET /api/analytics/publishing/average-times
 * Get average publishing time per platform
 */
fastify.get('/publishing/average-times', async (request, reply) => {
  const { start_date, end_date } = request.query as {
    start_date?: string;
    end_date?: string;
  };

  const endDate = end_date ? new Date(end_date) : new Date();
  const startDate = start_date
    ? new Date(start_date)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const times = await publishingAnalytics.getAveragePublishingTimes(startDate, endDate);
  const extremes = await publishingAnalytics.getPublishingTimeExtremes(startDate, endDate);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    fastest_platform: extremes.fastest,
    slowest_platform: extremes.slowest,
    by_platform: times
  };
});
```

**Acceptance Criteria**:
- [ ] Endpoint returns average times
- [ ] Shows fastest and slowest platforms
- [ ] Handles date range
- [ ] Returns proper JSON

---

### Task 11: Create API Endpoint - Get Publishing Time Distribution
**Estimate**: 0.5 hours
**Difficulty**: Easy
**Dependencies**: Task 7

**Objective**: Create REST API endpoint for publishing time distribution.

**File to modify**: `apps/api/src/routes/analytics.ts`

**Implementation**:
```typescript
/**
 * GET /api/analytics/publishing/time-distribution
 * Get publishing distribution by hour and day of week
 */
fastify.get('/publishing/time-distribution', async (request, reply) => {
  const { start_date, end_date } = request.query as {
    start_date?: string;
    end_date?: string;
  };

  const endDate = end_date ? new Date(end_date) : new Date();
  const startDate = start_date
    ? new Date(start_date)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const byHour = await publishingAnalytics.getPublishingByHour(startDate, endDate);
  const byDay = await publishingAnalytics.getPublishingByDayOfWeek(startDate, endDate);
  const popularHour = await publishingAnalytics.getMostPopularHour(startDate, endDate);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    most_popular_hour: popularHour,
    by_hour: byHour,
    by_day_of_week: byDay
  };
});
```

**Acceptance Criteria**:
- [ ] Returns hourly distribution
- [ ] Returns day of week distribution
- [ ] Shows most popular hour
- [ ] Handles date range

---

### Task 12: Create API Endpoint - Get Platform Usage
**Estimate**: 0.5 hours
**Difficulty**: Easy
**Dependencies**: Task 8

**Objective**: Create REST API endpoint for platform usage stats.

**File to modify**: `apps/api/src/routes/analytics.ts`

**Implementation**:
```typescript
/**
 * GET /api/analytics/publishing/platform-usage
 * Get platform usage statistics
 */
fastify.get('/publishing/platform-usage', async (request, reply) => {
  const { start_date, end_date } = request.query as {
    start_date?: string;
    end_date?: string;
  };

  const endDate = end_date ? new Date(end_date) : new Date();
  const startDate = start_date
    ? new Date(start_date)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = await publishingAnalytics.getPlatformUsageStats(startDate, endDate);
  const mostUsed = await publishingAnalytics.getMostUsedPlatform(startDate, endDate);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    most_used_platform: mostUsed,
    platforms: stats
  };
});
```

**Acceptance Criteria**:
- [ ] Returns usage stats
- [ ] Shows most used platform
- [ ] Includes percentages
- [ ] Shows last published timestamp

---

## Frontend Tasks (Tasks 13-23)

### Task 13: Create Analytics Page Layout
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: None

**Objective**: Create the main analytics page layout with placeholders for charts.

**File to create**: `apps/web/app/analytics/publishing/page.tsx`

**Implementation**:
```typescript
'use client';

import { useState } from 'react';

export default function PublishingAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Publishing Analytics
        </h1>
        <p style={{ color: '#666' }}>
          Track and analyze your publishing performance across all platforms
        </p>
      </div>

      {/* Date Range Filter */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <label>
          Start Date:
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>
      </div>

      {/* Metrics Grid - Placeholders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Metric cards will go here */}
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Overall Success Rate</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>--</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Publishes</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>--</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg. Publish Time</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>--</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Most Used Platform</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>--</p>
        </div>
      </div>

      {/* Charts Section - Placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Success Rate by Platform</h3>
          <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Chart will appear here</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Publishing Time Distribution</h3>
          <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Chart will appear here</p>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Page renders without errors
- [ ] Date range inputs work
- [ ] Layout is responsive
- [ ] Placeholder cards display
- [ ] Navigation from main menu works

---

### Task 14: Create Metric Card Component
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: None

**Objective**: Create a reusable metric card component.

**File to create**: `apps/web/app/components/MetricCard.tsx`

**Implementation**:
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change
  loading?: boolean;
}

export function MetricCard({ label, value, change, loading }: MetricCardProps) {
  return (
    <div style={{
      padding: '1.5rem',
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <p style={{
        color: '#666',
        fontSize: '0.875rem',
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {label}
      </p>

      {loading ? (
        <div style={{
          height: '2rem',
          background: '#f0f0f0',
          borderRadius: '4px',
          animation: 'pulse 1.5s infinite'
        }} />
      ) : (
        <>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: change !== undefined ? '0.25rem' : '0'
          }}>
            {value}
          </p>

          {change !== undefined && (
            <p style={{
              fontSize: '0.875rem',
              color: change >= 0 ? '#16a34a' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>{change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% from last period</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

**Add CSS animation in** `apps/web/app/globals.css`:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Acceptance Criteria**:
- [ ] Component renders correctly
- [ ] Shows loading state
- [ ] Shows percentage change with color
- [ ] Responsive design
- [ ] Reusable across dashboard

---

### Task 15: Fetch and Display Success Rate Metrics
**Estimate**: 1.5 hours
**Difficulty**: Medium
**Dependencies**: Task 9, Task 13, Task 14

**Objective**: Fetch success rate data from API and display in metric cards.

**File to modify**: `apps/web/app/analytics/publishing/page.tsx`

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';

interface SuccessRateData {
  overall_success_rate: number;
  by_platform: Array<{
    platform: string;
    total_attempts: number;
    successful: number;
    failed: number;
    success_rate: number;
  }>;
}

export default function PublishingAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [successRateData, setSuccessRateData] = useState<SuccessRateData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch success rate data
  useEffect(() => {
    async function fetchSuccessRates() {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/analytics/publishing/success-rates?` +
          `start_date=${dateRange.start}&end_date=${dateRange.end}`
        );
        const data = await response.json();
        setSuccessRateData(data);
      } catch (error) {
        console.error('Failed to fetch success rates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuccessRates();
  }, [dateRange]);

  // Calculate total publishes
  const totalPublishes = successRateData?.by_platform.reduce(
    (sum, p) => sum + p.total_attempts,
    0
  ) || 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header and date range (same as before) */}

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <MetricCard
          label="Overall Success Rate"
          value={loading ? '--' : `${successRateData?.overall_success_rate || 0}%`}
          loading={loading}
        />
        <MetricCard
          label="Total Publishes"
          value={loading ? '--' : totalPublishes.toLocaleString()}
          loading={loading}
        />
        {/* Other cards */}
      </div>

      {/* Rest of the page */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Data fetches on page load
- [ ] Data refetches when date range changes
- [ ] Loading state displays
- [ ] Metrics cards show real data
- [ ] Handles API errors gracefully

---

### Task 16: Fetch and Display Platform Usage Metrics
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 12, Task 15

**Objective**: Fetch platform usage data and display most used platform.

**File to modify**: `apps/web/app/analytics/publishing/page.tsx`

**Implementation**:
Add state and fetch logic for platform usage:

```typescript
const [platformUsage, setPlatformUsage] = useState<any>(null);

useEffect(() => {
  async function fetchPlatformUsage() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/analytics/publishing/platform-usage?` +
        `start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const data = await response.json();
      setPlatformUsage(data);
    } catch (error) {
      console.error('Failed to fetch platform usage:', error);
    }
  }

  fetchPlatformUsage();
}, [dateRange]);

// Add metric card
<MetricCard
  label="Most Used Platform"
  value={loading ? '--' : (platformUsage?.most_used_platform || 'N/A')}
  loading={loading}
/>
```

**Acceptance Criteria**:
- [ ] Fetches platform usage data
- [ ] Displays most used platform
- [ ] Updates with date range

---

### Task 17: Install and Configure Chart Library
**Estimate**: 0.5 hours
**Difficulty**: Easy
**Dependencies**: None

**Objective**: Install Recharts for data visualization.

**Implementation**:
```bash
cd apps/web
pnpm add recharts
```

**File to create**: `apps/web/app/components/charts/index.ts` (types)
```typescript
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}
```

**Acceptance Criteria**:
- [ ] Recharts installed
- [ ] No dependency conflicts
- [ ] Can import Recharts components

---

### Task 18: Create Success Rate Bar Chart Component
**Estimate**: 2 hours
**Difficulty**: Medium
**Dependencies**: Task 17, Task 15

**Objective**: Create bar chart showing success rates by platform.

**File to create**: `apps/web/app/components/charts/SuccessRateChart.tsx`

**Implementation**:
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SuccessRateChartProps {
  data: Array<{
    platform: string;
    success_rate: number;
    successful: number;
    failed: number;
  }>;
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    'Success Rate': parseFloat(item.success_rate.toFixed(1)),
    Successful: item.successful,
    Failed: item.failed
  }));

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{
                    background: '#fff',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {payload[0].payload.name}
                    </p>
                    <p style={{ color: '#16a34a', marginBottom: '0.25rem' }}>
                      Success: {payload[0].payload.Successful}
                    </p>
                    <p style={{ color: '#dc2626', marginBottom: '0.25rem' }}>
                      Failed: {payload[0].payload.Failed}
                    </p>
                    <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                      Rate: {payload[0].value}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="Success Rate"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Usage in page**:
```typescript
<div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
  <h3 style={{ marginBottom: '1rem' }}>Success Rate by Platform</h3>
  {successRateData && <SuccessRateChart data={successRateData.by_platform} />}
</div>
```

**Acceptance Criteria**:
- [ ] Bar chart renders correctly
- [ ] Shows success rate percentage
- [ ] Tooltip shows details
- [ ] Responsive design
- [ ] Proper axis labels

---

### Task 19: Create Time Distribution Line Chart
**Estimate**: 2 hours
**Difficulty**: Medium
**Dependencies**: Task 17, Task 11

**Objective**: Create line chart showing publishing activity by hour.

**File to create**: `apps/web/app/components/charts/TimeDistributionChart.tsx`

**Implementation**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeDistributionChartProps {
  data: Array<{
    hour: number;
    count: number;
  }>;
}

export function TimeDistributionChart({ data }: TimeDistributionChartProps) {
  // Fill in missing hours with 0
  const fullData = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return {
      hour: i,
      count: existing?.count || 0,
      label: `${i.toString().padStart(2, '0')}:00`
    };
  });

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <LineChart data={fullData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={2} // Show every 2 hours
          />
          <YAxis
            label={{ value: 'Number of Publishes', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{
                    background: '#fff',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ fontWeight: 'bold' }}>{payload[0].payload.label}</p>
                    <p>{payload[0].value} publishes</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Fetch data and use in page**:
```typescript
const [timeDistribution, setTimeDistribution] = useState<any>(null);

useEffect(() => {
  async function fetchTimeDistribution() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/analytics/publishing/time-distribution?` +
        `start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const data = await response.json();
      setTimeDistribution(data);
    } catch (error) {
      console.error('Failed to fetch time distribution:', error);
    }
  }

  fetchTimeDistribution();
}, [dateRange]);

// Use in page
<div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
  <h3 style={{ marginBottom: '1rem' }}>Publishing Activity by Hour</h3>
  {timeDistribution && <TimeDistributionChart data={timeDistribution.by_hour} />}
</div>
```

**Acceptance Criteria**:
- [ ] Line chart renders
- [ ] Shows all 24 hours
- [ ] Highlights peak hours
- [ ] Smooth curve
- [ ] Responsive

---

### Task 20: Create Platform Usage Pie Chart
**Estimate**: 1.5 hours
**Difficulty**: Medium
**Dependencies**: Task 17, Task 16

**Objective**: Create pie chart showing platform usage distribution.

**File to create**: `apps/web/app/components/charts/PlatformUsagePieChart.tsx`

**Implementation**:
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PlatformUsagePieChartProps {
  data: Array<{
    platform: string;
    total_publishes: number;
    usage_percentage: number;
  }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f97316'];

export function PlatformUsagePieChart({ data }: PlatformUsagePieChartProps) {
  const chartData = data.map(item => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.total_publishes,
    percentage: item.usage_percentage
  }));

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{
                    background: '#fff',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ fontWeight: 'bold' }}>{payload[0].name}</p>
                    <p>{payload[0].value} publishes</p>
                    <p>{payload[0].payload.percentage.toFixed(1)}% of total</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Pie chart renders
- [ ] Shows percentages
- [ ] Different colors per platform
- [ ] Labels visible
- [ ] Interactive tooltip

---

### Task 21: Add Export to CSV Functionality
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 15

**Objective**: Add button to export analytics data to CSV.

**File to create**: `apps/web/app/utils/exportCsv.ts`

**Implementation**:
```typescript
export function exportToCsv(data: any[], filename: string) {
  // Convert to CSV
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**Add button to page**:
```typescript
import { exportToCsv } from '../../utils/exportCsv';

// In the page component
const handleExport = () => {
  if (!successRateData) return;

  const exportData = successRateData.by_platform.map(p => ({
    Platform: p.platform,
    'Total Attempts': p.total_attempts,
    Successful: p.successful,
    Failed: p.failed,
    'Success Rate (%)': p.success_rate
  }));

  exportToCsv(exportData, `publishing-analytics-${dateRange.start}-to-${dateRange.end}.csv`);
};

// Add button in UI
<button
  onClick={handleExport}
  style={{
    padding: '0.5rem 1rem',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  }}
>
  Export to CSV
</button>
```

**Acceptance Criteria**:
- [ ] CSV downloads on click
- [ ] Includes all relevant data
- [ ] Filename includes date range
- [ ] Properly formatted CSV
- [ ] Works in all browsers

---

### Task 22: Add Loading States and Error Handling
**Estimate**: 1 hour
**Difficulty**: Easy
**Dependencies**: Task 15-20

**Objective**: Add proper loading states and error messages throughout the dashboard.

**File to modify**: `apps/web/app/analytics/publishing/page.tsx`

**Implementation**:
```typescript
const [error, setError] = useState<string | null>(null);

// Modify fetch functions
useEffect(() => {
  async function fetchSuccessRates() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(/*...*/);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccessRateData(data);
    } catch (error) {
      console.error('Failed to fetch success rates:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  fetchSuccessRates();
}, [dateRange]);

// Add error display in UI
{error && (
  <div style={{
    padding: '1rem',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    marginBottom: '1rem'
  }}>
    {error}
  </div>
)}

// Add loading skeleton for charts
{loading ? (
  <div style={{
    height: '400px',
    background: '#f0f0f0',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <p>Loading chart...</p>
  </div>
) : (
  timeDistribution && <TimeDistributionChart data={timeDistribution.by_hour} />
)}
```

**Acceptance Criteria**:
- [ ] Loading states display
- [ ] Error messages show
- [ ] Charts have loading skeletons
- [ ] Retry mechanism works
- [ ] User-friendly error messages

---

### Task 23: Add Responsive Design and Mobile Support
**Estimate**: 1.5 hours
**Difficulty**: Medium
**Dependencies**: Task 21

**Objective**: Make dashboard fully responsive for mobile devices.

**File to modify**: `apps/web/app/analytics/publishing/page.tsx`

**Implementation**:
```typescript
// Update grid layouts
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Smaller min on mobile
  gap: '1rem',
  marginBottom: '2rem'
}}>
  {/* Metric cards */}
</div>

<div style={{
  display: 'grid',
  gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', // Single column on mobile
  gap: '1rem'
}}>
  {/* Charts */}
</div>
```

**Add CSS for better mobile experience**:
```css
/* In globals.css */
@media (max-width: 768px) {
  .analytics-page {
    padding: 1rem !important;
  }

  .date-range-filter {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .date-range-filter label {
    width: 100%;
  }

  .date-range-filter input {
    width: 100%;
  }
}
```

**Acceptance Criteria**:
- [ ] Works on mobile devices
- [ ] Charts scale properly
- [ ] Date inputs stack on mobile
- [ ] Touch-friendly buttons
- [ ] Readable on small screens

---

## Testing Tasks (Tasks 24-25)

### Task 24: Write Backend Unit Tests
**Estimate**: 2 hours
**Difficulty**: Medium
**Dependencies**: Tasks 1-12

**Objective**: Write unit tests for analytics service.

**File to create**: `apps/api/src/services/analytics/__tests__/publishing-analytics.test.ts`

**Implementation**:
```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { publishingAnalytics } from '../publishing-analytics';
import { query } from '../../../db';

describe('PublishingAnalytics', () => {
  beforeEach(async () => {
    // Clean database
    await query('TRUNCATE publishing_daily_metrics RESTART IDENTITY CASCADE');

    // Insert test data
    await query(
      `INSERT INTO publishing_daily_metrics (date, platform, total_attempts, successful, failed, avg_duration_ms)
       VALUES
         ('2025-01-15', 'twitter', 10, 9, 1, 2000),
         ('2025-01-15', 'linkedin', 8, 8, 0, 3000),
         ('2025-01-16', 'twitter', 12, 11, 1, 2200)`
    );
  });

  test('getSuccessRates should return correct rates', async () => {
    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-16');

    const rates = await publishingAnalytics.getSuccessRates(startDate, endDate);

    expect(rates.length).toBe(2); // twitter and linkedin

    const twitter = rates.find(r => r.platform === 'twitter');
    expect(twitter?.total_attempts).toBe(22); // 10 + 12
    expect(twitter?.successful).toBe(20); // 9 + 11
    expect(twitter?.success_rate).toBeCloseTo(90.91, 1);
  });

  test('getOverallSuccessRate should calculate correctly', async () => {
    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-16');

    const rate = await publishingAnalytics.getOverallSuccessRate(startDate, endDate);

    // Total: 30 attempts, 28 successful = 93.33%
    expect(rate).toBeCloseTo(93.33, 1);
  });

  test('getAveragePublishingTimes should return correct averages', async () => {
    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-16');

    const times = await publishingAnalytics.getAveragePublishingTimes(startDate, endDate);

    const twitter = times.find(t => t.platform === 'twitter');
    expect(twitter?.avg_duration_ms).toBeCloseTo(2100, 0); // (2000 + 2200) / 2
    expect(twitter?.avg_duration_seconds).toBeCloseTo(2.1, 1);
  });
});
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Tests cover main functionality
- [ ] Tests use real database
- [ ] Tests clean up after themselves
- [ ] Good test coverage (>70%)

---

### Task 25: Write Frontend Integration Tests
**Estimate**: 2 hours
**Difficulty**: Medium
**Dependencies**: Tasks 13-23

**Objective**: Write integration tests for dashboard page.

**File to create**: `apps/web/app/analytics/publishing/__tests__/page.test.tsx`

**Implementation**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import PublishingAnalyticsPage from '../page';

// Mock fetch
global.fetch = vi.fn();

describe('PublishingAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title', () => {
    render(<PublishingAnalyticsPage />);
    expect(screen.getByText('Publishing Analytics')).toBeInTheDocument();
  });

  test('fetches and displays success rate data', async () => {
    // Mock API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overall_success_rate: 95.5,
        by_platform: [
          {
            platform: 'twitter',
            total_attempts: 100,
            successful: 95,
            failed: 5,
            success_rate: 95
          }
        ]
      })
    });

    render(<PublishingAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('95.5%')).toBeInTheDocument();
    });
  });

  test('displays error message on fetch failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<PublishingAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics data/)).toBeInTheDocument();
    });
  });

  test('export button triggers CSV download', async () => {
    // Setup mock data and test export functionality
    // ... implementation
  });
});
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Tests cover main user flows
- [ ] API calls are mocked
- [ ] Error states tested
- [ ] Export tested

---

## Summary

### Task Completion Checklist

**Backend (12 tasks)**:
- [ ] Task 1: Database schema
- [ ] Task 2: Event logger service
- [ ] Task 3: Integrate logging
- [ ] Task 4: Aggregation job
- [ ] Task 5: Success rate queries
- [ ] Task 6: Publishing time queries
- [ ] Task 7: Time distribution queries
- [ ] Task 8: Platform usage queries
- [ ] Task 9: Success rates API
- [ ] Task 10: Publishing times API
- [ ] Task 11: Time distribution API
- [ ] Task 12: Platform usage API

**Frontend (11 tasks)**:
- [ ] Task 13: Page layout
- [ ] Task 14: Metric card component
- [ ] Task 15: Fetch success rates
- [ ] Task 16: Fetch platform usage
- [ ] Task 17: Install charts library
- [ ] Task 18: Success rate chart
- [ ] Task 19: Time distribution chart
- [ ] Task 20: Platform usage chart
- [ ] Task 21: Export CSV
- [ ] Task 22: Loading & errors
- [ ] Task 23: Responsive design

**Testing (2 tasks)**:
- [ ] Task 24: Backend tests
- [ ] Task 25: Frontend tests

---

## Execution Strategy for AI Agent

### Sequential Execution
Tasks should be executed in order due to dependencies.

### Batch Execution (Optional)
Can parallelize these groups:
- **Group 1**: Tasks 5-8 (analytics queries)
- **Group 2**: Tasks 9-12 (API endpoints)
- **Group 3**: Tasks 18-20 (charts)

### Time Estimate
- **Backend**: ~15 hours
- **Frontend**: ~16 hours
- **Testing**: ~4 hours
- **Total**: ~35 hours (4-5 days)

---

## Success Criteria for Complete Feature

- [ ] Dashboard displays all key metrics
- [ ] All charts render correctly
- [ ] Data updates with date range
- [ ] Export to CSV works
- [ ] Responsive on mobile
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance < 2s load time
- [ ] Works in Chrome, Firefox, Safari

---

**Next**: Start with Task 1 (Database Schema) and proceed sequentially.
