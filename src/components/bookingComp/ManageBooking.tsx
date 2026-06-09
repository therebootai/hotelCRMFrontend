import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiSearch,
  FiCalendar,
  FiPhone,
  FiUser,
  FiLogIn,
  FiBriefcase,
  FiXCircle,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiX,
  FiPrinter,
  FiEye,
  FiMoreVertical,
  FiFilter,
  FiPlus
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Pagination from "../layout/Pagination";
import { format } from "date-fns";

const ManageBooking = ({
  data,
  loading,
  filters,
  setFilters,
  pagination,
  onPageChange,
  onCheckIn,
  onEdit,
  onCancel,
  onNewBooking,
}: any) => {
  const [viewType, setViewType] = useState<"Individual" | "Corporate">(
    "Individual",
  );
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return { bg: "bg-green-500", text: "text-white", shadow: "shadow-green-100" };
      case "Checked-In":
        return { bg: "bg-orange-500", text: "text-white", shadow: "shadow-orange-100" };
      case "Checked-Out":
        return { bg: "bg-blue-500", text: "text-white", shadow: "shadow-blue-100" };
      case "Cancelled":
        return { bg: "bg-red-500", text: "text-white", shadow: "shadow-red-100" };
      case "No-Show":
        return { bg: "bg-gray-500", text: "text-white", shadow: "shadow-gray-100" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", shadow: "" };
    }
  };

  // Payment status badge
  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "Paid":
        return { bg: "bg-green-100", text: "text-green-700", icon: FiCheckCircle };
      case "Partial":
        return { bg: "bg-yellow-100", text: "text-yellow-700", icon: FiClock };
      case "Pending":
        return { bg: "bg-gray-100", text: "text-gray-500", icon: FiClock };
      case "Refunded":
        return { bg: "bg-blue-100", text: "text-blue-700", icon: FiXCircle };
      default:
        return { bg: "bg-gray-100", text: "text-gray-500", icon: FiClock };
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
      {/* --- TOP FILTERS SECTION --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm 3xl:p-6 3xl:rounded-2xl 4xl:p-8 5xl:p-10 5xl:rounded-[20px]">
        <div className="flex items-center gap-3 w-full 3xl:gap-5 4xl:gap-8 5xl:gap-10">
          
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-gray-100 rounded-lg w-fit 3xl:p-1.5 3xl:rounded-xl 4xl:p-2.5 5xl:p-3 5xl:rounded-[14px] shrink-0">
            <button
              onClick={() => {
                setViewType("Individual");
                setFilters({ ...filters, bookingType: "Individual" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all 3xl:px-6 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 4xl:px-10 4xl:py-4.5 4xl:text-lg 5xl:px-12 5xl:py-5.5 5xl:text-xl 5xl:rounded-[10px] ${viewType === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiUser size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Individual
            </button>
            <button
              onClick={() => {
                setViewType("Corporate");
                setFilters({ ...filters, bookingType: "Corporate" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all 3xl:px-6 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 4xl:px-10 4xl:py-4.5 4xl:text-lg 5xl:px-12 5xl:py-5.5 5xl:text-xl 5xl:rounded-[10px] ${viewType === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiBriefcase size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Corporate
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 3xl:left-5 3xl:scale-125 4xl:scale-[2.2] 4xl:left-8 5xl:scale-[2.8] 5xl:left-10"
              size={14}
            />
            <input
              type="text"
              placeholder={`Search by name, phone, booking ID...`}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-xs font-medium text-gray-700 3xl:pl-14 3xl:pr-6 3xl:py-3.5 3xl:text-sm 3xl:rounded-2xl 4xl:pl-20 4xl:pr-10 4xl:py-5 4xl:text-lg 4xl:rounded-2xl 5xl:pl-24 5xl:pr-12 5xl:py-6 5xl:text-xl 5xl:rounded-[20px]"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Filter Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 3xl:p-3.5 3xl:rounded-2xl 4xl:p-5 4xl:rounded-2xl 5xl:p-6 5xl:rounded-[20px] ${
                showFilters || filters.status || filters.startDate || filters.endDate
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <FiFilter size={16} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[2.2]" />
            </button>
            
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-[300px] bg-white border border-gray-100 shadow-xl rounded-2xl z-50 p-4 flex flex-col gap-4 3xl:w-[380px] 3xl:p-6 3xl:rounded-3xl 4xl:w-[480px] 4xl:p-8 4xl:gap-6 5xl:w-[600px] 5xl:p-10">
                <div className="flex flex-col gap-1.5 3xl:gap-2 4xl:gap-3 5xl:gap-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider 3xl:text-xs 4xl:text-sm 5xl:text-base">Date Range</span>
                  <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 3xl:p-3 3xl:rounded-2xl 4xl:p-4 5xl:p-5">
                    <div className="flex items-center px-2 gap-1 3xl:gap-2 4xl:gap-3 border-r border-gray-200 flex-1">
                      <FiCalendar size={12} className="text-orange-500 3xl:scale-125 4xl:scale-[1.5] 5xl:scale-[2]" />
                      <DatePicker
                        selected={filters.startDate}
                        onChange={(date: any) => setFilters({ ...filters, startDate: date })}
                        placeholderText="From"
                        isClearable
                        className="bg-transparent outline-none text-[10px] font-bold w-full 3xl:text-xs 4xl:text-base 5xl:text-lg"
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    <div className="flex items-center px-2 gap-1 3xl:gap-2 4xl:gap-3 flex-1">
                      <DatePicker
                        selected={filters.endDate}
                        onChange={(date: any) => setFilters({ ...filters, endDate: date })}
                        placeholderText="To"
                        isClearable
                        className="bg-transparent outline-none text-[10px] font-bold w-full 3xl:text-xs 4xl:text-base 5xl:text-lg"
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 3xl:gap-2 4xl:gap-3 5xl:gap-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider 3xl:text-xs 4xl:text-sm 5xl:text-base">Status</span>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-gray-700 3xl:px-4 3xl:py-3.5 3xl:text-sm 3xl:rounded-2xl 4xl:px-6 4xl:py-5 4xl:text-lg 5xl:px-8 5xl:py-6 5xl:text-xl"
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked-In">Checked-In</option>
                    <option value="Checked-Out">Checked-Out</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* New Booking Button */}
          <button
            onClick={onNewBooking}
            className="shrink-0 h-[2.5rem] px-5 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95 3xl:h-[3.5rem] 3xl:px-8 3xl:text-base 3xl:rounded-2xl 4xl:h-[4.4rem] 4xl:px-10 4xl:text-lg 5xl:h-[5.2rem] 5xl:px-12 5xl:text-xl 5xl:rounded-[20px]"
          >
            <FiPlus className="3xl:scale-125 4xl:scale-[1.5] 5xl:scale-[2]" /> <span className="hidden md:inline">New Booking</span>
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full 3xl:rounded-2xl 5xl:rounded-[20px]">
        {/* Table Header */}
        <div className="flex items-center bg-gray-50/70 border-b border-gray-100 px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest min-w-[1050px] lg:min-w-0 3xl:px-8 3xl:py-6 3xl:text-xs 3xl:tracking-wider 4xl:px-12 4xl:py-10 4xl:text-base 4xl:tracking-wide 5xl:px-16 5xl:py-14 5xl:text-lg">
          <div className="flex-[0.8]">Booking ID</div>
          <div className="flex-1 text-left leading-tight">Guest Name <br/> <span className="opacity-70">Mobile No.</span></div>
          <div className="flex-1 text-center leading-tight">Check-In <br/> <span className="opacity-70">Check-Out</span></div>
          <div className="flex-[0.5] text-center">Nights</div>
          <div className="flex-1 text-center leading-tight">Room Type <br/> <span className="opacity-70">Rooms</span></div>
          <div className="flex-[0.6] text-center">Source</div>
          <div className="flex-[0.8] text-center leading-tight">Adv. Paid <br/> <span className="opacity-70">Total Amount</span></div>
          <div className="flex-[0.8] text-center">Status</div>
          <div className="flex-[0.6] text-center">Held Till</div>
          <div className="text-center flex-1 3xl:w-44 4xl:w-72 5xl:w-[360px]">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center 3xl:p-16 4xl:p-24 5xl:p-36">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto 3xl:w-12 3xl:h-12 4xl:w-20 4xl:h-20 5xl:w-28 5xl:h-28"></div>
              <p className="mt-2 text-xs text-gray-400 font-bold 3xl:text-sm 3xl:mt-4 4xl:text-lg 5xl:text-xl">Loading bookings...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold text-sm 3xl:p-16 3xl:text-base 4xl:p-24 4xl:text-xl 5xl:p-36 5xl:text-2xl">
              No bookings found
            </div>
          ) : (
            data.map((item: any) => {
              const statusBadge = getStatusBadge(item.status);
              const paymentBadge = getPaymentStatusBadge(item.paymentStatus || "Pending");
              const PaymentIcon = paymentBadge.icon;
              const guestName = item.bookingContact?.name || item.customerId?.name || "Guest";
              const guestPhone = item.bookingContact?.mobile || item.customerId?.phone || "";
              const grandTotal = item.pricingSummary?.grandTotal || 0;
              const paidAmount = item.pricingSummary?.paidAmount || 0;

              return (
                <div
                  key={item._id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50/50 transition-all min-w-[1050px] lg:min-w-0 3xl:px-8 3xl:py-6 4xl:px-12 4xl:py-10 5xl:px-16 5xl:py-14"
                >
                  {/* Booking ID */}
                  <div className="flex-[0.8]">
                    <span className={`font-bold text-xs 3xl:text-base 4xl:text-xl 5xl:text-2xl ${viewType === "Corporate" ? "text-blue-600" : "text-orange-500"}`}>
                      {item.bookingId}
                    </span>
                  </div>

                  {/* Guest Name / Mobile No. */}
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-800 3xl:text-lg 4xl:text-2xl 5xl:text-3xl">{guestName}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 3xl:text-sm 3xl:gap-2 4xl:text-lg 4xl:gap-3 5xl:text-xl 5xl:gap-4">
                      <FiPhone size={8} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                      {guestPhone}
                    </div>
                    {viewType === "Corporate" && item.corporateDetails?.companyName && (
                      <p className="text-[9px] text-blue-600 font-bold 3xl:text-xs 4xl:text-sm 5xl:text-base">{item.corporateDetails.companyName}</p>
                    )}
                  </div>

                  {/* Check-In / Check-Out */}
                  <div className="flex-1 text-center flex flex-col items-center">
                    <p className="text-xs font-bold text-gray-700 3xl:text-base 4xl:text-xl 5xl:text-2xl">
                      {item.overallCheckInDate || item.rooms?.[0]?.checkInDate ? format(new Date(item.overallCheckInDate || item.rooms?.[0]?.checkInDate), "dd MMM yyyy") : "TBD"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 3xl:text-xs 4xl:text-sm 5xl:text-base">
                      {item.overallCheckOutDate || item.rooms?.[0]?.checkOutDate ? format(new Date(item.overallCheckOutDate || item.rooms?.[0]?.checkOutDate), "dd MMM yyyy") : "TBD"}
                    </p>
                  </div>

                  {/* Nights */}
                  <div className="flex-[0.5] text-center">
                    <p className="text-sm font-bold text-gray-700 3xl:text-lg 4xl:text-2xl 5xl:text-3xl">{item.totalNights || 1}</p>
                  </div>

                  {/* Room Type / Rooms */}
                  <div className="flex-1 text-center flex flex-col items-center">
                    <span className="text-[11px] font-bold text-gray-800 3xl:text-sm 4xl:text-lg 5xl:text-xl truncate w-full px-2">
                      {item.rooms?.[0]?.roomType?.name || item.bookingCategory || "Room"}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold mt-0.5 3xl:text-xs 3xl:mt-1 4xl:text-sm 5xl:text-base">
                      {item.totalRooms || item.rooms?.length || 0} Room(s)
                    </span>
                  </div>

                  {/* Source */}
                  <div className="flex-[0.6] text-center">
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold 3xl:text-sm 4xl:text-lg 5xl:text-xl">
                      {item.source || "Walk-In"}
                    </span>
                  </div>

                  {/* Advance Paid / Total Amount */}
                  <div className="flex-[0.8] text-center flex flex-col items-center">
                    <span className="text-xs font-bold text-green-600 3xl:text-base 4xl:text-xl 5xl:text-2xl">
                      ₹{(item.advanceAmount || item.pricingSummary?.paidAmount || 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 3xl:text-xs 4xl:text-sm 5xl:text-base border-t border-gray-100 mt-0.5 pt-0.5 w-16 text-center">
                      ₹{(grandTotal).toLocaleString()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex-[0.8] text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase 3xl:text-sm 3xl:px-4 3xl:py-1.5 4xl:text-base 4xl:px-6 4xl:py-2 5xl:text-lg 5xl:px-8 5xl:py-3 ${statusBadge.bg} ${statusBadge.text}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Held Till */}
                  <div className="flex-[0.6] text-center">
                    <span className="text-sm font-bold text-gray-400 3xl:text-lg 4xl:text-xl 5xl:text-2xl">—</span>
                  </div>

                  {/* Actions */}
                  <div className="flex-1 flex items-center justify-center gap-1.5 3xl:w-44 3xl:gap-2.5 4xl:w-72 4xl:gap-4 5xl:w-[360px] 5xl:gap-5">
                    <button
                      onClick={() => onCheckIn(item)}
                      title="Check-in"
                      className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-all 3xl:p-2.5 3xl:rounded-xl 4xl:p-4 5xl:p-5"
                    >
                      <FiLogIn size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                    </button>
                    
                    <button
                      title="Print"
                      className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-all 3xl:p-2.5 3xl:rounded-xl 4xl:p-4 5xl:p-5"
                    >
                      <FiPrinter size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                    </button>

                    <button
                      title="WhatsApp"
                      className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all 3xl:p-2.5 3xl:rounded-xl 4xl:p-4 5xl:p-5"
                    >
                      <FaWhatsapp size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                    </button>

                    <button
                      title="View"
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all 3xl:p-2.5 3xl:rounded-xl 4xl:p-4 5xl:p-5"
                    >
                      <FiEye size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                    </button>

                    <div className="relative">
                      <button
                        title="More Options"
                        onClick={(e) => {
                           e.stopPropagation();
                           setActiveDropdown(activeDropdown === item._id ? null : item._id);
                        }}
                        className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-lg transition-all 3xl:p-2.5 3xl:rounded-xl 4xl:p-4 5xl:p-5"
                      >
                        <FiMoreVertical size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                      </button>

                      {activeDropdown === item._id && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-100 shadow-lg rounded-xl z-50 overflow-hidden flex flex-col 3xl:w-36 3xl:mt-2 4xl:w-48 4xl:mt-3 5xl:w-60 5xl:mt-4">
                          <button
                            onClick={() => { setActiveDropdown(null); onEdit(item); }}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors w-full text-left 3xl:px-4 3xl:py-3 3xl:text-sm 4xl:px-5 4xl:py-4 4xl:text-lg 4xl:gap-3 5xl:px-6 5xl:py-5 5xl:text-xl 5xl:gap-4"
                          >
                            <FiEdit2 size={10} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Edit
                          </button>
                          <button
                            onClick={() => { setActiveDropdown(null); onCancel(item); }}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left 3xl:px-4 3xl:py-3 3xl:text-sm 4xl:px-5 4xl:py-4 4xl:text-lg 4xl:gap-3 5xl:px-6 5xl:py-5 5xl:text-xl 5xl:gap-4 border-t border-gray-50"
                          >
                            <FiX size={10} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default ManageBooking;