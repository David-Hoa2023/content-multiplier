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
