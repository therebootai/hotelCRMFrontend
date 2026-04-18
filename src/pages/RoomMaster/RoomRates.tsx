import React, { useState, useEffect, forwardRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  BedDouble,
  User,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import { addDays, differenceInDays, format } from "date-fns";
import api from "../../lib/axios";
import { AxiosError } from "axios";

import "react-datepicker/dist/react-datepicker.css";

// --- Types ---
interface Room {
  id: string;
  roomNumber: string;
  basePrice: number;
}

interface RoomCategory {
  id: string;
  name: string;
  rooms: Room[];
}

const MAX_VIEW_DAYS = 10;

export default function RoomRates() {
  // --- State ---
  const [dateRange, setDateRange] = useState<[Date, Date | null]>([
    new Date(),
    addDays(new Date(), 6),
  ]);
  const [startDate, endDate] = dateRange;

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editFormValues, setEditFormValues] = useState<Record<string, number>>({});

  // --- Helpers ---
  const getDatesInRange = useCallback((start: Date, end: Date) => {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }
    return dates;
  }, []);

  const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");
  const currentDates = getDatesInRange(startDate, endDate || startDate);

  // --- Fetch Data from Real API ---
  const fetchGridData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const res = await api.get(`/pricing-rules/grid?startDate=${startStr}&endDate=${endStr}`);
      const { categories: fetchedCategories, overrides } = res.data?.data || { categories: [], overrides: [] };

      setCategories(fetchedCategories);

      const initialPrices: Record<string, number> = {};
      const datesToMap = getDatesInRange(startDate, endDate);

      // 1. Populate Base Prices
      fetchedCategories.forEach((cat: RoomCategory) => {
        cat.rooms.forEach((room: Room) => {
          datesToMap.forEach((date) => {
            const dateKey = formatDateKey(date);
            initialPrices[`${room.id}_${dateKey}`] = room.basePrice;
            
            // Set a default for the category row (we'll overwrite if needed)
            if (!initialPrices[`${cat.id}_${dateKey}`]) {
              initialPrices[`${cat.id}_${dateKey}`] = room.basePrice;
            }
          });
        });
      });

      // 2. Apply Database Overrides
      overrides.forEach((override: { roomId: string; date: string; price: number }) => {
        // override.date from backend should be "YYYY-MM-DD"
        initialPrices[`${override.roomId}_${override.date}`] = override.price;
      });

      // 3. Sync Category UI price (if all rooms in a category share the same price, show it, otherwise show base)
      fetchedCategories.forEach((cat: RoomCategory) => {
        datesToMap.forEach((date) => {
          const dateKey = formatDateKey(date);
          if (cat.rooms.length > 0) {
            const roomPrices = cat.rooms.map(r => initialPrices[`${r.id}_${dateKey}`]);
            const allSame = roomPrices.every(p => p === roomPrices[0]);
            initialPrices[`${cat.id}_${dateKey}`] = allSame ? roomPrices[0] : cat.rooms[0].basePrice;
          }
        });
      });

      setPrices(initialPrices);
    } catch (error: unknown) {
      let errorMsg = "Failed to load rate grid";
      if (error instanceof AxiosError) errorMsg = error.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, getDatesInRange]);

  // Trigger fetch on date change
  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  // --- Navigation Logic ---
  const handlePrev = () => {
    if (!endDate) return;
    const intervalDays = differenceInDays(endDate, startDate) + 1;
    setDateRange([addDays(startDate, -intervalDays), addDays(endDate, -intervalDays)]);
  };

  const handleNext = () => {
    if (!endDate) return;
    const intervalDays = differenceInDays(endDate, startDate) + 1;
    setDateRange([addDays(startDate, intervalDays), addDays(endDate, intervalDays)]);
  };

  const handleDateChange = (update: [Date | null, Date | null]) => {
    const [start, end] = update;
    if (start && end) {
      const daysSelected = differenceInDays(end, start) + 1;
      if (daysSelected > MAX_VIEW_DAYS) {
        toast.error(`View limited to ${MAX_VIEW_DAYS} days to keep the layout clean.`);
        setDateRange([start, addDays(start, MAX_VIEW_DAYS - 1)]);
        return;
      }
    }
    setDateRange([start || new Date(), end]);
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

  const saveEditing = async (id: string, isRoom: boolean) => {
    setIsSaving(true);
    try {
      const ratesPayload: { roomId: string; date: string; price: number }[] = [];
      const updatedPrices = { ...prices };

      Object.entries(editFormValues).forEach(([dateKey, newPrice]) => {
        updatedPrices[`${id}_${dateKey}`] = newPrice;
        
        if (isRoom) {
          // Saving an individual room
          ratesPayload.push({ roomId: id, date: dateKey, price: newPrice });
        } else {
          // Saving a category - cascade to all rooms inside it
          const category = categories.find((c) => c.id === id);
          category?.rooms.forEach((room) => {
            updatedPrices[`${room.id}_${dateKey}`] = newPrice;
            ratesPayload.push({ roomId: room.id, date: dateKey, price: newPrice });
          });
        }
      });

      // Call API
      await api.post("/rates/bulk", { rates: ratesPayload });

      setPrices(updatedPrices);
      cancelEditing();
      toast.success(`${isRoom ? "Room" : "Category"} rates updated successfully`);
    } catch (error: unknown) {
      let errorMsg = "Failed to save rates";
      if (error instanceof AxiosError) errorMsg = error.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const CustomDateInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick }, ref) => (
      <button onClick={onClick} ref={ref} className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer px-2 text-text-primary hover:text-primary transition-colors">
        {value || format(startDate, "MMM dd, yyyy")}
      </button>
    )
  );

  return (
    <div className="page-container py-8 animate-fade-in">
      {/* Header & Date Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Rates & Inventory</h1>
          <p className="text-text-secondary text-sm">Update pricing for categories or specific rooms</p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-lg shadow-sm">
          <button onClick={handlePrev} className="p-2 text-text-secondary hover:bg-background rounded-md transition-colors disabled:opacity-50" disabled={isLoading}>
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
              disabled={isLoading}
            />
          </div>

          <button onClick={handleNext} className="p-2 text-text-secondary hover:bg-background rounded-md transition-colors disabled:opacity-50" disabled={isLoading}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden w-full relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="font-medium text-sm">Loading inventory grid...</p>
          </div>
        )}

        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-background/80 border-b border-border">
            <tr>
              <th className="px-4 py-4 text-[11px] font-bold text-text-secondary uppercase border-r border-border w-[25%] lg:w-[20%]">
                Room / Category
              </th>
              {currentDates.map((date, idx) => (
                <th key={idx} className="px-1 py-4 text-center border-r border-border last:border-r-0">
                  <div className="text-[10px] text-text-secondary uppercase truncate">{format(date, "E")}</div>
                  <div className="text-sm font-bold text-text-primary truncate">{format(date, "dd MMM")}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {!isLoading && categories.length === 0 && (
              <tr>
                <td colSpan={currentDates.length + 1} className="py-12 text-center text-text-secondary">
                  No active rooms found in the system.
                </td>
              </tr>
            )}

            {categories.map((category) => (
              <React.Fragment key={category.id}>
                {/* CATEGORY ROW */}
                <tr className="bg-background/40 group">
                  <td className="px-4 py-3 border-r border-border font-semibold truncate">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 truncate pr-2">
                        <BedDouble size={16} className="text-primary shrink-0" />
                        <span className="truncate">{category.name}</span>
                      </span>
                      {editingCategoryId === category.id ? (
                        <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5 shrink-0">
                          <button disabled={isSaving} onClick={() => saveEditing(category.id, false)} className="p-1 text-success hover:bg-success/10 rounded disabled:opacity-50"><Check size={14} /></button>
                          <button disabled={isSaving} onClick={cancelEditing} className="p-1 text-danger hover:bg-danger/10 rounded disabled:opacity-50"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEditing(category.id, false)} className="p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-primary transition-all shrink-0">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  {currentDates.map((date, idx) => {
                    const dateKey = formatDateKey(date);
                    return (
                      <td key={idx} className="px-1 py-3 border-r border-border text-center overflow-hidden">
                        {editingCategoryId === category.id ? (
                          <input
                            type="number"
                            value={editFormValues[dateKey] || ""}
                            onChange={(e) => setEditFormValues({ ...editFormValues, [dateKey]: Number(e.target.value) })}
                            className="w-[90%] mx-auto text-center text-xs border border-primary/40 rounded py-1.5 focus:ring-1 focus:ring-primary focus:outline-none shadow-sm"
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="text-sm font-bold text-text-primary block truncate">
                            ₹{(prices[`${category.id}_${dateKey}`] || 0).toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* INDIVIDUAL ROOM ROWS */}
                {category.rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-background/20 group/room transition-colors">
                    <td className="px-6 py-2.5 border-r border-border pl-12 text-sm text-text-secondary sticky left-0 bg-white group-hover/room:bg-gray-50 z-10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><User size={12} /> Room {room.roomNumber}</span>
                        {editingRoomId === room.id ? (
                          <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5">
                            <button disabled={isSaving} onClick={() => saveEditing(room.id, true)} className="p-1 text-success hover:bg-success/10 rounded disabled:opacity-50"><Check size={14} /></button>
                            <button disabled={isSaving} onClick={cancelEditing} className="p-1 text-danger hover:bg-danger/10 rounded disabled:opacity-50"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEditing(room.id, true)} className="p-1 text-text-secondary opacity-0 group-hover/room:opacity-100 hover:text-primary transition-all">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    {currentDates.map((date, idx) => {
                      const dateKey = formatDateKey(date);
                      return (
                        <td key={idx} className="px-2 py-2.5 border-r border-border text-center">
                          {editingRoomId === room.id ? (
                            <input
                              type="number"
                              value={editFormValues[dateKey] || ""}
                              onChange={(e) => setEditFormValues({ ...editFormValues, [dateKey]: Number(e.target.value) })}
                              className="w-full max-w-17.5 mx-auto text-center text-[11px] border border-primary/20 rounded py-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                              disabled={isSaving}
                            />
                          ) : (
                            <span className="text-xs text-text-secondary">
                              ₹{(prices[`${room.id}_${dateKey}`] || 0).toLocaleString("en-IN")}
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