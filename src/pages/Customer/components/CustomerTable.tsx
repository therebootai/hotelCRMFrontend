import { FiSearch, FiEye } from "react-icons/fi";
import { format } from "date-fns";
import type { CustomerProfile } from "../types";
import Pagination from "../../../components/layout/Pagination";

interface CustomerTableProps {
  customers: CustomerProfile[];
  loadingList: boolean;
  searchQuery: string;
  page: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
}

const CustomerTable = ({
  customers,
  loadingList,
  searchQuery,
  page,
  totalPages,
  onSearchChange,
  onSelect,
  onPageChange,
}: CustomerTableProps) => {
  return (
    <div className="flex-1 flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-sm min-h-0 animate-fade-in">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-border flex justify-between items-center bg-white shrink-0">
        <div className="relative w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-border">
            <tr>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider">Customer</th>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider">Loyalty Tier</th>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider">Last Stay Date</th>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider">Last Stay Type</th>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider text-right">Total Revenue</th>
              <th className="px-5 py-4 text-xs 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingList ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary text-sm">{c.name}</span>
                      <span className="text-xs text-text-secondary mt-0.5">{c.phone}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.loyaltyTier === "Gold" ? "bg-amber-100 text-amber-700" :
                      c.loyaltyTier === "Silver" ? "bg-slate-200 text-slate-700" :
                      "bg-orange-50 text-orange-700"
                    }`}>
                      {c.loyaltyTier || "Bronze"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-primary">
                    {c.lastStayDate ? format(new Date(c.lastStayDate), "dd MMM yyyy") : "No Stays"}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-primary">
                    {c.lastStayType || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-text-primary text-right">
                    {c.totalRevenue ? `₹${c.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "₹0.00"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => onSelect(c._id)}
                        className="px-4 py-2 bg-white border border-border hover:bg-primary hover:text-white hover:border-primary text-text-primary text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
                      >
                        <FiEye size={14} /> View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-sm text-text-secondary">
                  No guest profiles found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {customers.length > 0 && (
        <div className="border-t border-border bg-white px-5 py-3 shrink-0 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
