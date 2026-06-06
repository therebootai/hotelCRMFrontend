import { useState, useEffect, useCallback, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import api from "../../lib/axios";
import { useQueryParams } from "../../hooks/useQueryParams";
import CreateBooking from "../../components/bookingComp/CreateBooking";
import ManageBooking from "../../components/bookingComp/ManageBooking";
import BookingOverview from "../../components/bookingComp/BookingOverview";
import CheckInForm from "../../components/checkinComp/CheckinForm";
import CancelBookingModal from "../../components/bookingComp/CancelBookingModal";

const BookingFullPage = () => {
  const { getParam, setMultipleParams } = useQueryParams();
  const isMounted = useRef(false);

  const [showPopup, setShowPopup] = useState(false);
  const [bookingKey, setBookingKey] = useState(0);

  // Data States
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Edit & Cancel State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Pagination & Filters — string fields initialized from URL
  const [pagination, setPagination] = useState({
    currentPage: Number(getParam("page") ?? "1"),
    totalPages: 1,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: getParam("search") ?? "",
    status: getParam("status") ?? "",
    bookingType: getParam("bookingType") ?? "",
    source: getParam("source") ?? "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Edit & Cancel Handlers
  const handleOpenEdit = (booking: any) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleOpenCancel = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleOpenCheckIn = (booking: any) => {
  setSelectedBooking(booking);
  setShowCheckIn(true);
};
  // Sync string filters + page to URL whenever they change
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    setMultipleParams({
      search: filters.search,
      status: filters.status,
      bookingType: filters.bookingType,
      source: filters.source,
      page: pagination.currentPage === 1 ? "" : String(pagination.currentPage),
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.bookingType, filters.source, pagination.currentPage]);

  // --- API FETCH LOGIC ---

  // 1. Fetch List Data
  const fetchBookingList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };
      const res = await api.get("/bookings/list", { params });
      setBookings(res.data.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: res.data.pagination.totalPages,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters]);

  // 2. Fetch Overview/Timeline Data
  const fetchOverview = useCallback(async () => {
    try {
      await api.get("/bookings/overview", {
        params: { month: filters.month, year: filters.year },
      });
      // setOverviewData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, [filters.month, filters.year]);

  // Initial and Dependency Load
  useEffect(() => {
    fetchBookingList();
    fetchOverview();
  }, [fetchBookingList, fetchOverview]);

  return (
    <div className="w-full flex flex-col gap-4 p-8 min-h-screen bg-[#F8F9FA] scroll-smooth 3xl:p-12 3xl:gap-6 4xl:p-16 4xl:gap-8 5xl:p-20 5xl:gap-10">
      {/* Header (Sticky thakle bhalo hoy) */}
      <div className="sticky top-0 z-50 bg-[#F8F9FA]/80 backdrop-blur-md py-4 flex flex-row justify-between items-center border-b border-gray-100 3xl:py-6 4xl:py-8 5xl:py-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl">
            Hotel Reservations
          </h1>
          <p className="text-xs text-gray-500 font-bold 3xl:text-sm 4xl:text-base 5xl:text-lg">
            Overview & Booking Management
          </p>
        </div>
        <button
          onClick={() => {
            setBookingKey(prev => prev + 1);
            setShowPopup(true);
          }}
          className="h-[2.8rem] px-6 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95 3xl:h-[3.8rem] 3xl:px-8 3xl:text-base 3xl:rounded-2xl 4xl:h-[4.4rem] 4xl:px-10 4xl:text-lg 5xl:h-[5.2rem] 5xl:px-12 5xl:text-xl 5xl:rounded-[20px] 3xl:gap-3 4xl:gap-4 5xl:gap-5"
        >
          <FaPlus className="3xl:scale-125 4xl:scale-150 5xl:scale-175" /> New Booking
        </button>
      </div>

      <section className="w-full flex flex-col gap-4 3xl:gap-6 4xl:gap-8 5xl:gap-10">
        <BookingOverview />
      </section>

      <section className="w-full flex flex-col gap-4">
        <ManageBooking
          data={bookings}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          pagination={pagination}
          onPageChange={(page: number) =>
            setPagination({ ...pagination, currentPage: page })
          }
          onCheckIn={handleOpenCheckIn}
          onEdit={handleOpenEdit}
          onCancel={handleOpenCancel}
        />
      </section>

      {/* Booking Popup */}
      {showPopup && (
        <CreateBooking
          key={bookingKey}
          onClose={() => {
            setShowPopup(false);
            fetchBookingList();
            fetchOverview();
          }}
          refreshBookings={fetchBookingList}
        />
      )}

      {showCheckIn && (
  <CheckInForm
    bookingData={selectedBooking}
    onClose={() => {
      setShowCheckIn(false);
      fetchBookingList();
    }}
  />
)}

      {showEditModal && selectedBooking && (
        <CreateBooking
          booking={selectedBooking}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBooking(null);
          }}
          refreshBookings={() => {
            setShowEditModal(false);
            setSelectedBooking(null);
            fetchBookingList();
            fetchOverview();
          }}
        />
      )}

      {showCancelModal && selectedBooking && (
        <CancelBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            setShowCancelModal(false);
            setSelectedBooking(null);
            fetchBookingList();
            fetchOverview();
          }}
        />
      )}
    </div>
  );
};

export default BookingFullPage;
