interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
}

export function MetricCard({ label, value, subtitle, trend, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div style={{
        padding: '1.5rem',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{label}</p>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#ccc',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
          {value}
        </p>
        {trend && (
          <span style={{
            fontSize: '0.875rem',
            color: trend.direction === 'up' ? '#10b981' : '#ef4444'
          }}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
