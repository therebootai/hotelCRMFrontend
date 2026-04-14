import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import RoomStatusBoard from "./components/RoomStatusBoard";
import StayOverview from "./components/StayOverview";
import OperationsOverview from "./components/OperationsOverview";
import KpiMetrics from "./components/KpiMetrics";

// Define the expected prop
interface DashboardProps {
  activeView: 'calendar' | 'overview';
}

const Dashboard = ({ activeView }: DashboardProps) => {
  return (
    <div className="page-container py-[32px] flex flex-col gap-[32px] animate-fade-in">
      
      {activeView === 'calendar' ? (
        <>
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
        </>
      ) : (
        <section className="w-full">
          <StayOverview />
        </section>
      )}
      
    </div>
  );
};

export default Dashboard;