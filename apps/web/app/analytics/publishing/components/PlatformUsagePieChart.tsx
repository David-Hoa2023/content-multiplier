import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PlatformUsagePieChartProps {
  data: Array<{
    platform: string;
    total_publishes: number;
    usage_percentage: number;
    last_published_at: string | null;
  }>;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

export function PlatformUsagePieChart({ data }: PlatformUsagePieChartProps) {
  // Transform data for recharts
  const chartData = data.map((item, index) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.total_publishes,
    percentage: item.usage_percentage,
    color: COLORS[index % COLORS.length]
  }));

  // Custom label for the pie chart
  const renderLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
                      Publishes: <strong>{data.value.toLocaleString()}</strong>
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                      Share: <strong>{data.percentage.toFixed(1)}%</strong>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Platform List */}
      <div style={{ marginTop: '1rem' }}>
        {chartData.map((platform, index) => (
          <div
            key={platform.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: index < chartData.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: platform.color
                }}
              />
              <span style={{ fontSize: '0.875rem' }}>{platform.name}</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {platform.value.toLocaleString()} ({platform.percentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
