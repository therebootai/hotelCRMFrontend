import React from 'react';
import { FiDollarSign, FiAlertTriangle, FiRefreshCw, FiEdit2, FiRepeat } from 'react-icons/fi';

// Reusable Sub-component
const KpiCard = ({ icon: Icon, label, value, valueColor, iconBg, iconColor }: any) => (
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

const KpiMetrics = () => {
  const metrics = [
    {
      id: 1,
      label: "AVG ROOM RENT",
      value: "₹428.50",
      valueColor: "text-text-primary",
      icon: FiDollarSign,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      id: 2,
      label: "PENDING POSTINGS",
      value: "04 Bills",
      valueColor: "text-danger", // Using the danger color from index.css
      icon: FiAlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-danger"
    },
    {
      id: 3,
      label: "CHANNEL ISSUES",
      value: "None",
      valueColor: "text-text-primary",
      icon: FiRepeat,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600"
    },
    {
      id: 4,
      label: "HOUSEKEEPING",
      value: "82% Clear",
      valueColor: "text-text-primary",
      icon: FiEdit2,
      iconBg: "bg-red-50", // Subtle pink/red background from your design
      iconColor: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[24px]">
      {metrics.map((metric) => (
        <KpiCard key={metric.id} {...metric} />
      ))}
    </div>
  );
};

export default KpiMetrics;