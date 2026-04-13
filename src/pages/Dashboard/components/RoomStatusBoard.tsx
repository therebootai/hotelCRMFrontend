import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// --- STYLING CONFIGURATION ---
const STATUS_STYLES = {
  available: {
    label: "Available",
    headerText: "text-[#37A108]",
    headerBorder: "border-[#37A108]",
    cardBg: "bg-[#37A108]/10", 
    divider: "border-[#37A108]/20",
  },
  confirmed: {
    label: "Confirmed",
    headerText: "text-[#FF5A3C]",
    headerBorder: "border-[#FF5A3C]",
    cardBg: "bg-[#FF5A3C]/10",
    divider: "border-[#FF5A3C]/20",
  },
  pencil: {
    label: "Pencil",
    headerText: "text-[#8D6700]",
    headerBorder: "border-[#8D6700]",
    cardBg: "bg-[#8D6700]/10",
    divider: "border-[#8D6700]/20",
  },
  booked: {
    label: "Booked",
    headerText: "text-[#006875]",
    headerBorder: "border-[#006875]",
    cardBg: "bg-[#006875]/10",
    divider: "border-[#006875]/20",
  },
  checkIn: {
    label: "Check-In",
    headerText: "text-[#0081FA]",
    headerBorder: "border-[#0081FA]",
    cardBg: "bg-[#0081FA]/10",
    divider: "border-[#0081FA]/20",
  },
};

// --- SUB-COMPONENTS ---

const StatusColumn = ({ statusKey, count, rooms }: any) => {
  const style = STATUS_STYLES[statusKey as keyof typeof STATUS_STYLES];

  if (!rooms || rooms.length === 0) return null;

  return (
    // CHANGED: Removed min-w-[180px] and added min-w-0 to allow shrinking
    <div className="flex-1 min-w-0 flex flex-col">
      
      {/* 1. Header Block */}
      <div className={`p-3 border-t-[4px] ${style.headerBorder} ${style.cardBg}`}>
        <h4 className={`text-[13px] font-bold ${style.headerText} flex gap-1 justify-center`}>
          {style.label} <span className="opacity-80">({count})</span>
        </h4>
      </div>

      {/* 2. Cards Stack */}
      <div className={`flex flex-col mt-[8px] ${style.cardBg}`}>
        {rooms.map((room: any, idx: number) => (
          <div 
            key={idx} 
            className={`p-3 border-x border-b border-t-0 ${style.headerBorder} ${idx !== rooms.length - 1 ? '' : 'rounded-b-xl'}`}
          >
            <div className="flex justify-between items-start mb-1.5 gap-2">
              <span className="text-[12px] font-semibold text-text-primary leading-tight break-words">{room.type}</span>
              <span className="text-[12px] font-semibold text-text-primary shrink-0">{room.qty}</span>
            </div>
            {/* CHANGED: Added break-words so long number strings wrap instead of breaking the layout */}
            <p className="text-[11px] text-text-secondary leading-relaxed break-words">{room.numbers}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
};

// --- MAIN COMPONENT ---

const RoomStatusBoard = () => {
  const [boardData, setBoardData] = useState([
    {
      id: "1",
      date: "24-Mar-26 (Tue)",
      isExpanded: true,
      availableSummary: 10,
      statuses: {
        available: {
          count: 10,
          rooms: [
            { type: "AC Deluxe Room", qty: 5, numbers: "504, 578, 589, 596, 148" },
            { type: "Banquet Hall", qty: 2, numbers: "666, 485" },
            { type: "Suit Room", qty: 3, numbers: "785, 589, 158" },
          ],
        },
        confirmed: {
          count: 10,
          rooms: [
            { type: "AC Deluxe Room", qty: 8, numbers: "504, 578, 589, 596, 148, 763, 863, 832" },
            { type: "Banquet Hall", qty: 2, numbers: "666, 485" },
          ],
        },
        pencil: {
          count: 2,
          rooms: [{ type: "Banquet Hall", qty: 2, numbers: "666, 485" }],
        },
        booked: {
          count: 10,
          rooms: [
            { type: "AC Deluxe Room", qty: 8, numbers: "504, 578, 589, 596, 148, 763, 863, 832" },
            { type: "Banquet Hall", qty: 2, numbers: "666, 485" },
          ],
        },
        checkIn: {
          count: 1,
          rooms: [{ type: "AC Deluxe Room", qty: 1, numbers: "752" }],
        },
      },
    },
    { id: "2", date: "25-Mar-26 (Wed)", isExpanded: false, availableSummary: 20 },
    { id: "3", date: "26-Mar-26 (Thu)", isExpanded: false, availableSummary: 30 },
    { id: "4", date: "27-Mar-26 (Fri)", isExpanded: false, availableSummary: 50 },
    { id: "5", date: "28-Mar-26 (Sat)", isExpanded: false, availableSummary: 50 },
  ]);

  const toggleRow = (id: string) => {
    setBoardData((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, isExpanded: !row.isExpanded } : row,
      ),
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {boardData.map((row) => (
        <div
          key={row.id}
          className="flex flex-col md:flex-row gap-4 items-start w-full"
        >
          {/* Left Side: Date Toggle Button */}
          <button
            onClick={() => toggleRow(row.id)}
            className="w-[180px] shrink-0 flex items-center justify-between py-2.5 px-4 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors text-[13px] font-semibold text-text-primary"
          >
            {row.date}
            {row.isExpanded ? (
              <ChevronDown size={16} className="text-text-secondary" />
            ) : (
              <ChevronRight size={16} className="text-text-secondary" />
            )}
          </button>

          {/* Right Side: Board Content */}
          <div className="flex-1 w-full min-w-0">
            {row.isExpanded && row.statuses ? (
              // CHANGED: Replaced min-w-max with w-full so it respects screen boundaries
              <div className="flex gap-3 w-full">
                {Object.entries(row.statuses).map(([statusKey, data]: any) => (
                  <StatusColumn
                    key={statusKey}
                    statusKey={statusKey}
                    count={data.count}
                    rooms={data.rooms}
                  />
                ))}
              </div>
            ) : (
              // COLLAPSED STATE: Show single summary bar
              <div
                className="w-full h-[42px] flex items-center justify-center bg-[#37A108]/10 border-t-2 border-t-[#37A108] rounded-sm cursor-pointer hover:bg-[#37A108]/20 transition-colors"
                onClick={() => toggleRow(row.id)}
              >
                <span className="text-[13px] font-bold text-[#37A108] tracking-wide">
                  Available ({row.availableSummary})
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomStatusBoard;