import React from 'react';
import { FiDollarSign, FiAlertTriangle, FiEdit2, FiRepeat } from 'react-icons/fi';
import type { KpiMetric } from '../useDashboardData';

const ICON_MAP: Record<string, any> = {
  FiDollarSign,
  FiAlertTriangle,
  FiEdit2,
  FiRepeat,
};

// Reusable Sub-component
const KpiCard = ({ icon, label, value, valueColor, iconBg, iconColor }: KpiMetric) => {
  const Icon = icon ? ICON_MAP[icon] : FiDollarSign;
  return (
    <div className="card flex items-center gap-5 py-5 hover:-translate-y-1 transition-transform duration-200">
      <div className={`w-12.5 h-12.5 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </span>
        <span className={`text-[22px] font-semibold leading-none ${valueColor}`}>
          {value}
        </span>
      </div>
    </div>
  );
};

interface KpiMetricsProps {
  metrics: KpiMetric[];
  loading?: boolean;
}

const KpiMetrics = ({ metrics, loading }: KpiMetricsProps) => {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[24px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card flex items-center gap-5 py-5 animate-pulse">
            <div className="w-12.5 h-12.5 rounded-full bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[24px]">
      {metrics.map((metric) => (
        <KpiCard key={metric.id} {...metric} />
      ))}
    </div>
  );
};

export default KpiMetrics;