import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import {
  FiDollarSign,
  FiUsers,
  FiUser,
  FiCheckCircle,
  FiLoader,
  FiCalendar,
} from "react-icons/fi";
import api from "../../lib/axios";

// ==========================================
// TYPES & INTERFACES
// ==========================================

type ViewMode = "daily" | "weekly" | "monthly";

interface GuestInfo {
  name: string;
  phone: string;
}

interface RoomBooking {
  id: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  guest: GuestInfo;
  tag: string;
  status: "confirmed" | "checked-in" | "checked-out";
}

interface RoomData {
  id: string;
  number: string;
  type: string;
  floor: string;
  status: "available" | "occupied" | "maintenance" | "blocked";
  bookings: RoomBooking[];
}

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  blockedRooms: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  totalCollected: number;
  pendingAmount: number;
}

interface DayColumn {
  date: Date;
  dayName: string;
  dayNumber: string;
  monthShort: string;
  isToday: boolean;
  isWeekend: boolean;
}

interface TimelineData {
  rooms: RoomData[];
  stats: RoomStats;
  dateRange: {
    start: string;
    end: string;
  };
}

// ==========================================
// BOOKING BAR COMPONENT
// ==========================================

interface BookingBarProps {
  booking: RoomBooking;
  startColumn: number;
  totalNights: number;
  columnsCount: number;
}

const BookingBar: React.FC<BookingBarProps> = ({
  booking,
  startColumn,
  totalNights,
  columnsCount,
}) => {
  const isIndividual = booking.tag === "Individual";
  const borderColor = isIndividual
    ? "border-l-blue-500"
    : "border-l-orange-500";
  const bgColor = isIndividual ? "bg-blue-50" : "bg-orange-50";

  const leftPosPercent = (startColumn / columnsCount) * 100;
  const barWidthPercent = (totalNights / columnsCount) * 100;

  return (
    <div
      className={`absolute top-1.5 bottom-1.5 rounded-lg shadow-sm border-l-4 ${borderColor} ${bgColor} px-2 py-1 flex items-center gap-1.5 overflow-hidden cursor-pointer hover:shadow-md transition-all z-10 `}
      style={{
        left: `calc(${leftPosPercent}% + 2px)`,
        width: `calc(${barWidthPercent}% - 4px)`,
        minWidth: "50px",
      }}
      title={`${booking.guest.name} - ${format(new Date(booking.checkIn), "dd MMM")} to ${format(new Date(booking.checkOut), "dd MMM")} (${totalNights} nights)`}
    >
      {/* Avatar */}
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-50 flex items-center justify-center flex-shrink-0 ">
        <span className="text-white text-[7px] font-bold ">
          {booking.guest.name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-800 truncate ">
          {booking.guest.name || "N/A"}
        </p>
        <p className="text-[9px] text-gray-500 ">{booking.guest.phone || ""}</p>
      </div>
    </div>
  );
};

// ==========================================
// ROOM ROW COMPONENT
// ==========================================

interface RoomRowProps {
  room: RoomData;
  columns: DayColumn[];
  timelineStartDate: Date;
}

const RoomRow: React.FC<RoomRowProps> = ({
  room,
  columns,
  timelineStartDate,
}) => {
  const getBookingPosition = (
    booking: RoomBooking,
  ): { startColumn: number; totalNights: number } => {
    const bookingStart = startOfDay(new Date(booking.checkIn));
    const bookingEnd = startOfDay(new Date(booking.checkOut));

    // Calculate start column based on timeline start
    const startColumn = Math.max(
      0,
      differenceInCalendarDays(bookingStart, timelineStartDate),
    );

    // totalNights from backend is already correct (checkOut - checkIn in days)
    const totalNights =
      booking.totalNights ||
      Math.max(1, differenceInCalendarDays(bookingEnd, bookingStart));

    return { startColumn, totalNights };
  };

  const isMaintenance = room.status === "maintenance";
  const isOccupied = room.status === "blocked";
  const hasBookings = room.bookings.length > 0;

  const columnsCount = columns.length;

  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors h-[52px] ">
      {/* Room Info - Sticky Left */}
      <div className="sticky left-0 z-20 bg-white flex-shrink-0 border-r border-gray-100 p-2 flex items-center gap-2 shadow-[2px_0_4px_rgba(0,0,0,0.05)] w-[140px] min-w-[140px] ">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center flex-shrink-0 ">
          <FiDollarSign size={12} className="text-orange-500 " />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-800 truncate ">
            Room {room.number}
          </p>
          <p className="text-[10px] text-gray-500 truncate ">{room.type}</p>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative flex-1">
        {/* Day Grid - Subtle background */}
        <div className="absolute inset-0 flex">
          {columns.map((col, idx) => (
            <div
              key={idx}
              className={`flex-1 border-r border-gray-100/60 ${
                col.isToday
                  ? "bg-red-50/30"
                  : col.isWeekend
                    ? "bg-gray-50/30"
                    : "bg-white"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        {isMaintenance ? (
          <div className="absolute inset-y-1 left-1 right-1 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center z-10 ">
            <span className="text-[8px] font-medium text-gray-400 uppercase tracking-wider ">
              Maintenance
            </span>
          </div>
        ) : isOccupied ? (
          <div className="absolute inset-y-1 left-1 right-1 rounded bg-orange-50 border border-dashed border-orange-300 flex items-center justify-center z-10 ">
            <span className="text-[8px] font-medium text-orange-400 uppercase tracking-wider ">
              Occupied
            </span>
          </div>
        ) : hasBookings ? (
          <div className="absolute inset-0">
            {room.bookings.map((booking, idx) => {
              const { startColumn, totalNights } = getBookingPosition(booking);
              return (
                <BookingBar
                  key={`${booking.id}-${idx}`}
                  booking={booking}
                  startColumn={startColumn}
                  totalNights={totalNights}
                  columnsCount={columnsCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-y-1 left-1 right-1 rounded bg-green-50/40 flex items-center justify-center z-10 " />
        )}
      </div>
    </div>
  );
};

// ==========================================
// TIMELINE COMPONENT
// ==========================================

interface BookingTimelineProps {
  data: TimelineData | null;
  viewMode: ViewMode;
  loading: boolean;
}

const BookingTimeline: React.FC<BookingTimelineProps> = ({
  data,
  viewMode: _viewMode,
  loading,
}) => {
  const today = startOfDay(new Date());
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll between header and body
  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = (
        e.target as HTMLDivElement
      ).scrollLeft;
    }
  };

  // Calculate columns
  const columns = useMemo((): DayColumn[] => {
    if (!data?.dateRange) {
      return Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i - 3);
        return {
          date,
          dayName: format(date, "EEE").toUpperCase(),
          dayNumber: format(date, "dd"),
          monthShort: format(date, "MMM"),
          isToday: isSameDay(date, today),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
        };
      });
    }

    const startDate = new Date(data.dateRange.start);
    const endDate = new Date(data.dateRange.end);

    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    return eachDayOfInterval({ start, end }).map((date) => ({
      date,
      dayName: format(date, "EEE").toUpperCase(),
      dayNumber: format(date, "dd"),
      monthShort: format(date, "MMM"),
      isToday: isSameDay(date, today),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    }));
  }, [data, today]);

  const rooms = data?.rooms || [];

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50/30">
        <div className="flex items-center justify-center h-48">
          <FiLoader size={28} className="animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  // Calculate timeline start date for booking position calculation
  const timelineStartDate = columns[0]?.date || new Date();

  // Determine dynamic minWidth for columns (each needs min 40px on tablet, plus 140px room sidebar = 1340px)
  const minWidthPx = columns.length * 40 + 140;

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/30 overflow-hidden">
      {/* Date Header - inside scroll container for sync */}
      <div
        ref={headerScrollRef}
        className="flex-shrink-0 overflow-x-auto overflow-y-hidden w-full scrollbar-hide"
      >
        {/* Header Row */}
        <div
          className="flex bg-white border-b border-gray-200 shadow-sm w-full"
          style={{ minWidth: `max(100%, ${minWidthPx}px)` }}
        >
          {/* Room column header */}
          <div className="flex-shrink-0 sticky left-0 z-20 bg-white border-r border-gray-100 px-3 py-2 shadow-[2px_0_4px_rgba(0,0,0,0.05)] flex items-center w-[140px] min-w-[140px] ">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ">
              Rooms
            </span>
          </div>
          {/* Date columns */}
          <div className="flex flex-grow flex-1">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`flex-grow flex-1 min-w-0 flex flex-col items-center justify-center py-2 border-r border-gray-100/60 ${
                  col.isToday
                    ? "bg-red-50"
                    : col.isWeekend
                      ? "bg-gray-50/50"
                      : "bg-white"
                }`}
              >
                <span
                  className={`text-[10px] font-medium ${col.isToday ? "text-red-600" : "text-gray-400"}`}
                >
                  {col.dayName}
                </span>
                <span
                  className={`text-sm font-black ${col.isToday ? "text-red-600" : "text-gray-700"}`}
                >
                  {col.dayNumber}
                </span>
                {col.isToday && (
                  <span className="text-[6px] font-bold text-red-500 uppercase ">
                    Today
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {data?.stats && (
        <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide w-full ">
          <div className="flex items-center gap-1.5 ">
            <div className="w-2 h-2 rounded-full bg-orange-500 "></div>
            <span className="text-[10px] font-bold text-gray-600 ">
              {data.stats.occupiedRooms} Occupied
            </span>
          </div>
          <div className="flex items-center gap-1.5 ">
            <div className="w-2 h-2 rounded-full bg-green-500 "></div>
            <span className="text-[10px] font-bold text-gray-600 ">
              {data.stats.availableRooms} Available
            </span>
          </div>
          <div className="flex items-center gap-1.5 ">
            <div className="w-2 h-2 rounded-full bg-gray-400 "></div>
            <span className="text-[10px] font-bold text-gray-600 ">
              {data.stats.maintenanceRooms} Maint.
            </span>
          </div>
          <div className="flex items-center gap-1.5 ">
            <div className="w-2 h-2 rounded-full bg-orange-400 "></div>
            <span className="text-[10px] font-bold text-gray-600 ">
              {data.stats.blockedRooms} Occupied
            </span>
          </div>
          <div className="flex items-center gap-1.5 ">
            <FiUser size={10} className="text-gray-400 " />
            <span className="text-[10px] font-bold text-gray-600 ">
              {data.stats.activeBookings} Active
            </span>
          </div>
        </div>
      )}

      {/* Room Rows - Same scroll container for synchronized scrolling */}
      <div
        ref={bodyScrollRef}
        className="flex-1 overflow-auto w-full"
        onScroll={handleBodyScroll}
      >
        <div
          className="w-full"
          style={{ minWidth: `max(100%, ${minWidthPx}px)` }}
        >
          {rooms.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              columns={columns}
              timelineStartDate={timelineStartDate}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-t border-gray-100 w-full ">
        <div className="flex items-center gap-4 flex-wrap ">
          <span className="text-[10px] font-bold text-gray-400 uppercase ">
            Legend:
          </span>
          <div className="flex items-center gap-1 ">
            <div className="w-2.5 h-2.5 rounded bg-blue-50 border-l-2 border-l-blue-500 "></div>
            <span className="text-[10px] text-gray-500 ">Individual</span>
          </div>
          <div className="flex items-center gap-1 ">
            <div className="w-2.5 h-2.5 rounded bg-orange-50 border-l-2 border-l-orange-500 "></div>
            <span className="text-[10px] text-gray-500 ">Corporate</span>
          </div>
          <div className="flex items-center gap-1 ">
            <div className="w-2.5 h-2.5 rounded bg-green-50/60 "></div>
            <span className="text-[10px] text-gray-500 ">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BOOKING OVERVIEW COMPONENT
// ==========================================

const BookingOverview: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/overview", { params: { viewMode } });

      if (res.data.success) {
        setTimelineData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching booking overview:", error);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const stats = timelineData?.stats;

  const viewModes = [
    { id: "daily" as ViewMode, label: "Daily" },
    { id: "weekly" as ViewMode, label: "Weekly" },
    { id: "monthly" as ViewMode, label: "Monthly" },
  ];

  const occupancyPercent = stats?.totalRooms
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Stats & Controls Bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 ">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 ">
          {/* Stats */}
          <div className="flex items-center gap-2 flex-wrap ">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 ">
              <FiDollarSign size={12} className="text-gray-400 " />
              <span className="text-[10px] font-bold text-gray-500 ">
                Total
              </span>
              <span className="text-base font-black text-gray-800 ">
                {stats?.totalRooms || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg border border-orange-100 ">
              <FiUsers size={12} className="text-orange-400 " />
              <span className="text-[10px] font-bold text-orange-500 ">
                Occupied
              </span>
              <span className="text-base font-black text-orange-600 ">
                {stats?.occupiedRooms || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-100 ">
              <FiCheckCircle size={12} className="text-green-400 " />
              <span className="text-[10px] font-bold text-green-500 ">
                Available
              </span>
              <span className="text-base font-black text-green-600 ">
                {stats?.availableRooms || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100 ">
              <FiCalendar size={12} className="text-blue-400 " />
              <span className="text-[10px] font-bold text-blue-500 ">
                Active
              </span>
              <span className="text-base font-black text-blue-600 ">
                {stats?.activeBookings || 0}
              </span>
            </div>

            {/* Occupancy Bar */}
            <div className="flex items-center gap-2 ml-2 ">
              <span className="text-[9px] font-bold text-gray-400 uppercase ">
                Occ.
              </span>
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden ">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-gray-700 ">
                {occupancyPercent}%
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ">
            <button
              onClick={fetchOverview}
              className="px-2.5 py-1 text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-100 transition-colors "
            >
              Refresh
            </button>

            <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg ">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    viewMode === mode.id
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 min-h-0 overflow-hidden w-full">
        <BookingTimeline
          data={timelineData}
          viewMode={viewMode}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default BookingOverview;
