import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { RoomStatusData } from "../useDashboardData";

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
  maintenance: {
  label: "Maintenance",
  headerText: "text-[#D97706]", // Amber
  headerBorder: "border-[#D97706]",
  cardBg: "bg-[#D97706]/10",
  divider: "border-[#D97706]/20",
  },
  blocked: {
  label: "Blocked",
  headerText: "text-[#DC2626]", // Red
  headerBorder: "border-[#DC2626]",
  cardBg: "bg-[#DC2626]/10",
  divider: "border-[#DC2626]/20",
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
 <div className={`p-3 border-t-4 ${style.headerBorder} ${style.cardBg}`}>
 <h4 className={`text-sm font-bold ${style.headerText} flex gap-1 justify-center`}>
 {style.label} <span className="opacity-80">({count})</span>
 </h4>
 </div>

 {/* 2. Cards Stack */}
 <div className={`flex flex-col `}>
 {rooms.map((room: any, idx: number) => (
 <div 
 key={idx} 
 className={`p-3 border-x border-b border-t-0 mt-[8px] ${style.cardBg} ${style.headerBorder} ${idx !== rooms.length - 1 ? '' : 'rounded-b-xl'}`}
 >
 <div className="flex justify-between items-start mb-1.5 gap-2">
 <span className="text-sm font-semibold text-text-primary leading-tight wrap-break-word">{room.type}</span>
 <span className="text-sm font-semibold text-text-primary shrink-0">{room.qty}</span>
 </div>
 {/* CHANGED: Added break-words so long number strings wrap instead of breaking the layout */}
 <p className="text-sm text-text-secondary leading-relaxed wrap-break-word">{room.numbers}</p>
 </div>
 ))}
 </div>
 
 </div>
 );
};

// --- MAIN COMPONENT ---

interface RoomStatusBoardProps {
 boardData: RoomStatusData[];
}

const RoomStatusBoard = ({ boardData: propBoardData }: RoomStatusBoardProps) => {
 const [internalBoardData, setInternalBoardData] = useState<RoomStatusData[]>([]);

 useEffect(() => {
   if (propBoardData.length > 0) {
     setInternalBoardData(propBoardData);
   }
 }, [propBoardData]);

 const toggleRow = (id: string) => {
   setInternalBoardData((prev) =>
     prev.map((row) =>
       row.id === id ? { ...row, isExpanded: !row.isExpanded } : row,
     ),
   );
 };

 const boardData = internalBoardData;

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
 className="w-[180px] shrink-0 flex items-center justify-between py-2.5 px-4 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors text-sm font-semibold text-text-primary"
 >
 {row.date}
 {row.isExpanded ? (
 <FiChevronDown size={16} className="text-text-secondary" />
 ) : (
 <FiChevronRight size={16} className="text-text-secondary" />
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
 <span className="text-sm font-bold text-[#37A108] tracking-wide">
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