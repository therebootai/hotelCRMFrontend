import React from 'react';
import DashboardHeader from './components/DashboardHeader';
import KpiMetrics from './components/KpiMetrics';

// Temporary placeholders so your app doesn't break
const RoomStatusBoardPlaceholder = () => (
  <div className="w-full h-[300px] border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-gray-50/50 text-text-secondary">
    Room Status Board Component (Next)
  </div>
);

const OperationsOverviewPlaceholder = () => (
  <div className="w-full h-[250px] border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-gray-50/50 text-text-secondary">
    Operations Overview Component (Arrivals, Occupancy, Departures)
  </div>
);

const Dashboard = () => {
  return (
    <div className="page-container py-[32px] flex flex-col gap-[32px] animate-fade-in">
      
      {/* 1. Header Area */}
      <DashboardHeader />

      {/* 2. Room Status Board (Kanban-style grid) */}
      <section className="w-full">
         <RoomStatusBoardPlaceholder />
      </section>

      {/* 3. Operations Overview (3-Column Layout) */}
      <section className="w-full">
        <OperationsOverviewPlaceholder />
      </section>

      {/* 4. KPI Metrics Cards */}
      <section className="w-full">
         <KpiMetrics />
      </section>

    </div>
  );
};

export default Dashboard;