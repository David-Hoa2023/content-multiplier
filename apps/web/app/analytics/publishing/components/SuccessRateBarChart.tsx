import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SuccessRateBarChartProps {
  data: Array<{
    platform: string;
    total_attempts: number;
    successful: number;
    failed: number;
    success_rate: number;
  }>;
}

export function SuccessRateBarChart({ data }: SuccessRateBarChartProps) {
  // Transform data for recharts
  const chartData = data.map(item => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    'Success Rate': item.success_rate,
    successful: item.successful,
    failed: item.failed,
    total: item.total_attempts
  }));

  // Color based on success rate
  const getBarColor = (rate: number) => {
    if (rate >= 90) return '#10b981'; // green
    if (rate >= 75) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          style={{ fontSize: '0.875rem' }}
        />
        <YAxis
          label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
          style={{ fontSize: '0.875rem' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{data.name}</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                    Success Rate: <strong>{data['Success Rate'].toFixed(1)}%</strong>
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0', color: '#10b981' }}>
                    Successful: {data.successful}
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0', color: '#ef4444' }}>
                    Failed: {data.failed}
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                    Total: {data.total}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar dataKey="Success Rate" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry['Success Rate'])} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
