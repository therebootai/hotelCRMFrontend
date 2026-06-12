import { FiSearch } from "react-icons/fi";
import type { CustomerProfile } from "../types";

interface CustomerDirectoryProps {
 customers: CustomerProfile[];
 loadingList: boolean;
 selectedCustomerId: string | null;
 searchQuery: string;
 page: number;
 totalPages: number;
 onSearchChange: (value: string) => void;
 onSelect: (id: string) => void;
 onPageChange: (page: number) => void;
}

const CustomerDirectory = ({
 customers,
 loadingList,
 selectedCustomerId,
 searchQuery,
 page,
 totalPages,
 onSearchChange,
 onSelect,
 onPageChange,
}: CustomerDirectoryProps) => {
 return (
 <div className="w-88 flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-sm shrink-0 min-h-0">
 <div className="p-4 border-b border-border">
 <div className="relative">
 <FiSearch
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 size={16}
 />
 <input
 type="text"
 placeholder="Search phone, name..."
 value={searchQuery}
 onChange={(e) => onSearchChange(e.target.value)}
 className="w-full bg-gray-50 border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
 {loadingList ? (
 <div className="flex justify-center items-center py-12">
 <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
 </div>
 ) : customers.length > 0 ? (
 customers.map((c) => (
 <div
 key={c._id}
 onClick={() => onSelect(c._id)}
 className={`p-4 cursor-pointer hover:bg-gray-50/50 transition-colors flex justify-between items-center ${
 selectedCustomerId === c._id
 ? "bg-primary/[0.03] border-l-4 border-primary pl-3"
 : ""
 }`}
 >
 <div>
 <h4 className="font-bold text-text-primary text-sm truncate max-w-[180px]">
 {c.name}
 </h4>
 <p className="text-[10px] text-text-secondary mt-1">{c.phone}</p>
 </div>
 <span
 className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
 c.loyaltyTier === "Gold"
 ? "bg-amber-100 text-amber-700"
 : c.loyaltyTier === "Silver"
 ? "bg-slate-100 text-slate-700"
 : "bg-orange-50 text-orange-700"
 }`}
 >
 {c.loyaltyTier || "Bronze"}
 </span>
 </div>
 ))
 ) : (
 <div className="p-8 text-center text-sm text-text-secondary">
 No guest profiles found.
 </div>
 )}
 </div>

 <div className="p-4 border-t border-border flex justify-between items-center bg-gray-50 text-[10px] font-semibold text-text-secondary shrink-0">
 <button
 disabled={page <= 1}
 onClick={() => onPageChange(Math.max(1, page - 1))}
 className="px-2.5 py-1 border border-border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
 >
 Prev
 </button>
 <span>
 Page {page} of {totalPages}
 </span>
 <button
 disabled={page >= totalPages}
 onClick={() => onPageChange(Math.min(totalPages, page + 1))}
 className="px-2.5 py-1 border border-border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
 >
 Next
 </button>
 </div>
 </div>
 );
};

export default CustomerDirectory;
