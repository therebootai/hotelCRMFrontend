import { useState } from "react";
import { FaTimes, FaDownload, FaExclamationTriangle } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface HotelBillExportModalProps {
 onClose: () => void;
}

const HotelBillExportModal = ({ onClose }: HotelBillExportModalProps) => {
 const [startDate, setStartDate] = useState<Date | null>(null);
 const [endDate, setEndDate] = useState<Date | null>(null);

 const diffDays =
 startDate && endDate
 ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
 : null;

 const canExport = !!(startDate && endDate && (!diffDays || diffDays <= 60));

 const dateLabel =
 startDate && endDate
 ? `${startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} – ${endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
 : null;

 const handleDownload = () => {
 if (!canExport) return;
 const start = new Date(startDate!);
 start.setHours(0, 0, 0, 0);
 const end = new Date(endDate!);
 end.setHours(23, 59, 59, 999);
 const base = import.meta.env.VITE_API_URL as string;
 const url = `${base}/billing/export-pdf?startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}`;
 window.open(url, "_blank");
 onClose();
 };

 return (
 <>
 <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
 <div
 style={{
 background: "#ffffff",
 borderRadius: "20px",
 width: "100%",
 maxWidth: "480px",
 display: "flex",
 flexDirection: "column",
 pointerEvents: "all",
 boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
 }}
 >
 {/* Header */}
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 padding: "16px 20px",
 borderBottom: "1px solid #f0f0f0",
 }}
 >
 <div>
 <h2 style={{ fontSize: "14px", fontWeight: 900, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
 Export Bills as PDF
 </h2>
 <p style={{ fontSize: "11px", color: "#888", marginTop: "2px", marginBottom: 0 }}>
 Select a date range (max 60 days)
 </p>
 </div>
 <button
 onClick={onClose}
 style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f5f5f5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}
 >
 <FaTimes size={12} />
 </button>
 </div>

 {/* Body */}
 <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
 {/* Date pickers */}
 <div style={{ display: "flex", gap: "12px" }}>
 <div style={{ flex: 1 }}>
 <label style={{ fontSize: "10px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
 From
 </label>
 <DatePicker
 selected={startDate}
 onChange={(d: Date | null) => setStartDate(d)}
 selectsStart
 startDate={startDate ?? undefined}
 endDate={endDate ?? undefined}
 maxDate={new Date()}
 dateFormat="dd MMM yyyy"
 placeholderText="Start date"
 className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-orange-300"
 />
 </div>
 <div style={{ flex: 1 }}>
 <label style={{ fontSize: "10px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
 To
 </label>
 <DatePicker
 selected={endDate}
 onChange={(d: Date | null) => setEndDate(d)}
 selectsEnd
 startDate={startDate ?? undefined}
 endDate={endDate ?? undefined}
 minDate={startDate ?? undefined}
 maxDate={new Date()}
 dateFormat="dd MMM yyyy"
 placeholderText="End date"
 className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-orange-300"
 />
 </div>
 </div>

 {/* Range pill */}
 {dateLabel && (
 <div style={{ background: "#f8f8f8", borderRadius: "12px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <span style={{ fontSize: "11px", color: "#555", fontWeight: 600 }}>{dateLabel}</span>
 {diffDays !== null && (
 <span style={{ fontSize: "11px", fontWeight: 700, color: diffDays > 60 ? "#dc2626" : "#16a34a" }}>
 {diffDays} days
 </span>
 )}
 </div>
 )}

 {/* Warning */}
 {diffDays !== null && diffDays > 60 && (
 <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px" }}>
 <FaExclamationTriangle size={13} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
 <div>
 <p style={{ fontSize: "12px", color: "#991b1b", fontWeight: 900, margin: 0 }}>Date range too large</p>
 <p style={{ fontSize: "11px", color: "#dc2626", margin: "2px 0 0" }}>Maximum 60 days allowed.</p>
 </div>
 </div>
 )}

 <p style={{ fontSize: "10px", color: "#aaa", margin: 0, lineHeight: "1.5" }}>
 PDF is generated server-side — download it and share via WhatsApp or print directly.
 </p>
 </div>

 {/* Footer */}
 <div style={{ borderTop: "1px solid #f0f0f0", padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
 <button
 onClick={onClose}
 style={{ padding: "9px 18px", background: "#f5f5f5", color: "#444", fontWeight: 900, fontSize: "11px", textTransform: "uppercase", borderRadius: "10px", border: "none", cursor: "pointer" }}
 >
 Cancel
 </button>
 <button
 onClick={handleDownload}
 disabled={!canExport}
 style={{
 display: "flex",
 alignItems: "center",
 gap: "8px",
 padding: "9px 18px",
 background: canExport ? "#111" : "#d1d5db",
 color: "#fff",
 fontWeight: 900,
 fontSize: "11px",
 textTransform: "uppercase",
 borderRadius: "10px",
 border: "none",
 cursor: canExport ? "pointer" : "not-allowed",
 }}
 >
 <FaDownload size={11} /> Download PDF
 </button>
 </div>
 </div>
 </div>
 </>
 );
};

export default HotelBillExportModal;
