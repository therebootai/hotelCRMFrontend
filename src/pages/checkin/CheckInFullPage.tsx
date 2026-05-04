import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Filter,
  User,
  Building2,
  MoreVertical,
  Edit3,
  LogOut,
  RefreshCw,
  X,
  Utensils,
  CalendarDays,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import api from "../../lib/axios";
import Pagination from "../../components/layout/Pagination";
import { FaEye } from "react-icons/fa";
import ExtendStayModal from "../../components/checkinComp/ExtendStayModal";
import GenerateBillModal from "../../components/checkinComp/GanerateBillModel";

const CheckInFullPage = () => {
  const [activeTab, setActiveTab] = useState<"Individual" | "Corporate">(
    "Individual",
  );
  const [loading, setLoading] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [stats, setStats] = useState({
    todayCheckins: 0,
    activeGuests: 0,
    expectedCheckouts: 0,
  });

  // Filters State
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    search: "",
    roomType: "",
    dateType: "checkIn",
    status: "",
    page: 1,
    limit: 10,
  });
  const [roomTypes, setRoomTypes] = useState([]);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
  });

const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);

// 2. Checkout Click Handler
const handleCheckoutClick = (item: any) => {
  setSelectedCheckIn(item);
  setIsBillingModalOpen(true);
};

  useEffect(() => {
    const getRoomTypes = async () => {
      try {
        const res = await api.get("/room-types?activeOnly=true"); 
        setRoomTypes(res.data.data || []);
      } catch (err) {
        console.error("Error fetching room types", err);
      }
    };
    getRoomTypes();
  }, []);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        checkInType: activeTab,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        status: filters.status,
      };
      const res = await api.get("/checkin/list", { params });
      setCheckins(res.data.data);
      setPagination(res.data.pagination);
      setStats(res.data.stats);
    } catch (err) {
      console.error("Error fetching checkins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [
    activeTab,
    filters.page,
    filters.startDate,
    filters.endDate,
    filters.roomType,
    filters.status,
  ]);

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen">
      {/* Header & Stats Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            Front Desk
          </h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
            Live Guest Occupancy
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-4 px-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">
                Today's Check-ins
              </p>
              <p className="text-xl font-black text-gray-800">
                {stats.todayCheckins}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 px-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">
                Active Stays
              </p>
              <p className="text-xl font-black text-gray-800">
                {stats.activeGuests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        {/* 1. Toggle Individual/Corporate */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("Individual")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
          >
            Individual
          </button>
          <button
            onClick={() => setActiveTab("Corporate")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
          >
            Corporate
          </button>
        </div>

        {/* 2. Global Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Name, Mobile, Company..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-orange-500 font-bold text-xs"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* 3. Date Type Selector (Check-in vs Checkout Filter) */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500"
          value={filters.dateType}
          onChange={(e) => setFilters({ ...filters, dateType: e.target.value })}
        >
          <option value="checkIn">By Check-in Date</option>
          <option value="expectedCheckout">By Expected Checkout</option>
          <option value="actualCheckout">By Actual Checkout</option>
          <option value="anyCheckout">By Any Checkout</option>
        </select>

        {/* 4. Date Range Picker */}
        <div className="flex items-center bg-gray-50 border border-transparent rounded-2xl px-4 py-2">
          <Calendar className="text-gray-400 mr-2" size={14} />
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            placeholderText="Start"
            className="bg-transparent outline-none text-[10px] font-black w-20 uppercase"
            isClearable
          />
          <ChevronRight className="text-gray-300 mx-1" size={12} />
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            placeholderText="End"
            className="bg-transparent outline-none text-[10px] font-black w-20 uppercase"
            isClearable
          />
        </div>

        {/* 5. Status Filter */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500"
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Checked-Out">Checked-Out</option>
          <option value="Shifted">Shifted</option>
        </select>

        {/* 6. Room Type Filter */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500"
          onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
        >
          <option value="">All Room Types</option>
          {roomTypes.map((type: any) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>

        {/* 7. Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={fetchCheckins}
            className="p-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-md shadow-orange-100"
            title="Apply Filters"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Room No
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Guest Details
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Check-in
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Stay Duration
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Expected Checkout
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Status
              </th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-20 font-bold text-gray-400"
                >
                  Loading live data...
                </td>
              </tr>
            ) : (
              checkins.map((item: any) => (
                <tr
                  key={item._id}
                  className="border-b border-gray-50 hover:bg-gray-50/30 transition-all group"
                >
                  {/* Room Info */}
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-s, font-black text-gray-800 tracking-tighter">
                        {item.roomDetails.map((r: any) => r.roomNumber).join(", ")}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {item.roomDetails[0]?.roomType?.name}
                      </span>
                    </div>
                  </td>

                  {/* Guest/Corporate Details */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                      {activeTab === 'Individual' ? item.guests[0]?.name.charAt(0) : 'C'}
                    </div> */}
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800">
                          {activeTab === "Individual"
                            ? item.guests[0]?.name
                            : item.corporateCheckInDetails?.companyName}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {activeTab === "Individual"
                            ? item.guests[0]?.mobileNo
                            : `${item.roomIds.length} Rooms Allocated`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Check-in Time */}
                  <td className="p-3">
                    <div className="text-sm font-bold text-gray-700">
                      {format(new Date(item.checkInTime), "MMM dd, HH:mm")}
                    </div>
                  </td>

                  {/* Stay Duration - Figma Style */}
                  <td className="p-3">
                    <div className="flex flex-col items-center justify-center border-x border-gray-100 px-4">
                      <span className="text-sm font-black text-gray-800">
                        {Math.max(
                          1,
                          differenceInDays(
                            new Date(item.expectedCheckOutTime),
                            new Date(item.checkInTime),
                          ),
                        )}{" "}
                        Night
                      </span>
                      <span className="text-[10px] font-bold text-orange-400 uppercase italic">
                        Departs{" "}
                        {format(new Date(item.expectedCheckOutTime), "MMM dd")}
                      </span>
                    </div>
                  </td>

                  {/* Expected Checkout */}
                  <td className="p-3">
                    <div className="text-sm font-bold text-gray-700">
                      {format(
                        new Date(item.expectedCheckOutTime),
                        "MMM dd, HH:mm",
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="p-3">
                    <div
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full w-fit ${item.status === "Active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                      ></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {item.status}
                      </span>
                    </div>
                  </td>

                  {/* Actions - Figma Wise */}
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                        title="View Guest Details"
                      >
                        <FaEye />
                      </button>

                      <button
                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                        title="Edit Information"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                        title="Add Food/Amenity"
                      >
                        <Utensils size={16} />
                      </button>
                      <button
                      onClick={() => { setSelectedItem(item); setIsExtendModalOpen(true); }}
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                        title="Extend Stay"
                      >
                        <CalendarDays size={16} />
                      </button>
                      <button onClick={() => handleCheckoutClick(item)} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-md transform active:scale-95 transition-all ml-2">
                        <LogOut size={14} /> Checkout
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Section */}
        <div className="p-3 bg-gray-50/50 border-t border-gray-50">
          <Pagination
            currentPage={filters.page}
            totalPages={pagination.totalPages}
            onPageChange={(p: number) => setFilters({ ...filters, page: p })}
          />
        </div>
      </div>


{isExtendModalOpen && selectedItem && (
  <ExtendStayModal 
    checkIn={selectedItem} 
    onClose={() => setIsExtendModalOpen(false)} 
    onSuccess={fetchCheckins} 
    roomTypes={roomTypes}
  />
)}


{isBillingModalOpen && selectedCheckIn && (
  <GenerateBillModal 
    checkIn={selectedCheckIn} 
    onClose={() => setIsBillingModalOpen(false)} 
    onSuccess={fetchCheckins} // Data refresh hobe checkout shesh hole
  />
)}
    </div>
  );
};



// Difference helper (jodi add kora na thake)
function differenceInDays(dateLeft: Date, dateRight: Date) {
  const diffTime = Math.abs(dateLeft.getTime() - dateRight.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default CheckInFullPage;
