import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
}

export function KpiCard({ title, value, subValue, icon, variant = 'default' }: KpiCardProps) {
  const variantClass = variant !== 'default' ? `kpi-${variant}` : '';

  return (
    <div className={`kpi-card ${variantClass}`}>
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-body">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        {subValue && <div className="kpi-sub">{subValue}</div>}
      </div>
    </div>
  );
}