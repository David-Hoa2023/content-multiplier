import { pool } from '../db';

/**
 * Aggregate publishing events into daily metrics
 *
 * This job reads from the publishing_events table and aggregates data
 * into the publishing_daily_metrics table for fast dashboard queries.
 *
 * Run this job daily (e.g., via cron at midnight) to keep metrics up-to-date.
 *
 * @param date - Optional date to aggregate (defaults to yesterday)
 *
 * @example
 * ```bash
 * # Aggregate yesterday's data
 * pnpm run aggregate-metrics
 *
 * # Aggregate specific date
 * node dist/jobs/aggregate-publishing-metrics.js 2025-01-15
 * ```
 */
export async function aggregatePublishingMetrics(date?: Date): Promise<void> {
  // Default to yesterday (since today's data is incomplete)
  const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`📊 Aggregating publishing metrics for ${dateStr}...`);

  // List of all supported platforms
  const platforms = [
    'twitter',
    'linkedin',
    'facebook',
    'instagram',
    'youtube',
    'medium',
    'wordpress',
    'sendgrid',
    'mailchimp'
  ];

  let totalAggregated = 0;

  for (const platform of platforms) {
    try {
      // Aggregate metrics for this platform on this date
      const result = await pool.query(
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

      // Skip if no data for this platform on this date
      if (parseInt(stats.total_attempts) === 0) {
        continue;
      }

      // Upsert into daily metrics table
      await pool.query(
        `INSERT INTO publishing_daily_metrics
         (date, platform, total_attempts, successful, failed, avg_duration_ms, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (date, platform)
         DO UPDATE SET
           total_attempts = EXCLUDED.total_attempts,
           successful = EXCLUDED.successful,
           failed = EXCLUDED.failed,
           avg_duration_ms = EXCLUDED.avg_duration_ms,
           updated_at = now()`,
        [
          dateStr,
          platform,
          parseInt(stats.total_attempts) || 0,
          parseInt(stats.successful) || 0,
          parseInt(stats.failed) || 0,
          Math.round(parseFloat(stats.avg_duration_ms) || 0)
        ]
      );

      totalAggregated++;
      console.log(
        `  ✓ ${platform}: ${stats.total_attempts} attempts (${stats.successful} success, ${stats.failed} failed)`
      );
    } catch (error) {
      console.error(`  ✗ Error aggregating ${platform}:`, error);
    }
  }

  console.log(`✅ Aggregated metrics for ${totalAggregated} platforms on ${dateStr}`);
}

/**
 * Aggregate metrics for a date range
 *
 * Useful for backfilling historical data or re-aggregating a period.
 *
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 */
export async function aggregateMetricsForRange(
  startDate: Date,
  endDate: Date
): Promise<void> {
  console.log(
    `📊 Aggregating metrics for range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
  );

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    await aggregatePublishingMetrics(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`✅ Range aggregation complete`);
}

/**
 * Cleanup old events (optional)
 *
 * Archive or delete events older than the retention period.
 * Keep events for 90 days by default.
 *
 * @param retentionDays - Number of days to keep (default: 90)
 */
export async function cleanupOldEvents(retentionDays: number = 90): Promise<void> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const dateStr = cutoffDate.toISOString().split('T')[0];

  console.log(`🗑️  Cleaning up events older than ${dateStr} (${retentionDays} days)...`);

  const result = await pool.query(
    `DELETE FROM publishing_events
     WHERE created_at < $1
     RETURNING event_id`,
    [cutoffDate]
  );

  console.log(`✅ Deleted ${result.rowCount} old events`);
}

/**
 * Get aggregation status
 *
 * Shows which dates have been aggregated and which are missing.
 */
export async function getAggregationStatus(days: number = 30): Promise<void> {
  console.log(`📈 Aggregation status for last ${days} days:\n`);

  const result = await pool.query(
    `SELECT
       date,
       COUNT(DISTINCT platform) as platforms_count,
       SUM(total_attempts) as total_attempts,
       SUM(successful) as total_successful
     FROM publishing_daily_metrics
     WHERE date >= CURRENT_DATE - $1::INTEGER
     GROUP BY date
     ORDER BY date DESC`,
    [days]
  );

  if (result.rows.length === 0) {
    console.log('  No aggregated data found.');
    return;
  }

  result.rows.forEach(row => {
    console.log(
      `  ${row.date}: ${row.platforms_count} platforms, ${row.total_attempts} attempts (${row.total_successful} successful)`
    );
  });
}

// CLI interface - run when executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      switch (command) {
        case 'status':
          await getAggregationStatus(parseInt(args[1]) || 30);
          break;

        case 'cleanup':
          await cleanupOldEvents(parseInt(args[1]) || 90);
          break;

        case 'range':
          if (!args[1] || !args[2]) {
            console.error('Usage: pnpm run aggregate-metrics range START_DATE END_DATE');
            console.error('Example: pnpm run aggregate-metrics range 2025-01-01 2025-01-31');
            process.exit(1);
          }
          await aggregateMetricsForRange(new Date(args[1]), new Date(args[2]));
          break;

        default:
          // Single date or yesterday
          const targetDate = args[0] ? new Date(args[0]) : undefined;
          await aggregatePublishingMetrics(targetDate);
          break;
      }

      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('❌ Aggregation failed:', error);
      await pool.end();
      process.exit(1);
    }
  })();
}
