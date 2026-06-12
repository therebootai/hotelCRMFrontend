import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../lib/axios";

export interface ArrivalGuest {
 id: string;
 initials: string;
 name: string;
 room: string;
 status: string;
 statusType: "text" | "badge";
 avatarBg: string;
 avatarColor: string;
 bookingId?: string;
 checkInId?: string;
}

export interface FloorOccupancy {
 id: string;
 label: string;
 occupied: number;
 total: number;
 percentage: number;
}

export interface DepartureGuest {
 id: string;
 name: string;
 time: string;
 isUrgent: boolean;
 checkInId?: string;
}

export interface RoomStatusEntry {
 type: string;
 qty: number;
 numbers: string;
}

export interface RoomStatusData {
 id: string;
 date: string;
 isExpanded: boolean;
 availableSummary: number;
 statuses?: {
 available?: { count: number; rooms: RoomStatusEntry[] };
 confirmed?: { count: number; rooms: RoomStatusEntry[] };
 pencil?: { count: number; rooms: RoomStatusEntry[] };
 booked?: { count: number; rooms: RoomStatusEntry[] };
 checkIn?: { count: number; rooms: RoomStatusEntry[] };
 };
}

export interface KpiMetric {
 id: number;
 label: string;
 value: string;
 valueColor: string;
 icon: any;
 iconBg: string;
 iconColor: string;
}



interface CheckInListItem {
 _id: string;
 checkInId: string;
 status: string;
 expectedCheckOutTime: string;
 guests: Array<{ name: string; isPrimary?: boolean }>;
 roomDetails: Array<{
 roomId?: { roomNumber: string; roomType?: { name: string } };
 roomNumber: string;
 }>;
}

interface OverviewStats {
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


function getInitials(name: string): string {
 return name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2);
}

function formatDate(date: Date): string {
 const day = date.getDate();
 const month = date.toLocaleString("en-US", { month: "short" });
 const year = String(date.getFullYear()).slice(-2);
 const weekday = date.toLocaleString("en-US", { weekday: "short" });
 return `${day}-${month}-${year} (${weekday})`;
}

function toDisplayDate(date: Date): string {
 return formatDate(date);
}

function isDueSoon(dateStr: string): boolean {
 const due = new Date(dateStr);
 const now = new Date();
 const diffMs = due.getTime() - now.getTime();
 const diffHours = diffMs / (1000 * 60 * 60);
 return diffHours <= 2 && diffMs > 0;
}

function formatDueTime(dateStr: string): string {
 const date = new Date(dateStr);
 return `DUE ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}

export function useDashboardData(selectedDate?: Date) {
 const [arrivals, setArrivals] = useState<ArrivalGuest[]>([]);
 const [departures, setDepartures] = useState<DepartureGuest[]>([]);
 const [floorOccupancy, setFloorOccupancy] = useState<FloorOccupancy[]>([]);
 const [arrivalsCount, setArrivalsCount] = useState(0);
 const [departuresCount, setDeparturesCount] = useState(0);
 const [roomStatus, setRoomStatus] = useState<RoomStatusData[]>([]);
 const [kpis, setKpis] = useState<KpiMetric[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // Stable date reference — memoized so the effect deps don't churn on every render
 const targetDate = useMemo(
 () => selectedDate ?? new Date(),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()],
 );

 const fetchDashboardData = useCallback(async () => {
 setLoading(true);
 setError(null);

 try {
 const today = new Date(targetDate);
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);
 const dayAfter = new Date(today);
 dayAfter.setDate(dayAfter.getDate() + 2);

 const fromStr = today.toISOString();
 const dayAfterStr = dayAfter.toISOString();
 const todayStr = today.toISOString().split("T")[0];

 const next7Days = new Date(today);
 next7Days.setDate(today.getDate() + 7);
 const next7DaysStr = next7Days.toISOString();

 // Fire all requests in parallel; use Promise.allSettled so one 404 doesn't break the whole dashboard
 const [overviewRes, weekOverviewRes, checkInRes, dueAgingRes] = await Promise.allSettled([
 api.get("/bookings/overview", {
 params: { fromDate: fromStr, toDate: dayAfterStr, viewMode: "daily" },
 }),
 api.get("/bookings/overview", {
 params: { fromDate: fromStr, toDate: next7DaysStr, viewMode: "daily" },
 }),
 api.get("/checkin/list", {
 params: { quickFilter: "today", limit: 100 },
 }),
 api.get("/reports/due-aging"),
 ]);

 const overview =
 overviewRes.status === "fulfilled" && overviewRes.value.data?.success
 ? overviewRes.value.data.data
 : null;

 const weekOverview =
 weekOverviewRes.status === "fulfilled" && weekOverviewRes.value.data?.success
 ? weekOverviewRes.value.data.data
 : null;

 const checkInData: CheckInListItem[] =
 checkInRes.status === "fulfilled" && checkInRes.value.data?.success
 ? Array.isArray(checkInRes.value.data.data)
 ? checkInRes.value.data.data
 : []
 : [];
 const dueData: any[] =
 dueAgingRes.status === "fulfilled" && dueAgingRes.value.data?.success
 ? Array.isArray(dueAgingRes.value.data.data)
 ? dueAgingRes.value.data.data
 : Array.isArray(dueAgingRes.value.data.data?.data)
 ? dueAgingRes.value.data.data.data
 : []
 : [];

 // --- Arrivals ---
 const arrivalsList: ArrivalGuest[] = [];

 for (const room of overview?.rooms || []) {
 for (const booking of room.bookings || []) {
 if (
 booking.status === "confirmed" &&
 booking.checkIn === todayStr
 ) {
 arrivalsList.push({
 id: booking.id,
 initials: getInitials(booking.guest?.name || "Guest"),
 name: booking.guest?.name || "Guest",
 room: `${room.number} • ${room.type}`,
 status: "Check-in",
 statusType: "text",
 avatarBg: "bg-primary/10",
 avatarColor: "text-primary",
 bookingId: booking.bookingId,
 });
 }
 }
 }

 for (const ci of checkInData) {
 if (ci.status === "Active") {
 const primaryGuest = ci.guests?.find((g) => g.isPrimary !== false) || ci.guests?.[0];
 arrivalsList.push({
 id: ci._id,
 initials: getInitials(primaryGuest?.name || "Guest"),
 name: primaryGuest?.name || "Guest",
 room: ci.roomDetails?.[0]?.roomId?.roomNumber
 ? `${ci.roomDetails[0].roomId.roomNumber} • ${ci.roomDetails[0].roomId.roomType?.name || ""}`
 : "Room TBD",
 status: "DONE",
 statusType: "badge",
 avatarBg: "bg-gray-200",
 avatarColor: "text-text-secondary",
 checkInId: ci.checkInId,
 });
 }
 }

 setArrivals(arrivalsList);
 setArrivalsCount(arrivalsList.length);

 // --- Departures ---
 const departuresList: DepartureGuest[] = [];

 for (const ci of checkInData) {
 if (ci.status === "Active" && ci.expectedCheckOutTime) {
 const dueDate = new Date(ci.expectedCheckOutTime);
 if (dueDate >= today && dueDate < tomorrow) {
 const primaryGuest = ci.guests?.find((g) => g.isPrimary !== false) || ci.guests?.[0];
 departuresList.push({
 id: ci._id,
 name: primaryGuest?.name || "Guest",
 time: formatDueTime(ci.expectedCheckOutTime),
 isUrgent: isDueSoon(ci.expectedCheckOutTime),
 checkInId: ci.checkInId,
 });
 }
 }
 }

 setDepartures(departuresList);
 setDeparturesCount(departuresList.length);

 // --- Floor Occupancy ---
 const floorMap = new Map<string, FloorOccupancy>();

 for (const room of overview?.rooms || []) {
 const floorLabel = `FLOOR ${String(room.floor || "1").padStart(2, "0")}`;
 if (!floorMap.has(floorLabel)) {
 floorMap.set(floorLabel, { id: floorLabel, label: floorLabel, occupied: 0, total: 0, percentage: 0 });
 }
 const floor = floorMap.get(floorLabel)!;
 floor.total += 1;
 if (room.bookings?.length > 0) floor.occupied += 1;
 }

 for (const floor of floorMap.values()) {
 floor.percentage = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0;
 }

 setFloorOccupancy(Array.from(floorMap.values()));

 // --- Room Status Board (Next 7 Days) ---
 const statusBoard: RoomStatusData[] = [];

 for (let i = 0; i < 7; i++) {
 const date = new Date(today);
 date.setDate(date.getDate() + i);
 const dateStr = toDisplayDate(date);
 
 const yyyy = date.getFullYear();
 const mm = String(date.getMonth() + 1).padStart(2, '0');
 const dd = String(date.getDate()).padStart(2, '0');
 const localDateStr = `${yyyy}-${mm}-${dd}`;

 const availableRooms: RoomStatusEntry[] = [];
 const confirmedRooms: RoomStatusEntry[] = [];
 const checkInRooms: RoomStatusEntry[] = [];

 for (const room of weekOverview?.rooms || []) {
 const overlappingBookings = room.bookings?.filter((b: any) => {
   const bCheckIn = b.checkIn.split("T")[0];
   const bCheckOut = b.checkOut.split("T")[0];
   return bCheckIn <= localDateStr && bCheckOut > localDateStr;
 });

 const hasActive = overlappingBookings?.some((b: any) => b.status === "checked-in");
 const hasConfirmed = overlappingBookings?.some((b: any) => b.status === "confirmed");

 if (hasActive) {
   checkInRooms.push({ type: room.type, qty: 1, numbers: room.number });
 } else if (hasConfirmed) {
   confirmedRooms.push({ type: room.type, qty: 1, numbers: room.number });
 } else {
   availableRooms.push({ type: room.type, qty: 1, numbers: room.number });
 }
 }

 const collapseRooms = (rooms: RoomStatusEntry[]): RoomStatusEntry[] => {
 const map = new Map<string, RoomStatusEntry>();
 for (const r of rooms) {
   if (map.has(r.type)) {
   const existing = map.get(r.type)!;
   existing.qty += r.qty;
   existing.numbers += `, ${r.numbers}`;
   } else {
   map.set(r.type, { ...r });
   }
 }
 return Array.from(map.values());
 };

 statusBoard.push({
 id: String(i + 1),
 date: dateStr,
 isExpanded: i === 0,
 availableSummary: availableRooms.length,
 statuses: {
   available: { count: availableRooms.length, rooms: collapseRooms(availableRooms) },
   confirmed: { count: confirmedRooms.length, rooms: collapseRooms(confirmedRooms) },
   pencil: { count: 0, rooms: [] },
   booked: { count: 0, rooms: [] },
   checkIn: { count: checkInRooms.length, rooms: collapseRooms(checkInRooms) },
 },
 });
 }

 setRoomStatus(statusBoard);

 // --- KPIs ---
 const stats: OverviewStats = overview?.stats || {};
 const pendingPostings = dueData.filter((d: any) => d.balance > 0).length;
 const avgRoomRent = stats.totalRooms > 0 ? stats.totalRevenue / stats.totalRooms : 0;
 const housekeepingPercent =
 stats.totalRooms > 0 ? Math.round((stats.availableRooms / stats.totalRooms) * 100) : 0;

 const kpiList: KpiMetric[] = [
 {
 id: 1,
 label: "AVG ROOM RENT",
 value: avgRoomRent > 0 ? `₹${avgRoomRent.toFixed(2)}` : "₹0.00",
 valueColor: "text-text-primary",
 icon: "FiDollarSign",
 iconBg: "bg-orange-50",
 iconColor: "text-orange-600",
 },
 {
 id: 2,
 label: "PENDING POSTINGS",
 value: `${pendingPostings} Bill${pendingPostings !== 1 ? "s" : ""}`,
 valueColor: "text-danger",
 icon: "FiAlertTriangle",
 iconBg: "bg-red-50",
 iconColor: "text-danger",
 },
 {
 id: 3,
 label: "CHANNEL ISSUES",
 value: "None",
 valueColor: "text-text-primary",
 icon: "FiRepeat",
 iconBg: "bg-cyan-50",
 iconColor: "text-cyan-600",
 },
 {
 id: 4,
 label: "HOUSEKEEPING",
 value: `${housekeepingPercent}% Clear`,
 valueColor: "text-text-primary",
 icon: "FiEdit2",
 iconBg: "bg-red-50",
 iconColor: "text-primary",
 },
 ];

 setKpis(kpiList);
 } catch (err) {
 console.error("Dashboard data fetch error:", err);
 setError("Failed to load dashboard data");
 } finally {
 setLoading(false);
 }
 }, [targetDate]);

 useEffect(() => {
 fetchDashboardData();
 }, [fetchDashboardData]);

 return {
 arrivals,
 departures,
 floorOccupancy,
 arrivalsCount,
 departuresCount,
 roomStatus,
 kpis,
 loading,
 error,
 refetch: fetchDashboardData,
 };
}
