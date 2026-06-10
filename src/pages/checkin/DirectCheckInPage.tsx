import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/axios";
import CheckInForm from "../../components/checkinComp/CheckinForm";

const DirectCheckInPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (bookingId) {
        setLoading(true);
        try {
          const res = await api.get(`/bookings/${bookingId}`);
          setBookingData(res.data.data.booking || res.data.data);
        } catch (error) {
          console.error("Error fetching booking for check-in:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setBookingData(null);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading booking data...</div>;
  }

  return (
    <div className="p-4 sm:p-8 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <CheckInForm key={bookingData?._id || 'new'} inline={true} bookingData={bookingData} />
      </div>
    </div>
  );
};

export default DirectCheckInPage;
