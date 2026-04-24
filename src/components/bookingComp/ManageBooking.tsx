import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Search,
  Calendar,
  Phone,
  User,
  Eye,
  Edit3,
  LogIn,
  Briefcase,
  Building2,
} from "lucide-react";
import Pagination from "../layout/Pagination";
import { format } from "date-fns";

const ManageBooking = ({
  data,
  loading,
  filters,
  setFilters,
  pagination,
  onPageChange,
  onCheckIn
}: any) => {
  const [viewType, setViewType] = useState<"Individual" | "Corporate">(
    "Individual",
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* --- TOP FILTERS SECTION --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Toggle Buttons */}
          <div className="flex p-1.5 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => {
                setViewType("Individual");
                setFilters({ ...filters, bookingType: "Individual" });
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              <User size={14} /> Individual
            </button>
            <button
              onClick={() => {
                setViewType("Corporate");
                setFilters({ ...filters, bookingType: "Corporate" });
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              <Briefcase size={14} /> Corporate
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 ">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={`Search ${viewType} bookings by name or phone...`}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl outline-none transition-all font-medium text-xs"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Date Range with isClearable */}
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <div className="flex items-center px-3 gap-2 border-r border-gray-200">
              <Calendar size={14} className="text-orange-500" />
              <DatePicker
                selected={filters.startDate}
                onChange={(date: any) =>
                  setFilters({ ...filters, startDate: date })
                }
                placeholderText="From Date"
                isClearable
                className="bg-transparent outline-none text-xs font-bold w-24"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="flex items-center px-3 gap-2">
              <DatePicker
                selected={filters.endDate}
                onChange={(date: any) =>
                  setFilters({ ...filters, endDate: date })
                }
                placeholderText="To Date"
                isClearable
                className="bg-transparent outline-none text-xs font-bold w-24"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-5 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-[10px] uppercase tracking-widest text-gray-500"
          >
            <option value="">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Checked-In">Checked-In</option>
          </select>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Dynamic Header */}
        <div className="flex items-center bg-gray-50/50 border-b border-gray-100 px-8 py-5">
          {viewType === "Individual" ? (
            <>
              <div className="flex-[0.8] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Booking ID
              </div>
              <div className="flex-[1.2] text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                Guest Name
              </div>
              <div className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Room No.
              </div>
              <div className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Stay Duration
              </div>
              <div className="flex-[0.7] text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Status
              </div>
              <div className="flex-[1.2] text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Payment
              </div>
            </>
          ) : (
            <>
              <div className="flex-[0.8] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Booking ID
              </div>
              <div className="flex-[1.2] text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                Company & GST
              </div>
              <div className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Liaison Info
              </div>
              <div className="flex-[0.7] text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Total Guest
              </div>
              <div className="flex-[0.8] text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Room Type
              </div>
              <div className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Rate / Status
              </div>
              <div className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Advance
              </div>
            </>
          )}
          <div className="w-[14rem] ml-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
            Actions
          </div>
        </div>

        {/* Dynamic Body */}
        <div className="flex flex-col divide-y divide-gray-50">
          {loading ? (
            <div className="p-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">
              Loading bookings...
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-bold text-sm">
              No records found.
            </div>
          ) : (
            data.map((item: any) => (
              <div
                key={item._id}
                className="flex items-center px-8 py-6 hover:bg-gray-50/80 transition-all group"
              >
                {viewType === "Individual" ? (
                  <>
                    <div className="flex-[0.8] font-black text-orange-500 text-xs uppercase tracking-tighter">
                      #{item.bookingId}
                    </div>
                    <div className="flex-[1.2] flex flex-col">
                      <span className="text-sm font-bold text-gray-800">
                        {item.customerId?.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {item.customerId?.phone}
                      </span>
                    </div>
                    <div className="flex-1 text-center flex flex-col">
                      <span className="text-xs font-bold text-gray-800">
                        Room {item.rooms[0]?.roomId?.roomNumber || "N/A"}
                      </span>
                      <span className="text-[10px] text-orange-500 font-black uppercase">
                        {item.rooms[0]?.roomType?.name}
                      </span>
                    </div>
                    <div className="flex-1 text-center flex flex-col">
                      <span className="text-xs font-bold text-gray-700">
                        {format(new Date(item.rooms[0]?.checkInDate), "dd MMM")}{" "}
                        -{" "}
                        {format(
                          new Date(item.rooms[0]?.checkOutDate),
                          "dd MMM",
                        )}
                      </span>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">
                        {item.rooms[0]?.pricePerNight
                          ? `${format(new Date(item.rooms[0].checkOutDate).getTime() - new Date(item.rooms[0].checkInDate).getTime(), "d")} Nights`
                          : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-[0.8] font-black text-blue-600 text-xs uppercase tracking-tighter">
                      #{item.bookingId}
                    </div>
                    <div className="flex-[1.2] flex flex-col">
                      <span className="text-sm font-bold text-gray-800">
                        {item.corporateDetails?.companyName}
                      </span>
                      <span className="text-[10px] text-blue-500 font-black uppercase">
                        GST: {item.corporateDetails?.gstNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex-1 text-center flex flex-col">
                      <span className="text-xs font-bold text-gray-800">
                        {item.corporateDetails?.contactPerson}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {item.corporateDetails?.mobile}
                      </span>
                    </div>
                    <div className="flex-[0.7] text-center font-bold text-gray-700 text-xs">
                      {item.corporateDetails?.totalGuests}
                    </div>
                    <div className="flex-[0.8] text-center font-black text-blue-600 text-[10px] uppercase">
                      {item.rooms[0]?.roomType?.name || "N/A"}
                    </div>
                    <div className="flex-1 text-center flex flex-col items-center">
                      <span className="text-xs font-black text-gray-800 mb-1">
                        ₹{item.corporateDetails?.negotiatedRate}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex-[0.7] flex justify-center">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.status === "Confirmed"
                        ? "bg-green-500 text-white shadow-md shadow-green-100"
                        : item.status === "Checked-In"
                          ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex-[1.2] text-right flex flex-col">
                  <span className="font-black text-gray-900 text-sm">
                    ₹{item.totalEstimatedAmount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-green-600 font-black uppercase tracking-widest">
                    Adv: ₹{item.advanceAmount}
                  </span>
                </div>

                {/* --- ACTIONS ORDERED --- */}
                <div className="w-[14rem] ml-4 flex items-center justify-center gap-2">
                  <button
                    title="Check-In"
                    onClick={() => onCheckIn(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-sm"
                  >
                    <LogIn size={14} />
                    <span className="text-[9px] font-black uppercase">
                      Check-in
                    </span>
                  </button>
                  <button
                    title="View"
                    className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-900 hover:text-white transition-all"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    title="Edit"
                    className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-900 hover:text-white transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
