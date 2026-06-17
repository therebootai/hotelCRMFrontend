import React from "react";
import { FiUser, FiPhone, FiEye } from "react-icons/fi";
import { format } from "date-fns";
import type { BillingItem } from "../../pages/billing/BillingPage";

interface BillingTableProps {
 billings: BillingItem[];
 loading: boolean;
 onViewDetails: (bill: BillingItem) => void;
 currentPage: number;
 totalPages: number;
 onPageChange: (page: number) => void;
 getStatusBadge: (status: string) => string;
}

const BillingTable: React.FC<BillingTableProps> = ({
 billings,
 loading,
 onViewDetails,
 currentPage,
 totalPages,
 onPageChange,
 getStatusBadge,
}) => {
 return (
 <div className="space-y-4">
 {/* DATA TABLE */}
 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
 {/* Table Header */}
 <div className="flex items-center bg-gray-50/70 border-b border-gray-100 px-6 py-3 text-[9px] 3xl:text-[14px] font-black text-gray-700 uppercase tracking-widest">
 <div className="w-32">Invoice No</div>
 <div className="flex-1">Guest details</div>
 <div className="w-36 text-center">Grand Total</div>
 <div className="w-36 text-center">Paid Amount</div>
 <div className="w-36 text-center">Due / Baki</div>
 <div className="w-28 text-center">Payment Status</div>
 <div className="w-32 text-center">Invoice Date</div>
 <div className="w-24 text-center">Actions</div>
 </div>

 {/* Table Body */}
 <div className="divide-y divide-gray-50">
 {loading ? (
 <div className="p-12 text-center">
 <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
 <p className="mt-2 text-sm text-gray-400 font-bold">Loading billing history...</p>
 </div>
 ) : billings.length === 0 ? (
 <div className="p-12 text-center text-gray-400 font-bold text-base">
 No bills found in history
 </div>
 ) : (
 billings.map((bill) => {
 // Gracefully handle guest details populating from checkIn list or customer
 const primaryGuest = bill.checkInId?.guests?.find((g: any) => g.isPrimary) || bill.checkInId?.guests?.[0];
 const guestName = bill.customerId?.name || primaryGuest?.name || "N/A";
 const guestPhone = bill.customerId?.phone || primaryGuest?.mobileNo || "N/A";

 return (
 <div key={bill._id} className="flex items-center px-6 py-3.5 hover:bg-gray-50/50 transition-all">
 
 {/* Invoice Code */}
 <div className="w-32">
 <span className="font-bold text-sm text-orange-600 block">{bill.invoiceNumber}</span>
 <span className="text-[9px] text-gray-400 uppercase font-semibold">{bill.invoiceType}</span>
 </div>

 {/* Guest Info */}
 <div className="flex-1">
 <div className="flex items-center gap-1.5">
 <FiUser size={10} className="text-gray-400" />
 <span className="text-sm font-bold text-gray-800">{guestName}</span>
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
 <FiPhone size={10} className="text-gray-400" />
 <span>{guestPhone}</span>
 </div>
 </div>

 {/* Grand Total */}
 <div className="w-36 text-center">
 <span className="font-bold text-gray-800 text-sm">₹{bill.grandTotal.toLocaleString()}</span>
 </div>

 {/* Paid Amount */}
 <div className="w-36 text-center">
 <span className="font-bold text-green-600 text-sm">₹{bill.paidAmount.toLocaleString()}</span>
 </div>

 {/* Remaining Due / Baki */}
 <div className="w-36 text-center">
 <span className={`font-bold text-sm ${bill.dueAmount > 0 ? "text-red-500" : "text-gray-400"}`}>
 ₹{bill.dueAmount.toLocaleString()}
 </span>
 </div>

 {/* Status Badge */}
 <div className="w-28 flex justify-center">
 <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase ${getStatusBadge(bill.paymentStatus)}`}>
 {bill.paymentStatus}
 </span>
 </div>

 {/* Date */}
 <div className="w-32 text-center">
 <span className="text-[10px] text-gray-500 font-bold">
 {format(new Date(bill.createdAt), "dd MMM yyyy")}
 </span>
 </div>

 {/* Action */}
 <div className="w-24 flex items-center justify-center">
 <button
 onClick={() => onViewDetails(bill)}
 className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all text-[10px] font-bold"
 >
 <FiEye size={12} /> View
 </button>
 </div>

 </div>
 );
 })
 )}
 </div>
 </div>

 {/* PAGINATION */}
 {totalPages > 1 && (
 <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
 <span className="text-sm text-gray-500 font-bold">
 Page {currentPage} of {totalPages}
 </span>
 <div className="flex gap-2">
 <button
 disabled={currentPage === 1}
 onClick={() => onPageChange(currentPage - 1)}
 className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-40"
 >
 Previous
 </button>
 <button
 disabled={currentPage === totalPages}
 onClick={() => onPageChange(currentPage + 1)}
 className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-40"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 );
};

export default BillingTable;
