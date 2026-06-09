import { useState } from "react";
import { FiSearch, FiList, FiChevronDown } from "react-icons/fi";
import useClickOutside from "../../../hooks/useClickOutside";

interface StaffFiltersBarProps {
 searchInput: string;
 onSearchChange: (value: string) => void;
 roleFilter: string;
 onRoleChange: (value: string) => void;
 statusFilter: string;
 onStatusChange: (value: string) => void;
 sortOrder: string;
 onSortChange: (value: string) => void;
}

const StaffFiltersBar = ({
 searchInput,
 onSearchChange,
 roleFilter,
 onRoleChange,
 statusFilter,
 onStatusChange,
 sortOrder,
 onSortChange,
}: StaffFiltersBarProps) => {
 const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
 const popoverRef = useClickOutside<HTMLDivElement>(
 () => setIsMoreFiltersOpen(false),
 isMoreFiltersOpen,
 );

 const hasActiveExtraFilter = statusFilter !== "all" || sortOrder !== "newest";

 return (
 <div className="flex items-center gap-4 bg-gray-50/80 p-2 rounded-xl mb-6">
 <div className="flex-1 relative">
 <FiSearch
 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
 size={18}
 />
 <input
 type="text"
 value={searchInput}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder="Search by name, mobile or ID..."
 className="input-field pl-10 py-2.5"
 />
 </div>

 <div className="relative min-w-45">
 <select
 value={roleFilter}
 onChange={(e) => onRoleChange(e.target.value)}
 className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-base font-medium text-text-primary focus:outline-none cursor-pointer"
 >
 <option value="all">All Roles</option>
 <option value="admin">Admin</option>
 <option value="receptionist">Reception</option>
 </select>
 <FiChevronDown
 className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
 size={16}
 />
 </div>

 <div className="relative" ref={popoverRef}>
 <button
 onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
 className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-base font-medium transition-colors ${isMoreFiltersOpen ? "bg-gray-200 text-text-primary" : "bg-gray-100 hover:bg-gray-200 text-text-secondary"}`}
 >
 <FiList size={16} />
 <span>More Filters</span>
 {/* Show a little dot if a filter is active */}
 {hasActiveExtraFilter && (
 <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
 )}
 </button>

 {/* Popover Menu */}
 {isMoreFiltersOpen && (
 <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-modal z-20 animate-fade-in p-4">
 {/* Status Filter */}
 <div className="mb-4">
 <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
 Account Status
 </label>
 <select
 value={statusFilter}
 onChange={(e) => onStatusChange(e.target.value)}
 className="w-full bg-background border border-border rounded-lg px-3 py-2 text-base text-text-primary focus:outline-none focus:border-primary"
 >
 <option value="all">All Statuses</option>
 <option value="active">Active Only</option>
 <option value="disabled">Disabled Only</option>
 </select>
 </div>

 {/* Sort Filter */}
 <div>
 <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
 Sort By
 </label>
 <select
 value={sortOrder}
 onChange={(e) => onSortChange(e.target.value)}
 className="w-full bg-background border border-border rounded-lg px-3 py-2 text-base text-text-primary focus:outline-none focus:border-primary"
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 </select>
 </div>

 {/* Reset Button */}
 {hasActiveExtraFilter && (
 <button
 onClick={() => {
 onStatusChange("all");
 onSortChange("newest");
 }}
 className="w-full mt-4 text-sm font-semibold text-danger hover:text-red-700 transition-colors"
 >
 Clear Filters
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 );
};

export default StaffFiltersBar;
