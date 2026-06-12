import React from "react";
import { FiX } from "react-icons/fi";
import { FaDownload } from "react-icons/fa";
import { format } from "date-fns";
import type { BillingItem } from "../../pages/billing/BillingPage";

interface BillingDetailsModalProps {
 isOpen: boolean;
 onClose: () => void;
 selectedBill: BillingItem | null;
}

const BillingDetailsModal: React.FC<BillingDetailsModalProps> = ({
 isOpen,
 onClose,
 selectedBill,
}) => {
 const handleDownloadPdf = () => {
 if (!selectedBill) return;
 const base = import.meta.env.VITE_API_URL as string;
 window.open(`${base}/billing/${selectedBill._id}/invoice-pdf`, "_blank");
 };

 if (!isOpen || !selectedBill) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl max-w-4xl w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-250">
 
 {/* Modal Header */}
 <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50/50">
 <div>
 <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
 Invoice details: {selectedBill.invoiceNumber}
 </h3>
 <span className="text-[10px] text-gray-500 font-bold uppercase">
 Invoice Type: {selectedBill.invoiceType} | Created on: {format(new Date(selectedBill.createdAt), "dd MMM yyyy, hh:mm a")}
 </span>
 </div>
 <button
 onClick={onClose}
 className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
 >
 <FiX size={20} />
 </button>
 </div>

 {/* Modal Content */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 
 {/* Top Summary Banner */}
 <div className="grid grid-cols-3 gap-4 bg-orange-50/40 p-4 rounded-xl border border-orange-100/50">
 <div>
 <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Invoice Grand Total</span>
 <p className="text-base font-black text-gray-800">₹{selectedBill.grandTotal.toLocaleString()}</p>
 </div>
 <div>
 <span className="text-[9px] uppercase font-bold text-green-500 tracking-wider">Settled Amount</span>
 <p className="text-base font-black text-green-600">₹{selectedBill.paidAmount.toLocaleString()}</p>
 </div>
 <div>
 <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Remaining Outstanding</span>
 <p className="text-base font-black text-red-600">₹{selectedBill.dueAmount.toLocaleString()}</p>
 </div>
 </div>

 {/* Guest & Stays Summary */}
 <div className="grid grid-cols-2 gap-6">
 <div className="border border-gray-100 p-4 rounded-xl">
 <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mb-3">
 Customer Info
 </h4>
 <div className="space-y-1 text-sm">
 <p className="font-bold text-gray-700">
 Name: <span className="font-medium text-gray-600">
 {selectedBill.customerId?.name || selectedBill.checkInId?.guests?.find((g: any) => g.isPrimary)?.name || "N/A"}
 </span>
 </p>
 <p className="font-bold text-gray-700">
 Phone: <span className="font-medium text-gray-600">
 {selectedBill.customerId?.phone || selectedBill.checkInId?.guests?.find((g: any) => g.isPrimary)?.mobileNo || "N/A"}
 </span>
 </p>
 {selectedBill.customerId?.companyName && (
 <p className="font-bold text-gray-700">
 Company: <span className="font-medium text-blue-600">{selectedBill.customerId.companyName}</span>
 </p>
 )}
 </div>
 </div>

 <div className="border border-gray-100 p-4 rounded-xl">
 <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mb-3">
 Stay details
 </h4>
 <div className="space-y-1 text-sm">
 <p className="font-bold text-gray-700">
 Check-in Code: <span className="font-medium text-gray-600">{selectedBill.checkInId?.checkInId || "N/A"}</span>
 </p>
 {selectedBill.checkInId?.checkInTime && (
 <p className="font-bold text-gray-700">
 Stay Period: <span className="font-medium text-gray-600">
 {format(new Date(selectedBill.checkInId.checkInTime), "dd MMM")} - {format(new Date(selectedBill.checkInId.expectedCheckOutTime), "dd MMM yyyy")}
 </span>
 </p>
 )}
 <p className="font-bold text-gray-700">
 Status: <span className="font-black text-orange-600 uppercase text-[10px]">{selectedBill.checkInId?.status || "Draft"}</span>
 </p>
 </div>
 </div>
 </div>

 {/* Room Charges Breakdown Table */}
 {selectedBill.roomChargesBreakdown && selectedBill.roomChargesBreakdown.length > 0 && (
 <div>
 <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Room Charges Breakdown</h4>
 <div className="border border-gray-100 rounded-xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400 tracking-wider">
 <tr>
 <th className="px-4 py-2">Room No</th>
 <th className="px-4 py-2">Room Type</th>
 <th className="px-4 py-2 text-center">Nights</th>
 <th className="px-4 py-2 text-right">Rate / Night</th>
 <th className="px-4 py-2 text-right">Total Charge</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
 {selectedBill.roomChargesBreakdown.map((room: any, index: number) => (
 <tr key={index}>
 <td className="px-4 py-2.5 text-orange-600">{room.roomNumber}</td>
 <td className="px-4 py-2.5 font-medium text-gray-600">{room.roomType || "Standard"}</td>
 <td className="px-4 py-2.5 text-center">{room.nights}</td>
 <td className="px-4 py-2.5 text-right">₹{room.ratePerNight}</td>
 <td className="px-4 py-2.5 text-right">₹{room.totalRoomCharge}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Extra Services Breakdown */}
 {selectedBill.extraServices && selectedBill.extraServices.length > 0 && (
 <div>
 <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Extra Services Added</h4>
 <div className="border border-gray-100 rounded-xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400 tracking-wider">
 <tr>
 <th className="px-4 py-2">Service Name</th>
 <th className="px-4 py-2 text-center">Quantity</th>
 <th className="px-4 py-2 text-right">Rate</th>
 <th className="px-4 py-2 text-right">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
 {selectedBill.extraServices.map((service: any, index: number) => (
 <tr key={index}>
 <td className="px-4 py-2.5">{service.serviceName}</td>
 <td className="px-4 py-2.5 text-center font-medium text-gray-600">{service.quantity}</td>
 <td className="px-4 py-2.5 text-right font-medium text-gray-600">₹{service.rate}</td>
 <td className="px-4 py-2.5 text-right">₹{service.total}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Payments History log */}
 <div>
 <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Payment History</h4>
 {selectedBill.payments && selectedBill.payments.length > 0 ? (
 <div className="border border-gray-100 rounded-xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400 tracking-wider">
 <tr>
 <th className="px-4 py-2">Date</th>
 <th className="px-4 py-2">Payment Mode</th>
 <th className="px-4 py-2">Transaction ID</th>
 <th className="px-4 py-2">Details / Notes</th>
 <th className="px-4 py-2 text-right">Amount Collected</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
 {selectedBill.payments.map((pm: any, index: number) => (
 <tr key={index}>
 <td className="px-4 py-2.5 font-medium text-gray-600">
 {pm.paidAt ? format(new Date(pm.paidAt), "dd MMM yyyy, hh:mm a") : format(new Date(pm.date || Date.now()), "dd MMM yyyy")}
 </td>
 <td className="px-4 py-2.5">
 <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-black text-[9px] uppercase">
 {pm.paymentMode || pm.method || "Cash"}
 </span>
 </td>
 <td className="px-4 py-2.5 font-mono text-gray-500">{pm.transactionId || "N/A"}</td>
 <td className="px-4 py-2.5 font-medium text-gray-500">{pm.note || "N/A"}</td>
 <td className="px-4 py-2.5 text-right text-green-600">₹{pm.amount}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="text-sm text-gray-400 font-bold p-3 border border-gray-50 border-dashed rounded-xl">No payments logged yet.</p>
 )}
 </div>

 {/* Invoices Calculation Breakdown Details */}
 <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row justify-between gap-4">
 <div className="max-w-md w-full text-sm text-gray-500 font-bold">
 {selectedBill.notes && (
 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
 <span className="text-[9px] uppercase text-gray-400 font-bold block mb-1">Billing Notes / Comments</span>
 <p className="text-gray-600 font-medium">{selectedBill.notes}</p>
 </div>
 )}
 </div>

 <div className="w-80 space-y-1.5 text-sm">
 <div className="flex justify-between font-bold text-gray-500">
 <span>Room Charges Total</span>
 <span>₹{selectedBill.totalRoomCharges?.toLocaleString()}</span>
 </div>
 {selectedBill.extraServices && selectedBill.extraServices.length > 0 && (
 <div className="flex justify-between font-bold text-gray-500">
 <span>Extra Services Total</span>
 <span>₹{selectedBill.extraServices.reduce((acc: number, s: any) => acc + (s.total || 0), 0).toLocaleString()}</span>
 </div>
 )}
 <div className="flex justify-between font-bold text-gray-500 border-b border-gray-100 pb-1.5">
 <span>Sub Total</span>
 <span>₹{selectedBill.subTotal?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between font-bold text-gray-500">
 <span>GST Tax ({selectedBill.taxBreakdown?.totalTax ? "CGST + SGST" : "GST"})</span>
 <span>₹{selectedBill.taxBreakdown?.totalTax?.toLocaleString() || "0"}</span>
 </div>
 {selectedBill.discount > 0 && (
 <div className="flex justify-between font-bold text-red-500">
 <span>Discount Applied</span>
 <span>-₹{selectedBill.discount?.toLocaleString()}</span>
 </div>
 )}
 {selectedBill.advanceDeducted > 0 && (
 <div className="flex justify-between font-bold text-green-600">
 <span>Advance Amount Deducted</span>
 <span>-₹{selectedBill.advanceDeducted?.toLocaleString()}</span>
 </div>
 )}
 <div className="flex justify-between font-black text-gray-800 text-base border-t border-gray-100 pt-1.5">
 <span>Grand Total Invoice</span>
 <span>₹{selectedBill.grandTotal?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between font-bold text-green-700">
 <span>Total Amount Paid</span>
 <span>₹{selectedBill.paidAmount?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between font-black text-red-600 border-t border-dashed border-gray-200 pt-1.5 text-base bg-red-50/50 p-2 rounded-lg">
 <span>Net Outstanding Due</span>
 <span>₹{selectedBill.dueAmount?.toLocaleString()}</span>
 </div>
 </div>
 </div>

 </div>

 {/* Modal Footer */}
 <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex justify-between items-center">
 <button
 onClick={handleDownloadPdf}
 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all active:scale-95"
 >
 <FaDownload size={11} /> Download Invoice PDF
 </button>
 <button
 onClick={onClose}
 className="px-5 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 font-bold text-sm"
 >
 Close details
 </button>
 </div>

 </div>
 </div>
 );
};

export default BillingDetailsModal;
