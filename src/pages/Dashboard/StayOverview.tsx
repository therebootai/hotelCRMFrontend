import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import api from "../../lib/axios";
import NewBookingButton from "../../components/ui/NewBookingButton";
import ExtendStayModal from "../../components/checkinComp/ExtendStayModal";
import { FaSnowflake } from "react-icons/fa";
import { BiUser, BiWrench } from "react-icons/bi";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toISODate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getDaysArray = (start: Date, end: Date) => {
  const arr: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    arr.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return arr;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const SummaryCard = ({
  title,
  value,
  total,
}: {
  title: string;
  value: number;
  total: number;
}) => (
  <div className="card p-4! flex flex-col gap-2">
    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
      {title}
    </span>
    <div className="flex items-baseline gap-1">
      <span className="text-[24px] font-bold text-text-primary">{value}</span>
      <span className="text-[12px] font-bold text-text-secondary">
        /{total}
      </span>
    </div>
  </div>
);

const BookingBlock = ({
  booking,
  startCol,
  span,
  actualSpan,
  onDragStart,
  onResizeStart,
}: any) => {
  const colorStyles: any = {
    red: "bg-primary/10 border-primary/20",
    cyan: "bg-cyan-100 border-cyan-300",
    gray: "bg-gray-200 border-gray-300",
  };
  const theme = colorStyles[booking.color] || colorStyles.red;

  if (booking.isBlocked) {
    return (
      <div
        className={`z-10 m-1.5 rounded-lg border ${theme} flex items-center justify-center gap-2 opacity-80 overflow-hidden`}
        style={{ gridColumn: `${startCol} / span ${span}` }}
      >
        <BiWrench size={14} className="text-text-secondary shrink-0" />
        <span className="text-[8px] font-bold text-text-secondary truncate">
          BLOCKED
        </span>
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
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BiUser size={12} className="text-primary shrink-0" />
          <span className="text-[9px] font-bold text-text-primary truncate">
            {booking.guest}
          </span>
        </div>
        <span className="text-[9px] font-bold text-text-secondary hidden sm:inline-block">
          {actualSpan} Days
        </span>
      </div>
      <div className="flex justify-between items-end mt-1 gap-2">
        <span className="text-[11px] text-text-secondary truncate">
          {booking.phone}
        </span>
        <span className="text-[11px] font-bold text-primary shrink-0">
          ₹{booking.price || 0}
        </span>
      </div>
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(e, booking);
        }}
        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
      >
        <div className="w-0.5 h-3 bg-black/20 rounded-full"></div>
      </div>
    </div>
  );
};

const StayOverview = () => {
  const today = startOfToday();

  const [viewStart, setViewStart] = useState<Date>(today);
  const [viewEnd, setViewEnd] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 9);
    return d;
  });

  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);
  const [extendOpen, setExtendOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Store pending resize result — set on mouseup, not on mousemove
  const pendingResizeRef = useRef<any>(null);

  const datesArray = useMemo(
    () => getDaysArray(viewStart, viewEnd),
    [viewStart, viewEnd],
  );

  const gridTemplate = `180px repeat(${datesArray.length}, minmax(0, 1fr))`;

  // =====================================================
  // FETCH DATA
  // =====================================================
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/checkin/stay-overview", {
        params: { from: toISODate(viewStart), to: toISODate(viewEnd) },
      });
      setTimelineData(res.data.data || []);
    } catch (error) {
      console.error("overview failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [viewStart, viewEnd]);

  // =====================================================
  // SUMMARY
  // =====================================================
  const summary = useMemo(() => {
    let total = 0;
    let occupied = 0;
    timelineData.forEach((cat: any) => {
      cat.rooms.forEach((room: any) => {
        total++;
        if (room.bookings?.length > 0) occupied++;
      });
    });
    return { total, occupied, available: total - occupied };
  }, [timelineData]);

  // =====================================================
  // NAVIGATION
  // =====================================================
  const goPrev = () => {
    const s = new Date(viewStart);
    const e = new Date(viewEnd);
    s.setDate(s.getDate() - 1);
    e.setDate(e.getDate() - 1);
    setViewStart(s);
    setViewEnd(e);
  };

  const goNext = () => {
    const s = new Date(viewStart);
    const e = new Date(viewEnd);
    s.setDate(s.getDate() + 1);
    e.setDate(e.getDate() + 1);
    setViewStart(s);
    setViewEnd(e);
  };

  // =====================================================
  // DRAG & DROP
  // =====================================================
  const handleDragStart = (e: React.DragEvent, booking: any) => {
    e.dataTransfer.setData("booking", JSON.stringify({ booking }));
  };

  // =====================================================
  // DRAG & DROP
  // =====================================================
  const handleDrop = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const raw = e.dataTransfer.getData("booking");
    if (!raw) return;

    const { booking } = JSON.parse(raw);

    const dropDate = new Date(datesArray[colIndex]);
    dropDate.setHours(12, 0, 0, 0);

    const currentEnd = new Date(booking.end);
    if (dropDate <= currentEnd) return;

    setSelectedCheckIn({
      _id: booking.id,
      guests: [{ name: booking.guest, mobileNo: booking.phone }],
      expectedCheckOutTime: new Date(booking.end),
      roomDetails: [
        {
          roomId: booking.roomId,
          roomNumber: booking.roomNumber,
          roomType: booking.roomType || "",
          appliedPrice: booking.price || 0,
        },
      ],
      totalAdvanceAmount: booking.totalAdvanceAmount || 0,
      _prefillCheckout: dropDate,
    });

    setExtendOpen(true);
  };

  // =====================================================
  // RESIZE — replace your existing handleResizeStart
  // =====================================================
  const handleResizeStart = (e: React.MouseEvent, booking: any) => {
    e.preventDefault();
    const startX = e.clientX;

    pendingResizeRef.current = new Date(booking.end);

    const move = (ev: MouseEvent) => {
      if (!gridRef.current) return;

      const width = gridRef.current.offsetWidth - 180;
      const colWidth = width / datesArray.length;
      const diff = ev.clientX - startX;
      const cols = Math.round(diff / colWidth);

      if (cols === 0) return;

      const newDate = new Date(booking.end);
      newDate.setDate(newDate.getDate() + cols);
      newDate.setHours(12, 0, 0, 0);

      if (newDate <= new Date(booking.start)) return;

      // ✅ Only ref update — no setState during drag
      pendingResizeRef.current = newDate;
    };

    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);

      const finalDate = pendingResizeRef.current;
      if (!finalDate) return;

      // ✅ finalDate must be after booking.end
      const originalEnd = new Date(booking.end);
      if (finalDate <= originalEnd) {
        pendingResizeRef.current = null;
        return;
      }

      setSelectedCheckIn({
        _id: booking.id,
        guests: [{ name: booking.guest }],
        expectedCheckOutTime: originalEnd,
        roomDetails: [
          {
            roomId: booking.roomId,
            roomNumber: booking.roomNumber,
            roomType: booking.roomType || "",
            appliedPrice: booking.price || 0,
          },
        ],
        totalAdvanceAmount: booking.totalAdvanceAmount || 0,
        _prefillCheckout: finalDate,
      });

      setExtendOpen(true);
      pendingResizeRef.current = null;
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <div className="page-container flex flex-col py-[32px] gap-[24px] w-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-text-primary">
          Stay Overview
        </h2>
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-2 py-1.5 shadow-sm">
            <button
              onClick={goPrev}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 text-[9px] font-bold px-3 py-1 hover:bg-gray-50 rounded-md"
            >
              <FiCalendar size={16} className="text-primary" />
              <span className="text-[12px]">
                {viewStart.toLocaleDateString()} -{" "}
                {viewEnd.toLocaleDateString()}
              </span>
            </button>
            <button
              onClick={goNext}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
          <NewBookingButton />
          {showPicker && (
            <div className="absolute top-full right-0 mt-2 bg-white border rounded-xl shadow-xl z-50 p-4 flex gap-3">
              <DatePicker
                selected={viewStart}
                onChange={(date: Date | null) => date && setViewStart(date)}
                selectsStart
                startDate={viewStart}
                endDate={viewEnd}
                className="input-field"
              />
              <DatePicker
                selected={viewEnd}
                onChange={(date: Date | null) => date && setViewEnd(date)}
                selectsEnd
                startDate={viewStart}
                endDate={viewEnd}
                minDate={viewStart}
                className="input-field"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-[24px]">
        <SummaryCard
          title="TOTAL ROOMS"
          value={summary.total}
          total={summary.total}
        />
        <SummaryCard
          title="OCCUPIED"
          value={summary.occupied}
          total={summary.total}
        />
        <SummaryCard
          title="AVAILABLE"
          value={summary.available}
          total={summary.total}
        />
      </div>

      {/* Timeline */}
      <div className="card !p-0 overflow-hidden">
        <div ref={gridRef}>
          {/* Header Row */}
          <div
            className="grid bg-white border-b border-border"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="p-4 border-r border-border text-[11px] font-bold uppercase text-text-secondary">
              Rooms
            </div>
            {datesArray.map((d, i) => {
              const isToday = toISODate(d) === toISODate(new Date());
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center py-2 border-r last:border-0 ${
                    isToday ? "text-primary border-b-2 border-b-primary" : ""
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-[10px] font-bold">{d.getDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-10 text-center font-bold text-gray-400">
              Loading...
            </div>
          ) : (
            timelineData.map((category: any, cIdx: number) => (
              <div key={cIdx}>
                <div className="bg-gray-50 px-4 py-2 border-b text-[12px] font-bold">
                  {category.category}
                </div>
                {category.rooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="grid border-b min-h-[70px] relative"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {/* Room Cell */}
                    <div className="p-3 border-r bg-white z-20 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold">
                          {room.roomNumber}
                        </span>
                        <FaSnowflake
                          size={12}
                          className="text-cyan-600 shrink-0"
                        />
                      </div>
                      <span className="text-[10px] text-text-secondary">
                        {room.status}
                      </span>
                    </div>

                    {/* Blank Cells */}
                    {datesArray.map((_, i) => (
                      <div
                        key={i}
                        className="border-r bg-white hover:bg-orange-50 min-h-[70px] relative z-30"
                        style={{ gridColumn: i + 2 }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => handleDrop(e, i)}
                      />
                    ))}

                    {/* Booking Blocks */}
                    {room.bookings.map((booking: any) => {
                      const bStart = new Date(booking.start);
                      const bEnd = new Date(booking.end);

                      const startOffset = Math.floor(
                        (bStart.getTime() - viewStart.getTime()) / MS_PER_DAY,
                      );
                      const endOffset = Math.floor(
                        (bEnd.getTime() - viewStart.getTime()) / MS_PER_DAY,
                      );

                      const visualStartCol =
                        startOffset < 0 ? 2 : 2 + startOffset;
                      const visualEndCol =
                        endOffset >= datesArray.length
                          ? datesArray.length + 1
                          : 2 + endOffset;
                      const visualSpan = visualEndCol - visualStartCol + 1;
                      const actualSpan =
                        Math.floor(
                          (bEnd.getTime() - bStart.getTime()) / MS_PER_DAY,
                        ) + 1;

                      if (
                        visualSpan <= 0 ||
                        startOffset >= datesArray.length ||
                        endOffset < 0
                      )
                        return null;

                      return (
                        <BookingBlock
                          key={booking.id}
                          booking={{
                            ...booking,
                            roomId: room.id,
                            roomNumber: room.roomNumber,
                            roomType: room.roomType?._id || room.roomType || "",
                          }}
                          startCol={visualStartCol}
                          span={visualSpan}
                          actualSpan={actualSpan}
                          onDragStart={(e: React.DragEvent) =>
                            handleDragStart(e, { ...booking, roomId: room.id })
                          }
                          onResizeStart={handleResizeStart}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {extendOpen && selectedCheckIn && (
        <ExtendStayModal
          checkIn={selectedCheckIn}
          onClose={() => {
            setExtendOpen(false);
            setSelectedCheckIn(null);
          }}
          onSuccess={() => {
            fetchOverview();
            setExtendOpen(false);
            setSelectedCheckIn(null);
          }}
          prefillCheckout={selectedCheckIn._prefillCheckout}
        />
      )}
    </div>
  );
};

export default StayOverview;
