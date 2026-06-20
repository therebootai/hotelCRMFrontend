import { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiHome,
  FiEdit2,
  FiRefreshCw,
  FiChevronRight,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import api from "../../lib/axios";
import Pagination from "../../components/layout/Pagination";
import { useQueryParams } from "../../hooks/useQueryParams";
import { FaEye } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import ExtendStayModal from "../../components/checkinComp/ExtendStayModal";
import CheckoutModal from "../../components/checkinComp/CheckoutModal";
import ViewCheckin from "../../components/checkinComp/ViewCheckin";
import CheckinForm from "../../components/checkinComp/CheckinForm";

const CheckInFullPage = () => {
  const { getParam, setMultipleParams } = useQueryParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [bookingData, setBookingData] = useState<any>(null);

  const isMounted = useRef(false);

  // URL-driven string filters
  const activeTab =
    (getParam("tab") as "Individual" | "Corporate") ?? "Individual";
  const activeCategory = getParam("category") ?? "Room Stay";
  const urlSearch = getParam("search") ?? "";
  const urlStatus = getParam("status") ?? "";
  const urlRoomType = getParam("roomType") ?? "";
  const urlDateType = getParam("dateType") ?? "checkIn";
  const urlPage = Number(getParam("page") ?? "1");

  const [loading, setLoading] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [stats, setStats] = useState({
    todayCheckins: 0,
    activeGuests: 0,
    expectedCheckouts: 0,
  });

  // Filters State — dates stay in local state; string fields initialized from URL
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    search: urlSearch,
    roomType: urlRoomType,
    dateType: urlDateType,
    status: urlStatus,
    page: urlPage,
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

  // View & Edit Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCheckInData, setViewCheckInData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editCheckInData, setEditCheckInData] = useState<any>(null);

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
        bookingCategory: activeCategory,
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

  // Sync string filters to URL whenever they change (skip on initial mount)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setMultipleParams(
      {
        tab: activeTab === "Individual" ? "" : activeTab,
        search: filters.search,
        status: filters.status,
        roomType: filters.roomType,
        dateType: filters.dateType === "checkIn" ? "" : filters.dateType,
        page: filters.page === 1 ? "" : String(filters.page),
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    filters.search,
    filters.status,
    filters.roomType,
    filters.dateType,
    filters.page,
  ]);

  useEffect(() => {
    fetchCheckins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    activeCategory,
    filters.page,
    filters.startDate,
    filters.endDate,
    filters.roomType,
    filters.status,
  ]);

  useEffect(() => {
    if (bookingId) {
      api
        .get(`/bookings/${bookingId}`)
        .then((res) => setBookingData(res.data.data.booking || res.data.data))
        .catch((err) => console.error("Error fetching booking", err));
    } else {
      setBookingData(null);
    }
  }, [bookingId]);

  if (bookingId) {
    if (!bookingData) {
      return (
        <div className="p-8 text-center text-gray-500">
          Loading booking data...
        </div>
      );
    }
    return (
      <div className="bg-[#F8F9FA] min-h-screen w-full">
        <CheckinForm
          key={bookingData._id}
          inline={true}
          bookingData={bookingData}
          onClose={() => {
            setSearchParams({});
          }}
          onSuccess={() => {
            setSearchParams({});
            fetchCheckins();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen ">
      {/* Header & Stats Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase ">
            Front Desk
          </h1>
          <p className="text-base text-gray-400 font-bold uppercase tracking-widest mt-1 ">
            Live Guest Occupancy
          </p>
        </div>

        <div className="flex gap-4 ">
          <div className="bg-white p-4 px-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 ">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl ">
              <FiUser size={20} className=" " />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase ">
                Today's Check-ins
              </p>
              <p className="text-xl font-black text-gray-800 ">
                {stats.todayCheckins}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 px-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 ">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl ">
              <FiHome size={20} className=" " />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase ">
                Active Stays
              </p>
              <p className="text-xl font-black text-gray-800 ">
                {stats.activeGuests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center gap-4 ">
        {/* 1. Toggle Individual/Corporate */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit ">
          <button
            onClick={() =>
              setMultipleParams({ tab: "", page: "" }, { replace: true })
            }
            className={`px-6 py-2 rounded-xl text-[10px] 3xl:text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
          >
            Individual
          </button>
          <button
            onClick={() =>
              setMultipleParams(
                { tab: "Corporate", page: "" },
                { replace: true },
              )
            }
            className={`px-6 py-2 rounded-xl text-[10px] 3xl:text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
          >
            Corporate
          </button>
        </div>

        {/* 2. Global Search */}
        <div className="relative min-w-50 flex-1 ">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 "
            size={16}
          />
          <input
            type="text"
            placeholder="Name, Mobile, Company..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-orange-500 font-bold text-sm "
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* 3. Date Type Selector (Check-in vs Checkout Filter) */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500 "
          value={filters.dateType}
          onChange={(e) => setFilters({ ...filters, dateType: e.target.value })}
        >
          <option value="checkIn">By Check-in Date</option>
          <option value="expectedCheckout">By Expected Checkout</option>
          <option value="actualCheckout">By Actual Checkout</option>
          <option value="anyCheckout">By Any Checkout</option>
        </select>

        {/* 4. Date Range Picker */}
        <div className="flex items-center bg-gray-50 border border-transparent rounded-2xl px-4 py-2 ">
          <FiCalendar className="text-gray-400 mr-2 " size={14} />
          <DatePicker
            selected={filters.startDate}
            onChange={(date: Date | null) =>
              setFilters({ ...filters, startDate: date })
            }
            placeholderText="Start"
            className="bg-transparent outline-none text-[10px] font-black w-20 uppercase "
            isClearable
          />
          <FiChevronRight className="text-gray-300 mx-1 " size={12} />
          <DatePicker
            selected={filters.endDate}
            onChange={(date: Date | null) =>
              setFilters({ ...filters, endDate: date })
            }
            placeholderText="End"
            className="bg-transparent outline-none text-[10px] font-black w-20 uppercase "
            isClearable
          />
        </div>

        {/* 5. Status Filter */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500 "
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Checked-Out">Checked-Out</option>
          <option value="Shifted">Shifted</option>
        </select>

        {/* 6. Room Type Filter */}
        <select
          className="p-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-black text-[10px] uppercase tracking-wider text-gray-500 "
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
            className="p-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-md shadow-orange-100 "
            title="Apply Filters"
          >
            <FiRefreshCw size={18} className=" " />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full ">
        <table className="w-full text-left border-collapse min-w-300 lg:min-w-0">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap ">
                Check-In ID
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap ">
                Guest / Company
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap ">
                Room(s)
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap ">
                Check-in Date
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap ">
                Expected Checkout
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap text-center ">
                Stay Duration
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap text-right ">
                Total Amount
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap text-right ">
                Paid
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap text-right ">
                Due
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600 whitespace-nowrap text-center ">
                Status
              </th>
              <th className="p-2 text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-700 uppercase tracking-widest whitespace-nowrap text-center ">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-20 font-bold text-gray-400 "
                >
                  Loading live data...
                </td>
              </tr>
            ) : (
              checkins.map((item: any) => {
                const isDayAccess = item.bookingCategory === "Day Access";
                const typeLabel = isDayAccess
                  ? "DAY ACCESS"
                  : (item.checkInType || "INDIVIDUAL").toUpperCase();
                const totalAmt = item.paymentSummary?.totalAmount || 0;
                const paidAmt = item.paymentSummary?.totalPaid || 0;
                const dueAmt = item.paymentSummary?.dueAmount || 0;

                return (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-all"
                  >
                    <td className="p-2 ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 block">
                        {item.checkInId || "N/A"}
                      </span>
                      <span className="text-[9px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-400 uppercase">
                        {typeLabel}
                      </span>
                    </td>
                    <td className="p-2 ">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <FiUser size={12} />
                        </div>
                        <div>
                          <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 block">
                            {item.checkInType === "Corporate"
                              ? item.corporateCheckInDetails?.companyName
                              : item.guests[0]?.name}
                          </span>
                          <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-500 font-bold block">
                            {item.checkInType === "Corporate"
                              ? item.corporateCheckInDetails?.contactMobile
                              : item.guests[0]?.mobileNo}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 block">
                        {item.roomDetails
                          ?.map((r: any) => r.roomNumber)
                          .join(", ") || (isDayAccess ? "DA-01" : "N/A")}
                      </span>
                      <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-500 font-bold block">
                        {item.roomDetails
                          ?.map((r: any) => r.roomType?.name || "Room")
                          .join(", ") || (isDayAccess ? "Day Access" : "")}
                      </span>
                    </td>
                    <td className="p-2 ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 block">
                        {format(new Date(item.checkInTime), "dd MMM yyyy")}
                      </span>
                      <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-500 font-bold block">
                        {format(new Date(item.checkInTime), "hh:mm a")}
                      </span>
                    </td>
                    <td className="p-2 ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-orange-500 block">
                        {format(
                          new Date(item.expectedCheckOutTime),
                          "dd MMM yyyy",
                        )}
                      </span>
                      <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-orange-400 font-bold block">
                        {format(new Date(item.expectedCheckOutTime), "hh:mm a")}
                      </span>
                    </td>
                    <td className="p-2 text-center ">
                      <span className="text-xs 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 ">
                        {isDayAccess
                          ? "Day Access"
                          : `${Math.max(1, differenceInDays(new Date(item.expectedCheckOutTime), new Date(item.checkInTime)))} Nights`}
                      </span>
                    </td>
                    <td className="p-2 text-right ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800 ">
                        ₹{" "}
                        {totalAmt.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-2 text-right ">
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-green-500 ">
                        ₹{" "}
                        {paidAmt.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-2 text-right ">
                      <span
                        className={`text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold ${dueAmt > 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        ₹{" "}
                        {dueAmt.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-2 text-center ">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[9px] 3xl:text-[14px] 4xl:text-[16px] font-black uppercase ${item.status === "Active" ? (dueAmt > 0 ? "bg-red-50 text-red-500 border border-red-100" : "bg-green-50 text-green-500 border border-green-100") : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                      >
                        {item.status === "Active"
                          ? dueAmt > 0
                            ? "PENDING DUE"
                            : "READY"
                          : item.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1 ">
                        <button
                          onClick={() => {
                            setViewCheckInData(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100 "
                          title="View"
                        >
                          <FaEye className="h-3 w-3 3xl:h-5 3xl:w-5 " />
                        </button>
                        <button
                          onClick={() => {
                            setEditCheckInData(item);
                            setIsEditMode(true);
                          }}
                          disabled={item.status !== "Active"}
                          className={`p-1.5 rounded-lg transition-all border ${
                            item.status === "Active"
                              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100"
                              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                          title="Edit"
                        >
                          <FiEdit2 className="h-3 w-3 3xl:h-5 3xl:w-5 " />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setIsExtendModalOpen(true);
                          }}
                          disabled={item.status !== "Active"}
                          className={`p-1.5 rounded-lg transition-all ${
                            item.status === "Active"
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-gray-50 text-gray-300 cursor-not-allowed"
                          }`}
                          title="Extend"
                        >
                          <FiCalendar className="h-3 w-3 3xl:h-5 3xl:w-5 " />
                        </button>
                        {item.status === "Active" && (
                          <button
                            onClick={() => handleCheckoutClick(item)}
                            className="p-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-100 transition-all "
                            title="Checkout"
                          >
                            <FiChevronRight size={12} className=" " />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Section */}
        <div className="p-2 bg-gray-50/50 border-t border-gray-100 ">
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
        />
      )}

      {isBillingModalOpen && selectedCheckIn && (
        <CheckoutModal
          checkIn={selectedCheckIn}
          onClose={() => setIsBillingModalOpen(false)}
          onSuccess={fetchCheckins}
        />
      )}

      {isViewModalOpen && viewCheckInData && (
        <ViewCheckin
          checkIn={viewCheckInData}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewCheckInData(null);
          }}
        />
      )}

      {isEditMode && editCheckInData && (
        <CheckinForm
          editMode={true}
          existingCheckIn={editCheckInData}
          onClose={() => {
            setIsEditMode(false);
            setEditCheckInData(null);
          }}
          onSuccess={() => {
            setIsEditMode(false);
            setEditCheckInData(null);
            fetchCheckins();
          }}
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
