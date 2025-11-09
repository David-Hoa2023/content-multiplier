import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface TimeDistributionLineChartProps {
  hourlyData: Array<{
    hour: number;
    count: number;
  }>;
  dailyData: Array<{
    day_of_week: number;
    day_name: string;
    count: number;
  }>;
}

export function TimeDistributionLineChart({ hourlyData, dailyData }: TimeDistributionLineChartProps) {
  // Ensure all hours are present (0-23)
  const completeHourlyData = Array.from({ length: 24 }, (_, i) => {
    const existing = hourlyData.find(d => d.hour === i);
    return {
      hour: i,
      count: existing?.count || 0,
      label: `${i.toString().padStart(2, '0')}:00`
    };
  });

  return (
    <div>
      {/* Hourly Distribution */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#666' }}>
          Publishing by Hour of Day
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={completeHourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="label"
              interval={2}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              label={{ value: 'Number of Publishes', angle: -90, position: 'insideLeft' }}
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
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{data.label}</p>
                      <p style={{ fontSize: '0.875rem' }}>Publishes: <strong>{data.count}</strong></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              fill="#3b82f6"
              fillOpacity={0.2}
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Distribution */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#666' }}>
          Publishing by Day of Week
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="day_name"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              label={{ value: 'Number of Publishes', angle: -90, position: 'insideLeft' }}
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
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{data.day_name}</p>
                      <p style={{ fontSize: '0.875rem' }}>Publishes: <strong>{data.count}</strong></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
