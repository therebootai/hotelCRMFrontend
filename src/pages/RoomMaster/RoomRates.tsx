import React, { useState, useEffect, forwardRef, useCallback } from "react";
import {
 FiChevronLeft,
 FiChevronRight,
 FiEdit2,
 FiCheck,
 FiX,
 FiUser,
 FiLoader,
 FiUpload,
 FiCoffee,
} from "react-icons/fi";
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
 
 const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
 
 const [isLoading, setIsLoading] = useState(true);
 const [isPublishing, setIsPublishing] = useState(false);

 const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
 const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
 const [editFormValues, setEditFormValues] = useState<Record<string, number>>({});

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

 const hasUnsavedChanges = Object.keys(editedPrices).length > 0;

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

 // 1. Populate Base Prices for Rooms
 fetchedCategories.forEach((cat: RoomCategory) => {
 cat.rooms.forEach((room: Room) => {
 datesToMap.forEach((date) => {
 const dateKey = formatDateKey(date);
 initialPrices[`${room.id}_${dateKey}`] = room.basePrice;
 });
 });
 });

 // 2. Apply Database Overrides
 overrides.forEach((override: any) => {
 // Skip if the backend sent empty data
 if (!override || !override.date) return; 

 let safeDateStr = "";
 
 // Handle if backend sends an array: ["2026-04-18", "00:00:00.000Z"]
 if (Array.isArray(override.date) && override.date.length > 0) {
 // Grab the index and force it to be a String before splitting
 safeDateStr = String(override.date[0]).split("T")[0];
 } 
 if (safeDateStr) {
 const cellKey = `${override.roomId}_${safeDateStr}`;
 initialPrices[cellKey] = override.price;
 }
 });
 setPrices(initialPrices);
 // Clear any pending edits when we fetch fresh data
 setEditedPrices({});
 } catch (error: unknown) {
 console.log(error)
 let errorMsg = "Failed to load rate grid";
 if (error instanceof AxiosError) errorMsg = error.response?.data?.message || errorMsg;
 toast.error(errorMsg);
 } finally {
 setIsLoading(false);
 }
 }, [startDate, endDate, getDatesInRange]);

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

 // --- Inline Editing Logic (Draft Mode) ---
 const startEditing = (id: string, isRoom: boolean) => {
 const currentValues: Record<string, number> = {};
 
 currentDates.forEach((date) => {
 const dateKey = formatDateKey(date);
 if (isRoom) {
 const cellKey = `${id}_${dateKey}`;
 currentValues[dateKey] = editedPrices[cellKey] ?? prices[cellKey] ?? 0;
 } else {
 currentValues[dateKey] = 0; 
 }
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

 const saveEditing = () => {
 const newEdits = { ...editedPrices };

 Object.entries(editFormValues).forEach(([dateKey, newPrice]) => {
 if (!newPrice) return; 

 if (editingRoomId) {
 const cellKey = `${editingRoomId}_${dateKey}`;
 
 // Only flag as edited if the price is ACTUALLY different from the saved API price
 if (newPrice !== prices[cellKey]) {
 newEdits[cellKey] = newPrice;
 } else {
 // If they changed it back to the original price, remove the edit flag
 delete newEdits[cellKey];
 }
 } else if (editingCategoryId) {
 // Cascade to all rooms
 const category = categories.find((c) => c.id === editingCategoryId);
 category?.rooms.forEach((room) => {
 const cellKey = `${room.id}_${dateKey}`;
 
 if (newPrice !== prices[cellKey]) {
 newEdits[cellKey] = newPrice;
 } else {
 delete newEdits[cellKey];
 }
 });
 }
 });

 setEditedPrices(newEdits);
 cancelEditing();
 };

 // --- Publish Logic (Send to API) ---
 const handlePublish = async () => {
 if (!hasUnsavedChanges) return;
 
 setIsPublishing(true);
 try {
 const ratesPayload = Object.entries(editedPrices).map(([key, price]) => {
 const [roomId, date] = key.split("_");
 return { roomId, date, price };
 });

 await api.post("/pricing-rules/bulk", { rates: ratesPayload });
 
 toast.success(`Successfully published rates for ${ratesPayload.length} slots`);
 await fetchGridData();
 } catch (error: unknown) {
 let errorMsg = "Failed to publish rates";
 if (error instanceof AxiosError) errorMsg = error.response?.data?.message || errorMsg;
 toast.error(errorMsg);
 } finally {
 setIsPublishing(false);
 }
 };

 const CustomDateInput = forwardRef<HTMLButtonElement, any>(
 ({ value, onClick }, ref) => (
 <button onClick={onClick} ref={ref} className="bg-transparent border-none text-base font-medium focus:outline-none cursor-pointer px-2 text-text-primary hover:text-primary transition-colors">
 {value || format(startDate, "MMM dd, yyyy")}
 </button>
 )
 );

 return (
 <div className="page-container py-8 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-text-primary mb-1">Rates & Inventory</h1>
 <p className="text-text-secondary text-base">Update pricing for categories or specific rooms</p>
 </div>

 <div className="flex items-center gap-3">
 {hasUnsavedChanges && (
 <button 
 onClick={handlePublish}
 disabled={isPublishing}
 className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg font-medium shadow-sm hover:bg-success/90 transition-colors animate-fade-in disabled:opacity-50"
 >
 {isPublishing ? <FiLoader size={16} className="animate-spin" /> : <FiUpload size={16} />}
 Publish Changes ({Object.keys(editedPrices).length})
 </button>
 )}

 <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-lg shadow-sm">
 <button onClick={handlePrev} className="p-2 text-text-secondary hover:bg-background rounded-md transition-colors disabled:opacity-50" disabled={isLoading}>
 <FiChevronLeft size={18} />
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
 <FiChevronRight size={18} />
 </button>
 </div>
 </div>
 </div>

 <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden w-full relative min-h-100">
 {isLoading && (
 <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-text-secondary">
 <FiLoader className="w-8 h-8 animate-spin text-primary mb-3" />
 <p className="font-medium text-base">Loading inventory grid...</p>
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
 <div className="text-base font-bold text-text-primary truncate">{format(date, "dd MMM")}</div>
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
 <span className="flex items-center gap-2 truncate pr-2 text-text-primary">
 <FiCoffee size={16} className="text-primary shrink-0" />
 <span className="truncate">{category.name}</span>
 </span>
 {editingCategoryId === category.id ? (
 <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5 shrink-0">
 <button onClick={() => saveEditing()} className="p-1 text-success hover:bg-success/10 rounded"><FiCheck size={14} /></button>
 <button onClick={cancelEditing} className="p-1 text-danger hover:bg-danger/10 rounded"><FiX size={14} /></button>
 </div>
 ) : (
 <button onClick={() => startEditing(category.id, false)} className="p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-primary transition-all shrink-0">
 <FiEdit2 size={14} />
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
 placeholder="Set All"
 value={editFormValues[dateKey] || ""}
 onChange={(e) => setEditFormValues({ ...editFormValues, [dateKey]: Number(e.target.value) })}
 className="w-[90%] mx-auto text-center text-sm border border-primary/40 rounded py-1.5 focus:ring-1 focus:ring-primary focus:outline-none shadow-sm"
 />
 ) : (
 <span className="text-text-secondary/30 block">—</span>
 )}
 </td>
 );
 })}
 </tr>

 {/* INDIVIDUAL ROOM ROWS */}
 {category.rooms.map((room) => (
 <tr key={room.id} className="hover:bg-background/20 group/room transition-colors">
 <td className="px-6 py-2.5 border-r border-border pl-12 text-base text-text-secondary sticky left-0 bg-white group-hover/room:bg-gray-50 z-10 transition-colors">
 <div className="flex items-center justify-between">
 <span className="flex items-center gap-2"><FiUser size={12} /> Room {room.roomNumber}</span>
 {editingRoomId === room.id ? (
 <div className="flex gap-1 bg-white rounded shadow-sm border border-border p-0.5">
 <button onClick={() => saveEditing()} className="p-1 text-success hover:bg-success/10 rounded"><FiCheck size={14} /></button>
 <button onClick={cancelEditing} className="p-1 text-danger hover:bg-danger/10 rounded"><FiX size={14} /></button>
 </div>
 ) : (
 <button onClick={() => startEditing(room.id, true)} className="p-1 text-text-secondary opacity-0 group-hover/room:opacity-100 hover:text-primary transition-all">
 <FiEdit2 size={14} />
 </button>
 )}
 </div>
 </td>
 {currentDates.map((date, idx) => {
 const dateKey = formatDateKey(date);
 const cellKey = `${room.id}_${dateKey}`;
 
 const isEdited = cellKey in editedPrices;
 const displayPrice = isEdited ? editedPrices[cellKey] : (prices[cellKey] ?? room.basePrice);

 return (
 <td 
 key={idx} 
 className={`px-2 py-2.5 border-r border-border text-center transition-colors
 ${isEdited && editingRoomId !== room.id ? 'bg-primary/5 border border-primary/20 shadow-[inset_0_0_0_1px_rgba(255,90,60,0.2)]' : ''}
 `}
 >
 {editingRoomId === room.id ? (
 <input
 type="number"
 value={editFormValues[dateKey] || ""}
 onChange={(e) => setEditFormValues({ ...editFormValues, [dateKey]: Number(e.target.value) })}
 className="w-full max-w-17.5 mx-auto text-center text-[11px] border border-primary/20 rounded py-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
 />
 ) : (
 <span className={`text-sm font-medium ${isEdited ? 'text-primary' : 'text-text-secondary'}`}>
 ₹{displayPrice.toLocaleString("en-IN")}
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