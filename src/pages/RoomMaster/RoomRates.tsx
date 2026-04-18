import React, { useState, useEffect, forwardRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  BedDouble,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import { addDays, differenceInDays, format } from "date-fns";

import "react-datepicker/dist/react-datepicker.css";

interface Room {
  id: string;
  roomNumber: string;
}

interface RoomCategory {
  id: string;
  name: string;
  rooms: Room[];
}

const INITIAL_CATEGORIES: RoomCategory[] = [
  {
    id: "cat_1",
    name: "Deluxe Room",
    rooms: [
      { id: "r_101", roomNumber: "101" },
      { id: "r_102", roomNumber: "102" },
    ],
  },
  {
    id: "cat_2",
    name: "Executive Room",
    rooms: [
      { id: "r_201", roomNumber: "201" },
      { id: "r_202", roomNumber: "202" },
      { id: "r_203", roomNumber: "203" },
    ],
  },
  {
    id: "cat_3",
    name: "Suite Room",
    rooms: [{ id: "r_301", roomNumber: "301" }],
  },
];

export default function RoomRates() {
  // --- Date Range State ---
  // Default interval is Today -> Today + 6 days (7 days total)
  const [dateRange, setDateRange] = useState<[Date, Date | null]>([
    new Date(),
    addDays(new Date(), 6),
  ]);
  const [startDate, endDate] = dateRange;

  // --- Pricing State ---
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editFormValues, setEditFormValues] = useState<Record<string, number>>(
    {},
  );

  // --- Date Math Helpers ---
  // Generate the array of dates for the table columns
  const getDatesInRange = (start: Date, end: Date) => {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }
    return dates;
  };

  // If user is currently selecting and endDate is null, just show the start date's column
  const currentDates = getDatesInRange(startDate, endDate || startDate);
  const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  // --- Initialize Dummy Data ---
  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    INITIAL_CATEGORIES.forEach((cat) => {
      const basePrice =
        cat.name === "Suite Room"
          ? 8000
          : cat.name === "Executive Room"
            ? 5500
            : 3800;
      // Generating 60 days of dummy data from today
      getDatesInRange(new Date(), addDays(new Date(), 60)).forEach((date) => {
        const dateKey = formatDateKey(date);
        initialPrices[`${cat.id}_${dateKey}`] = basePrice;
        cat.rooms.forEach((room) => {
          initialPrices[`${room.id}_${dateKey}`] = basePrice;
        });
      });
    });
    setPrices(initialPrices);
  }, []);

  // --- Navigation Logic ---
  const handlePrev = () => {
    if (!endDate) return;
    const intervalDays = differenceInDays(endDate, startDate) + 1;
    setDateRange([
      addDays(startDate, -intervalDays),
      addDays(endDate, -intervalDays),
    ]);
  };

  const handleNext = () => {
    if (!endDate) return;
    const intervalDays = differenceInDays(endDate, startDate) + 1;
    setDateRange([
      addDays(startDate, intervalDays),
      addDays(endDate, intervalDays),
    ]);
  };

  // --- Editing Logic ---
  const startEditing = (id: string, isRoom: boolean) => {
    const currentValues: Record<string, number> = {};
    currentDates.forEach((date) => {
      const dateKey = formatDateKey(date);
      currentValues[dateKey] = prices[`${id}_${dateKey}`] || 0;
    });
    setEditFormValues(currentValues);
    if (isRoom) {
      setEditingRoomId(id);
      setEditingCategoryId(null);
    } else {
      setEditingCategoryId(id);
      setEditingRoomId(null);
    }
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingRoomId(null);
    setEditFormValues({});
  };

  const saveEditing = (id: string, isRoom: boolean) => {
    const updatedPrices = { ...prices };
    Object.entries(editFormValues).forEach(([dateKey, newPrice]) => {
      updatedPrices[`${id}_${dateKey}`] = newPrice;
      if (!isRoom) {
        const category = INITIAL_CATEGORIES.find((c) => c.id === id);
        category?.rooms.forEach((room) => {
          updatedPrices[`${room.id}_${dateKey}`] = newPrice;
        });
      }
    });
    setPrices(updatedPrices);
    cancelEditing();
    toast.success(`${isRoom ? "Room" : "Category"} rates updated`);
  };

  const MAX_VIEW_DAYS = 10;

  const handleDateChange = (update: [Date | null, Date | null]) => {
    const [start, end] = update;

    if (start && end) {
      const daysSelected = differenceInDays(end, start) + 1;

      if (daysSelected > MAX_VIEW_DAYS) {
        toast.error(
          `View limited to ${MAX_VIEW_DAYS} days to keep the layout clean.`,
        );
        setDateRange([start, addDays(start, MAX_VIEW_DAYS - 1)]);
        return;
      }
    }

    setDateRange([start || new Date(), end]);
  };

  const CustomDateInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick }, ref) => (
      <button
        onClick={onClick}
        ref={ref}
        className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer px-2 text-text-primary hover:text-primary transition-colors"
      >
        {value || format(startDate, "MMM dd, yyyy")}
      </button>
    ),
  );

  return (
    <div className="page-container py-8 animate-fade-in">
      {/* Header & Date Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Rates & Inventory
          </h1>
          <p className="text-text-secondary text-sm">
            Update pricing for categories or specific rooms
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-lg shadow-sm">
          <button
            onClick={handlePrev}
            className="p-2 text-text-secondary hover:bg-background rounded-md transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center px-1">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              customInput={<CustomDateInput />}
              dateFormat="MMM dd, yyyy"
              calendarClassName="border-border rounded-xl shadow-modal font-sans"
            />
          </div>

          <button
            onClick={handleNext}
            className="p-2 text-text-secondary hover:bg-background rounded-md transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-background/80 border-b border-border">
            <tr>
              {/* Fixed width for the Category/Room column (e.g., 25% of the table) */}
              <th className="px-4 py-4 text-[11px] font-bold text-text-secondary uppercase border-r border-border w-[25%] lg:w-[20%]">
                Room / Category
              </th>

              {/* Evenly distributed width for the date columns */}
              {currentDates.map((date, idx) => (
                <th
                  key={idx}
                  className="px-1 py-4 text-center border-r border-border last:border-r-0"
                >
                  <div className="text-[10px] text-text-secondary uppercase truncate">
                    {format(date, "E")}
                  </div>
                  <div className="text-sm font-bold text-text-primary truncate">
                    {format(date, "dd MMM")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {INITIAL_CATEGORIES.map((category) => (
              <React.Fragment key={category.id}>
                {/* CATEGORY ROW */}
                <tr className="bg-background/40 group">
                  <td className="px-4 py-3 border-r border-border font-semibold truncate">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 truncate pr-2">
                        <BedDouble
                          size={16}
                          className="text-primary shrink-0"
                        />
                        <span className="truncate">{category.name}</span>
                      </span>
                      {editingCategoryId === category.id ? (
                        <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5 shrink-0">
                          <button
                            onClick={() => saveEditing(category.id, false)}
                            className="p-1 text-success hover:bg-success/10 rounded"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-danger hover:bg-danger/10 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(category.id, false)}
                          className="p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-primary transition-all shrink-0"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  {currentDates.map((date, idx) => {
                    const dateKey = formatDateKey(date);
                    return (
                      <td
                        key={idx}
                        className="px-1 py-3 border-r border-border text-center overflow-hidden"
                      >
                        {editingCategoryId === category.id ? (
                          <input
                            type="number"
                            value={editFormValues[dateKey] || ""}
                            onChange={(e) =>
                              setEditFormValues({
                                ...editFormValues,
                                [dateKey]: Number(e.target.value),
                              })
                            }
                            className="w-[90%] mx-auto text-center text-xs border border-primary/40 rounded py-1.5 focus:ring-1 focus:ring-primary focus:outline-none shadow-sm"
                          />
                        ) : (
                          <span className="text-sm font-bold text-text-primary block truncate">
                            ₹
                            {(
                              prices[`${category.id}_${dateKey}`] || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* INDIVIDUAL ROOM ROWS */}
                {category.rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-background/20 group/room transition-colors"
                  >
                    <td className="px-6 py-2.5 border-r border-border pl-12 text-sm text-text-secondary sticky left-0 bg-white group-hover/room:bg-gray-50 z-10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <User size={12} /> Room {room.roomNumber}
                        </span>
                        {editingRoomId === room.id ? (
                          <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5">
                            <button
                              onClick={() => saveEditing(room.id, true)}
                              className="p-1 text-success hover:bg-success/10 rounded"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-danger hover:bg-danger/10 rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(room.id, true)}
                            className="p-1 text-text-secondary opacity-0 group-hover/room:opacity-100 hover:text-primary transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    {currentDates.map((date, idx) => {
                      const dateKey = formatDateKey(date);
                      return (
                        <td
                          key={idx}
                          className="px-2 py-2.5 border-r border-border text-center"
                        >
                          {editingRoomId === room.id ? (
                            <input
                              type="number"
                              value={editFormValues[dateKey] || ""}
                              onChange={(e) =>
                                setEditFormValues({
                                  ...editFormValues,
                                  [dateKey]: Number(e.target.value),
                                })
                              }
                              className="w-full max-w-17.5 mx-auto text-center text-[11px] border border-primary/20 rounded py-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            />
                          ) : (
                            <span className="text-xs text-text-secondary">
                              ₹
                              {(
                                prices[`${room.id}_${dateKey}`] || 0
                              ).toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
