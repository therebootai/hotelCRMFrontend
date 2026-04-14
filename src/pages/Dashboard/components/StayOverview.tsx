import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Snowflake, Wrench, User } from 'lucide-react';
import NewBookingButton from '../../../components/ui/NewBookingButton';

// --- INITIAL MOCK DATA ---
const initialTimelineData = [
  {
    category: "AC Deluxe Room",
    rooms: [
      {
        id: "101", status: "Cleaned", isClean: true,
        bookings: [
          { id: 1, guest: "Puja Agarwal", phone: "+91 8906605355", plan: "EP", startCol: 2, span: 3, color: "red" }
        ]
      },
      {
        id: "102", status: "Dirty", isClean: false,
        bookings: [
          { id: 2, guest: "Puja Agarwal", source: "Expedia", plan: "CP", startCol: 4, span: 3, color: "cyan" },
          { id: 3, isBlocked: true, text: "BLOCKED", startCol: 7, span: 2, color: "gray" }
        ]
      }
    ]
  },
  {
    category: "Suite Room",
    rooms: [
      {
        id: "987", status: "Cleaned", isClean: true,
        bookings: [
          { id: 4, guest: "VIP Guest", source: "Direct Booking", plan: "MAP", price: "₹350/n", startCol: 6, span: 3, color: "red" }
        ]
      }
    ]
  },
  {
    category: "Banquet Hall",
    rooms: [
      {
        id: "547", status: "Cleaned", isClean: true,
        bookings: [
          { id: 5, guest: "VIP Guest", source: "Direct Booking", plan: "MAP", price: "₹350/n", startCol: 6, span: 3, color: "red" }
        ]
      }
    ]
  }
];

// --- SUB-COMPONENTS ---

const SummaryCard = ({ title, value, total }: any) => (
  <div className="card p-4! flex flex-col gap-2">
    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{title}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-[24px] font-bold text-text-primary">{value}</span>
      <span className="text-[16px] font-bold text-text-secondary">/{total}</span>
    </div>
  </div>
);

// We pass drag handlers AND resize handlers into the BookingBlock
const BookingBlock = ({ booking, onDragStart, onResizeStart }: any) => {
  const colorStyles = {
    red: "bg-primary/10 border-primary/20",
    cyan: "bg-cyan-100 border-cyan-300",
    gray: "bg-gray-200 border-gray-300"
  };
  const theme = colorStyles[booking.color as keyof typeof colorStyles];

  // 1. BLOCKED STATE
  if (booking.isBlocked) {
    return (
      <div 
        className={`z-10 m-1.5 rounded-lg border ${theme} flex items-center justify-center gap-2 opacity-80 cursor-not-allowed`}
        style={{ gridColumn: `${booking.startCol} / span ${booking.span}` }}
      >
        <Wrench size={14} className="text-text-secondary" />
        <span className="text-[12px] font-bold text-text-secondary tracking-wide">{booking.text}</span>
      </div>
    );
  }

  // 2. ACTIVE BOOKING STATE
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className={`z-10 m-1.5 rounded-lg border ${theme} p-2 flex flex-col justify-center relative overflow-hidden group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow`}
      style={{ gridColumn: `${booking.startCol} / span ${booking.span}` }}
    >
      <div className="flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-1.5">
          {booking.color === 'cyan' && <User size={12} className="text-cyan-700" />}
          {booking.guest === 'VIP Guest' && <span className="text-primary text-[10px]">⭐</span>}
          <span className="text-[13px] font-bold text-text-primary leading-tight truncate max-w-[80%]">{booking.guest}</span>
        </div>
        <span className="text-[9px] font-bold bg-white/60 px-1.5 py-0.5 rounded text-text-primary">{booking.plan}</span>
      </div>
      
      <div className="flex justify-between items-end mt-1 pointer-events-none">
        <span className="text-[11px] text-text-secondary truncate">{booking.phone || booking.source}</span>
        {booking.price ? (
          <span className="text-[11px] font-bold text-primary shrink-0">{booking.price}</span>
        ) : (
          <User size={12} className="text-primary opacity-50 shrink-0" />
        )}
      </div>

      {/* Right Resize Handle */}
      {/* We stop propagation so clicking the handle doesn't trigger a "Drag Move" event on the parent block */}
      <div 
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, booking.id); }}
        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
      >
        <div className="w-0.5 h-3 bg-black/20 rounded-full"></div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const StayOverview = () => {
  const [timelineData, setTimelineData] = useState(initialTimelineData);
  
  // Ref to the timeline grid container so we can calculate mouse positions relative to column widths
  const gridRef = useRef<HTMLDivElement>(null);
  
  // State to track if we are currently resizing
  const [isResizing, setIsResizing] = useState<{ id: number; startX: number; initialSpan: number } | null>(null);

  // --- DRAG TO MOVE LOGIC ---
  const handleDragStart = (e: React.DragEvent, bookingId: number, sourceRoomId: string, categoryIndex: number) => {
    e.dataTransfer.setData("bookingId", bookingId.toString());
    e.dataTransfer.setData("sourceRoomId", sourceRoomId);
    e.dataTransfer.setData("categoryIndex", categoryIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, targetRoomId: string, targetCategoryIndex: number, newStartCol: number) => {
    e.preventDefault();
    const bookingId = parseInt(e.dataTransfer.getData("bookingId"));
    const sourceRoomId = e.dataTransfer.getData("sourceRoomId");
    const sourceCategoryIndex = parseInt(e.dataTransfer.getData("categoryIndex"));

    if (!bookingId || !sourceRoomId) return;

    setTimelineData(prevData => {
      const newData = [...prevData];
      let movingBooking = null;

      const sourceCategory = newData[sourceCategoryIndex];
      const sourceRoom = sourceCategory.rooms.find(r => r.id === sourceRoomId);
      if (sourceRoom) {
        movingBooking = sourceRoom.bookings.find(b => b.id === bookingId);
        sourceRoom.bookings = sourceRoom.bookings.filter(b => b.id !== bookingId);
      }

      if (movingBooking) {
        const targetCategory = newData[targetCategoryIndex];
        const targetRoom = targetCategory.rooms.find(r => r.id === targetRoomId);
        if (targetRoom) {
          // Prevent dropping a block so far right that its span goes off the 7-day grid
          const maxAllowedCol = 9 - movingBooking.span; 
          movingBooking.startCol = Math.min(newStartCol, maxAllowedCol);
          targetRoom.bookings.push(movingBooking);
        }
      }
      return newData;
    });
  };

  // --- DRAG TO RESIZE LOGIC ---
  const handleResizeStart = (e: React.MouseEvent, bookingId: number) => {
    // Find the current span of the booking we are about to resize
    let initialSpan = 1;
    timelineData.forEach(cat => cat.rooms.forEach(room => room.bookings.forEach(b => {
      if(b.id === bookingId) initialSpan = b.span;
    })));

    setIsResizing({ id: bookingId, startX: e.clientX, initialSpan });
    
    // Add global listeners so the resize continues even if the mouse leaves the handle slightly
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    setIsResizing(currentResizeState => {
      if (!currentResizeState || !gridRef.current) return currentResizeState;

      // Calculate how wide one column is based on the grid's current rendered width
      // Total width minus 180px (for the left column), divided by 7 days
      const columnWidth = (gridRef.current.offsetWidth - 180) / 7;
      
      // Calculate how far the mouse has moved since the drag started
      const deltaX = e.clientX - currentResizeState.startX;
      
      // Convert that distance into whole columns (Math.round makes it snap nicely)
      const deltaCols = Math.round(deltaX / columnWidth);

      setTimelineData(prevData => {
        const newData = [...prevData];
        newData.forEach(category => {
          category.rooms.forEach(room => {
            const booking = room.bookings.find(b => b.id === currentResizeState.id);
            if (booking && !booking.isBlocked) {
              // Calculate new span, ensuring it doesn't go below 1 day
              let newSpan = Math.max(1, currentResizeState.initialSpan + deltaCols);
              // Ensure the span doesn't push the block off the right edge of the grid
              const maxSpan = 9 - booking.startCol;
              booking.span = Math.min(newSpan, maxSpan);
            }
          });
        });
        return newData;
      });

      return currentResizeState;
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  return (
    <div className="flex flex-col gap-[24px] w-full animate-fade-in">
      
      {/* 1. Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-text-primary">Stay Overview</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white border border-border rounded-lg px-4 py-2 shadow-sm">
            <button className="text-text-secondary hover:text-text-primary"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
              <CalendarIcon size={16} className="text-primary" />
              <span>5 Jul - 11 Jul, 2024</span>
            </div>
            <button className="text-text-secondary hover:text-text-primary"><ChevronRight size={18} /></button>
          </div>
          <NewBookingButton />
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-[24px]">
        <SummaryCard title="TOTAL AVAILABILITY" value="12" total="20" />
        <SummaryCard title="AC DELUXE AVAIL" value="2" total="20" />
        <SummaryCard title="SUITE AVAIL" value="4" total="8" />
        <SummaryCard title="BANQUET HALL" value="14" total="20" />
      </div>

      {/* 3. Gantt Chart / Timeline Area */}
      {/* We apply a global cursor if we are currently resizing so the mouse doesn't flicker */}
      <div className={`card !p-0 overflow-x-auto custom-scroll w-full ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        <div className="min-w-[1000px] flex flex-col w-full" ref={gridRef}>
          
          {/* Timeline Header */}
          <div className="grid grid-cols-[180px_repeat(7,1fr)] bg-white border-b border-border sticky top-0 z-20">
            <div className="p-4 flex items-center justify-between border-r border-border">
              <span className="text-[11px] font-bold text-text-secondary uppercase">Rooms</span>
            </div>
            {[
              { day: "MON", date: "5" }, { day: "TUE", date: "6", active: true },
              { day: "WED", date: "7" }, { day: "THU", date: "8" },
              { day: "FRI", date: "9" }, { day: "SAT", date: "10" }, { day: "SUN", date: "11" }
            ].map((d, i) => (
              <div key={i} className={`flex flex-col items-center justify-center py-2 border-r border-border last:border-0 ${d.active ? 'border-b-2 border-b-primary text-primary' : 'text-text-secondary'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${d.active ? 'text-primary' : ''}`}>{d.day}</span>
                <span className={`text-[14px] font-bold ${d.active ? 'text-primary' : 'text-text-primary'}`}>{d.date}</span>
              </div>
            ))}
          </div>

          {/* Timeline Body */}
          {timelineData.map((category, cIdx) => (
            <div key={cIdx} className="flex flex-col">
              
              <div className="bg-gray-50 px-4 py-2 border-b border-border">
                <span className="text-[12px] font-bold text-text-primary">{category.category}</span>
              </div>

              {category.rooms.map((room) => (
                <div key={room.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border last:border-0 relative min-h-[70px]">
                  
                  {/* Column 1: Room Details */}
                  <div className="p-3 border-r border-border flex flex-col justify-center bg-white z-20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[14px] font-bold text-text-primary">{room.id}</span>
                      <Snowflake size={12} className="text-cyan-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${room.isClean ? 'bg-gray-400' : 'bg-primary'}`}></div>
                      <span className="text-[10px] text-text-secondary">{room.status}</span>
                    </div>
                  </div>

                  {/* Columns 2-8: The Drop Zones (Empty Grid Columns) */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border-r border-border last:border-0 bg-white hover:bg-gray-50 transition-colors" 
                      style={{ gridColumn: i + 2 }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, room.id, cIdx, i + 2)}
                    ></div>
                  ))}

                  {/* The Bookings */}
                  {room.bookings.map((booking: any) => (
                    <BookingBlock 
                      key={booking.id} 
                      booking={booking} 
                      onDragStart={(e: React.DragEvent) => handleDragStart(e, booking.id, room.id, cIdx)}
                      onResizeStart={handleResizeStart}
                    />
                  ))}

                </div>
              ))}
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};

export default StayOverview;