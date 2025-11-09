#!/bin/bash
# Docker-based setup and test script for Publishing Analytics Dashboard

set -e  # Exit on error

echo "================================"
echo "Publishing Analytics - Docker Setup"
echo "================================"
echo ""

# Step 1: Start Docker containers
echo "Step 1: Starting Docker containers..."
cd infra
if docker-compose ps | grep -q "Up"; then
    echo "✓ Docker containers already running"
else
    echo "Starting PostgreSQL with pgvector..."
    docker-compose up -d
    echo "⏳ Waiting for database to be ready..."
    sleep 5

    # Wait for health check
    until docker-compose exec -T db pg_isready -U cm > /dev/null 2>&1; do
        echo "   Waiting for database..."
        sleep 2
    done
    echo "✓ Database is ready"
fi
cd ..
echo ""

# Step 2: Set DATABASE_URL for local connection
export DATABASE_URL="postgresql://cm:cm@localhost:5432/cm"
echo "Step 2: Database connection configured"
echo "   DATABASE_URL=$DATABASE_URL"
echo ""

# Step 3: Apply migration
echo "Step 3: Applying analytics migration..."
if psql "$DATABASE_URL" -f infra/migrations/004_publishing_analytics.sql > /dev/null 2>&1; then
    echo "✓ Migration applied successfully"
else
    echo "⚠ Migration may already be applied (this is OK)"
fi
echo ""

# Step 4: Seed test data
echo "Step 4: Seeding test data (~280 events)..."
psql "$DATABASE_URL" -f scripts/seed-analytics-data.sql
echo ""

# Step 5: Verify data
echo "Step 5: Verifying data..."
EVENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_events;" | tr -d ' ')
echo "✓ Created $EVENT_COUNT publishing events"

PLATFORMS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(DISTINCT platform) FROM publishing_events;" | tr -d ' ')
echo "✓ Across $PLATFORMS platforms"
echo ""

# Step 6: Install dependencies
echo "Step 6: Installing dependencies..."

# API dependencies
if [ ! -d "apps/api/node_modules" ]; then
    echo "Installing API dependencies..."
    cd apps/api
    pnpm install
    cd ../..
else
    echo "✓ API dependencies already installed"
fi

# Web dependencies (includes recharts)
if [ ! -d "apps/web/node_modules/recharts" ]; then
    echo "Installing Web dependencies (including recharts)..."
    cd apps/web
    pnpm install
    cd ../..
else
    echo "✓ Web dependencies already installed"
fi
echo ""

# Step 7: Aggregate metrics
echo "Step 7: Aggregating metrics..."
cd apps/api
export DATABASE_URL="postgresql://cm:cm@localhost:5432/cm"
pnpm aggregate-metrics range 2024-01-01 2025-12-31
cd ../..
echo ""

# Step 8: Verify aggregated data
echo "Step 8: Verifying aggregated metrics..."
METRICS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_daily_metrics;" | tr -d ' ')
METRIC_DAYS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(DISTINCT date) FROM publishing_daily_metrics;" | tr -d ' ')
echo "✓ Created $METRICS_COUNT metric records across $METRIC_DAYS days"
echo ""

# Summary
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Database Info:"
echo "   Host: localhost:5432"
echo "   Database: cm"
echo "   User: cm"
echo "   Password: cm"
echo ""
echo "Next steps:"
echo ""
echo "1. Start API server (Terminal 1):"
echo "   export DATABASE_URL='postgresql://cm:cm@localhost:5432/cm'"
echo "   cd apps/api && pnpm dev"
echo ""
echo "2. Start Web server (Terminal 2):"
echo "   cd apps/web && pnpm dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000/analytics/publishing"
echo ""
echo "4. Stop Docker when done:"
echo "   cd infra && docker-compose down"
echo ""
