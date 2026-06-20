import {
  FiX,
  FiUser,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiFileText,
  FiCoffee,
} from "react-icons/fi";
import { BiBuilding } from "react-icons/bi";
import { format } from "date-fns";

interface ViewBookingModalProps {
  booking: any;
  onClose: () => void;
}

const ViewBookingModal = ({ booking, onClose }: ViewBookingModalProps) => {
  if (!booking) return null;

  const guestName =
    booking.bookingContact?.name || booking.customerId?.name || booking.customerDetails?.name || "Guest";
  const guestPhone =
    booking.bookingContact?.mobile || booking.customerId?.phone || booking.customerDetails?.phone || "Not Provided";
  const guestEmail =
    booking.bookingContact?.email || booking.customerId?.email || booking.customerDetails?.email || "Not Provided";
  const guestAddress = booking.customerId?.address || "Not Provided";

  const checkInStr = booking.overallCheckInDate ? format(new Date(booking.overallCheckInDate), "dd MMM yyyy") : "N/A";
  const checkOutStr = booking.overallCheckOutDate ? format(new Date(booking.overallCheckOutDate), "dd MMM yyyy") : "N/A";
  const nights = booking.totalNights || 1;

  const advancePaid = booking.pricingSummary?.paidAmount || booking.advanceAmount || 0;
  const grandTotal = booking.pricingSummary?.grandTotal || 0;
  const balanceDue = booking.pricingSummary?.dueAmount ?? (grandTotal - advancePaid);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Tentative":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Checked-In":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Checked-Out":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatus = () => {
    if (grandTotal === 0) return "Free / Complimentary";
    if (advancePaid >= grandTotal) return "Paid";
    if (advancePaid > 0) return "Partial";
    return "Unpaid";
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiFileText size={18} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-base 3xl:text-lg 4xl:text-xl font-black text-gray-800 uppercase">
                Booking Details
              </h2>
              <p className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-500 font-bold">
                {booking.bookingId || booking.reservationNumber || booking._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
          >
            <FiX size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content - Compact Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Status Bar */}
          <div className="flex items-center gap-2 text-[10px] 3xl:text-[14px] 4xl:text-[16px]">
            <span
              className={`px-2 py-0.5 border rounded-full font-bold uppercase ${getStatusBadge(booking.status)}`}
            >
              {booking.status || "Tentative"}
            </span>
            <span
              className={`px-2 py-0.5 border rounded-full font-bold uppercase ${
                getPaymentStatus() === "Paid" ? "bg-green-100 text-green-700 border-green-200" :
                getPaymentStatus() === "Partial" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              {getPaymentStatus()}
            </span>
            <span className="px-2 py-0.5 border rounded-full font-bold uppercase bg-blue-100 text-blue-700 border-blue-200">
              {booking.bookingType || "Individual"}
            </span>
          </div>

          {/* 2 Column Grid for Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Guest Details */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <FiUser size={12} className="text-gray-400" />
                <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-500 uppercase">
                  Primary Contact
                </span>
              </div>
              <div className="space-y-1 text-[10px] 3xl:text-[14px] 4xl:text-[16px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="font-bold text-gray-800">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mobile</span>
                  <span className="font-bold text-gray-800">{guestPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="font-bold text-gray-800">{guestEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Address</span>
                  <span className="font-bold text-gray-800">{guestAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Occupancy</span>
                  <span className="font-bold text-gray-800">
                    {booking.totalAdults || booking.adults || 1} Adults
                    {booking.totalChildren || booking.children ? ` + ${booking.totalChildren || booking.children} Children` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar size={12} className="text-gray-400" />
                <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-500 uppercase">
                  Stay Info
                </span>
              </div>
              <div className="space-y-1 text-[10px] 3xl:text-[14px] 4xl:text-[16px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Check-in</span>
                  <span className="font-bold text-gray-800">
                    {checkInStr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Checkout</span>
                  <span className="font-bold text-gray-800">
                    {checkOutStr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nights</span>
                  <span className="font-bold text-orange-600">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Category</span>
                  <span className="font-bold text-gray-800">
                    {booking.bookingCategory || "Room Stay"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Source</span>
                  <span className="font-bold text-gray-800">
                    {booking.bookingSource || "Front Desk"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <FiCoffee size={12} className="text-gray-400" />
              <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-500 uppercase">
                Rooms ({booking.rooms?.length || 0})
              </span>
            </div>
            <div className="space-y-1">
              {booking.rooms?.map((room: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-[10px] 3xl:text-[14px] 4xl:text-[16px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 3xl:w-10 3xl:h-10 4xl:w-12 4xl:h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-black text-[10px] 3xl:text-[14px] 4xl:text-[16px]">
                      {room.roomNumber || "TBD"}
                    </span>
                    <div>
                      <span className="font-bold text-gray-800">
                        {room.roomType?.name || room.roomType || "Standard Room"}
                      </span>
                      <span className="text-gray-400 ml-2">
                        ₹{(room.pricePerNight || room.appliedPrice || room.basePrice || room.rate || 0)}/night
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-orange-600">
                    ₹{((room.pricePerNight || room.appliedPrice || room.basePrice || room.rate || 0) * nights).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Addons / Services */}
          {booking.addons?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <FiUsers size={12} className="text-gray-400" />
                <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-500 uppercase">
                  Add-on Services
                </span>
              </div>
              <div className="space-y-1">
                {booking.addons.map((addon: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-[10px] 3xl:text-[14px] 4xl:text-[16px]"
                  >
                    <div>
                      <span className="font-bold text-gray-800">
                        {addon.serviceName || addon.name || "Service"}
                      </span>
                      <span className="text-gray-400 ml-2">
                        Qty: {addon.quantity || 1}
                      </span>
                    </div>
                    <span className="font-bold text-gray-800">
                      ₹{Number(addon.total || addon.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <FiCreditCard size={12} className="text-green-600" />
              <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-green-700 uppercase">
                Payment Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded p-2 text-center border border-green-100">
                <span className="text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-400 block">Total</span>
                <span className="text-base 3xl:text-lg 4xl:text-xl font-black text-gray-800">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="bg-white rounded p-2 text-center border border-green-100">
                <span className="text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-400 block">Paid / Advance</span>
                <span className="text-base 3xl:text-lg 4xl:text-xl font-black text-green-600">
                  ₹{advancePaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-white rounded p-2 text-center border border-green-100">
                <span className="text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-400 block">Due / Balance</span>
                <span className={`text-base 3xl:text-lg 4xl:text-xl font-black ${balanceDue > 0 ? "text-red-500" : "text-green-600"}`}>
                  ₹{balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Corporate Details */}
          {booking.bookingType === "Corporate" && booking.corporateDetails && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BiBuilding size={12} className="text-blue-600" />
                <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-blue-700 uppercase">
                  Corporate Details
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] 3xl:text-[14px] 4xl:text-[16px]">
                <div className="flex justify-between border-b border-blue-100/50 pb-1">
                  <span className="text-gray-400">Company Name</span>
                  <span className="font-bold text-gray-800">
                    {booking.corporateDetails.companyName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-blue-100/50 pb-1">
                  <span className="text-gray-400">GSTIN</span>
                  <span className="font-bold text-gray-800">
                    {booking.corporateDetails.companyGST || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-blue-100/50 pb-1">
                  <span className="text-gray-400">Contact Person</span>
                  <span className="font-bold text-gray-800">
                    {booking.corporateDetails.contactPersonName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-blue-100/50 pb-1">
                  <span className="text-gray-400">Contact Mobile</span>
                  <span className="font-bold text-gray-800">
                    {booking.corporateDetails.contactMobile || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Special Requests / Notes */}
          {booking.notes && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] font-black text-gray-500 uppercase block mb-1">
                Special Remarks / Notes
              </span>
              <p className="text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50/50 rounded-b-xl flex justify-between items-center">
          <span className="text-[9px] 3xl:text-[14px] 4xl:text-[16px] text-gray-400 font-bold uppercase">
            Created:{" "}
            {booking.createdAt
              ? format(new Date(booking.createdAt), "dd MMM yyyy HH:mm")
              : ""}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-[10px] 3xl:text-[14px] 4xl:text-[16px] uppercase hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingModal;
