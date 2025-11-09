'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from './components/MetricCard';
import { SuccessRateBarChart } from './components/SuccessRateBarChart';
import { TimeDistributionLineChart } from './components/TimeDistributionLineChart';
import { PlatformUsagePieChart } from './components/PlatformUsagePieChart';
import { ExportButton } from './components/ExportButton';

interface SuccessRateData {
  start_date: string;
  end_date: string;
  overall_success_rate: number;
  by_platform: Array<{
    platform: string;
    total_attempts: number;
    successful: number;
    failed: number;
    success_rate: number;
  }>;
}

interface AverageTimesData {
  start_date: string;
  end_date: string;
  fastest_platform: string;
  slowest_platform: string;
  by_platform: Array<{
    platform: string;
    avg_duration_ms: number;
    avg_duration_seconds: number;
    total_publishes: number;
  }>;
}

interface PlatformUsageData {
  start_date: string;
  end_date: string;
  most_used_platform: string;
  platforms: Array<{
    platform: string;
    total_publishes: number;
    usage_percentage: number;
    last_published_at: string | null;
  }>;
}

interface TimeDistributionData {
  start_date: string;
  end_date: string;
  most_popular_hour: number | null;
  by_hour: Array<{
    hour: number;
    count: number;
  }>;
  by_day_of_week: Array<{
    day_of_week: number;
    day_name: string;
    count: number;
  }>;
}

export default function PublishingAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<SuccessRateData | null>(null);
  const [timesData, setTimesData] = useState<AverageTimesData | null>(null);
  const [usageData, setUsageData] = useState<PlatformUsageData | null>(null);
  const [timeDistData, setTimeDistData] = useState<TimeDistributionData | null>(null);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const params = new URLSearchParams({
          start_date: dateRange.start,
          end_date: dateRange.end
        });

        // Fetch all analytics in parallel
        const [successRes, timesRes, usageRes, timeDistRes] = await Promise.all([
          fetch(`${baseUrl}/api/analytics/publishing/success-rates?${params}`),
          fetch(`${baseUrl}/api/analytics/publishing/average-times?${params}`),
          fetch(`${baseUrl}/api/analytics/publishing/platform-usage?${params}`),
          fetch(`${baseUrl}/api/analytics/publishing/time-distribution?${params}`)
        ]);

        if (!successRes.ok || !timesRes.ok || !usageRes.ok || !timeDistRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const [success, times, usage, timeDist] = await Promise.all([
          successRes.json(),
          timesRes.json(),
          usageRes.json(),
          timeDistRes.json()
        ]);

        setSuccessData(success);
        setTimesData(times);
        setUsageData(usage);
        setTimeDistData(timeDist);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange]);

  // Calculate total publishes
  const totalPublishes = usageData?.platforms.reduce((sum, p) => sum + p.total_publishes, 0) || 0;

  // Calculate average publish time across all platforms
  const avgPublishTime = timesData?.by_platform.length
    ? (timesData.by_platform.reduce((sum, p) => sum + p.avg_duration_seconds, 0) / timesData.by_platform.length).toFixed(2)
    : '--';

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Publishing Analytics
        </h1>
        <p style={{ color: '#666', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
          Track and analyze your publishing performance across all platforms
        </p>
      </div>

      {/* Date Range Filter */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            Start Date:
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </label>
        </div>
        <ExportButton
          successData={successData}
          timesData={timesData}
          usageData={usageData}
          timeDistData={timeDistData}
          dateRange={dateRange}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '2rem',
          color: '#c33'
        }}>
          Error: {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <MetricCard
          label="Overall Success Rate"
          value={loading ? '--' : `${successData?.overall_success_rate.toFixed(1) || 0}%`}
          subtitle={loading ? undefined : `${dateRange.start} to ${dateRange.end}`}
          loading={loading}
        />
        <MetricCard
          label="Total Publishes"
          value={loading ? '--' : totalPublishes.toLocaleString()}
          subtitle={loading ? undefined : `Across ${usageData?.platforms.length || 0} platforms`}
          loading={loading}
        />
        <MetricCard
          label="Avg. Publish Time"
          value={loading ? '--' : `${avgPublishTime}s`}
          subtitle={loading ? undefined : `Fastest: ${timesData?.fastest_platform || 'N/A'}`}
          loading={loading}
        />
        <MetricCard
          label="Most Used Platform"
          value={loading ? '--' : usageData?.most_used_platform || 'N/A'}
          subtitle={loading ? undefined : `${usageData?.platforms[0]?.total_publishes.toLocaleString() || 0} publishes`}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {/* Success Rate Bar Chart */}
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Success Rate by Platform</h3>
          {loading ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Loading...</p>
          ) : successData?.by_platform.length ? (
            <SuccessRateBarChart data={successData.by_platform} />
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>No data available</p>
          )}
        </div>

        {/* Platform Usage Pie Chart */}
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Platform Usage Distribution</h3>
          {loading ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Loading...</p>
          ) : usageData?.platforms.length ? (
            <PlatformUsagePieChart data={usageData.platforms} />
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Time Distribution Charts */}
      <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Publishing Time Patterns</h3>
        {loading ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Loading...</p>
        ) : timeDistData?.by_hour.length && timeDistData?.by_day_of_week.length ? (
          <TimeDistributionLineChart
            hourlyData={timeDistData.by_hour}
            dailyData={timeDistData.by_day_of_week}
          />
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>No data available</p>
        )}
      </div>

      {/* Average Publishing Times Table */}
      <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Average Publishing Time by Platform</h3>
        {loading ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Loading...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Platform</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>Avg Time (ms)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>Avg Time (s)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>Total Publishes</th>
              </tr>
            </thead>
            <tbody>
              {timesData?.by_platform.map(platform => (
                <tr key={platform.platform} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{platform.platform}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{platform.avg_duration_ms.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{platform.avg_duration_seconds}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{platform.total_publishes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
