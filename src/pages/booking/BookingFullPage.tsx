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
 <div className="w-full flex flex-col gap-4 p-8 min-h-screen bg-[#F8F9FA] scroll-smooth ">
 <section className="w-full flex flex-col gap-4 mt-2">
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
 onNewBooking={() => {
 setBookingKey(prev => prev + 1);
 setShowPopup(true);
 }}
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
