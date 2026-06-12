import { FiCalendar } from "react-icons/fi";

interface StayHistoryTableProps {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 bookings: any[];
}

const StayHistoryTable = ({ bookings }: StayHistoryTableProps) => {
 return (
 <div className="mt-4">
 <h3 className="text-sm uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5 mb-3">
 <FiCalendar size={14} />
 Stay History
 </h3>
 <div className="border border-border rounded-xl overflow-hidden">
 <table className="w-full border-collapse">
 <thead>
 <tr className="bg-gray-50 border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
 <th className="px-4 py-2">Booking ID</th>
 <th className="px-4 py-2">Dates</th>
 <th className="px-4 py-2">Total Amount</th>
 <th className="px-4 py-2">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 text-sm">
 {bookings && bookings.length > 0 ? (
 bookings.map((b) => (
 <tr key={b._id} className="hover:bg-gray-50/50">
 <td className="px-4 py-2 font-semibold text-primary">
 {b.bookingId || "N/A"}
 </td>
 <td className="px-4 py-2 text-text-secondary">
 {b.bookingCategory === "Day Access" && b.visitDate
 ? new Date(b.visitDate).toLocaleDateString("en-IN", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 })
 : b.rooms?.[0]?.checkInDate
 ? `${new Date(b.rooms[0].checkInDate).toLocaleDateString("en-IN", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 })} — ${b.rooms[0].checkOutDate
 ? new Date(b.rooms[0].checkOutDate).toLocaleDateString("en-IN", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 })
 : "—"}`
 : "—"}
 </td>
 <td className="px-4 py-2">
 {typeof b.pricingSummary?.grandTotal === "number"
 ? `₹${b.pricingSummary.grandTotal.toLocaleString("en-IN")}`
 : "—"}
 </td>
 <td className="px-4 py-2">
 <span
 className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
 b.status === "Confirmed"
 ? "bg-blue-50 text-blue-700"
 : b.status === "Checked-In"
 ? "bg-green-50 text-green-700"
 : b.status === "Checked-Out"
 ? "bg-slate-100 text-slate-700"
 : b.status === "Cancelled"
 ? "bg-red-50 text-red-700"
 : "bg-gray-100 text-gray-600"
 }`}
 >
 {b.status || "Unknown"}
 </span>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td
 colSpan={4}
 className="text-center py-6 text-text-secondary italic"
 >
 No booking history available
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default StayHistoryTable;
