import React from 'react';
import type { ArrivalGuest, FloorOccupancy, DepartureGuest } from '../useDashboardData';

interface OperationsOverviewProps {
  arrivals: ArrivalGuest[];
  departures: DepartureGuest[];
  floorOccupancy: FloorOccupancy[];
  arrivalsCount: number;
  departuresCount: number;
  loading?: boolean;
}

// --- SUB-COMPONENTS ---

interface CardProps {
  arrivals: ArrivalGuest[];
  floorOccupancy: FloorOccupancy[];
  departures: DepartureGuest[];
  arrivalsCount: number;
  departuresCount: number;
  loading?: boolean;
}

const ExpectedArrivalsCard = ({ arrivals, arrivalsCount, loading }: { arrivals: ArrivalGuest[]; arrivalsCount: number; loading?: boolean }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Expected Arrivals</h3>
      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide">{arrivalsCount} Today</span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-3 flex-1">
      {(arrivals.length > 0 ? arrivals : []).map((guest) => (
        <div key={guest.id} className="flex items-center justify-between bg-gray-100 rounded-xl p-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${guest.avatarBg} ${guest.avatarColor}`}>
              {guest.initials}
            </div>
            {/* Details */}
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-text-primary leading-tight mb-0.5">{guest.name}</span>
              <span className="text-[11px] text-text-secondary">{guest.room}</span>
            </div>
          </div>
          
          {/* Status */}
          {guest.statusType === 'text' ? (
            <span className="text-[12px] font-bold text-primary">{guest.status}</span>
          ) : (
            <span className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              {guest.status}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const OccupiedRoomsCard = ({ floorOccupancy, loading }: { floorOccupancy: FloorOccupancy[]; loading?: boolean }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Occupied Rooms</h3>
      <span className="text-[12px] font-semibold text-text-secondary">
        {floorOccupancy.length > 0
          ? Math.round(floorOccupancy.reduce((sum, f) => sum + f.percentage, 0) / floorOccupancy.length)
          : 0}% Capacity
      </span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-6 flex-1 justify-center pb-4">
      {(floorOccupancy.length > 0 ? floorOccupancy : []).map((floor) => (
        <div key={floor.id} className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{floor.label}</span>
            <span className="text-[12px] font-bold text-text-primary">{floor.occupied} / {floor.total}</span>
          </div>
          {/* Progress Bar Container */}
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            {/* Progress Bar Fill */}
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${floor.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ExpectedDeparturesCard = ({ departures, departuresCount, loading }: { departures: DepartureGuest[]; departuresCount: number; loading?: boolean }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Expected Departures</h3>
      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide">{departuresCount} Today</span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-3 flex-1">
      {(departures.length > 0 ? departures : []).map((guest) => (
        <div key={guest.id} className="flex items-center justify-between bg-gray-100 rounded-xl p-3 relative overflow-hidden">
          
          {/* Urgent Red Marker */}
          {guest.isUrgent && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-primary rounded-r-md"></div>
          )}
          
          {/* Name & Time */}
          <div className={`flex flex-col ${guest.isUrgent ? 'pl-2' : ''}`}>
            <span className="text-[14px] font-semibold text-text-primary leading-tight mb-0.5">{guest.name}</span>
            <span className={`text-[10px] font-bold tracking-wider ${guest.isUrgent ? 'text-primary' : 'text-text-secondary'}`}>
              {guest.time}
            </span>
          </div>

          {/* Action Button - Overriding the global btn-secondary slightly for size */}
          <button className="btn-secondary text-[11px]! px-3! py-1.5!">
            Checkout
          </button>
        </div>
      ))}
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const OperationsOverview = ({ arrivals, departures, floorOccupancy, arrivalsCount, departuresCount, loading }: OperationsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-19">
      <ExpectedArrivalsCard arrivals={arrivals} arrivalsCount={arrivalsCount} loading={loading} />
      <OccupiedRoomsCard floorOccupancy={floorOccupancy} loading={loading} />
      <ExpectedDeparturesCard departures={departures} departuresCount={departuresCount} loading={loading} />
    </div>
  );
};

export default OperationsOverview;