import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./components/DashboardHeader";
import RoomStatusBoard from "./components/RoomStatusBoard";
import OperationsOverview from "./components/OperationsOverview";
import KpiMetrics from "./components/KpiMetrics";
import { useDashboardData } from "./useDashboardData";
import CreateBooking from "../../components/bookingComp/CreateBooking";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingKey, setBookingKey] = useState(0);

  const {
    arrivals,
    departures,
    floorOccupancy,
    arrivalsCount,
    departuresCount,
    roomStatus,
    kpis,
    loading,
    error,
    refetch,
  } = useDashboardData();

  return (
    <div className="page-container py-[32px] flex flex-col gap-[32px] animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={refetch} className="ml-3 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <section className="w-full">
        <DashboardHeader onNewBooking={() => { setBookingKey(k => k + 1); setShowBookingModal(true); }} />
      </section>

      <section className="w-full">
        <RoomStatusBoard
          boardData={roomStatus}
        />
      </section>

      <section className="w-full mt-14">
        <OperationsOverview
          arrivals={arrivals}
          departures={departures}
          floorOccupancy={floorOccupancy}
          arrivalsCount={arrivalsCount}
          departuresCount={departuresCount}
          loading={loading}
        />
      </section>

      <section className="w-full mt-14">
        <KpiMetrics metrics={kpis} loading={loading} />
      </section>

      {showBookingModal && (
        <CreateBooking
          key={bookingKey}
          onClose={() => setShowBookingModal(false)}
          refreshBookings={() => navigate('/bookings')}
        />
      )}
    </div>
  );
};

export default Dashboard;
