# Publishing Analytics Dashboard - Testing Checklist

## Quick Start (5 Minutes)

Since you have database access, here's what to do:

### Prerequisites ✅
1. **Set DATABASE_URL** (you mentioned you have database access):
   ```bash
   export DATABASE_URL='postgresql://username:password@host:port/database'
   # Or if using local:
   export DATABASE_URL='postgresql://localhost/content_multiplier'
   ```

2. **Verify connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

---

## Complete Setup (Run Once)

### Option A: Automated Setup (Recommended)
```bash
# This runs everything automatically
./scripts/setup-and-test.sh
```

### Option B: Manual Setup (Step by Step)

#### Step 1: Apply Database Migration
```bash
psql $DATABASE_URL -f infra/migrations/004_publishing_analytics.sql
```

**Expected**: Creates 2 tables and 9 indexes
**Verify**:
```bash
psql $DATABASE_URL -c "\dt publishing_*"
# Should show: publishing_events, publishing_daily_metrics
```

#### Step 2: Seed Test Data
```bash
psql $DATABASE_URL -f scripts/seed-analytics-data.sql
```

**Expected**: ~280 events across 9 platforms
**Verify**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM publishing_events;"
# Should show: ~280
```

#### Step 3: Install Dependencies
```bash
# API dependencies
cd apps/api
pnpm install

# Web dependencies (includes recharts)
cd ../web
pnpm install
```

**Verify recharts installed**:
```bash
ls apps/web/node_modules/recharts
# Should show recharts directory
```

#### Step 4: Aggregate Metrics
```bash
cd apps/api
pnpm aggregate-metrics range 2024-01-01 2025-12-31
```

**Expected**: Processes events into daily metrics
**Verify**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM publishing_daily_metrics;"
# Should show metrics records
```

---

## Start Servers

### Terminal 1: API Server
```bash
cd apps/api
pnpm dev
```

**Expected output**:
```
Server listening at http://127.0.0.1:3001
```

**Test API**:
```bash
curl http://localhost:3001/api/analytics/publishing/success-rates
# Should return JSON with analytics data
```

### Terminal 2: Web Server
```bash
cd apps/web
pnpm dev
```

**Expected output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Testing the Dashboard

### 1. Open Dashboard
Visit: **http://localhost:3000/analytics/publishing**

### 2. Visual Checklist

#### Header ✅
- [ ] "Publishing Analytics" title visible
- [ ] Subtitle explaining the dashboard
- [ ] Date range picker with start/end dates
- [ ] Blue "Export to CSV" button

#### Metric Cards (Top Row) ✅
- [ ] **Overall Success Rate** - Shows percentage (e.g., 89.3%)
- [ ] **Total Publishes** - Shows number (e.g., 250)
- [ ] **Avg. Publish Time** - Shows seconds (e.g., 5.42s)
- [ ] **Most Used Platform** - Shows platform name (e.g., Twitter)

#### Charts ✅

**Success Rate Bar Chart** (Top Left)
- [ ] Colored bars (green for >90%, yellow for 75-90%, red for <75%)
- [ ] Platform names on X-axis
- [ ] Percentage on Y-axis
- [ ] Hover shows tooltip with details

**Platform Usage Pie Chart** (Top Right)
- [ ] Multi-colored segments
- [ ] Percentage labels on slices
- [ ] Legend below with platform names
- [ ] Hover shows count and percentage

**Publishing Time Patterns** (Full Width)
- [ ] Two charts: hourly line chart + daily bar chart
- [ ] Line chart shows 24 hours (0-23)
- [ ] Bar chart shows 7 days (Sun-Sat)
- [ ] Hover shows publish counts

**Publishing Times Table** (Bottom)
- [ ] Four columns: Platform, Avg Time (ms), Avg Time (s), Total Publishes
- [ ] Sorted from fastest to slowest
- [ ] Responsive (scrolls horizontally on mobile)

### 3. Functionality Testing

#### Date Range Filter ✅
1. Change start date → Data updates
2. Change end date → Data updates
3. Select future date → Shows "No data available"

**Test**: Try last 7 days vs last 30 days

#### CSV Export ✅
1. Click "Export to CSV" button
2. File downloads automatically
3. Open CSV file
4. Verify contains:
   - Overall metrics section
   - Success rates by platform
   - Average publishing times
   - Platform usage stats
   - Hourly distribution
   - Daily distribution

**Test**: Export and open in Excel/Numbers

#### Interactive Charts ✅
1. **Bar Chart**: Hover over bars → See tooltip
2. **Pie Chart**: Hover over slices → See details
3. **Line Charts**: Hover on points → See hour/day counts

#### Responsive Design ✅
1. Resize browser to mobile width (< 768px)
2. Verify:
   - Charts stack vertically
   - Table scrolls horizontally
   - Text sizes adjust
   - Export button stays visible

#### Loading States ✅
1. Refresh page
2. Should see "Loading..." in metric cards
3. Should see "Loading..." in charts
4. Data loads within 1-2 seconds

#### Error Handling ✅
1. Stop API server
2. Refresh dashboard
3. Should see error message in red box
4. Restart API → Error disappears

---

## API Testing

### Test All Endpoints

Run automated tests:
```bash
./scripts/test-analytics-api.sh
```

Or test manually:

```bash
# Success rates
curl http://localhost:3001/api/analytics/publishing/success-rates | jq

# Average times
curl http://localhost:3001/api/analytics/publishing/average-times | jq

# Time distribution
curl http://localhost:3001/api/analytics/publishing/time-distribution | jq

# Platform usage
curl http://localhost:3001/api/analytics/publishing/platform-usage | jq
```

### Test Date Range Filtering

```bash
# January 2025 only
curl "http://localhost:3001/api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31" | jq

# Last 7 days
START_DATE=$(date -d '7 days ago' +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl "http://localhost:3001/api/analytics/publishing/success-rates?start_date=$START_DATE&end_date=$END_DATE" | jq
```

---

## Data Verification

### Check Database

```bash
# Event counts by platform
psql $DATABASE_URL -c "
SELECT
  platform,
  COUNT(*) as events,
  COUNT(*) FILTER (WHERE status = 'published') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM publishing_events
GROUP BY platform
ORDER BY events DESC;
"

# Daily metrics summary
psql $DATABASE_URL -c "
SELECT
  date,
  COUNT(DISTINCT platform) as platforms,
  SUM(total_attempts) as total_attempts,
  SUM(successful) as successful
FROM publishing_daily_metrics
GROUP BY date
ORDER BY date DESC
LIMIT 10;
"
```

---

## Performance Testing

### Load Time ✅
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh dashboard
4. Check:
   - [ ] Page loads < 2 seconds
   - [ ] 4 API calls (parallel)
   - [ ] Each API call < 500ms
   - [ ] Total data transferred < 100KB

### Chart Rendering ✅
1. Open Performance tab in DevTools
2. Record while changing date range
3. Check:
   - [ ] No frame drops (60fps)
   - [ ] Smooth transitions
   - [ ] No layout shifts

---

## Troubleshooting

### Problem: "No data available"
**Solutions**:
1. Check events exist: `SELECT COUNT(*) FROM publishing_events;`
2. Check metrics aggregated: `SELECT COUNT(*) FROM publishing_daily_metrics;`
3. Run aggregation: `cd apps/api && pnpm aggregate-metrics range 2024-01-01 2025-12-31`

### Problem: Charts not showing
**Solutions**:
1. Check recharts installed: `ls apps/web/node_modules/recharts`
2. Reinstall: `cd apps/web && pnpm install`
3. Check console for errors (F12)

### Problem: API errors
**Solutions**:
1. Verify API running: `curl http://localhost:3001/api/analytics/publishing/success-rates`
2. Check API logs in terminal
3. Verify DATABASE_URL is set

### Problem: Slow queries
**Solutions**:
1. Check indexes: `\d publishing_events` in psql
2. Run ANALYZE: `ANALYZE publishing_events; ANALYZE publishing_daily_metrics;`
3. Check row counts (should be pre-aggregated)

---

## Quick Diagnostic

At any time, run:
```bash
./scripts/check-status.sh
```

This shows:
- ✓ Database connection status
- ✓ Table existence
- ✓ Data counts
- ✓ Dependency status
- ✓ Server status
- ✓ File existence

---

## Success Criteria

Your implementation is working if:

- [x] ✅ All 4 metric cards show real data
- [x] ✅ All 3 chart types render correctly
- [x] ✅ Publishing times table displays
- [x] ✅ Date range filter updates data
- [x] ✅ CSV export downloads complete report
- [x] ✅ Mobile view is responsive
- [x] ✅ API endpoints return JSON in < 500ms
- [x] ✅ Dashboard loads in < 2 seconds
- [x] ✅ No console errors
- [x] ✅ Charts are interactive with tooltips

---

## Next Steps After Testing

1. **Schedule Daily Aggregation** (Production)
   ```bash
   # Add to crontab
   0 1 * * * cd /path/to/apps/api && pnpm aggregate-metrics
   ```

2. **Set Up Monitoring**
   - Track API response times
   - Alert on aggregation failures
   - Monitor dashboard usage

3. **Optional: Add Tests** (Tasks 24-25)
   - Backend unit tests with Jest
   - Frontend integration tests

4. **Deploy**
   - Set up production environment variables
   - Configure reverse proxy/CDN
   - Enable HTTPS

---

## Test Data Notes

The seeded data includes:
- **280 events** across 9 platforms
- **30-day date range**
- Varying success rates (75-97%)
- Realistic durations (300ms - 25s)
- Distributed across all hours/days

Platforms included:
- Twitter (50 events, 95% success)
- LinkedIn (40 events, 92% success)
- Facebook (35 events, 88% success)
- Instagram (25 events, 82% success)
- WordPress (20 events, 90% success)
- SendGrid (30 events, 97% success)
- Mailchimp (25 events, 93% success)
- Medium (15 events, 85% success)
- YouTube (20 events, 75% success)

---

**Ready to test? Start here:**
```bash
# 1. Set DATABASE_URL
export DATABASE_URL='postgresql://...'

# 2. Run automated setup
./scripts/setup-and-test.sh

# 3. Start servers (in separate terminals)
cd apps/api && pnpm dev
cd apps/web && pnpm dev

# 4. Open dashboard
open http://localhost:3000/analytics/publishing
```
