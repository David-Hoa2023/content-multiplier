#!/bin/bash
# Quick diagnostic script to check system status

echo "================================"
echo "Analytics Dashboard - Status Check"
echo "================================"
echo ""

# Check DATABASE_URL
echo "📊 Database Connection:"
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ DATABASE_URL not set"
    echo "   → Set with: export DATABASE_URL='postgresql://...'"
else
    echo "   ✓ DATABASE_URL is configured"

    # Try to connect and check tables
    if psql "$DATABASE_URL" -c "\dt publishing_events" > /dev/null 2>&1; then
        echo "   ✓ publishing_events table exists"

        # Count events
        EVENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_events;" 2>/dev/null | tr -d ' ')
        if [ -n "$EVENT_COUNT" ]; then
            echo "   ✓ $EVENT_COUNT events in database"
        fi
    else
        echo "   ⚠ publishing_events table not found (migration needed)"
    fi

    if psql "$DATABASE_URL" -c "\dt publishing_daily_metrics" > /dev/null 2>&1; then
        echo "   ✓ publishing_daily_metrics table exists"

        # Count metrics
        METRICS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM publishing_daily_metrics;" 2>/dev/null | tr -d ' ')
        if [ -n "$METRICS_COUNT" ]; then
            echo "   ✓ $METRICS_COUNT daily metrics in database"
        fi
    else
        echo "   ⚠ publishing_daily_metrics table not found (migration needed)"
    fi
fi
echo ""

# Check API dependencies
echo "🔧 API Dependencies:"
if [ -f "apps/api/package.json" ]; then
    if [ -d "apps/api/node_modules" ]; then
        echo "   ✓ API dependencies installed"
    else
        echo "   ⚠ API dependencies not installed"
        echo "   → Run: cd apps/api && pnpm install"
    fi
else
    echo "   ❌ apps/api/package.json not found"
fi
echo ""

# Check web dependencies
echo "🌐 Web Dependencies:"
if [ -f "apps/web/package.json" ]; then
    if [ -d "apps/web/node_modules" ]; then
        echo "   ✓ Web dependencies installed"

        # Check for recharts specifically
        if [ -d "apps/web/node_modules/recharts" ]; then
            echo "   ✓ Recharts library installed"
        else
            echo "   ⚠ Recharts not found (needed for charts)"
            echo "   → Run: cd apps/web && pnpm install"
        fi
    else
        echo "   ⚠ Web dependencies not installed"
        echo "   → Run: cd apps/web && pnpm install"
    fi
else
    echo "   ❌ apps/web/package.json not found"
fi
echo ""

# Check if servers are running
echo "🚀 Server Status:"
if curl -s http://localhost:3001/api/analytics/publishing/success-rates > /dev/null 2>&1; then
    echo "   ✓ API server is running (port 3001)"
else
    echo "   ⚠ API server not running"
    echo "   → Run: cd apps/api && pnpm dev"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✓ Web server is running (port 3000)"
else
    echo "   ⚠ Web server not running"
    echo "   → Run: cd apps/web && pnpm dev"
fi
echo ""

# Check files
echo "📁 Analytics Files:"
if [ -f "apps/web/app/analytics/publishing/page.tsx" ]; then
    echo "   ✓ Analytics page exists"
fi
if [ -f "apps/web/app/analytics/publishing/components/SuccessRateBarChart.tsx" ]; then
    echo "   ✓ Chart components exist"
fi
if [ -f "apps/api/src/routes/analytics.ts" ]; then
    echo "   ✓ Analytics API routes exist"
fi
echo ""

echo "================================"
echo "Summary:"
echo "================================"

# Provide next steps based on status
if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "⚠ Next step: Set DATABASE_URL environment variable"
    echo "   export DATABASE_URL='postgresql://user:pass@host/db'"
elif ! psql "$DATABASE_URL" -c "\dt publishing_events" > /dev/null 2>&1; then
    echo ""
    echo "⚠ Next step: Run setup script"
    echo "   ./scripts/setup-and-test.sh"
elif [ ! -d "apps/web/node_modules/recharts" ]; then
    echo ""
    echo "⚠ Next step: Install dependencies"
    echo "   cd apps/web && pnpm install"
else
    echo ""
    echo "✅ Everything looks good!"
    echo ""
    echo "If servers aren't running, start them:"
    echo "   Terminal 1: cd apps/api && pnpm dev"
    echo "   Terminal 2: cd apps/web && pnpm dev"
    echo ""
    echo "Then visit: http://localhost:3000/analytics/publishing"
fi
echo ""
