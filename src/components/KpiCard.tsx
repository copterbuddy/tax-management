import type { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValue2?: string;
  tooltip?: string;
  icon?: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'neutral' | 'highlight' | 'warning';
}

export function KpiCard({
  title,
  value,
  subValue,
  subValue2,
  tooltip,
  icon,
  variant = 'default',
}: KpiCardProps) {
  const variantClass = variant !== 'default' ? `kpi-${variant}` : '';

  return (
    <div className={`kpi-card ${variantClass}`}>
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-body">
        <div className="kpi-title">
          {title}
          {tooltip && <Tooltip content={tooltip} />}
        </div>
        <div className="kpi-value">{value}</div>
        {subValue && <div className="kpi-sub">{subValue}</div>}
        {subValue2 && <div className="kpi-sub kpi-sub-detail">{subValue2}</div>}
      </div>
    </div>
  );
}
