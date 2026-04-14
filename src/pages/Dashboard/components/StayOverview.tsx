import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Snowflake, Wrench, User } from 'lucide-react';
import NewBookingButton from '../../../components/ui/NewBookingButton';

// --- HELPER CONSTANTS & FUNCTIONS ---
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toISODate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const getDaysArray = (start: Date, end: Date) => {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
};

// --- DYNAMIC DEFAULT DATES (Current Week) ---
const today = new Date();
today.setHours(0, 0, 0, 0); // Reset time to midnight to avoid timezone bugs

// Calculate Monday of the current week
const defaultStart = new Date(today);
const dayOfWeek = defaultStart.getDay();
// JS getDay() returns 0 for Sunday. We adjust so Monday is the start of the week.
const diffToMonday = defaultStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
defaultStart.setDate(diffToMonday);

// Calculate Sunday of the current week (Monday + 6 days)
const defaultEnd = new Date(defaultStart);
defaultEnd.setDate(defaultStart.getDate() + 6);

// Helper function to keep our mock data visible in the current week!
const offsetDate = (days: number) => {
  const d = new Date(defaultStart);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// --- INITIAL MOCK DATA (Dynamically shifted to this week) ---
const initialTimelineData = [
  {
    category: "AC Deluxe Room",
    rooms: [
      {
        id: "101", status: "Cleaned", isClean: true,
        bookings: [
          // Starts Tuesday (offset 1), Ends Thursday (offset 3)
          { id: 1, guest: "Puja Agarwal", phone: "+91 8906605355", plan: "EP", start: offsetDate(1), end: offsetDate(3), color: "red" }
        ]
      },
      {
        id: "102", status: "Dirty", isClean: false,
        bookings: [
          { id: 2, guest: "Puja Agarwal", source: "Expedia", plan: "CP", start: offsetDate(3), end: offsetDate(5), color: "cyan" },
          { id: 3, isBlocked: true, text: "BLOCKED", start: offsetDate(6), end: offsetDate(7), color: "gray" }
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
          { id: 4, guest: "VIP Guest", source: "Direct Booking", plan: "MAP", price: "₹350/n", start: offsetDate(5), end: offsetDate(7), color: "red" }
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
          { id: 5, guest: "VIP Guest", source: "Direct Booking", plan: "MAP", price: "₹350/n", start: offsetDate(5), end: offsetDate(7), color: "red" }
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

const BookingBlock = ({ booking, onDragStart, onResizeStart, startCol, span, actualSpan }: any) => {
  const colorStyles = {
    red: "bg-primary/10 border-primary/20",
    cyan: "bg-cyan-100 border-cyan-300",
    gray: "bg-gray-200 border-gray-300"
  };
  const theme = colorStyles[booking.color as keyof typeof colorStyles];

  if (booking.isBlocked) {
    return (
      <div 
        className={`z-10 m-1.5 rounded-lg border ${theme} flex items-center justify-center gap-2 opacity-80 cursor-not-allowed overflow-hidden`}
        style={{ gridColumn: `${startCol} / span ${span}` }}
      >
        <Wrench size={14} className="text-text-secondary shrink-0" />
        <span className="text-[12px] font-bold text-text-secondary tracking-wide truncate">{booking.text}</span>
      </div>
    );
  }

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className={`z-10 m-1.5 rounded-lg border ${theme} p-2 flex flex-col justify-center relative overflow-hidden group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow`}
      style={{ gridColumn: `${startCol} / span ${span}` }}
    >
      <div className="flex justify-between items-start pointer-events-none gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {booking.color === 'cyan' && <User size={12} className="text-cyan-700 shrink-0" />}
          {booking.guest === 'VIP Guest' && <span className="text-primary text-[10px] shrink-0">⭐</span>}
          <span className="text-[13px] font-bold text-text-primary leading-tight truncate">{booking.guest}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-bold text-text-secondary hidden sm:inline-block">{actualSpan} Days</span>
          <span className="text-[9px] font-bold bg-white/60 px-1.5 py-0.5 rounded text-text-primary">{booking.plan}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-1 pointer-events-none gap-2">
        <span className="text-[11px] text-text-secondary truncate">{booking.phone || booking.source}</span>
        {booking.price ? (
          <span className="text-[11px] font-bold text-primary shrink-0">{booking.price}</span>
        ) : (
          <User size={12} className="text-primary opacity-50 shrink-0" />
        )}
      </div>

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
  
  // --- DATE VIEW STATE (Initialized to current week) ---
  const [viewStart, setViewStart] = useState<Date>(new Date(defaultStart)); 
  const [viewEnd, setViewEnd] = useState<Date>(new Date(defaultEnd)); 
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate dynamic array of dates for the headers
  const datesArray = getDaysArray(viewStart, viewEnd);

  // Action: "<" button subtracts 1 day from the "From" date, extending the grid left
  const handlePrevDay = () => {
    setViewStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  // Action: ">" button adds 1 day to the "To" date, extending the grid right
  const handleNextDay = () => {
    setViewEnd(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const formattedDateRange = `${viewStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${viewEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  // --- DRAG TO MOVE LOGIC ---
  const handleDragStart = (e: React.DragEvent, bookingId: number, sourceRoomId: string, categoryIndex: number) => {
    e.dataTransfer.setData("bookingId", bookingId.toString());
    e.dataTransfer.setData("sourceRoomId", sourceRoomId);
    e.dataTransfer.setData("categoryIndex", categoryIndex.toString());
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
          const daysFromViewStart = newStartCol - 2; 
          const newStartDate = new Date(viewStart);
          newStartDate.setDate(newStartDate.getDate() + daysFromViewStart);
          
          const currentSpanDays = Math.round((new Date(movingBooking.end).getTime() - new Date(movingBooking.start).getTime()) / MS_PER_DAY);
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newEndDate.getDate() + currentSpanDays);

          movingBooking.start = toISODate(newStartDate);
          movingBooking.end = toISODate(newEndDate);
          targetRoom.bookings.push(movingBooking);
        }
      }
      return newData;
    });
  };

  // --- DRAG TO RESIZE LOGIC ---
  const gridRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<{ id: number; startX: number; originalEnd: string } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, bookingId: number) => {
    let originalEnd = "";
    timelineData.forEach(cat => cat.rooms.forEach(room => room.bookings.forEach(b => {
      if(b.id === bookingId) originalEnd = b.end;
    })));

    setIsResizing({ id: bookingId, startX: e.clientX, originalEnd });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    setIsResizing(currentResizeState => {
      if (!currentResizeState || !gridRef.current) return currentResizeState;

      const columnWidth = (gridRef.current.offsetWidth - 180) / datesArray.length;
      const deltaX = e.clientX - currentResizeState.startX;
      const deltaCols = Math.round(deltaX / columnWidth);

      setTimelineData(prevData => {
        const newData = [...prevData];
        newData.forEach(category => {
          category.rooms.forEach(room => {
            const booking = room.bookings.find(b => b.id === currentResizeState.id);
            if (booking && !booking.isBlocked) {
              const newEndDate = new Date(currentResizeState.originalEnd);
              newEndDate.setDate(newEndDate.getDate() + deltaCols);
              
              if (newEndDate > new Date(booking.start)) {
                booking.end = toISODate(newEndDate);
              }
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

  // --- DYNAMIC GRID STYLING ---
  const gridTemplate = `180px repeat(${datesArray.length}, minmax(0, 1fr))`;

  return (
    <div className="flex flex-col gap-[24px] w-full animate-fade-in relative pb-10">
      
      {/* 1. Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-text-primary">Stay Overview</h2>
        <div className="flex items-center gap-4 relative">
          
          <div className="flex items-center gap-3 bg-white border border-border rounded-lg px-2 py-1.5 shadow-sm relative">
            <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded-md text-text-secondary transition-colors"><ChevronLeft size={18} /></button>
            
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 text-[13px] font-bold text-text-primary px-3 py-1 hover:bg-gray-50 rounded-md transition-colors"
            >
              <CalendarIcon size={16} className="text-primary" />
              <span>{formattedDateRange}</span>
            </button>

            <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded-md text-text-secondary transition-colors"><ChevronRight size={18} /></button>
            
            {showDatePicker && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-border p-4 shadow-xl rounded-xl z-50 flex gap-4 w-[320px] animate-slide-up">
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-[11px] font-bold text-text-secondary uppercase">From</span>
                  <input type="date" value={toISODate(viewStart)} onChange={e => setViewStart(new Date(e.target.value))} className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-[11px] font-bold text-text-secondary uppercase">To</span>
                  <input type="date" value={toISODate(viewEnd)} onChange={e => setViewEnd(new Date(e.target.value))} className="input-field text-sm" />
                </div>
              </div>
            )}
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
      <div className={`card !p-0 w-full overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        <div className="flex flex-col w-full" ref={gridRef}>
          
          <div className="grid bg-white border-b border-border z-20" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="p-4 flex items-center justify-between border-r border-border bg-white z-30">
              <span className="text-[11px] font-bold text-text-secondary uppercase">Rooms</span>
            </div>
            
            {datesArray.map((d, i) => {
              const isToday = toISODate(d) === toISODate(new Date()); 
              return (
                <div key={i} className={`flex flex-col items-center justify-center py-2 border-r border-border last:border-0 min-w-0 ${isToday ? 'border-b-2 border-b-primary text-primary' : 'text-text-secondary'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${isToday ? 'text-primary' : ''}`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className={`text-[14px] font-bold truncate ${isToday ? 'text-primary' : 'text-text-primary'}`}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>

          {timelineData.map((category, cIdx) => (
            <div key={cIdx} className="flex flex-col">
              
              <div className="bg-gray-50 px-4 py-2 border-b border-border w-full inline-block">
                <span className="text-[12px] font-bold text-text-primary">{category.category}</span>
              </div>

              {category.rooms.map((room) => (
                <div key={room.id} className="grid border-b border-border last:border-0 relative min-h-[70px]" style={{ gridTemplateColumns: gridTemplate }}>
                  
                  <div className="p-3 border-r border-border flex flex-col justify-center bg-white z-30 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                      <span className="text-[14px] font-bold text-text-primary truncate">{room.id}</span>
                      <Snowflake size={12} className="text-cyan-600 shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${room.isClean ? 'bg-gray-400' : 'bg-primary'}`}></div>
                      <span className="text-[10px] text-text-secondary truncate">{room.status}</span>
                    </div>
                  </div>

                  {datesArray.map((_, i) => (
                    <div 
                      key={i} 
                      className="border-r border-border last:border-0 bg-white hover:bg-gray-50 transition-colors" 
                      style={{ gridColumn: i + 2 }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, room.id, cIdx, i + 2)}
                    ></div>
                  ))}

                  {room.bookings.map((booking: any) => {
                    const bStart = new Date(booking.start);
                    const bEnd = new Date(booking.end);
                    
                    const startOffset = Math.round((bStart.getTime() - viewStart.getTime()) / MS_PER_DAY);
                    const endOffset = Math.round((bEnd.getTime() - viewStart.getTime()) / MS_PER_DAY);

                    const visualStartCol = startOffset < 0 ? 2 : 2 + startOffset;
                    const visualEndCol = endOffset >= datesArray.length ? 1 + datesArray.length : 2 + endOffset;
                    const visualSpan = visualEndCol - visualStartCol + 1;

                    const actualSpan = Math.round((bEnd.getTime() - bStart.getTime()) / MS_PER_DAY) + 1;

                    if (visualSpan <= 0 || startOffset >= datesArray.length || endOffset < 0) return null;

                    return (
                      <BookingBlock 
                        key={booking.id} 
                        booking={booking}
                        startCol={visualStartCol}
                        span={visualSpan} 
                        actualSpan={actualSpan} 
                        onDragStart={(e: React.DragEvent) => handleDragStart(e, booking.id, room.id, cIdx)}
                        onResizeStart={handleResizeStart}
                      />
                    );
                  })}

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