import { FastifyInstance } from 'fastify';
import { publishingAnalytics } from '../services/analytics/publishing-analytics';

/**
 * Analytics API Routes
 *
 * REST endpoints for querying publishing analytics and metrics.
 * All endpoints support date range filtering via query parameters.
 *
 * @example
 * GET /api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31
 */
export default async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/analytics/publishing/success-rates
   * Get success/failure rates by platform
   *
   * Query params:
   * - start_date: ISO date string (optional, defaults to 30 days ago)
   * - end_date: ISO date string (optional, defaults to today)
   *
   * Response:
   * {
   *   start_date: "2025-01-01",
   *   end_date: "2025-01-31",
   *   overall_success_rate: 95.5,
   *   by_platform: [
   *     {
   *       platform: "twitter",
   *       total_attempts: 100,
   *       successful: 95,
   *       failed: 5,
   *       success_rate: 95.0
   *     }
   *   ]
   * }
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

  /**
   * GET /api/analytics/publishing/average-times
   * Get average publishing time per platform
   *
   * Query params:
   * - start_date: ISO date string (optional, defaults to 30 days ago)
   * - end_date: ISO date string (optional, defaults to today)
   *
   * Response:
   * {
   *   start_date: "2025-01-01",
   *   end_date: "2025-01-31",
   *   fastest_platform: "twitter",
   *   slowest_platform: "wordpress",
   *   by_platform: [
   *     {
   *       platform: "twitter",
   *       avg_duration_ms: 1200,
   *       avg_duration_seconds: 1.2,
   *       total_publishes: 95
   *     }
   *   ]
   * }
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

  /**
   * GET /api/analytics/publishing/time-distribution
   * Get publishing distribution by hour and day of week
   *
   * Query params:
   * - start_date: ISO date string (optional, defaults to 30 days ago)
   * - end_date: ISO date string (optional, defaults to today)
   *
   * Response:
   * {
   *   start_date: "2025-01-01",
   *   end_date: "2025-01-31",
   *   most_popular_hour: 14,
   *   by_hour: [
   *     { hour: 0, count: 5 },
   *     { hour: 1, count: 3 }
   *   ],
   *   by_day_of_week: [
   *     { day_of_week: 0, day_name: "Sunday", count: 10 },
   *     { day_of_week: 1, day_name: "Monday", count: 25 }
   *   ]
   * }
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

  /**
   * GET /api/analytics/publishing/platform-usage
   * Get platform usage statistics
   *
   * Query params:
   * - start_date: ISO date string (optional, defaults to 30 days ago)
   * - end_date: ISO date string (optional, defaults to today)
   *
   * Response:
   * {
   *   start_date: "2025-01-01",
   *   end_date: "2025-01-31",
   *   most_used_platform: "twitter",
   *   platforms: [
   *     {
   *       platform: "twitter",
   *       total_publishes: 95,
   *       usage_percentage: 45.5,
   *       last_published_at: "2025-01-31T12:00:00Z"
   *     }
   *   ]
   * }
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
}
