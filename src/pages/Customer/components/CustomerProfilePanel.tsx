import {
 FiPhone,
 FiMail,
 FiMapPin,
 FiEdit2,
 FiTrash2,
 FiFileText,
 FiTag,
 FiCompass,
} from "react-icons/fi";
import type { CustomerProfile, CustomerDetail } from "../types";
import StayHistoryTable from "./StayHistoryTable";

interface CustomerProfilePanelProps {
 customer: CustomerDetail | null;
 loadingDetail: boolean;
 onEdit: (customer: CustomerProfile) => void;
 onDelete: (id: string) => void;
}

const CustomerProfilePanel = ({
 customer,
 loadingDetail,
 onEdit,
 onDelete,
}: CustomerProfilePanelProps) => {
 return (
 <div className="flex-1 min-w-0 bg-white border border-border rounded-2xl overflow-y-auto shadow-sm p-8 flex flex-col justify-between min-h-0">
 {loadingDetail ? (
 <div className="flex-1 flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
 </div>
 ) : customer ? (
 <div className="flex flex-col gap-6">
 {/* Profile Card Header */}
 <div className="flex justify-between items-start">
 <div>
 <h2 className="text-xl font-bold text-text-primary">
 {customer.name}
 </h2>
 <div className="flex flex-wrap items-center gap-4 mt-2">
 <span className="flex items-center gap-1 text-sm text-text-secondary">
 <FiPhone size={14} />
 {customer.phone}
 </span>
 {customer.email && (
 <span className="flex items-center gap-1 text-sm text-text-secondary">
 <FiMail size={14} />
 {customer.email}
 </span>
 )}
 {customer.address && (
 <span className="flex items-center gap-1 text-sm text-text-secondary">
 <FiMapPin size={14} />
 {customer.address}
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => onEdit(customer)}
 className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 cursor-pointer"
 >
 <FiEdit2 size={15} />
 </button>
 <button
 onClick={() => onDelete(customer._id)}
 className="p-2 border border-border rounded-xl text-danger hover:bg-red-50 cursor-pointer"
 >
 <FiTrash2 size={15} />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Meta details */}
 <div className="border border-border p-5 rounded-2xl flex flex-col gap-4">
 <h3 className="text-sm uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1">
 <FiFileText size={14} />
 Company & Loyalty details
 </h3>
 <div className="flex justify-between items-center py-1">
 <span className="text-sm font-semibold text-text-secondary">
 Loyalty Membership
 </span>
 <span className="text-sm font-bold text-primary">
 {customer.loyaltyTier || "Bronze"}
 </span>
 </div>
 {customer.companyName && (
 <div className="flex justify-between items-center py-1 border-t border-gray-50">
 <span className="text-sm font-semibold text-text-secondary">
 Company Name
 </span>
 <span className="text-sm font-medium text-text-primary">
 {customer.companyName}
 </span>
 </div>
 )}
 {customer.companyGST && (
 <div className="flex justify-between items-center py-1 border-t border-gray-50">
 <span className="text-sm font-semibold text-text-secondary">
 Company GST Number
 </span>
 <span className="text-sm font-medium text-text-primary">
 {customer.companyGST}
 </span>
 </div>
 )}
 </div>

 {/* Preferences */}
 <div className="border border-border p-5 rounded-2xl flex flex-col gap-3">
 <h3 className="text-sm uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1">
 <FiTag size={14} />
 Preferences & Notes
 </h3>
 <div className="flex flex-wrap gap-1.5 mt-1">
 {Array.isArray(customer.preferences) &&
 customer.preferences.length > 0 ? (
 customer.preferences.map((p: string, i: number) => (
 <span
 key={i}
 className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full"
 >
 {p}
 </span>
 ))
 ) : (
 <span className="text-sm text-text-secondary italic">
 No preferences tagged
 </span>
 )}
 </div>
 {customer.internalNotes && (
 <p className="text-[11px] text-text-secondary bg-gray-50 p-2.5 rounded-lg border border-border/40 mt-2">
 <strong>Notes:</strong> {customer.internalNotes}
 </p>
 )}
 </div>
 </div>

 <StayHistoryTable bookings={customer.history?.bookings || []} />
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary">
 <FiCompass size={40} className="mb-2 text-gray-300 animate-pulse" />
 <p className="text-base">
 Select a guest from the directory list to display customer profile
 metrics.
 </p>
 </div>
 )}
 </div>
 );
};

export default CustomerProfilePanel;
