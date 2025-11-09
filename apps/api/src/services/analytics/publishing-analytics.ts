import { pool } from '../../db';

/**
 * Success rate metrics for a platform
 */
export interface SuccessRateMetrics {
  platform: string;
  total_attempts: number;
  successful: number;
  failed: number;
  success_rate: number; // percentage
}

/**
 * Publishing time metrics for a platform
 */
export interface PublishingTimeMetrics {
  platform: string;
  avg_duration_ms: number;
  avg_duration_seconds: number;
  total_publishes: number;
}

/**
 * Publishing distribution by hour of day
 */
export interface PublishingTimeDistribution {
  hour: number; // 0-23
  count: number;
}

/**
 * Publishing distribution by day of week
 */
export interface DayDistribution {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  day_name: string;
  count: number;
}

/**
 * Platform usage statistics
 */
export interface PlatformUsageStats {
  platform: string;
  total_publishes: number;
  usage_percentage: number;
  last_published_at: Date | null;
}

/**
 * Publishing Analytics Service
 *
 * Query service for retrieving publishing analytics and metrics.
 * Reads from pre-aggregated daily_metrics table for fast queries.
 *
 * @example
 * ```typescript
 * const analytics = new PublishingAnalytics();
 * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const today = new Date();
 * const successRates = await analytics.getSuccessRates(lastWeek, today);
 * console.log(successRates); // [{platform: 'twitter', success_rate: 95.5, ...}]
 * ```
 */
export class PublishingAnalytics {
  /**
   * Get success/failure rates by platform for a date range
   *
   * Returns aggregated metrics showing how many publishing attempts
   * succeeded vs failed for each platform within the date range.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of success rate metrics per platform
   */
  async getSuccessRates(
    startDate: Date,
    endDate: Date
  ): Promise<SuccessRateMetrics[]> {
    const result = await pool.query(
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
   * Get overall success rate (all platforms combined)
   *
   * Calculates the combined success rate across all platforms
   * for the specified date range.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Overall success rate as a percentage
   */
  async getOverallSuccessRate(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await pool.query(
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

  /**
   * Get average publishing time per platform
   *
   * Returns the average time it takes to publish content on each platform.
   * Only includes successful publishes in the calculation.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of publishing time metrics per platform
   */
  async getAveragePublishingTimes(
    startDate: Date,
    endDate: Date
  ): Promise<PublishingTimeMetrics[]> {
    const result = await pool.query(
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
   *
   * Identifies which platforms are fastest and slowest to publish to.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Object with fastest and slowest platform names
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

  /**
   * Get publishing distribution by hour of day
   *
   * Shows when during the day content is most frequently published.
   * Useful for identifying peak publishing times.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of publishing counts per hour (0-23)
   */
  async getPublishingByHour(
    startDate: Date,
    endDate: Date
  ): Promise<PublishingTimeDistribution[]> {
    const result = await pool.query(
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
   *
   * Shows which days of the week content is most frequently published.
   * Useful for understanding publishing patterns.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of publishing counts per day of week
   */
  async getPublishingByDayOfWeek(
    startDate: Date,
    endDate: Date
  ): Promise<DayDistribution[]> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const result = await pool.query(
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

    return result.rows.map(row => ({
      day_of_week: parseInt(row.day_of_week),
      day_name: dayNames[parseInt(row.day_of_week)],
      count: parseInt(row.count)
    }));
  }

  /**
   * Get platform usage statistics
   *
   * Shows how frequently each platform is used, as a percentage
   * of total publishes and absolute counts.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of platform usage statistics
   */
  async getPlatformUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<PlatformUsageStats[]> {
    const result = await pool.query(
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
   *
   * Returns the name of the platform with the highest number of publishes.
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Platform name or null if no data
   */
  async getMostUsedPlatform(startDate: Date, endDate: Date): Promise<string | null> {
    const stats = await this.getPlatformUsageStats(startDate, endDate);
    return stats.length > 0 ? stats[0].platform : null;
  }
}

/**
 * Singleton instance of PublishingAnalytics
 *
 * Import and use this instance throughout the application:
 * ```typescript
 * import { publishingAnalytics } from './services/analytics/publishing-analytics';
 * const rates = await publishingAnalytics.getSuccessRates(startDate, endDate);
 * ```
 */
export const publishingAnalytics = new PublishingAnalytics();
