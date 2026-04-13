import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import KpiMetrics from "./components/KpiMetrics";
import RoomStatusBoard from "./components/RoomStatusBoard";
import OperationsOverview from "./components/OperationsOverview";

const Dashboard = () => {
  return (
    <div className="page-container py-[32px] flex flex-col gap-19 animate-fade-in">
      {/* 1. Header Area */}
      <DashboardHeader />

      {/* 2. Room Status Board (Kanban-style grid) */}
      <section className="w-full">
        <RoomStatusBoard />
      </section>

      {/* 3. Operations Overview (3-Column Layout) */}
      <section className="w-full">
        <OperationsOverview />
      </section>

      {/* 4. KPI Metrics Cards */}
      <section className="w-full">
        <KpiMetrics />
      </section>
    </div>
  );
};

export default Dashboard;
