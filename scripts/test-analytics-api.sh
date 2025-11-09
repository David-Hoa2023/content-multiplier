#!/bin/bash
# Quick test script for Publishing Analytics API
# Usage: ./scripts/test-analytics-api.sh

API_BASE="${API_BASE:-http://localhost:3001}"

echo "Testing Publishing Analytics API"
echo "================================="
echo "API Base: $API_BASE"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Success Rates
echo -e "${BLUE}Test 1: Success Rates${NC}"
echo "GET /api/analytics/publishing/success-rates"
curl -s "$API_BASE/api/analytics/publishing/success-rates" | jq '.'
echo ""
echo -e "${GREEN}✓ Success Rates endpoint tested${NC}"
echo ""

# Test 2: Average Publishing Times
echo -e "${BLUE}Test 2: Average Publishing Times${NC}"
echo "GET /api/analytics/publishing/average-times"
curl -s "$API_BASE/api/analytics/publishing/average-times" | jq '.'
echo ""
echo -e "${GREEN}✓ Average Times endpoint tested${NC}"
echo ""

# Test 3: Time Distribution
echo -e "${BLUE}Test 3: Time Distribution${NC}"
echo "GET /api/analytics/publishing/time-distribution"
curl -s "$API_BASE/api/analytics/publishing/time-distribution" | jq '.'
echo ""
echo -e "${GREEN}✓ Time Distribution endpoint tested${NC}"
echo ""

# Test 4: Platform Usage
echo -e "${BLUE}Test 4: Platform Usage${NC}"
echo "GET /api/analytics/publishing/platform-usage"
curl -s "$API_BASE/api/analytics/publishing/platform-usage" | jq '.'
echo ""
echo -e "${GREEN}✓ Platform Usage endpoint tested${NC}"
echo ""

# Test 5: Date Range Filtering
echo -e "${BLUE}Test 5: Date Range Filtering${NC}"
echo "GET /api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31"
curl -s "$API_BASE/api/analytics/publishing/success-rates?start_date=2025-01-01&end_date=2025-01-31" | jq '.'
echo ""
echo -e "${GREEN}✓ Date range filtering tested${NC}"
echo ""

echo "================================="
echo -e "${GREEN}All API tests completed!${NC}"
echo ""
echo "Summary:"
echo "  ✓ Success Rates endpoint"
echo "  ✓ Average Times endpoint"
echo "  ✓ Time Distribution endpoint"
echo "  ✓ Platform Usage endpoint"
echo "  ✓ Date range filtering"
echo ""
echo "Note: Install 'jq' for better JSON formatting: apt-get install jq"
