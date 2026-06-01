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
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* --- TOP FILTERS SECTION --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => {
                setViewType("Individual");
                setFilters({ ...filters, bookingType: "Individual" });
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiUser size={12} /> Individual
            </button>
            <button
              onClick={() => {
                setViewType("Corporate");
                setFilters({ ...filters, bookingType: "Corporate" });
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`
              }
            >
              <FiBriefcase size={12} /> Corporate
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder={`Search by name, phone, booking ID...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-xs"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <div className="flex items-center px-2 gap-1 border-r border-gray-200">
              <FiCalendar size={12} className="text-orange-500" />
              <DatePicker
                selected={filters.startDate}
                onChange={(date: any) => setFilters({ ...filters, startDate: date })}
                placeholderText="From"
                isClearable
                className="bg-transparent outline-none text-[10px] font-bold w-20"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="flex items-center px-2 gap-1">
              <DatePicker
                selected={filters.endDate}
                onChange={(date: any) => setFilters({ ...filters, endDate: date })}
                placeholderText="To"
                isClearable
                className="bg-transparent outline-none text-[10px] font-bold w-20"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-gray-50 border border-transparent rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-gray-500"
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center bg-gray-50/70 border-b border-gray-100 px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
          <div className="flex-[0.7]">Booking ID</div>
          <div className="flex-1 text-left">Guest / Company</div>
          <div className="flex-1 text-center">Rooms</div>
          <div className="flex-1 text-center">Dates</div>
          <div className="flex-1 text-center">Status</div>
          <div className="flex-1 text-center">Payment</div>
          <div className="flex-[0.8] text-center">Total</div>
          <div className="w-24 text-center">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-xs text-gray-400 font-bold">Loading bookings...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold text-sm">
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
                  className="flex items-center px-4 py-3 hover:bg-gray-50/50 transition-all"
                >
                  {/* Booking ID */}
                  <div className="flex-[0.7]">
                    <span className={`font-bold text-xs ${viewType === "Corporate" ? "text-blue-600" : "text-orange-500"}`}>
                      {item.bookingId}
                    </span>
                    <p className="text-[9px] text-gray-400 font-medium">{item.source}</p>
                  </div>

                  {/* Guest / Company */}
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-800">{guestName}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <FiPhone size={8} />
                      {guestPhone}
                    </div>
                    {viewType === "Corporate" && item.corporateDetails?.companyName && (
                      <p className="text-[9px] text-blue-600 font-bold">{item.corporateDetails.companyName}</p>
                    )}
                  </div>

                  {/* Rooms */}
                  <div className="flex-1 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {item.rooms?.slice(0, 3).map((room: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold">
                          {room.roomId?.roomNumber || "TBD"}
                        </span>
                      ))}
                      {item.rooms?.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
                          +{item.rooms.length - 3}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {item.totalRooms || item.rooms?.length || 0} room(s) • {item.totalGuests || 0} guest(s)
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="flex-1 text-center">
                    <p className="text-xs font-bold text-gray-700">
                      {format(new Date(item.overallCheckInDate || item.rooms?.[0]?.checkInDate), "dd MMM")}
                      {" - "}
                      {format(new Date(item.overallCheckOutDate || item.rooms?.[0]?.checkOutDate), "dd MMM")}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      {item.totalNights || 1} night(s)
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-1 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusBadge.bg} ${statusBadge.text}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Payment Status */}
                  <div className="flex-1 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${paymentBadge.bg} ${paymentBadge.text}`}>
                      <PaymentIcon size={10} />
                      {item.paymentStatus || "Pending"}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      ₹{paidAmount.toLocaleString()} paid
                    </p>
                  </div>

                  {/* Total */}
                  <div className="flex-[0.8] text-center">
                    <span className="font-black text-gray-800 text-sm">₹{grandTotal.toLocaleString()}</span>
                    {paidAmount > 0 && paidAmount < grandTotal && (
                      <p className="text-[9px] text-red-500 font-bold">
                        Due: ₹{(grandTotal - paidAmount).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-24 flex items-center justify-center gap-1">
                    {item.status === "Confirmed" || item.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          title="Edit Booking"
                          className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all"
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          onClick={() => onCancel(item)}
                          title="Cancel Booking"
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                        >
                          <FiX size={12} />
                        </button>
                        <button
                          onClick={() => onCheckIn(item)}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-[9px] font-bold"
                        >
                          <FiLogIn size={10} />
                          Check-in
                        </button>
                      </>
                    ) : item.status === "Checked-In" ? (
                      <span className="px-2.5 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-bold">
                        In House
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-bold">{item.status}</span>
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