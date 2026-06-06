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
} from "react-icons/fi";
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
}: any) => {
  const [viewType, setViewType] = useState<"Individual" | "Corporate">(
    "Individual",
  );

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 3xl:gap-8 4xl:gap-12 5xl:gap-16">
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-gray-100 rounded-lg w-full lg:w-fit 3xl:p-1.5 3xl:rounded-xl 4xl:p-2.5 5xl:p-3 5xl:rounded-[14px]">
            <button
              onClick={() => {
                setViewType("Individual");
                setFilters({ ...filters, bookingType: "Individual" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 lg:flex-initial 3xl:px-6 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 4xl:px-10 4xl:py-4.5 4xl:text-lg 5xl:px-12 5xl:py-5.5 5xl:text-xl 5xl:rounded-[10px] ${viewType === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiUser size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Individual
            </button>
            <button
              onClick={() => {
                setViewType("Corporate");
                setFilters({ ...filters, bookingType: "Corporate" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 lg:flex-initial 3xl:px-6 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 4xl:px-10 4xl:py-4.5 4xl:text-lg 5xl:px-12 5xl:py-5.5 5xl:text-xl 5xl:rounded-[10px] ${viewType === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiBriefcase size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" /> Corporate
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:flex-1 lg:min-w-[200px] 3xl:min-w-[300px] 4xl:min-w-[400px] 5xl:min-w-[500px]">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 3xl:left-5 3xl:scale-125 4xl:scale-[2.2] 4xl:left-8 5xl:scale-[2.8] 5xl:left-10"
              size={14}
            />
            <input
              type="text"
              placeholder={`Search by name, phone, booking ID...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-xs 3xl:pl-14 3xl:pr-6 3xl:py-3.5 3xl:text-sm 3xl:rounded-2xl 4xl:pl-20 4xl:pr-10 4xl:py-5.5 4xl:text-lg 4xl:rounded-2xl 5xl:pl-24 5xl:pr-12 5xl:py-7 5xl:text-xl 5xl:rounded-[20px]"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center justify-between lg:justify-start gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full lg:w-auto 3xl:p-2.5 3xl:rounded-2xl 3xl:gap-4 4xl:p-4.5 4xl:gap-6 4xl:rounded-2xl 5xl:p-6 5xl:gap-8 5xl:rounded-[20px]">
            <div className="flex items-center px-2 gap-1 border-r border-gray-200 3xl:px-4 3xl:gap-2 4xl:px-6 4xl:gap-4 5xl:px-8 5xl:gap-5">
              <FiCalendar size={12} className="text-orange-500 3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
              <DatePicker
                selected={filters.startDate}
                onChange={(date: any) => setFilters({ ...filters, startDate: date })}
                placeholderText="From"
                isClearable
                className="bg-transparent outline-none text-[10px] font-bold w-20 3xl:text-xs 3xl:w-28 4xl:text-base 4xl:w-44 5xl:text-lg 5xl:w-56"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="flex items-center px-2 gap-1 3xl:px-4 3xl:gap-2 4xl:px-6 4xl:gap-4 5xl:px-8 5xl:gap-5">
              <DatePicker
                selected={filters.endDate}
                onChange={(date: any) => setFilters({ ...filters, endDate: date })}
                placeholderText="To"
                isClearable
                className="bg-transparent outline-none text-[10px] font-bold w-20 3xl:text-xs 3xl:w-28 4xl:text-base 4xl:w-44 5xl:text-lg 5xl:w-56"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-gray-50 border border-transparent rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-gray-500 w-full lg:w-auto 3xl:px-5 3xl:py-3.5 3xl:text-xs 3xl:rounded-2xl 4xl:px-8 4xl:py-5.5 4xl:text-base 4xl:rounded-2xl 5xl:px-10 5xl:py-7 5xl:text-lg 5xl:rounded-[20px]"
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

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full 3xl:rounded-2xl 5xl:rounded-[20px]">
        {/* Table Header */}
        <div className="flex items-center bg-gray-50/70 border-b border-gray-100 px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest min-w-[950px] lg:min-w-0 3xl:px-8 3xl:py-6 3xl:text-xs 3xl:tracking-wider 4xl:px-12 4xl:py-10 4xl:text-base 4xl:tracking-wide 5xl:px-16 5xl:py-14 5xl:text-lg">
          <div className="flex-[0.7]">Booking ID</div>
          <div className="flex-1 text-left">Guest / Company</div>
          <div className="flex-1 text-center">Rooms</div>
          <div className="flex-1 text-center">Dates</div>
          <div className="flex-1 text-center">Status</div>
          <div className="flex-1 text-center">Payment</div>
          <div className="flex-[0.8] text-center">Total</div>
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
                  className="flex items-center px-4 py-3 hover:bg-gray-50/50 transition-all min-w-[950px] lg:min-w-0 3xl:px-8 3xl:py-6 4xl:px-12 4xl:py-10 5xl:px-16 5xl:py-14"
                >
                  {/* Booking ID */}
                  <div className="flex-[0.7]">
                    <span className={`font-bold text-xs 3xl:text-base 4xl:text-xl 5xl:text-2xl ${viewType === "Corporate" ? "text-blue-600" : "text-orange-500"}`}>
                      {item.bookingId}
                    </span>
                    <p className="text-[9px] text-gray-400 font-medium 3xl:text-xs 4xl:text-base 5xl:text-lg">{item.source}</p>
                  </div>

                  {/* Guest / Company */}
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

                  {/* Rooms */}
                  <div className="flex-1 text-center">
                    <div className="flex flex-wrap justify-center gap-1 3xl:gap-2 4xl:gap-3 5xl:gap-4">
                      {item.rooms?.slice(0, 3).map((room: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold 3xl:text-sm 3xl:px-4 3xl:py-1.5 3xl:rounded-lg 4xl:text-lg 4xl:px-6 4xl:py-2.5 4xl:rounded-xl 5xl:text-xl 5xl:px-8 5xl:py-3.5 5xl:rounded-[14px]">
                          {room.roomId?.roomNumber || room.roomType?.name || room.roomType || "TBD"}
                        </span>
                      ))}
                      {item.rooms?.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold 3xl:text-sm 3xl:px-4 3xl:py-1.5 3xl:rounded-lg 4xl:text-lg 4xl:px-6 4xl:py-2.5 4xl:rounded-xl 5xl:text-xl 5xl:px-8 5xl:py-3.5 5xl:rounded-[14px]">
                          +{item.rooms.length - 3}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 3xl:text-xs 3xl:mt-1.5 4xl:text-base 5xl:text-lg 5xl:mt-2">
                      {item.totalRooms || item.rooms?.length || 0} room(s) • {item.totalGuests || 0} guest(s)
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="flex-1 text-center">
                    <p className="text-xs font-bold text-gray-700 3xl:text-base 4xl:text-xl 5xl:text-2xl">
                      {format(new Date(item.overallCheckInDate || item.rooms?.[0]?.checkInDate), "dd MMM")}
                      {" - "}
                      {format(new Date(item.overallCheckOutDate || item.rooms?.[0]?.checkOutDate), "dd MMM")}
                    </p>
                    <p className="text-[9px] text-gray-400 3xl:text-xs 4xl:text-sm 5xl:text-lg">
                      {item.totalNights || 1} night(s)
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-1 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase 3xl:text-base  3xl:px-5 3xl:py-2 4xl:text-lg 4xl:px-8 4xl:py-3.5 5xl:text-xl 5xl:px-10 5xl:py-4.5 ${statusBadge.bg} ${statusBadge.text}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Payment Status */}
                  <div className="flex-1 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold 3xl:text-xs 3xl:px-4 3xl:py-2 3xl:gap-2 4xl:text-base 4xl:px-7 4xl:py-3 4xl:gap-3 5xl:text-lg 5xl:px-9 5xl:py-4 5xl:gap-4 ${paymentBadge.bg} ${paymentBadge.text}`}>
                      <PaymentIcon size={10} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                      {item.paymentStatus || "Pending"}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 3xl:text-xs 3xl:mt-1.5 4xl:text-sm 5xl:text-base 5xl:mt-2">
                      ₹{paidAmount.toLocaleString()} paid
                    </p>
                  </div>

                  {/* Total */}
                  <div className="flex-[0.8] text-center">
                    <span className="font-black text-gray-800 text-sm 3xl:text-lg 4xl:text-2xl 5xl:text-3xl">₹{grandTotal.toLocaleString()}</span>
                    {paidAmount > 0 && paidAmount < grandTotal && (
                      <p className="text-[9px] text-red-500 font-bold 3xl:text-xs 4xl:text-sm 5xl:text-base">
                        Due: ₹{(grandTotal - paidAmount).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 flex items-center justify-center gap-1 3xl:w-44 3xl:gap-2 4xl:w-72 4xl:gap-3.5 5xl:w-[360px] 5xl:gap-4.5">
                    {item.status === "Confirmed" || item.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          title="Edit Booking"
                          className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all 3xl:p-3 3xl:rounded-xl 4xl:p-5 5xl:p-6.5"
                        >
                          <FiEdit2 size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                        </button>
                        <button
                          onClick={() => onCancel(item)}
                          title="Cancel Booking"
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all 3xl:p-3 3xl:rounded-xl 4xl:p-5 5xl:p-6.5"
                        >
                          <FiX size={12} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                        </button>
                        <button
                          onClick={() => onCheckIn(item)}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-[9px] font-bold 3xl:px-4 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 3xl:gap-2 4xl:px-7 4xl:py-4.5 4xl:text-lg 4xl:gap-3 5xl:px-9 5xl:py-5.5 5xl:text-xl 5xl:gap-4 5xl:rounded-2xl"
                        >
                          <FiLogIn size={10} className="3xl:scale-150 4xl:scale-[2.2] 5xl:scale-[2.8]" />
                          Check-in
                        </button>
                      </>
                    ) : item.status === "Checked-In" ? (
                      <span className="px-2.5 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-bold 3xl:px-4.5 3xl:py-2.5 3xl:text-sm 3xl:rounded-xl 4xl:px-7.5 4xl:py-4.5 4xl:text-lg 5xl:px-10 5xl:py-5.5 5xl:text-xl 5xl:rounded-2xl">
                        In House
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-bold 3xl:text-sm 4xl:text-lg 5xl:text-xl">{item.status}</span>
                    )}
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