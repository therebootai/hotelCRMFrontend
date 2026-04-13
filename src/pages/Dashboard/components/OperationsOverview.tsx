import React from 'react';

// --- MOCK DATA (Now using semantic theme classes) ---
const arrivalsData = [
  { id: 1, initials: 'SM', name: 'Sarah Mitchell', room: 'Room 402 • Deluxe King', status: 'Check-in', statusType: 'text', avatarBg: 'bg-primary/10', avatarColor: 'text-primary' },
  { id: 2, initials: 'RK', name: 'Robert King', room: 'Room 105 • Executive Suite', status: 'DONE', statusType: 'badge', avatarBg: 'bg-gray-200', avatarColor: 'text-text-secondary' },
  { id: 3, initials: 'AJ', name: 'Alice Johnson', room: 'Room 312 • Standard Twin', status: 'Check-in', statusType: 'text', avatarBg: 'bg-primary/10', avatarColor: 'text-primary' },
];

const occupancyData = [
  { id: 1, label: 'FLOOR 04 - PREMIUM', occupied: 18, total: 20, percentage: 90 },
  { id: 2, label: 'FLOOR 03 - STANDARD', occupied: 15, total: 24, percentage: 62 },
  { id: 3, label: 'FLOOR 02 - STANDARD', occupied: 22, total: 24, percentage: 91 },
];

const departuresData = [
  { id: 1, name: 'Mr. Leonard Cohen', time: 'DUE 11:00 AM', isUrgent: true },
  { id: 2, name: 'The Smiths (Family)', time: 'DUE 12:00 PM', isUrgent: false },
  { id: 3, name: 'David Byrne', time: 'DUE 12:30 PM', isUrgent: false },
];

// --- SUB-COMPONENTS ---

const ExpectedArrivalsCard = () => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Expected Arrivals</h3>
      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide">12 Today</span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-3 flex-1">
      {arrivalsData.map((guest) => (
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

const OccupiedRoomsCard = () => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Occupied Rooms</h3>
      <span className="text-[12px] font-semibold text-text-secondary">84% Capacity</span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-6 flex-1 justify-center pb-4">
      {occupancyData.map((floor) => (
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

const ExpectedDeparturesCard = () => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-[16px] font-semibold text-text-primary">Expected Departures</h3>
      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide">8 Today</span>
    </div>

    {/* List */}
    <div className="flex flex-col gap-3 flex-1">
      {departuresData.map((guest) => (
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
          <button className="btn-secondary !text-[11px] !px-3 !py-1.5">
            Checkout
          </button>
        </div>
      ))}
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const OperationsOverview = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[76px]">
      <ExpectedArrivalsCard />
      <OccupiedRoomsCard />
      <ExpectedDeparturesCard />
    </div>
  );
};

export default OperationsOverview;