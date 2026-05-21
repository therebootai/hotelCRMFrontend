import React, { useState, useMemo } from "react";
import { format, addDays, startOfDay, differenceInDays, isSameDay } from "date-fns";
import { BedDouble, User, Phone, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ==========================================
// TYPES & INTERFACES
// ==========================================

type ViewMode = "daily" | "weekly" | "monthly";

interface BookingTag {
  code: string;
  label: string;
  bgColor: string;
  textColor: string;
}

interface GuestInfo {
  name: string;
  phone: string;
  avatar?: string;
}

interface Booking {
  id: string;
  guest: GuestInfo;
  checkIn: Date;
  checkOut: Date;
  tag: BookingTag;
  roomId: string;
  status: "confirmed" | "checked-in" | "checked-out";
}

interface Room {
  id: string;
  number: string;
  type: string;
  floor: string;
  status: "available" | "occupied" | "maintenance";
}

interface DayColumn {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  isWeekend: boolean;
}

// ==========================================
// MOCK DATA
// ==========================================

const BOOKING_TAGS: BookingTag[] = [
  { code: "CP", label: "Continental Plan", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  { code: "EP", label: "European Plan", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  { code: "MAP", label: "Modified American Plan", bgColor: "bg-green-100", textColor: "text-green-700" },
  { code: "AP", label: "American Plan", bgColor: "bg-purple-100", textColor: "text-purple-700" },
];

const MOCK_ROOMS: Room[] = [
  { id: "r1", number: "101", type: "Standard", floor: "1st Floor", status: "available" },
  { id: "r2", number: "102", type: "Standard", floor: "1st Floor", status: "occupied" },
  { id: "r3", number: "103", type: "Deluxe", floor: "1st Floor", status: "maintenance" },
  { id: "r4", number: "104", type: "Deluxe", floor: "1st Floor", status: "available" },
  { id: "r5", number: "201", type: "Executive Suite", floor: "2nd Floor", status: "occupied" },
  { id: "r6", number: "202", type: "Executive Suite", floor: "2nd Floor", status: "available" },
  { id: "r7", number: "203", type: "Executive Suite", floor: "2nd Floor", status: "occupied" },
  { id: "r8", number: "301", type: "Premium Suite", floor: "3rd Floor", status: "available" },
];

const generateMockBookings = (): Booking[] => {
  const today = startOfDay(new Date());
  return [
    {
      id: "b1",
      guest: { name: "Rajesh Kumar", phone: "9876543210" },
      checkIn: addDays(today, -2),
      checkOut: addDays(today, 3),
      tag: BOOKING_TAGS[0],
      roomId: "r2",
      status: "checked-in",
    },
    {
      id: "b2",
      guest: { name: "Priya Sharma", phone: "8765432109" },
      checkIn: addDays(today, 1),
      checkOut: addDays(today, 5),
      tag: BOOKING_TAGS[1],
      roomId: "r5",
      status: "confirmed",
    },
    {
      id: "b3",
      guest: { name: "Amit Singh", phone: "7654321098" },
      checkIn: addDays(today, 0),
      checkOut: addDays(today, 2),
      tag: BOOKING_TAGS[2],
      roomId: "r7",
      status: "checked-in",
    },
    {
      id: "b4",
      guest: { name: "Sneha Patel", phone: "6543210987" },
      checkIn: addDays(today, 3),
      checkOut: addDays(today, 7),
      tag: BOOKING_TAGS[3],
      roomId: "r4",
      status: "confirmed",
    },
    {
      id: "b5",
      guest: { name: "Vikram Mehta", phone: "5432109876" },
      checkIn: addDays(today, -1),
      checkOut: addDays(today, 4),
      tag: BOOKING_TAGS[0],
      roomId: "r1",
      status: "checked-in",
    },
  ];
};

const MOCK_BOOKINGS = generateMockBookings();

// ==========================================
// COMPONENTS
// ==========================================

// Booking Tag Badge Component
interface BookingTagBadgeProps {
  tag: BookingTag;
}

const BookingTagBadge: React.FC<BookingTagBadgeProps> = ({ tag }) => (
  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tag.bgColor} ${tag.textColor}`}>
    {tag.code}
  </span>
);

// Booking Bar Component
interface BookingBarProps {
  booking: Booking;
  startOffset: number;
  width: number;
  dayWidth: number;
}

const BookingBar: React.FC<BookingBarProps> = ({ booking, startOffset, width, dayWidth }) => {
  const borderColors: Record<string, string> = {
    "Continental Plan": "border-l-orange-500",
    "European Plan": "border-l-blue-500",
    "Modified American Plan": "border-l-green-500",
    "American Plan": "border-l-purple-500",
  };

  const bgColors: Record<string, string> = {
    "Continental Plan": "bg-orange-50/80",
    "European Plan": "bg-blue-50/80",
    "Modified American Plan": "bg-green-50/80",
    "American Plan": "bg-purple-50/80",
  };

  const borderColor = borderColors[booking.tag.label] || "border-l-gray-500";
  const bgColor = bgColors[booking.tag.label] || "bg-gray-50/80";

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-lg shadow-sm border-l-4 ${borderColor} ${bgColor} px-2 py-1.5 flex items-center gap-2 overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all z-10`}
      style={{
        left: `${startOffset * dayWidth}px`,
        width: `${width * dayWidth - 8}px`,
        minWidth: "120px",
      }}
      title={`${booking.guest.name} - ${booking.tag.label}`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[10px] font-bold">
          {booking.guest.name.charAt(0)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-bold text-gray-800 truncate">{booking.guest.name}</p>
          <BookingTagBadge tag={booking.tag} />
        </div>
        <p className="text-[9px] text-gray-500 flex items-center gap-1">
          <Phone size={8} />
          {booking.guest.phone}
        </p>
      </div>
    </div>
  );
};

// Availability Bar Component
interface AvailabilityBarProps {
  width: number;
  dayWidth: number;
}

const AvailabilityBar: React.FC<AvailabilityBarProps> = ({ width, dayWidth }) => (
  <div
    className="absolute top-1 bottom-1 rounded-lg bg-green-50 border border-green-100 px-3 flex items-center justify-center"
    style={{
      left: "4px",
      width: `${width * dayWidth - 8}px`,
    }}
  >
    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Available</span>
  </div>
);

// Maintenance Bar Component
interface MaintenanceBarProps {
  width: number;
  dayWidth: number;
}

const MaintenanceBar: React.FC<MaintenanceBarProps> = ({ width, dayWidth }) => (
  <div
    className="absolute top-1 bottom-1 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 px-3 flex items-center justify-center"
    style={{
      left: "4px",
      width: `${width * dayWidth - 8}px`,
    }}
  >
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maintenance Blocked</span>
  </div>
);

// Timeline Header Component
interface TimelineHeaderProps {
  columns: DayColumn[];
  dayWidth: number;
  onScroll: (scrollLeft: number) => void;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ columns, dayWidth, onScroll }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollLeft);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-600">
            {format(columns[0]?.date || new Date(), "MMMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <button className="px-3 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50">
            Today
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        onScroll={handleScroll}
      >
        {columns.map((col, idx) => (
          <div
            key={idx}
            className={`flex-shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-100 ${
              col.isToday
                ? "bg-red-50"
                : col.isWeekend
                  ? "bg-gray-50/50"
                  : "bg-white"
            }`}
            style={{ width: `${dayWidth}px` }}
          >
            <span className={`text-[10px] font-medium ${col.isToday ? "text-red-600" : "text-gray-500"}`}>
              {col.dayName}
            </span>
            <span className={`text-sm font-black ${col.isToday ? "text-red-600" : "text-gray-800"}`}>
              {col.dayNumber}
            </span>
            {col.isToday && (
              <span className="text-[8px] font-bold text-red-500 uppercase mt-0.5">Today</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Room Row Component
interface RoomRowProps {
  room: Room;
  bookings: Booking[];
  columns: DayColumn[];
  dayWidth: number;
  timelineStart: Date;
}

const RoomRow: React.FC<RoomRowProps> = ({ room, bookings, columns, dayWidth, timelineStart }) => {
  const totalDays = columns.length;
  const today = startOfDay(new Date());

  // Get bookings for this room
  const roomBookings = bookings.filter(b => b.roomId === room.id);

  // Calculate booking positions
  const getBookingPosition = (booking: Booking) => {
    const bookingStart = startOfDay(booking.checkIn);
    const bookingEnd = startOfDay(booking.checkOut);
    const startDiff = differenceInDays(bookingStart, timelineStart);
    const duration = differenceInDays(bookingEnd, bookingStart);

    const startOffset = Math.max(0, startDiff);
    const width = duration;

    return { startOffset, width };
  };

  // Check if date range has booking
  const getBookingsInRange = (startIdx: number, days: number) => {
    return roomBookings.filter(b => {
      const bStart = startOfDay(b.checkIn);
      const bEnd = startOfDay(b.checkOut);
      const rangeStart = addDays(timelineStart, startIdx);
      const rangeEnd = addDays(rangeStart, days);

      return bStart < rangeEnd && bEnd > rangeStart;
    });
  };

  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
      {/* Room Info - Sticky Left */}
      <div className="sticky left-0 z-30 bg-white w-32 lg:w-40 flex-shrink-0 border-r border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
            <BedDouble size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-800">Room {room.number}</p>
            <p className="text-[10px] text-gray-500">{room.type}</p>
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div
        className="relative flex-1 h-20 bg-white/50"
        style={{ width: `${totalDays * dayWidth}px` }}
      >
        {/* Day Grid Lines */}
        {columns.map((col, idx) => (
          <div
            key={idx}
            className={`absolute top-0 bottom-0 border-r border-gray-100/50 ${
              col.isToday ? "bg-red-50/30" : col.isWeekend ? "bg-gray-50/30" : ""
            }`}
            style={{ left: `${idx * dayWidth}px`, width: `${dayWidth}px` }}
          />
        ))}

        {/* Content Based on Room Status */}
        {room.status === "maintenance" ? (
          <MaintenanceBar width={totalDays} dayWidth={dayWidth} />
        ) : roomBookings.length === 0 ? (
          <AvailabilityBar width={totalDays} dayWidth={dayWidth} />
        ) : (
          // Render booking bars
          roomBookings.map(booking => {
            const { startOffset, width } = getBookingPosition(booking);
            return (
              <BookingBar
                key={booking.id}
                booking={booking}
                startOffset={startOffset}
                width={width}
                dayWidth={dayWidth}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const BookingTimeline: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [timelineScroll, setTimelineScroll] = useState(0);

  const dayWidth = viewMode === "daily" ? 120 : viewMode === "weekly" ? 60 : 40;

  const today = startOfDay(new Date());

  // Generate columns based on view mode
  const columns = useMemo((): DayColumn[] => {
    const days = viewMode === "daily" ? 1 : viewMode === "weekly" ? 14 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = addDays(today, i - (viewMode === "daily" ? 0 : viewMode === "weekly" ? 3 : 10));
      return {
        date,
        dayName: format(date, "EEE").toUpperCase(),
        dayNumber: format(date, "dd"),
        isToday: isSameDay(date, today),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [viewMode]);

  const timelineStart = columns[0]?.date || today;
  const totalDays = columns.length;

  // Stats
  const stats = useMemo(() => {
    const totalRooms = MOCK_ROOMS.length;
    const availableRooms = MOCK_ROOMS.filter(r => r.status === "available").length;
    const occupiedRooms = MOCK_ROOMS.filter(r => r.status === "occupied").length;
    const maintenanceRooms = MOCK_ROOMS.filter(r => r.status === "maintenance").length;
    const activeBookings = MOCK_BOOKINGS.filter(b =>
      b.checkIn <= today && b.checkOut >= today
    ).length;

    return { totalRooms, availableRooms, occupiedRooms, maintenanceRooms, activeBookings };
  }, []);

  const handleScroll = (scrollLeft: number) => {
    setTimelineScroll(scrollLeft);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Timeline Header */}
      <TimelineHeader
        columns={columns}
        dayWidth={dayWidth}
        onScroll={handleScroll}
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-bold text-gray-600">
            {stats.availableRooms} Available
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span className="text-[10px] font-bold text-gray-600">
            {stats.occupiedRooms} Occupied
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-[10px] font-bold text-gray-600">
            {stats.maintenanceRooms} Maintenance
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <User size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-600">
            {stats.activeBookings} Active Bookings
          </span>
        </div>
      </div>

      {/* Room Rows */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-hide">
          {MOCK_ROOMS.map(room => (
            <RoomRow
              key={room.id}
              room={room}
              bookings={MOCK_BOOKINGS}
              columns={columns}
              dayWidth={dayWidth}
              timelineStart={timelineStart}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Legend:</span>
          {BOOKING_TAGS.map(tag => (
            <div key={tag.code} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${tag.bgColor} border-l-2 ${tag.textColor.replace("text-", "border-l-")}`}></div>
              <span className="text-[10px] text-gray-600">{tag.code}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-100"></div>
            <span className="text-[10px] text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 border-2 border-dashed border-gray-300"></div>
            <span className="text-[10px] text-gray-600">Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeline;