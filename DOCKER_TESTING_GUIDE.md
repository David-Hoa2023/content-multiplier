# Publishing Analytics Dashboard - Docker Testing Guide

## 🐳 Quick Start with Docker (3 Commands)

Since you're using Docker and PostgreSQL, here's the fastest way to test:

```bash
# 1. Run automated Docker setup (does everything)
./scripts/docker-setup-and-test.sh

# 2. Start API server (Terminal 1)
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
cd apps/api && pnpm dev

# 3. Start Web server (Terminal 2)
cd apps/web && pnpm dev
```

**Then open**: http://localhost:3000/analytics/publishing

---

## 📋 What the Setup Script Does

The `docker-setup-and-test.sh` script automatically:

1. ✅ Starts PostgreSQL container with pgvector
2. ✅ Waits for database to be ready
3. ✅ Applies analytics migration (creates tables)
4. ✅ Seeds ~280 test events across 9 platforms
5. ✅ Installs API and Web dependencies (including recharts)
6. ✅ Runs metrics aggregation job
7. ✅ Verifies everything is working

**Takes ~2-3 minutes total**

---

## 🔧 Docker Commands Reference

### Start Database
```bash
cd infra
docker-compose up -d
```

### Check Database Status
```bash
cd infra
docker-compose ps
```

Should show:
```
NAME         IMAGE                  STATUS         PORTS
infra-db-1   ankane/pgvector:latest Up 2 minutes   0.0.0.0:5432->5432/tcp
```

### View Database Logs
```bash
cd infra
docker-compose logs -f db
```

### Connect to Database (psql)
```bash
# Using psql from host
psql postgresql://cm:cm@localhost:5432/cm

# Or using docker exec
cd infra
docker-compose exec db psql -U cm -d cm
```

### Stop Database
```bash
cd infra
docker-compose down
```

### Reset Database (Fresh Start)
```bash
cd infra
docker-compose down -v  # Removes volumes (all data!)
docker-compose up -d
```

---

## 🗄️ Database Connection Details

Your Docker Compose setup:
- **Host**: localhost
- **Port**: 5432
- **Database**: cm
- **Username**: cm
- **Password**: cm
- **Image**: ankane/pgvector:latest

**Connection String**:
```bash
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
```

---

## 🚀 Step-by-Step Testing

### Step 1: Start Docker Database
```bash
cd infra
docker-compose up -d

# Verify it's running
docker-compose ps
```

Expected: Database container running and healthy

### Step 2: Run Setup Script
```bash
# From project root
./scripts/docker-setup-and-test.sh
```

This will:
- Apply migration
- Seed test data
- Install dependencies
- Aggregate metrics

### Step 3: Verify Data
```bash
# Quick check
psql postgresql://cm:cm@localhost:5432/cm -c "
SELECT
  platform,
  COUNT(*) as events,
  COUNT(*) FILTER (WHERE status = 'published') as successful
FROM publishing_events
GROUP BY platform
ORDER BY events DESC;
"
```

Should show ~280 events across 9 platforms.

### Step 4: Start API Server
```bash
# Terminal 1
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
cd apps/api
pnpm dev
```

Expected output:
```
Server listening at http://127.0.0.1:3001
```

### Step 5: Test API Endpoints
```bash
# In another terminal
curl http://localhost:3001/api/analytics/publishing/success-rates | jq

# Or use the test script
./scripts/test-analytics-api.sh
```

### Step 6: Start Web Server
```bash
# Terminal 2
cd apps/web
pnpm dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000
```

### Step 7: Open Dashboard
Visit: **http://localhost:3000/analytics/publishing**

You should see:
- ✅ 4 metric cards with data
- ✅ Interactive bar chart (success rates)
- ✅ Pie chart (platform usage)
- ✅ Line charts (time patterns)
- ✅ Publishing times table
- ✅ Export to CSV button

---

## 🧪 Testing Features

### Test 1: View Real Data
Dashboard should show:
- **Overall Success Rate**: ~89%
- **Total Publishes**: ~250 (varies based on test data)
- **Avg Publish Time**: ~5-6 seconds
- **Most Used Platform**: Twitter

### Test 2: Interactive Charts
1. **Bar Chart**: Hover over bars → see detailed tooltips
2. **Pie Chart**: Hover over slices → see counts and percentages
3. **Line Charts**: Hover on points → see hourly/daily counts

### Test 3: Date Range Filter
1. Change start date to last week
2. Change end date to today
3. Data updates automatically
4. Try different ranges to see data changes

### Test 4: CSV Export
1. Click "Export to CSV" button
2. File downloads: `publishing-analytics-YYYY-MM-DD-to-YYYY-MM-DD.csv`
3. Open in Excel/Numbers
4. Verify contains all metrics sections

### Test 5: Responsive Design
1. Resize browser to mobile width
2. Charts should stack vertically
3. Table should scroll horizontally
4. All text should be readable

---

## 🔍 Troubleshooting

### Issue: Container won't start
```bash
# Check if port 5432 is already in use
lsof -i :5432

# If yes, stop other PostgreSQL:
sudo systemctl stop postgresql
# OR change port in docker-compose.yml
```

### Issue: Database connection refused
```bash
# Check container is running
cd infra && docker-compose ps

# Check logs
docker-compose logs db

# Restart container
docker-compose restart db
```

### Issue: Migration fails
```bash
# Connect to database manually
psql postgresql://cm:cm@localhost:5432/cm

# Check if tables exist
\dt

# If tables exist, migration already applied (OK)
```

### Issue: No test data
```bash
# Reseed data
psql postgresql://cm:cm@localhost:5432/cm -f scripts/seed-analytics-data.sql

# Verify
psql postgresql://cm:cm@localhost:5432/cm -c "SELECT COUNT(*) FROM publishing_events;"
```

### Issue: Aggregation fails
```bash
# Run manually with verbose output
cd apps/api
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
pnpm aggregate-metrics range 2024-01-01 2025-12-31

# Check for errors in output
```

---

## 📊 Verify Database Contents

### Check Events Table
```sql
-- Total events
SELECT COUNT(*) FROM publishing_events;

-- By platform
SELECT
  platform,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'published') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(AVG(duration_ms)) as avg_duration_ms
FROM publishing_events
GROUP BY platform
ORDER BY total DESC;

-- Recent events
SELECT
  platform,
  status,
  duration_ms,
  created_at
FROM publishing_events
ORDER BY created_at DESC
LIMIT 10;
```

### Check Metrics Table
```sql
-- Total metrics
SELECT COUNT(*) FROM publishing_daily_metrics;

-- By date
SELECT
  date,
  COUNT(*) as platforms,
  SUM(total_attempts) as attempts,
  SUM(successful) as successes,
  SUM(failed) as failures
FROM publishing_daily_metrics
GROUP BY date
ORDER BY date DESC;

-- Top platforms by success
SELECT
  platform,
  SUM(successful) as total_successful,
  SUM(total_attempts) as total_attempts,
  ROUND(SUM(successful)::DECIMAL / NULLIF(SUM(total_attempts), 0) * 100, 2) as success_rate
FROM publishing_daily_metrics
GROUP BY platform
ORDER BY total_successful DESC;
```

---

## 🎯 Expected Test Results

After running the setup script, you should have:

### Database Tables
- `publishing_events`: ~280 rows
- `publishing_daily_metrics`: ~270 rows (9 platforms × 30 days)

### Platform Distribution
| Platform | Events | Success Rate |
|----------|--------|--------------|
| Twitter | 50 | ~95% |
| LinkedIn | 40 | ~92% |
| Facebook | 35 | ~88% |
| SendGrid | 30 | ~97% |
| Mailchimp | 25 | ~93% |
| Instagram | 25 | ~82% |
| WordPress | 20 | ~90% |
| YouTube | 20 | ~75% |
| Medium | 15 | ~85% |

### Performance Metrics
| Metric | Expected Value |
|--------|---------------|
| Overall Success Rate | ~89% |
| Total Publishes | ~250 |
| Avg Publish Time | ~5.5 seconds |
| Fastest Platform | SendGrid (~0.85s) |
| Slowest Platform | YouTube (~17s) |

---

## 🔄 Daily Aggregation (Production)

For production, schedule the aggregation job to run daily:

### Option 1: Cron Job
```bash
# Add to crontab
crontab -e

# Run daily at 1 AM
0 1 * * * cd /path/to/content-multiplier/apps/api && export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm' && pnpm aggregate-metrics
```

### Option 2: Docker Compose (Separate Service)
Add to `docker-compose.yml`:
```yaml
  aggregator:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://cm:cm@db:5432/cm
    command: pnpm aggregate-metrics
    depends_on:
      - db
```

Run manually:
```bash
docker-compose run aggregator
```

---

## 🧹 Cleanup

### Remove Test Data
```sql
-- Connect to database
psql postgresql://cm:cm@localhost:5432/cm

-- Clear test data
TRUNCATE publishing_events, publishing_daily_metrics CASCADE;
```

### Stop and Remove Everything
```bash
cd infra
docker-compose down -v  # Removes containers and volumes
```

### Fresh Start
```bash
cd infra
docker-compose down -v
docker-compose up -d
cd ..
./scripts/docker-setup-and-test.sh
```

---

## 📝 Environment Variables

For convenience, add to your `.bashrc` or `.zshrc`:

```bash
# Publishing Analytics
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
alias analytics-start='cd /path/to/content-multiplier/infra && docker-compose up -d'
alias analytics-stop='cd /path/to/content-multiplier/infra && docker-compose down'
alias analytics-logs='cd /path/to/content-multiplier/infra && docker-compose logs -f db'
```

Then you can use:
```bash
analytics-start  # Start database
analytics-stop   # Stop database
analytics-logs   # View logs
```

---

## ✅ Success Checklist

Your Docker setup is working if:

- [ ] Docker container is running (`docker-compose ps`)
- [ ] Can connect to database (`psql postgresql://cm:cm@localhost:5432/cm`)
- [ ] Tables exist (`\dt` shows publishing_events, publishing_daily_metrics)
- [ ] Test data loaded (~280 events)
- [ ] Metrics aggregated (~270 metric records)
- [ ] API server responds (`curl http://localhost:3001/api/analytics/...`)
- [ ] Web server running (http://localhost:3000)
- [ ] Dashboard displays data with charts
- [ ] CSV export works
- [ ] Charts are interactive

---

## 🚀 Ready to Start?

**One Command Setup:**
```bash
./scripts/docker-setup-and-test.sh
```

**Then Start Servers:**
```bash
# Terminal 1
export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'
cd apps/api && pnpm dev

# Terminal 2
cd apps/web && pnpm dev
```

**Open Dashboard:**
http://localhost:3000/analytics/publishing

---

## 📚 Additional Resources

- **Full Testing Guide**: `TESTING_CHECKLIST.md`
- **API Testing**: `ANALYTICS_API_TESTING.md`
- **Implementation Summary**: `ANALYTICS_COMPLETE_SUMMARY.md`
- **Status Check**: Run `./scripts/check-status.sh`

---

**Need Help?**

Run the diagnostic:
```bash
./scripts/check-status.sh
```

This will show you exactly what's ready and what needs to be done next!
