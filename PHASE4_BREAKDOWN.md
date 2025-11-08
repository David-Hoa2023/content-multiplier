# Phase 4: Intelligence & Analytics - Task Breakdown

**Timeline**: Q3-Q4 2025 (12 weeks)
**Goal**: Provide actionable insights to optimize content performance

---

## Overview

Phase 4 transforms Content Multiplier from a content creation platform into a data-driven intelligence system. This phase focuses on:
- Unified analytics across all publishing platforms
- AI-powered insights and predictions
- A/B testing and experimentation
- Comprehensive reporting and attribution
- Integration with major analytics and CRM platforms

---

## Task Groups

### 1. Performance Analytics (3 weeks)

#### 1.1 Analytics Data Collection

**Task**: Create platform API integrations for analytics data
- **Deliverables**:
  - Twitter/X Analytics API integration (impressions, engagements, link clicks)
  - LinkedIn Analytics API (post impressions, clicks, shares, comments)
  - Facebook Insights API (reach, engagement, clicks)
  - Instagram Insights API (impressions, reach, saves, shares)
  - YouTube Analytics API (views, watch time, likes, comments)
  - WordPress Stats API (page views, unique visitors)
  - Medium Stats API (views, reads, claps)
  - Email analytics (SendGrid/Mailchimp open rates, click rates)
  - Data normalization across platforms
  - Incremental data sync (fetch only new data)
  - Error handling and retry logic
- **Dependencies**: Phase 1 publishing integrations complete
- **Estimate**: 6 days
- **Files**: `apps/api/src/services/analytics/collectors/*.ts`

**Task**: Design and build unified analytics dashboard
- **Deliverables**:
  - Cross-platform metrics aggregation
  - Time range selector (today, 7d, 30d, 90d, custom)
  - Platform comparison view
  - Metric cards (total impressions, engagement rate, clicks, conversions)
  - Trend indicators (up/down arrows with percentages)
  - Real-time data updates (5-minute polling)
  - Export dashboard to PDF
- **Dependencies**: Platform integrations complete
- **Estimate**: 4 days
- **Files**: `apps/web/app/analytics/dashboard/page.tsx`

#### 1.2 Engagement Metrics

**Task**: Implement engagement metrics tracking
- **Deliverables**:
  - Like/reaction tracking across platforms
  - Share/retweet tracking
  - Comment count and sentiment
  - Click tracking (link clicks, CTA clicks)
  - Save/bookmark tracking
  - Video watch time and completion rate
  - Engagement rate calculation (engagements / impressions)
  - Engagement by platform chart
  - Engagement by content type analysis
  - Top performing content leaderboard
- **Dependencies**: Analytics data collection complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/analytics/engagement.ts`

**Task**: Build traffic source attribution system
- **Deliverables**:
  - Referrer tracking
  - Direct traffic vs. social vs. search
  - Platform-specific attribution
  - Campaign source tracking
  - Medium and content tracking
  - Attribution by content pack
  - Traffic source breakdown chart (pie/donut)
  - Traffic trends over time (line chart)
- **Dependencies**: Analytics integration complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/analytics/attribution.ts`

#### 1.3 UTM & Conversion Tracking

**Task**: Create UTM parameter tracking automation
- **Deliverables**:
  - Auto-generate UTM parameters (source, medium, campaign, content, term)
  - UTM template builder
  - URL shortening integration (Bitly API)
  - UTM parameter extraction from analytics
  - UTM performance comparison
  - Click-through rate by UTM parameter
  - Campaign performance by UTM
- **Dependencies**: None
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/analytics/utm.ts`

**Task**: Implement conversion tracking
- **Deliverables**:
  - Conversion goal definition (signup, download, purchase, etc.)
  - Conversion pixel/webhook integration
  - Conversion attribution to content packs
  - Conversion rate calculation
  - Multi-step funnel tracking
  - Time to conversion metrics
  - Conversion value tracking (revenue)
  - Goal completion report
- **Dependencies**: Traffic attribution complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/analytics/conversions.ts`

**Task**: Build content ROI calculation system
- **Deliverables**:
  - Cost input (time spent, AI costs, design costs)
  - Revenue tracking (conversions × value)
  - ROI formula: (Revenue - Cost) / Cost × 100
  - ROI by content pack
  - ROI by platform
  - ROI by content type
  - Payback period calculation
  - Lifetime value attribution
- **Dependencies**: Conversion tracking complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/analytics/roi.ts`

**Total Performance Analytics**: 26 days (~5 weeks)

---

### 2. AI-Powered Insights (3 weeks)

#### 2.1 Predictive Analytics

**Task**: Implement content performance prediction using ML
- **Deliverables**:
  - Training dataset from historical performance
  - Feature engineering (word count, readability, topic, day/time, platform)
  - Model training (regression for engagement prediction)
  - Model evaluation (RMSE, MAE, R²)
  - Prediction API endpoint
  - Confidence score for predictions
  - Predicted vs. actual performance comparison
  - Model retraining pipeline (weekly)
  - Performance prediction before publishing
- **Dependencies**: Historical analytics data (3+ months)
- **Estimate**: 6 days
- **Files**: `apps/api/src/services/ai-insights/performance-prediction.ts`

**Task**: Build optimal publish time recommendation engine
- **Deliverables**:
  - Historical performance by hour/day analysis
  - Audience activity patterns detection
  - Platform-specific optimal times
  - Timezone-aware recommendations
  - Content type-specific timing
  - Confidence scoring for recommendations
  - "Best time to publish" suggestions in UI
  - Schedule optimization for content calendar
- **Dependencies**: Analytics data with timestamps
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/ai-insights/optimal-timing.ts`

#### 2.2 Sentiment & Trend Analysis

**Task**: Create audience sentiment analysis system
- **Deliverables**:
  - Comment sentiment classification (positive, neutral, negative)
  - Sentiment scoring (-1 to +1)
  - LLM-based sentiment analysis
  - Aspect-based sentiment (what specifically they like/dislike)
  - Sentiment trends over time
  - Sentiment by platform
  - Alert for negative sentiment spikes
  - Comment theme extraction
- **Dependencies**: Comment data from platforms
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/ai-insights/sentiment.ts`

**Task**: Implement topic trend detection and forecasting
- **Deliverables**:
  - Topic extraction from published content
  - Trending topics identification
  - Search volume trends (Google Trends API)
  - Social media trend detection
  - Topic lifecycle analysis (emerging, trending, declining)
  - Seasonal trend patterns
  - Topic recommendation based on trends
  - Trend forecasting (next 30 days)
- **Dependencies**: Google Trends API or similar
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/ai-insights/trends.ts`

#### 2.3 Competitive Intelligence

**Task**: Build competitor content monitoring system
- **Deliverables**:
  - Competitor URL/account registration
  - Automated content scraping (RSS, API)
  - Publication frequency tracking
  - Topic coverage analysis
  - Engagement benchmarking
  - Content format analysis
  - Publishing schedule patterns
  - Alert when competitor publishes on similar topic
- **Dependencies**: Web scraping infrastructure
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/ai-insights/competitor-monitor.ts`

**Task**: Create automated content gap analysis
- **Deliverables**:
  - Your content vs. competitor content comparison
  - Topic gap identification
  - Keyword gap analysis
  - Content type gap (e.g., competitor has videos, you don't)
  - Engagement gap (topics they succeed on)
  - Opportunity scoring
  - Gap-filling content suggestions
  - Gap closure tracking over time
- **Dependencies**: Competitor monitoring, your analytics
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/ai-insights/content-gaps.ts`

**Total AI-Powered Insights**: 29 days (~6 weeks)

---

### 3. A/B Testing & Experimentation (2 weeks)

#### 3.1 Testing Framework

**Task**: Implement headline A/B testing framework
- **Deliverables**:
  - Variant creation (A vs. B vs. C, up to 5 variants)
  - Traffic split configuration (50/50, 33/33/33, weighted)
  - Test execution tracking
  - Impression and click tracking by variant
  - Winner determination (click-through rate)
  - Statistical significance calculation (chi-square test)
  - Auto-promote winner option
  - Test history and results
- **Dependencies**: Publishing system complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/experiments/ab-testing.ts`

**Task**: Build CTA variation testing system
- **Deliverables**:
  - CTA text variation testing
  - CTA placement testing (top, middle, bottom)
  - CTA button color/style testing
  - Click tracking by CTA variant
  - Conversion tracking by CTA
  - Heatmap visualization (optional)
  - Best-performing CTA recommendation
- **Dependencies**: A/B testing framework
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/experiments/cta-testing.ts`

**Task**: Create image variation testing and analysis
- **Deliverables**:
  - Featured image A/B testing
  - Thumbnail variation testing
  - Social media image testing
  - Engagement by image variant
  - Click-through rate by image
  - AI image quality correlation
  - Image style performance analysis
- **Dependencies**: A/B testing framework, visual content generation
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/experiments/image-testing.ts`

#### 3.2 Advanced Experimentation

**Task**: Implement publish time experimentation
- **Deliverables**:
  - Time slot A/B testing (morning vs. evening)
  - Day-of-week testing (weekday vs. weekend)
  - Timezone testing for global audiences
  - Engagement by publish time analysis
  - Optimal time confirmation through testing
  - Sample size calculator
- **Dependencies**: Publishing schedule system
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/experiments/timing-tests.ts`

**Task**: Build statistical significance tracking for experiments
- **Deliverables**:
  - Sample size requirements calculation
  - Statistical power analysis
  - Confidence interval calculation
  - P-value computation (t-test, chi-square)
  - Confidence level indicator (90%, 95%, 99%)
  - Early stopping rules (if winner is clear)
  - Bayesian analysis (optional)
  - Test validity checks (no peeking, minimum runtime)
- **Dependencies**: A/B testing framework
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/experiments/statistics.ts`

**Total A/B Testing**: 15 days (~3 weeks)

---

### 4. Reporting & Attribution (2 weeks)

#### 4.1 Custom Reporting

**Task**: Create custom report builder interface
- **Deliverables**:
  - Drag-and-drop report builder
  - Metric selection (choose from 30+ metrics)
  - Dimension selection (platform, date, campaign, author)
  - Filter builder (date range, platform, status)
  - Chart type selection (line, bar, pie, table)
  - Report layout customization
  - Save report templates
  - Clone and modify reports
- **Dependencies**: Analytics data available
- **Estimate**: 5 days
- **Files**: `apps/web/app/analytics/reports/builder/page.tsx`

**Task**: Implement executive summary report generation
- **Deliverables**:
  - Auto-generated executive summary (AI-written)
  - Key metrics highlight (top 5 KPIs)
  - Performance vs. goals comparison
  - Trend analysis (up/down from last period)
  - Top performing content (top 10)
  - Recommendations section
  - PDF export with branding
  - Email delivery option
- **Dependencies**: Analytics data, report builder
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/reporting/executive-summary.ts`

**Task**: Build campaign performance reporting
- **Deliverables**:
  - Campaign-level metrics aggregation
  - Content pack contribution to campaign
  - Campaign ROI calculation
  - Campaign timeline view
  - Multi-campaign comparison
  - Campaign goal tracking (target vs. actual)
  - Campaign success scoring
  - Campaign post-mortem report
- **Dependencies**: Campaign system from Phase 2
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/reporting/campaign-reports.ts`

#### 4.2 Attribution & Integrations

**Task**: Create multi-touch attribution model
- **Deliverables**:
  - First-touch attribution
  - Last-touch attribution
  - Linear attribution (equal credit to all touchpoints)
  - Time-decay attribution (recent touches get more credit)
  - Position-based attribution (U-shaped, W-shaped)
  - Custom attribution model builder
  - Attribution comparison (which model to use)
  - Touchpoint visualization (customer journey map)
- **Dependencies**: Conversion tracking complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/reporting/attribution.ts`

**Task**: Implement integrations with Google Analytics, HubSpot, Salesforce
- **Deliverables**:
  - Google Analytics 4 integration (send events)
  - HubSpot CRM integration (contact tracking, deal attribution)
  - Salesforce integration (lead/opportunity attribution)
  - Segment.io integration (send events to all tools)
  - Bi-directional data sync
  - Custom event mapping
  - Integration health monitoring
  - Data quality validation
- **Dependencies**: External API accounts
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/integrations/analytics/*.ts`

**Task**: Build scheduled report delivery
- **Deliverables**:
  - Report schedule configuration (daily, weekly, monthly)
  - Email delivery with PDF attachment
  - Slack delivery (summary + link to full report)
  - Microsoft Teams delivery
  - Recipient list management
  - Report delivery history
  - Delivery failure alerts
  - Timezone-aware scheduling
- **Dependencies**: Report builder complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/reporting/scheduler.ts`

**Total Reporting & Attribution**: 23 days (~4.5 weeks)

---

### 5. Analytics UI & Visualization (1.5 weeks)

#### 5.1 Dashboard Components

**Task**: Create analytics dashboard UI components
- **Deliverables**:
  - Metric card component (value, change %, trend sparkline)
  - Line chart component (time series data)
  - Bar chart component (comparison data)
  - Pie/donut chart component (distribution)
  - Table component with sorting and pagination
  - Heatmap component (engagement by hour/day)
  - Funnel visualization component
  - Leaderboard component (top content)
  - Date range picker with presets
  - Platform filter selector
  - Export buttons (CSV, PDF, PNG)
- **Dependencies**: Chart library (Chart.js, Recharts, or D3.js)
- **Estimate**: 5 days
- **Files**: `apps/web/app/components/analytics/*.tsx`

**Task**: Build interactive analytics explorer
- **Deliverables**:
  - Drill-down capability (click metric to see details)
  - Cross-filtering (filter all widgets by selection)
  - Comparison mode (this period vs. last period)
  - Anomaly highlighting (unexpected spikes/drops)
  - Tooltip with detailed breakdowns
  - Responsive design for mobile
  - Dark mode support
- **Dependencies**: Dashboard components complete
- **Estimate**: 3 days
- **Files**: `apps/web/app/analytics/explorer/page.tsx`

**Task**: Create performance insights panel
- **Deliverables**:
  - AI-generated insights sidebar
  - "Why did this happen?" explanations
  - Actionable recommendations
  - Insight prioritization (high impact first)
  - Dismiss/snooze insights
  - Insight history log
  - Insight sharing with team
- **Dependencies**: AI insights complete
- **Estimate**: 2 days
- **Files**: `apps/web/app/components/InsightsPanel.tsx`

**Total Analytics UI**: 10 days (~2 weeks)

---

### 6. Data Infrastructure (1 week)

#### 6.1 Data Warehouse

**Task**: Set up analytics data warehouse
- **Deliverables**:
  - Dimensional modeling (fact and dimension tables)
  - ETL pipeline for analytics data
  - Data retention policy (keep 2 years)
  - Data aggregation tables (daily, weekly, monthly rollups)
  - Indexed queries for performance
  - Data quality checks
  - Data lineage tracking
- **Dependencies**: PostgreSQL or separate warehouse (BigQuery, Redshift)
- **Estimate**: 4 days
- **Files**: `infra/migrations/006_analytics_warehouse.sql`

**Task**: Build analytics data sync jobs
- **Deliverables**:
  - Scheduled jobs for platform data sync (every 6 hours)
  - Incremental sync (only new data)
  - Backfill mechanism for historical data
  - Rate limit handling
  - Sync status monitoring
  - Sync failure alerts
  - Manual sync trigger
- **Dependencies**: Platform API integrations
- **Estimate**: 3 days
- **Files**: `apps/api/src/jobs/analytics-sync.ts`

**Total Data Infrastructure**: 7 days

---

### 7. Testing & Quality Assurance (1 week)

#### 7.1 Integration Tests

**Task**: Write integration tests for analytics features
- **Deliverables**:
  - Platform data collection tests (mocked APIs)
  - Metric calculation tests
  - UTM tracking tests
  - Conversion attribution tests
  - ROI calculation tests
  - A/B test variant selection tests
  - Statistical significance tests
  - Report generation tests
- **Dependencies**: All analytics features complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/__tests__/analytics.test.ts`

#### 7.2 End-to-End Tests

**Task**: Create E2E tests for analytics workflows
- **Deliverables**:
  - Publish content → collect analytics → view dashboard
  - Create A/B test → run test → view results
  - Build custom report → schedule delivery → receive email
  - Set up conversion goal → track conversion → view ROI
- **Dependencies**: All features complete
- **Estimate**: 2 days
- **Files**: `apps/web/__tests__/e2e/analytics.spec.ts`

**Task**: Perform data accuracy validation
- **Deliverables**:
  - Compare Content Multiplier data vs. platform native analytics
  - Verify metric calculations (±5% tolerance)
  - Test edge cases (zero data, huge numbers)
  - Validate attribution logic
  - Cross-check ROI calculations
- **Dependencies**: Analytics complete
- **Estimate**: 1 day

**Total Testing**: 7 days

---

### 8. Documentation & Training (1 week)

#### 8.1 User Documentation

**Task**: Create analytics user documentation
- **Deliverables**:
  - Understanding the analytics dashboard
  - Metric definitions glossary
  - How to set up conversion tracking
  - Creating custom reports guide
  - A/B testing best practices
  - Attribution models explained
  - Integration setup guides (GA4, HubSpot, Salesforce)
  - Troubleshooting analytics issues
- **Dependencies**: All features complete
- **Estimate**: 3 days
- **Files**: `docs/analytics/*.md`

**Task**: Create video tutorials for analytics
- **Deliverables**:
  - "Analytics Dashboard Overview" (8 min)
  - "Setting Up Conversion Tracking" (6 min)
  - "Running Your First A/B Test" (10 min)
  - "Creating Custom Reports" (7 min)
  - "Understanding Multi-Touch Attribution" (9 min)
- **Dependencies**: All features complete
- **Estimate**: 2 days

**Task**: Build analytics onboarding checklist
- **Deliverables**:
  - Connect your first platform
  - Set up UTM parameters
  - Create your first conversion goal
  - View your first analytics report
  - Run your first A/B test
  - Schedule a weekly report
- **Dependencies**: All features complete
- **Estimate**: 1 day
- **Files**: `apps/web/app/components/AnalyticsOnboarding.tsx`

**Total Documentation**: 6 days

---

## Task Dependencies Diagram

```
[Platform API Integrations] → [Unified Analytics Dashboard] → [Engagement Metrics]
                                        ↓
                              [Traffic Attribution] → [UTM Tracking] → [Conversion Tracking]
                                                                              ↓
                                                                        [ROI Calculation]

[Historical Data] → [Performance Prediction ML] → [Optimal Timing]
                              ↓
                    [Sentiment Analysis] → [Trend Detection]
                              ↓
            [Competitor Monitoring] → [Content Gap Analysis]

[A/B Testing Framework] → [Headline Testing, CTA Testing, Image Testing, Timing Tests]
                              ↓
                    [Statistical Significance]

[Custom Report Builder] → [Executive Summary] → [Campaign Reports]
                              ↓
            [Multi-Touch Attribution] → [CRM Integrations]
                              ↓
                    [Scheduled Delivery]

[Analytics UI Components] → [Interactive Explorer] → [Insights Panel]

[Data Warehouse] → [Sync Jobs] → [All Analytics Features]

[Testing & Documentation]
```

---

## Timeline Summary

| Week | Focus | Tasks |
|------|-------|-------|
| 1-3 | Performance Analytics | Platform APIs, unified dashboard, engagement, attribution, UTM, conversions, ROI |
| 4-6 | AI-Powered Insights | Performance prediction, optimal timing, sentiment, trends, competitor monitoring, gap analysis |
| 7-8 | A/B Testing | Testing framework, headline/CTA/image/timing tests, statistical significance |
| 9-10 | Reporting & Attribution | Custom reports, executive summaries, campaign reports, multi-touch attribution, CRM integrations, scheduled delivery |
| 11 | Analytics UI | Dashboard components, interactive explorer, insights panel |
| 12 | Data Infrastructure | Data warehouse, sync jobs |
| 13 | Testing | Integration tests, E2E tests, data validation |
| 14 | Documentation | User docs, video tutorials, onboarding |

---

## Resource Allocation

### Engineering Team (6 FTE)

**Backend Engineers (3):**
- Engineer 1: Platform API integrations, data collection (Weeks 1-3)
- Engineer 2: AI insights - prediction, sentiment, trends (Weeks 4-6)
- Engineer 3: A/B testing framework, statistics (Weeks 7-8)
- All: Reporting, attribution, integrations (Weeks 9-10)

**Data Engineer (1):**
- Data warehouse design and implementation (Weeks 1-2)
- ETL pipeline development (Weeks 3-4)
- Data sync jobs (Weeks 5-6)
- Analytics query optimization (Weeks 7-8)
- Data quality validation (Weeks 9-14)

**Frontend Engineers (2):**
- Engineer 1: Analytics dashboard UI, metric cards, charts (Weeks 1-6)
- Engineer 2: Report builder UI, A/B test UI (Weeks 7-10)
- Both: Analytics explorer, insights panel (Weeks 11-12)
- Testing and documentation support (Weeks 13-14)

---

## Database Schema Changes

### New Tables

**analytics_metrics**
```sql
CREATE TABLE analytics_metrics (
  metric_id BIGSERIAL PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,  -- twitter, linkedin, facebook, etc.
  metric_type TEXT NOT NULL,  -- impressions, clicks, likes, shares, etc.
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, platform, metric_type, date)
);

CREATE INDEX idx_metrics_pack ON analytics_metrics(pack_id);
CREATE INDEX idx_metrics_platform ON analytics_metrics(platform);
CREATE INDEX idx_metrics_date ON analytics_metrics(date);
```

**conversions**
```sql
CREATE TABLE conversions (
  conversion_id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id),
  goal_type TEXT NOT NULL,  -- signup, download, purchase, etc.
  value NUMERIC,  -- revenue value
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversions_pack ON conversions(pack_id);
CREATE INDEX idx_conversions_goal ON conversions(goal_type);
CREATE INDEX idx_conversions_date ON conversions(converted_at);
```

**ab_tests**
```sql
CREATE TABLE ab_tests (
  test_id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id),
  test_type TEXT NOT NULL,  -- headline, cta, image, timing
  variants JSONB NOT NULL,  -- [{variant: 'A', content: '...', impressions: 0, clicks: 0}]
  traffic_split JSONB,  -- {A: 50, B: 50}
  status TEXT DEFAULT 'running',  -- running, completed, stopped
  winner_variant TEXT,
  confidence_level NUMERIC,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_ab_tests_pack ON ab_tests(pack_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
```

**ab_test_events**
```sql
CREATE TABLE ab_test_events (
  event_id BIGSERIAL PRIMARY KEY,
  test_id TEXT REFERENCES ab_tests(test_id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- impression, click, conversion
  user_identifier TEXT,  -- cookie/session ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_events_test ON ab_test_events(test_id);
CREATE INDEX idx_test_events_variant ON ab_test_events(variant);
```

**reports**
```sql
CREATE TABLE reports (
  report_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,  -- metrics, dimensions, filters, chart types
  schedule JSONB,  -- {frequency: 'weekly', day: 'monday', time: '09:00', recipients: [...]}
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**report_deliveries**
```sql
CREATE TABLE report_deliveries (
  delivery_id BIGSERIAL PRIMARY KEY,
  report_id TEXT REFERENCES reports(report_id) ON DELETE CASCADE,
  status TEXT NOT NULL,  -- success, failed
  delivered_to TEXT[],  -- email addresses
  error_message TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_report ON report_deliveries(report_id);
```

**competitor_content**
```sql
CREATE TABLE competitor_content (
  content_id TEXT PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  title TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  content_type TEXT,  -- blog, video, social, etc.
  topics TEXT[],
  engagement_metrics JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_content_name ON competitor_content(competitor_name);
CREATE INDEX idx_competitor_content_published ON competitor_content(published_at);
```

### Analytical Tables (Pre-Aggregated)

**daily_metrics**
```sql
CREATE TABLE daily_metrics (
  id SERIAL PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id),
  date DATE NOT NULL,
  platform TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  conversion_value NUMERIC DEFAULT 0,
  engagement_rate NUMERIC,
  ctr NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, date, platform)
);

CREATE INDEX idx_daily_metrics_pack ON daily_metrics(pack_id);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
```

### Migration File
- **File**: `infra/migrations/006_phase4_analytics.sql`

---

## Environment Variables Required

```bash
# Platform Analytics APIs
TWITTER_API_KEY=
TWITTER_API_SECRET=
LINKEDIN_ANALYTICS_TOKEN=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_ANALYTICS_TOKEN=
YOUTUBE_API_KEY=
GOOGLE_ANALYTICS_PROPERTY_ID=

# CRM/Analytics Integrations
GOOGLE_ANALYTICS_MEASUREMENT_ID=
HUBSPOT_API_KEY=
HUBSPOT_PORTAL_ID=
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_USERNAME=
SALESFORCE_PASSWORD=
SEGMENT_WRITE_KEY=

# ML/AI Services
OPENAI_API_KEY=  # For sentiment analysis, insights generation

# External Data Services
GOOGLE_TRENDS_API_KEY=  # Or SerpAPI for trends
BITLY_ACCESS_TOKEN=  # For URL shortening

# Analytics Configuration
ANALYTICS_SYNC_INTERVAL=21600000  # 6 hours in ms
ANALYTICS_RETENTION_DAYS=730  # 2 years
MIN_AB_TEST_SAMPLE_SIZE=100
AB_TEST_CONFIDENCE_LEVEL=0.95  # 95% confidence

# Report Delivery
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
REPORT_FROM_EMAIL=reports@contentmultiplier.com

# Data Warehouse (if using external)
BIGQUERY_PROJECT_ID=
BIGQUERY_DATASET=
REDSHIFT_HOST=
REDSHIFT_DATABASE=
```

---

## Success Criteria

### Technical Metrics
- [ ] Analytics data accuracy ±5% vs. platform native analytics
- [ ] Analytics dashboard load time < 2 seconds
- [ ] Data sync completion within 6 hours
- [ ] ML prediction accuracy > 70% (MAPE < 30%)
- [ ] A/B test statistical significance achieved in 80%+ of tests
- [ ] Report generation time < 10 seconds

### User Metrics
- [ ] 360° visibility into content performance across 8+ platforms
- [ ] 25% improvement in engagement rates through AI recommendations
- [ ] 50% time savings on manual reporting
- [ ] ROI tracking for 90%+ of content packs
- [ ] User satisfaction with analytics > 8.5/10

### Business Metrics
- [ ] Average content ROI > 200%
- [ ] A/B testing adoption rate > 50%
- [ ] Custom reports created by 70%+ of teams
- [ ] Conversion tracking enabled for 80%+ of content
- [ ] Data-driven decisions increase by 60%

---

## Risk Mitigation

### High-Risk Items

1. **Platform API Rate Limits**
   - **Risk**: Hitting rate limits when syncing analytics from multiple platforms
   - **Mitigation**: Implement exponential backoff, request batching, cache aggressively, sync incrementally

2. **Data Accuracy**
   - **Risk**: Discrepancies between Content Multiplier and platform native analytics
   - **Mitigation**: Validate against source platforms, document calculation methods, display data source timestamps

3. **ML Model Performance**
   - **Risk**: Predictions are inaccurate or biased
   - **Mitigation**: Regular model evaluation, A/B test recommendations, user feedback loop, model retraining

4. **Integration Complexity**
   - **Risk**: CRM/analytics integrations break due to API changes
   - **Mitigation**: Version API calls, monitor integration health, have fallback mechanisms, user notifications

5. **Data Privacy & Compliance**
   - **Risk**: Storing analytics data may violate GDPR/CCPA
   - **Mitigation**: Data anonymization, user consent tracking, data retention policies, right to deletion

---

## Integration Points

### With Phase 1 (Publishing)
- Analytics data collection depends on published content
- Publishing success/failure affects metrics
- Platform connections reused for analytics APIs

### With Phase 2 (Advanced Content)
- Template performance analytics
- Visual content engagement analysis
- SEO ranking correlation with analytics

### With Phase 3 (Collaboration)
- Team performance dashboards
- User contribution analytics
- Approval velocity metrics

### With Phase 5 (Scale)
- Analytics query optimization at scale
- Data warehouse for large datasets
- Real-time analytics streaming

---

## External Dependencies

### Required Integrations
- **Platform Analytics APIs**: Twitter, LinkedIn, Facebook, Instagram, YouTube
- **CRM Systems**: HubSpot, Salesforce (optional but recommended)
- **Analytics Platforms**: Google Analytics 4, Segment.io
- **Data Services**: Google Trends, SerpAPI (for trend data)
- **URL Shortening**: Bitly API (for UTM tracking)

### Optional Services
- **Data Warehouse**: BigQuery, Redshift, Snowflake (for scale)
- **ML Platforms**: Google Vertex AI, AWS SageMaker (for advanced ML)

---

## Testing Strategy

### Unit Tests
- Metric calculation functions
- ROI calculation formulas
- Statistical significance calculations
- Attribution model logic
- Sentiment scoring

### Integration Tests
- Platform API data collection (mocked)
- Data sync jobs
- Report generation
- A/B test variant selection
- CRM data push

### E2E Tests
- Complete analytics workflow (publish → collect → visualize)
- A/B test creation → execution → results
- Report building → scheduling → delivery

### Data Quality Tests
- Compare against platform native analytics
- Verify aggregations are correct
- Test edge cases (zero data, spikes, missing data)
- Cross-platform consistency

---

## Performance Optimization

### Query Optimization
- Pre-aggregate daily/weekly/monthly metrics
- Index all foreign keys and date columns
- Materialize frequently accessed views
- Partition large tables by date

### Caching Strategy
- Cache dashboard data (5-minute TTL)
- Cache report results (1-hour TTL)
- Cache ML predictions (24-hour TTL)
- Invalidate cache on new data sync

### Data Pipeline
- Batch insert analytics data (1000 rows at a time)
- Parallel data collection from platforms
- Incremental sync (only fetch new data)
- Queue-based processing for data sync jobs

---

## Next Steps After Phase 4

1. **Advanced ML Features**: Deep learning for content recommendations
2. **Real-Time Analytics**: Live dashboards with WebSocket updates
3. **Predictive Budgeting**: AI suggests optimal content budget allocation
4. **Automated Optimization**: AI auto-adjusts publishing strategy
5. **Benchmark Database**: Industry benchmarks for comparison

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready for implementation
