import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import RoomStatusBoard from "./components/RoomStatusBoard";
import OperationsOverview from "./components/OperationsOverview";
import KpiMetrics from "./components/KpiMetrics";

const Dashboard = () => {
  return (
    <div className="page-container py-[32px] flex flex-col gap-[32px] animate-fade-in">
      <section className="w-full">
        <DashboardHeader />
      </section>

      <section className="w-full">
        <RoomStatusBoard />
      </section>

      <section className="w-full mt-14">
        <OperationsOverview />
      </section>

      <section className="w-full mt-14">
        <KpiMetrics />
      </section>
    </div>
  );
};

export default Dashboard;
