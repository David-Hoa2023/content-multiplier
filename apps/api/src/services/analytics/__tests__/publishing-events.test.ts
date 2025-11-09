import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { PublishingEventLogger } from '../publishing-events';
import { pool } from '../../../db';

describe('PublishingEventLogger', () => {
  const logger = new PublishingEventLogger();
  const testPackId = 'test-pack-' + Date.now();

  beforeEach(async () => {
    // Clean up test data
    await pool.query(
      'DELETE FROM publishing_events WHERE pack_id LIKE $1',
      ['test-pack-%']
    );
  });

  afterAll(async () => {
    // Clean up and close pool
    await pool.query(
      'DELETE FROM publishing_events WHERE pack_id LIKE $1',
      ['test-pack-%']
    );
    await pool.end();
  });

  test('should log a new publishing event', async () => {
    const eventId = await logger.logEvent({
      pack_id: testPackId,
      platform: 'twitter',
      status: 'processing',
      started_at: new Date()
    });

    expect(eventId).toBeTruthy();
    expect(typeof eventId).toBe('string');

    // Verify it was inserted
    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].pack_id).toBe(testPackId);
    expect(result.rows[0].platform).toBe('twitter');
    expect(result.rows[0].status).toBe('processing');
  });

  test('should mark event as started', async () => {
    const eventId = await logger.markStarted(testPackId, 'linkedin');

    expect(eventId).toBeTruthy();

    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows[0].status).toBe('processing');
    expect(result.rows[0].started_at).toBeTruthy();
  });

  test('should mark event as successful', async () => {
    const eventId = await logger.markStarted(testPackId, 'facebook');
    const startTime = Date.now();

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const duration = Date.now() - startTime;
    await logger.markSuccess(eventId, duration);

    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows[0].status).toBe('published');
    expect(result.rows[0].completed_at).toBeTruthy();
    expect(result.rows[0].duration_ms).toBeGreaterThan(0);
  });

  test('should mark event as failed with error message', async () => {
    const eventId = await logger.markStarted(testPackId, 'instagram');

    await logger.markFailed(eventId, 'API rate limit exceeded', 1);

    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows[0].status).toBe('failed');
    expect(result.rows[0].error_message).toBe('API rate limit exceeded');
    expect(result.rows[0].retry_count).toBe(1);
    expect(result.rows[0].completed_at).toBeTruthy();
  });

  test('should update event with partial data', async () => {
    const eventId = await logger.logEvent({
      pack_id: testPackId,
      platform: 'twitter',
      status: 'pending'
    });

    await logger.updateEvent(eventId, {
      status: 'processing',
      started_at: new Date()
    });

    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows[0].status).toBe('processing');
    expect(result.rows[0].started_at).toBeTruthy();
  });

  test('should get events by pack_id', async () => {
    // Create multiple events for the same pack
    await logger.markStarted(testPackId, 'twitter');
    await logger.markStarted(testPackId, 'linkedin');
    await logger.markStarted(testPackId, 'facebook');

    const events = await logger.getEventsByPack(testPackId);

    expect(events.length).toBe(3);
    expect(events.every(e => e.pack_id === testPackId)).toBe(true);
  });

  test('should get recent events with limit', async () => {
    // Create some events
    await logger.markStarted(testPackId, 'twitter');
    await logger.markStarted(testPackId, 'linkedin');

    const events = await logger.getRecentEvents(5);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(5);
  });

  test('should handle retry count correctly', async () => {
    const eventId = await logger.logEvent({
      pack_id: testPackId,
      platform: 'twitter',
      status: 'failed',
      error_message: 'Network error',
      retry_count: 0
    });

    const result = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(result.rows[0].retry_count).toBe(0);

    // Update with retry
    await logger.markFailed(eventId, 'Still failing', 1);

    const updated = await pool.query(
      'SELECT * FROM publishing_events WHERE event_id = $1',
      [eventId]
    );

    expect(updated.rows[0].retry_count).toBe(1);
  });

  test('should handle empty updates gracefully', async () => {
    const eventId = await logger.markStarted(testPackId, 'twitter');

    // Should not throw error
    await expect(logger.updateEvent(eventId, {})).resolves.not.toThrow();
  });
});
