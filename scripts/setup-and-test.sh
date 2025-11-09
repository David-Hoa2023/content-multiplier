#!/bin/bash
# Complete test setup script for Publishing Analytics Dashboard
# Run this to set up and test everything

set -e  # Exit on error

echo "================================"
echo "Publishing Analytics - Test Setup"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:pass@localhost/dbname'"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Step 1: Apply migration
echo "Step 1: Applying database migration..."
if psql "$DATABASE_URL" -f infra/migrations/004_publishing_analytics.sql > /dev/null 2>&1; then
    echo "✓ Migration applied successfully"
else
    echo "⚠ Migration may already be applied (this is OK)"
fi
echo ""

# Step 2: Seed test data
echo "Step 2: Seeding test data (~280 events)..."
psql "$DATABASE_URL" -f scripts/seed-analytics-data.sql
echo ""

# Step 3: Verify data was inserted
echo "Step 3: Verifying data..."
EVENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_events;" | tr -d ' ')
echo "✓ Found $EVENT_COUNT publishing events"
echo ""

# Step 4: Run aggregation job
echo "Step 4: Running metrics aggregation..."
cd apps/api
if [ ! -d "node_modules" ]; then
    echo "Installing API dependencies..."
    pnpm install
fi

echo "Aggregating metrics for 2024-2025..."
pnpm aggregate-metrics range 2024-01-01 2025-12-31
cd ../..
echo ""

# Step 5: Verify aggregated metrics
echo "Step 5: Verifying aggregated metrics..."
METRICS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_daily_metrics;" | tr -d ' ')
echo "✓ Found $METRICS_COUNT daily metrics records"
echo ""

# Step 6: Check web dependencies
echo "Step 6: Checking web dependencies..."
cd apps/web
if [ ! -d "node_modules" ] || [ ! -d "node_modules/recharts" ]; then
    echo "Installing web dependencies (including recharts)..."
    pnpm install
else
    echo "✓ Dependencies already installed"
fi
cd ../..
echo ""

echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the API server:"
echo "   cd apps/api && pnpm dev"
echo ""
echo "2. In another terminal, start the web server:"
echo "   cd apps/web && pnpm dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000/analytics/publishing"
echo ""
echo "4. Test the API directly:"
echo "   ./scripts/test-analytics-api.sh"
echo ""
