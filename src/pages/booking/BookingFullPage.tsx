import { useState, useEffect, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import api from "../../lib/axios";
import CreateBooking from "../../components/bookingComp/CreateBooking";
import ManageBooking from "../../components/bookingComp/ManageBooking";
import BookingOverview from "../../components/bookingComp/BookingOverview";
import CheckInForm from "../../components/checkinComp/CheckinForm";
import EditBookingModal from "../../components/bookingComp/EditBookingModal";
import CancelBookingModal from "../../components/bookingComp/CancelBookingModal";

const BookingFullPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [bookingKey, setBookingKey] = useState(0);

  // Data States
  const [bookings, setBookings] = useState([]);
  // const [overviewData, setOverviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Edit & Cancel State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Pagination & Filters
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    bookingType: "",
    source: "",
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
    <div className="flex flex-col gap-4 p-8 min-h-screen bg-[#F8F9FA] scroll-smooth">
      {/* Header (Sticky thakle bhalo hoy) */}
      <div className="sticky top-0 z-50 bg-[#F8F9FA]/80 backdrop-blur-md py-4 flex flex-row justify-between items-center border-b border-gray-100">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            Hotel Reservations
          </h1>
          <p className="text-xs text-gray-500 font-bold">
            Overview & Booking Management
          </p>
        </div>
        <button
          onClick={() => {
            setBookingKey(prev => prev + 1);
            setShowPopup(true);
          }}
          className="h-[2.8rem] px-6 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95"
        >
          <FaPlus /> New Booking
        </button>
      </div>

      <section className="flex flex-col gap-4">
        <BookingOverview />
      </section>

      <section className="flex flex-col gap-4">
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
        <EditBookingModal
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
