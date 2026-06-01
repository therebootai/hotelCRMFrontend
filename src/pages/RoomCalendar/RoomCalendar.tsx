import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO, isSameDay } from "date-fns";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiLogIn,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../lib/axios";

interface CalendarRoom {
  roomId: string;
  roomNumber: string;
  roomType: string;
  bookings: {
    id: string;
    bookingId?: string;
    guestName: string;
    checkIn: string;
    checkOut?: string;
    expectedCheckOut?: string;
    status: string;
    type: "booking" | "checkin";
  }[];
}

const RoomCalendar = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [calendarData, setCalendarData] = useState<CalendarRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");
  const [roomTypes, setRoomTypes] = useState<string[]>([]);

  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStart, i),
  );

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const fromStr = format(currentWeekStart, "yyyy-MM-dd");
      const toStr = format(addDays(currentWeekStart, 7), "yyyy-MM-dd");
      const response = await api.get(
        `/bookings/calendar?from=${fromStr}&to=${toStr}`,
      );
      if (response.data?.success) {
        const data = response.data.data || [];
        setCalendarData(data);

        // Extract unique room types for filters
        const types: string[] = Array.from(
          new Set(data.map((r: any) => r.roomType).filter(Boolean) as string[]),
        );
        setRoomTypes(types);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const filteredData =
    roomTypeFilter === "All"
      ? calendarData
      : calendarData.filter((r) => r.roomType === roomTypeFilter);

  // Helper to render booking block inside grid cells
  const getBookingForDate = (room: CalendarRoom, date: Date) => {
    return room.bookings.find((booking) => {
      const checkInDate = parseISO(booking.checkIn);
      const checkOutDate = parseISO(
        booking.checkOut || booking.expectedCheckOut || "",
      );

      // Checking if date falls in interval [checkIn, checkOut)
      return (
        (isSameDay(date, checkInDate) || date > checkInDate) &&
        date < checkOutDate
      );
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiCalendar className="text-primary" size={24} />
            Room Calendar
          </h1>
          <p className="text-text-secondary text-sm">
            Visual schedule grid of room occupancies, reservations, and
            maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-semibold text-text-secondary bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-border cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-gray-50 border border-border rounded-lg overflow-hidden">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-100 text-text-secondary transition-colors border-r border-border cursor-pointer"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="px-4 py-2 text-xs font-bold text-text-primary whitespace-nowrap">
              {format(currentWeekStart, "MMM d")} –{" "}
              {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 text-text-secondary transition-colors border-l border-border cursor-pointer"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={fetchCalendarData}
            className="p-2.5 text-text-secondary bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-border cursor-pointer"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FiFilter size={16} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Filters:
          </span>

          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="bg-gray-50 border border-border rounded-lg text-xs font-medium text-text-primary px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">All Room Types</option>
            {roomTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-text-secondary">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-text-secondary">Checked-In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 border-dashed"></span>
            <span className="text-text-secondary">Available</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider min-w-[200px] border-r border-border">
                  Room Info
                </th>
                {days.map((day, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px] ${
                      isSameDay(day, new Date())
                        ? "bg-primary/5 text-primary"
                        : "text-text-secondary"
                    } ${idx < 6 ? "border-r border-border" : ""}`}
                  >
                    <div>{format(day, "eee")}</div>
                    <div className="text-sm font-bold mt-0.5">
                      {format(day, "d")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length > 0 ? (
                filteredData.map((room) => (
                  <tr
                    key={room.roomId}
                    className="hover:bg-gray-50/20 transition-colors"
                  >
                    {/* Room Info Cell */}
                    <td className="px-6 py-4 border-r border-border">
                      <div className="font-bold text-text-primary text-sm">
                        Room {room.roomNumber}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {room.roomType}
                      </div>
                    </td>

                    {/* Date Cells */}
                    {days.map((day, idx) => {
                      const booking = getBookingForDate(room, day);
                      const isCheckInDay =
                        booking && isSameDay(day, parseISO(booking.checkIn));

                      return (
                        <td
                          key={idx}
                          className={`p-2 relative min-w-[120px] h-16 border-r border-border ${
                            idx === 6 ? "border-r-0" : ""
                          }`}
                        >
                          {booking ? (
                            <Link
                              to={
                                booking.type === "checkin"
                                  ? "/checkin"
                                  : "/bookings"
                              }
                              className={`absolute inset-x-1.5 inset-y-1.5 rounded-lg p-1.5 flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.02] shadow-sm ${
                                booking.status === "Checked-In" ||
                                booking.type === "checkin"
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              <div className="text-[10px] font-bold truncate leading-tight">
                                {booking.guestName}
                              </div>
                              <div className="text-[8px] opacity-90 truncate leading-none mt-0.5">
                                {isCheckInDay
                                  ? "Starts Checkin"
                                  : "Stay Active"}
                              </div>
                            </Link>
                          ) : (
                            <Link
                              to="/bookings"
                              className="absolute inset-0 hover:bg-gray-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            >
                              <span className="text-[9px] font-semibold text-primary flex items-center gap-0.5 bg-primary/10 px-2 py-1 rounded-full">
                                <FiLogIn size={9} /> Book Room
                              </span>
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-text-secondary text-sm"
                  >
                    No rooms found match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomCalendar;
