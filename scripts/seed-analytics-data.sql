-- Seed data for testing publishing analytics
-- Run this after applying migration 004_publishing_analytics.sql
-- Usage: psql $DATABASE_URL -f scripts/seed-analytics-data.sql

\echo 'Seeding analytics test data...'

-- Create a test content pack if it doesn't exist
INSERT INTO content_packs (pack_id, brief_id, draft_markdown, status, created_at)
VALUES
  ('test-pack-analytics-1', 'test-brief-1', '# Test Content', 'published', NOW() - INTERVAL '30 days'),
  ('test-pack-analytics-2', 'test-brief-2', '# Test Content 2', 'published', NOW() - INTERVAL '15 days'),
  ('test-pack-analytics-3', 'test-brief-3', '# Test Content 3', 'published', NOW() - INTERVAL '7 days')
ON CONFLICT (pack_id) DO NOTHING;

-- Insert publishing events for the last 30 days
\echo 'Inserting publishing events...'

-- Twitter events (high success rate, fast)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'twitter',
  CASE WHEN random() < 0.95 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 2000 + 500 || ' milliseconds')::interval,
  (random() * 2000 + 500)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 50);

-- LinkedIn events (good success rate, medium speed)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'linkedin',
  CASE WHEN random() < 0.92 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 3000 + 1500 || ' milliseconds')::interval,
  (random() * 3000 + 1500)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 40);

-- Facebook events (moderate success rate, medium speed)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'facebook',
  CASE WHEN random() < 0.88 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 3500 + 2000 || ' milliseconds')::interval,
  (random() * 3500 + 2000)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 35);

-- Instagram events (lower success rate, slower)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'instagram',
  CASE WHEN random() < 0.82 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 5000 + 3000 || ' milliseconds')::interval,
  (random() * 5000 + 3000)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 25);

-- WordPress events (good success rate, slow)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'wordpress',
  CASE WHEN random() < 0.90 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 8000 + 5000 || ' milliseconds')::interval,
  (random() * 8000 + 5000)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 20);

-- Medium events (moderate success, very slow)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'medium',
  CASE WHEN random() < 0.85 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 10000 + 6000 || ' milliseconds')::interval,
  (random() * 10000 + 6000)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 15);

-- SendGrid events (high success, fast)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'sendgrid',
  CASE WHEN random() < 0.97 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 1500 + 300 || ' milliseconds')::interval,
  (random() * 1500 + 300)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 30);

-- Mailchimp events (good success, medium)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'mailchimp',
  CASE WHEN random() < 0.93 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 2500 + 1000 || ' milliseconds')::interval,
  (random() * 2500 + 1000)::int,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 25);

-- YouTube events (lower success, slowest)
INSERT INTO publishing_events (pack_id, platform, status, started_at, completed_at, duration_ms, error_message, created_at)
SELECT
  'test-pack-analytics-' || ((random() * 2 + 1)::int),
  'youtube',
  CASE WHEN random() < 0.75 THEN 'published' ELSE 'failed' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval + (random() * 15000 + 10000 || ' milliseconds')::interval,
  (random() * 15000 + 10000)::int,
  CASE WHEN random() > 0.75 THEN 'Video processing timeout' ELSE NULL END,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 20);

\echo 'Publishing events created successfully!'

-- Show summary of created events
\echo ''
\echo 'Summary of test data:'
SELECT
  platform,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(AVG(duration_ms)) as avg_duration_ms
FROM publishing_events
GROUP BY platform
ORDER BY total_events DESC;

\echo ''
\echo 'Test data seeded successfully! Now run the aggregation job:'
\echo 'cd apps/api && pnpm aggregate-metrics range 2024-01-01 2025-12-31'
