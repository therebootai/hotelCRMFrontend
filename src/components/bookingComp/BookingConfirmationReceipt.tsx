import { FiPrinter, FiMail, FiCheckCircle, FiUser, FiLoader } from "react-icons/fi";
import { format } from "date-fns";
import { useState, useRef } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import PaymentReceiptTemplate, { type PaymentReceiptRef, type PaymentReceiptData } from "../ui/PaymentReceiptTemplate";

const BookingConfirmationReceipt = ({ 
  booking: initialBooking, 
  onBack, 
  onEdit, 
  onCreateAnother,
  onSave
}: { 
  booking: any, 
  onBack: () => void, 
  onEdit: () => void, 
  onCreateAnother: () => void,
  onSave?: () => void
}) => {
  const [booking, setBooking] = useState(initialBooking);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const isSaved = booking?.isSaved !== false;

  const customerName = booking?.customerDetails?.name || booking?.customer?.name || booking?.bookingContact?.name || "Guest";
  const customerPhone = booking?.customerDetails?.phone || booking?.customer?.phone || booking?.bookingContact?.mobile || "";
  
  const checkIn = booking?.overallCheckInDate ? new Date(booking.overallCheckInDate) : new Date();
  const checkOut = booking?.overallCheckOutDate ? new Date(booking.overallCheckOutDate) : new Date();
  const nights = booking?.totalNights || 1;
  const roomsCount = booking?.rooms?.length || 0;
  
  const roomTypesNames = booking?.rooms?.map((r: any) => r.roomType?.name || "Room").join(", ");
  
  const handleConfirm = async () => {
    if (isSaved) return;
    setSaving(true);
    try {
      let res;
      if (booking.isEdit) {
        res = await api.put(`/bookings/${booking._id}`, booking.payloadToSave);
        toast.success(res.data.message || "Booking updated successfully");
      } else {
        res = await api.post("/bookings/create", booking.payloadToSave);
        toast.success(res.data.message || "Booking created successfully");
      }
      setBooking(res.data.data); // Update with real saved booking from backend
      if (onSave) onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to confirm booking");
    } finally {
      setSaving(false);
    }
  };
  
  const receiptRef = useRef<PaymentReceiptRef>(null);
  const [printData, setPrintData] = useState<PaymentReceiptData | null>(null);

  const handleEmail = async () => {
    if (!booking?._id) return;
    const emailToUse = booking.bookingContact?.email || booking.customerId?.email || booking.customerDetails?.email;
    
    if (!emailToUse) {
      toast.error("No email address found for this guest");
      return;
    }

    setSendingEmail(true);
    try {
      await api.post(`/bookings/${booking._id}/email-receipt`, { email: emailToUse });
      toast.success(`Receipt sent to ${emailToUse}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    const item = booking;
    const roomTypeNames = item.rooms?.map((r: any) => r.roomType?.name || r.roomType).join(", ") || "N/A";
    const servicesList = (item.addons || []).map((a: any) => ({
      service: a.serviceName || a.name || "Add-on",
      description: "Additional Service",
      qty: a.quantity || 1,
      unitPrice: a.rate || 0,
      amount: a.total || 0,
      taxAmount: a.taxAmount || 0,
      taxPercentage: a.taxPercentage || 0,
    }));

    const advancePaid = item.pricingSummary?.paidAmount || item.advanceAmount || 0;
    const grandTotal = item.pricingSummary?.grandTotal || 0;

    const data: PaymentReceiptData = {
      bookingId: item.bookingId || item.reservationNumber || item._id?.substring(0, 8) || "N/A",
      bookingDate: item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy"),
      bookingStatus: item.status || "CONFIRMED",
      guest: {
        name: item.bookingContact?.name || item.customerId?.name || item.customerDetails?.name || "Guest",
        mobile: item.bookingContact?.mobile || item.customerId?.phone || item.customerDetails?.phone || "Not Provided",
        email: item.bookingContact?.email || item.customerId?.email || item.customerDetails?.email || "Not Provided",
        address: item.customerId?.address || "Not Provided",
        noOfGuests: `${item.totalAdults || item.adults || 1} Adults${(item.totalChildren || item.children) ? ` + ${item.totalChildren || item.children} Children` : ''}`,
        idProofType: "Not Provided",
      },
      stay: {
        roomType: roomTypeNames,
        checkInDate: item.overallCheckInDate ? format(new Date(item.overallCheckInDate), "dd MMM yyyy") : "N/A",
        checkOutDate: item.overallCheckOutDate ? format(new Date(item.overallCheckOutDate), "dd MMM yyyy") : "N/A",
        noOfNights: `${item.totalNights || 1} Nights`,
        view: "Standard View",
        district: "Jalpaiguri",
      },
      services: servicesList,
      payment: {
        roomCharges: item.pricingSummary?.roomTotal || 0,
        roomChargesDesc: `Room Charges (₹${((item.pricingSummary?.roomTotal || 0) / (item.totalNights || 1)).toFixed(2)} × ${item.totalNights || 1} Nights)`,
        servicesTotal: servicesList.reduce((acc: number, s: any) => acc + s.amount, 0),
        taxAmount: item.pricingSummary?.taxAmount || 0,
        roomTaxAmount: (item.pricingSummary?.taxAmount || 0) - servicesList.reduce((acc: number, s: any) => acc + (s.taxAmount || 0), 0),
        grandTotal: grandTotal,
        advancePaid: advancePaid,
        balanceDue: item.pricingSummary?.dueAmount ?? (grandTotal - advancePaid),
        paymentMode: advancePaid > 0 ? (item.paymentMode || "Online / UPI") : "N/A",
      }
    };

    setPrintData(data);
    setTimeout(() => {
      receiptRef.current?.exportToPDF();
    }, 100);
  };

  const advancePaid = booking?.pricingSummary?.paidAmount || booking?.advanceAmount || 0;
  const grandTotal = booking?.pricingSummary?.grandTotal || 0;
  const balanceDue = booking?.pricingSummary?.dueAmount || Math.max(0, grandTotal - advancePaid);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#F8F9FA] rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-border print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-xl text-text-secondary hover:text-text-primary">
              &times;
            </button>
            <h2 className="text-xl font-bold text-text-primary">
              {!isSaved ? "Step 2: Preview & Confirm Booking" : "Booking Confirmed & Inventory Reserved"}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Booking ID</p>
              <p className="font-bold text-text-primary">{booking?.reservationNumber || booking?._id?.substring(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Booking Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                !isSaved ? "bg-slate-100 text-slate-700" :
                advancePaid > 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}>
                {!isSaved ? "Preview" : advancePaid > 0 ? "Advance Paid" : booking?.status || "Tentative"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth print:p-0 print:overflow-visible">
          
          {/* Top Info Card */}
          <div className="bg-white rounded-xl border border-border p-5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary">
                <FiUser size={20} />
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Guest Name</p>
                <p className="font-bold text-text-primary">{customerName}</p>
                <p className="text-xs text-text-secondary mt-0.5">{customerPhone}</p>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Check-in</p>
              <p className="font-bold text-text-primary">{format(checkIn, "dd MMM yyyy")}</p>
              <p className="text-xs text-text-secondary mt-0.5">{format(checkIn, "hh:mm a")} (Expected)</p>
            </div>
            
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Check-out</p>
              <p className="font-bold text-text-primary">{format(checkOut, "dd MMM yyyy")}</p>
              <p className="text-xs text-text-secondary mt-0.5">{format(checkOut, "hh:mm a")} (Expected)</p>
            </div>
            
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Nights</p>
              <p className="font-bold text-text-primary">{nights} Nights</p>
            </div>
            
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Rooms</p>
              <p className="font-bold text-text-primary">{roomsCount} Rooms</p>
              <p className="text-xs text-text-secondary mt-0.5 max-w-37.5 truncate">{roomTypesNames}</p>
            </div>
            
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Booking Source</p>
              <p className="font-bold text-text-primary">{booking?.source || "Direct"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* BOOKING SUMMARY */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-border flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">A</span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Booking Summary</h3>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-text-secondary font-bold">Item</th>
                        <th className="pb-3 text-text-secondary font-bold">Details</th>
                        <th className="pb-3 text-text-secondary font-bold text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-4 font-bold text-text-primary">Room Charges</td>
                        <td className="py-4 text-text-secondary">
                          {roomsCount} Rooms × {nights} Nights <br/>
                          <span className="text-xs">{format(checkIn, "dd MMM yyyy")} - {format(checkOut, "dd MMM yyyy")}</span>
                        </td>
                        <td className="py-4 font-bold text-text-primary text-right">
                          {(booking?.pricingSummary?.roomTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                      {booking?.pricingSummary?.taxAmount > 0 && (
                        <tr>
                          <td className="py-4 font-bold text-text-primary">Taxes & Charges</td>
                          <td className="py-4 text-text-secondary">GST</td>
                          <td className="py-4 font-bold text-text-primary text-right">
                            {(booking?.pricingSummary?.taxAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border border-dashed">
                        <td colSpan={2} className="py-4 font-black text-text-primary text-base">Estimated Total Amount</td>
                        <td className="py-4 font-black text-primary text-lg text-right">
                          ₹{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-start gap-2">
                    <span>ℹ️</span>
                    <p>Final bill amount may change based on actual room assignment, taxes, and additional usage at check-in / check-out.</p>
                  </div>
                </div>
              </div>

              {/* PAYMENT DETAILS (Readonly View) */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-border flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">B</span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Payment Details</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Advance Amount (₹)</label>
                    <div className="font-bold text-text-primary">{advancePaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Payment Mode</label>
                    <div className="font-bold text-text-primary">{advancePaid > 0 ? (booking?.paymentMode || "Online / UPI") : "N/A"}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Payment Date & Time</label>
                    <div className="font-bold text-text-primary">{format(new Date(), "dd MMM yyyy, hh:mm a")}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Remarks</label>
                    <div className="font-bold text-text-primary text-sm">Advance received for booking confirmation.</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* PAYMENT SUMMARY */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-border flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">C</span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Payment Summary</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text-secondary">Estimated Total Amount</span>
                    <span className="text-sm font-bold text-text-primary">₹{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm font-bold">Total Advance Paid</span>
                    <span className="text-sm font-bold">₹{advancePaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="pt-4 border-t border-border border-dashed flex justify-between items-center">
                    <span className="text-base font-black text-text-primary">Balance Payable (At Check-in)</span>
                    <span className="text-base font-black text-red-600">₹{balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-start gap-2">
                    <FiCheckCircle size={16} className="mt-0.5 shrink-0" />
                    <p>This advance will be adjusted in the final bill during Check-in / Check-out.</p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className={`bg-white rounded-xl border border-border overflow-hidden shadow-sm print:hidden ${!isSaved ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="bg-slate-50 px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">D</span>
                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Actions</h3>
                  </div>
                  {!isSaved && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase font-bold">Requires Save</span>}
                </div>
                <div className="p-5 space-y-3">

                  <button onClick={handlePrint} className="w-full flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                        <FiPrinter size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Print Payment Receipt</p>
                        <p className="text-xs opacity-80">Print advance receipt for guest</p>
                      </div>
                    </div>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button 
                    onClick={handleEmail}
                    disabled={sendingEmail}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                        {sendingEmail ? <FiLoader className="animate-spin" size={16} /> : <FiMail size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{sendingEmail ? "Sending..." : "Email Receipt"}</p>
                        <p className="text-xs opacity-80">Send receipt to guest email</p>
                      </div>
                    </div>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>

              {/* BOOKING INFORMATION */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-border flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">E</span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Booking Information</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex">
                    <span className="w-32 text-xs font-bold text-text-secondary">Booking ID</span>
                    <span className="text-xs font-bold text-text-primary">{booking?.reservationNumber || booking?._id?.substring(0, 8)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-xs font-bold text-text-secondary">Booking Date</span>
                    <span className="text-xs font-bold text-text-primary">{format(new Date(), "dd MMM yyyy, hh:mm a")}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-xs font-bold text-text-secondary">Status</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Advance Paid</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-xs font-bold text-text-secondary">Hold Till (If Hold)</span>
                    <span className="text-xs font-bold text-text-primary">—</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-xs font-bold text-text-secondary">Special Request</span>
                    <span className="text-xs font-bold text-text-primary line-clamp-2">{booking?.specialRequests || "None"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
        
        {/* Footer Actions */}
        <div className="bg-white border-t border-border p-5 flex items-center justify-end  print:hidden">
          
          <div className="flex items-center gap-3">
            {isSaved && (
              <>
                <button onClick={onEdit} className="px-6 py-2.5 rounded-lg border border-border text-sm font-bold text-text-primary hover:bg-slate-50 transition-colors">
                  Edit Booking
                </button>
                <button onClick={onCreateAnother} className="px-6 py-2.5 rounded-lg border border-border text-sm font-bold text-text-primary hover:bg-slate-50 transition-colors">
                  + Create Another Booking
                </button>
                <button onClick={onBack} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                  View All Bookings
                </button>
              </>
            )}
            {!isSaved && (
              <button 
                onClick={handleConfirm} 
                disabled={saving}
                className="px-8 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-orange-100 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <FiLoader className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
                Confirm & Save Booking
              </button>
            )}
          </div>
        </div>

        {/* Hidden Payment Receipt Template for printing */}
        <div className="hidden">
          {printData && (
            <PaymentReceiptTemplate ref={receiptRef} data={printData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationReceipt;
