interface ExportButtonProps {
  successData: any;
  timesData: any;
  usageData: any;
  timeDistData: any;
  dateRange: { start: string; end: string };
}

export function ExportButton({ successData, timesData, usageData, timeDistData, dateRange }: ExportButtonProps) {
  const exportToCSV = () => {
    if (!successData && !timesData && !usageData) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const lines: string[] = [];

    // Header
    lines.push(`Publishing Analytics Report`);
    lines.push(`Date Range: ${dateRange.start} to ${dateRange.end}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Overall metrics
    if (successData) {
      lines.push('OVERALL METRICS');
      lines.push(`Overall Success Rate,${successData.overall_success_rate.toFixed(1)}%`);
      lines.push('');
    }

    // Success rates by platform
    if (successData?.by_platform.length) {
      lines.push('SUCCESS RATES BY PLATFORM');
      lines.push('Platform,Total Attempts,Successful,Failed,Success Rate (%)');
      successData.by_platform.forEach((p: any) => {
        lines.push(`${p.platform},${p.total_attempts},${p.successful},${p.failed},${p.success_rate.toFixed(1)}`);
      });
      lines.push('');
    }

    // Average publishing times
    if (timesData?.by_platform.length) {
      lines.push('AVERAGE PUBLISHING TIMES');
      lines.push('Platform,Avg Time (ms),Avg Time (s),Total Publishes');
      timesData.by_platform.forEach((p: any) => {
        lines.push(`${p.platform},${p.avg_duration_ms},${p.avg_duration_seconds},${p.total_publishes}`);
      });
      lines.push('');
    }

    // Platform usage
    if (usageData?.platforms.length) {
      lines.push('PLATFORM USAGE STATISTICS');
      lines.push('Platform,Total Publishes,Usage Percentage (%),Last Published');
      usageData.platforms.forEach((p: any) => {
        const lastPublished = p.last_published_at ? new Date(p.last_published_at).toISOString() : 'N/A';
        lines.push(`${p.platform},${p.total_publishes},${p.usage_percentage.toFixed(1)},${lastPublished}`);
      });
      lines.push('');
    }

    // Time distribution by hour
    if (timeDistData?.by_hour.length) {
      lines.push('PUBLISHING BY HOUR OF DAY');
      lines.push('Hour,Count');
      timeDistData.by_hour.forEach((h: any) => {
        lines.push(`${h.hour}:00,${h.count}`);
      });
      lines.push('');
    }

    // Time distribution by day
    if (timeDistData?.by_day_of_week.length) {
      lines.push('PUBLISHING BY DAY OF WEEK');
      lines.push('Day,Count');
      timeDistData.by_day_of_week.forEach((d: any) => {
        lines.push(`${d.day_name},${d.count}`);
      });
    }

    // Create and download CSV
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `publishing-analytics-${dateRange.start}-to-${dateRange.end}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      style={{
        padding: '0.75rem 1.5rem',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#3b82f6';
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export to CSV
    </button>
  );
}
