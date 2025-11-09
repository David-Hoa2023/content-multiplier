import { pool } from '../../db';

/**
 * Publishing event data for logging
 */
export interface PublishingEventData {
  pack_id: string;
  platform: string;
  status: 'pending' | 'processing' | 'published' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  error_message?: string;
  retry_count?: number;
}

/**
 * Service for logging publishing events to the database
 *
 * Tracks all publishing attempts including timing, status, and errors.
 * Used by the publishing orchestrator to create audit trail and analytics data.
 *
 * @example
 * ```typescript
 * const eventId = await publishingEventLogger.markStarted(pack_id, 'twitter');
 * try {
 *   await publishToTwitter(content);
 *   await publishingEventLogger.markSuccess(eventId, 2500);
 * } catch (error) {
 *   await publishingEventLogger.markFailed(eventId, error.message, 0);
 * }
 * ```
 */
export class PublishingEventLogger {
  /**
   * Log a new publishing event
   *
   * @param data - Event data to log
   * @returns The created event_id
   */
  async logEvent(data: PublishingEventData): Promise<string> {
    const result = await pool.query(
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

    return result.rows[0].event_id.toString();
  }

  /**
   * Update an existing publishing event
   *
   * @param event_id - ID of the event to update
   * @param updates - Partial event data to update
   */
  async updateEvent(
    event_id: string,
    updates: Partial<PublishingEventData>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    if (fields.length === 0) {
      return; // Nothing to update
    }

    values.push(event_id);
    await pool.query(
      `UPDATE publishing_events
       SET ${fields.join(', ')}
       WHERE event_id = $${paramCount}`,
      values
    );
  }

  /**
   * Mark a publishing event as started (processing)
   *
   * Creates a new event with status 'processing' and current timestamp.
   *
   * @param pack_id - Content pack being published
   * @param platform - Publishing platform (twitter, linkedin, etc.)
   * @returns The created event_id
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
   * Mark a publishing event as successful
   *
   * Updates the event with status 'published' and records completion time.
   *
   * @param event_id - ID of the event to update
   * @param duration_ms - Publishing duration in milliseconds
   */
  async markSuccess(event_id: string, duration_ms: number): Promise<void> {
    await this.updateEvent(event_id, {
      status: 'published',
      completed_at: new Date(),
      duration_ms
    });
  }

  /**
   * Mark a publishing event as failed
   *
   * Updates the event with status 'failed' and error details.
   *
   * @param event_id - ID of the event to update
   * @param error_message - Error description
   * @param retry_count - Number of retry attempts (default: 0)
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

  /**
   * Get all events for a specific content pack
   *
   * @param pack_id - Content pack ID
   * @returns Array of publishing events
   */
  async getEventsByPack(pack_id: string): Promise<PublishingEventData[]> {
    const result = await pool.query(
      `SELECT * FROM publishing_events
       WHERE pack_id = $1
       ORDER BY created_at DESC`,
      [pack_id]
    );

    return result.rows;
  }

  /**
   * Get recent publishing events
   *
   * @param limit - Maximum number of events to return (default: 100)
   * @returns Array of recent publishing events
   */
  async getRecentEvents(limit: number = 100): Promise<PublishingEventData[]> {
    const result = await pool.query(
      `SELECT * FROM publishing_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

/**
 * Singleton instance of PublishingEventLogger
 *
 * Import and use this instance throughout the application:
 * ```typescript
 * import { publishingEventLogger } from './services/analytics/publishing-events';
 * ```
 */
export const publishingEventLogger = new PublishingEventLogger();
