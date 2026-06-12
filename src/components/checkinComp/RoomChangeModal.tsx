import React, { useState, useEffect } from "react";
import { FiX, FiRefreshCw } from "react-icons/fi";
import api from "../../lib/axios";

interface RoomChangeModalProps {
 booking: {
 id: string;
 guest: string;
 start: string;
 end: string;
 currentRoomId: string;
 currentRoomNumber: string;
 currentRoomTypeId: string;
 currentRoomTypeName: string;
 currentPricePerNight: number;
 };
 roomTypes: Array<{ _id: string; name: string; basePrice: number }>;
 onClose: () => void;
 onSuccess: () => void;
}

const RoomChangeModal: React.FC<RoomChangeModalProps> = ({
 booking,
 roomTypes,
 onClose,
 onSuccess,
}) => {
 const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(
 booking.currentRoomTypeId
 );
 const [selectedRoomId, setSelectedRoomId] = useState<string>("");
 const [availableRooms, setAvailableRooms] = useState<any[]>([]);
 const [fetchingRooms, setFetchingRooms] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 if (!selectedRoomTypeId) return;

 const fetchAvailable = async () => {
 try {
 setFetchingRooms(true);
 const res = await api.get("/rooms/available", {
 params: {
 roomType: selectedRoomTypeId,
 checkIn: booking.start,
 checkOut: booking.end,
 },
 });
 const rooms = (res.data.data?.rooms || []).filter(
 (r: any) => r._id !== booking.currentRoomId
 );
 setAvailableRooms(rooms);
 } catch (err) {
 console.error("Room fetch failed", err);
 setAvailableRooms([]);
 } finally {
 setFetchingRooms(false);
 }
 };

 fetchAvailable();
 }, [selectedRoomTypeId, booking.start, booking.end, booking.currentRoomId]);

 const selectedRoom = availableRooms.find((r) => r._id === selectedRoomId);
 const newPricePerNight = selectedRoom?.basePrice || 0;
 const priceDelta = newPricePerNight - booking.currentPricePerNight;

 const nights = Math.max(
 1,
 Math.ceil(
 (new Date(booking.end).getTime() - new Date(booking.start).getTime()) /
 (1000 * 60 * 60 * 24)
 )
 );

 const handleConfirm = async () => {
 if (!selectedRoomId) return;
 try {
 setSubmitting(true);
 setError("");
 await api.patch(`/checkin/${booking.id}/room-change`, {
 newRoomId: selectedRoomId,
 newRoomType: selectedRoomTypeId,
 effectiveDate: booking.start,
 });
 onSuccess();
 onClose();
 } catch (err: any) {
 setError(err?.response?.data?.message || "Room change failed");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-white w-full max-w-[420px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
 {/* Header */}
 <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
 <FiRefreshCw size={20} className="text-orange-500" />
 </div>
 <div>
 <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
 Change Room
 </h2>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
 {booking.guest}
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-2 hover:bg-gray-200 rounded-full transition-all"
 >
 <FiX size={22} />
 </button>
 </div>

 <div className="p-6 space-y-5">
 {/* Booking Info */}
 <div className="grid grid-cols-2 gap-3">
 <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
 <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">
 Current Room
 </span>
 <p className="text-base font-black text-gray-700">
 {booking.currentRoomNumber}
 </p>
 <p className="text-[10px] text-gray-400 font-bold">
 {booking.currentRoomTypeName}
 </p>
 </div>
 <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
 <span className="text-[10px] font-black text-blue-400 uppercase block mb-1">
 Booking Period
 </span>
 <p className="text-base font-black text-blue-700">
 {new Date(booking.start).toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 })}
 {" – "}
 {new Date(booking.end).toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 })}
 </p>
 <p className="text-[10px] text-blue-400 font-bold">
 {nights} night{nights > 1 ? "s" : ""}
 </p>
 </div>
 </div>

 {/* Room Type Selector */}
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
 Room Category
 </label>
 <select
 value={selectedRoomTypeId}
 onChange={(e) => {
 setSelectedRoomTypeId(e.target.value);
 setSelectedRoomId("");
 }}
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-base outline-none focus:ring-2 ring-gray-200"
 >
 <option value="">Choose Category</option>
 {roomTypes?.map((t: any) => (
 <option key={t._id} value={t._id}>
 {t.name}
 </option>
 ))}
 </select>
 </div>

 {/* Room Number Selector */}
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
 New Room
 </label>
 <select
 value={selectedRoomId}
 onChange={(e) => setSelectedRoomId(e.target.value)}
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-base outline-none focus:ring-2 ring-gray-200"
 disabled={fetchingRooms}
 >
 <option value="">
 {fetchingRooms ? "Checking availability..." : "Select Room Number"}
 </option>
 {availableRooms.map((r: any) => (
 <option key={r._id} value={r._id}>
 Room {r.roomNumber} — ₹{r.basePrice}/night
 </option>
 ))}
 </select>
 </div>

 {/* Price Impact */}
 {selectedRoomId && priceDelta !== 0 && (
 <div
 className={`p-4 rounded-2xl border ${
 priceDelta > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
 }`}
 >
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-black text-gray-500 uppercase">
 Price Impact
 </span>
 <span
 className={`text-lg font-black ${
 priceDelta > 0 ? "text-red-500" : "text-green-500"
 }`}
 >
 {priceDelta > 0 ? "+" : ""}₹{priceDelta}/night
 </span>
 </div>
 <div className="flex justify-between items-center mt-1">
 <span className="text-[10px] text-gray-400">
 New total for {nights} night{nights > 1 ? "s" : ""}
 </span>
 <span className="text-base font-bold text-gray-700">
 ₹{(newPricePerNight * nights).toLocaleString()}
 </span>
 </div>
 </div>
 )}

 {/* Error */}
 {error && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
 <p className="text-[8px] font-bold text-red-500">{error}</p>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-6 pt-0 flex gap-3">
 <button
 onClick={onClose}
 className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirm}
 disabled={!selectedRoomId || submitting}
 className="flex-1 py-3 bg-orange-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
 >
 {submitting ? "Changing..." : "Confirm Change"}
 </button>
 </div>
 </div>
 </div>
 );
};

export default RoomChangeModal;
