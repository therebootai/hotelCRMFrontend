import { useState, useEffect } from "react";
import {
  FiX,
  FiLoader,
  FiCheckCircle,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiPhone,
  FiMessageSquare,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/axios";

interface EditBookingModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface TaxOption {
  _id: string;
  name: string;
  percentage: number;
  type: "Room" | "Food" | "Service";
  isActive: boolean;
}

const EditBookingModal = ({ booking, onClose, onSuccess }: EditBookingModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchingRooms, setSearchingRooms] = useState(false);

  // Search & Dates
  const [checkInDate, setCheckInDate] = useState<Date>(
    new Date(booking.overallCheckInDate || booking.rooms?.[0]?.checkInDate || new Date()),
  );
  const [checkOutDate, setCheckOutDate] = useState<Date>(
    new Date(booking.overallCheckOutDate || booking.rooms?.[0]?.checkOutDate || addDays(new Date(), 1)),
  );
  const [totalNights, setTotalNights] = useState(1);

  // Room Types List
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);

  // Customer Details
  const [customerForm, setCustomerForm] = useState({
    name: booking.bookingContact?.name || booking.customerId?.name || "",
    phone: booking.bookingContact?.mobile || booking.customerId?.phone || "",
    email: booking.bookingContact?.email || booking.customerId?.email || "",
  });

  // Corporate Details
  const [corporateForm, setCorporateForm] = useState({
    companyName: booking.corporateDetails?.companyName || "",
    gstNumber: booking.corporateDetails?.gstNumber || "",
    contactPerson: booking.corporateDetails?.contactPerson || "",
    mobile: booking.corporateDetails?.mobile || "",
    negotiatedRate: booking.corporateDetails?.negotiatedRate || 0,
  });

  // Other Fields
  const [source, setSource] = useState(booking.source || "Walk-in");
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || "");
  const [internalNotes, setInternalNotes] = useState(booking.internalNotes || "");
  const [advanceAmount, setAdvanceAmount] = useState(booking.advanceAmount || 0);
  const [paymentMode, setPaymentMode] = useState("Cash");

  // Tax
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState("");

  // Load room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get("/room-types");
        setRoomTypes(res.data.data || []);
      } catch (err) {
        console.error("Error fetching room types:", err);
      }
    };
    fetchRoomTypes();
  }, []);

  // Fetch taxes based on booking category
  useEffect(() => {
    const fetchTaxes = async () => {
      const taxType = booking.bookingCategory === "Day Access" ? "Service" : "Room";
      try {
        const res = await api.get("/tax-gst", {
          params: { type: taxType, activeOnly: "true" },
        });
        const taxes: TaxOption[] = res.data.data || [];
        setTaxOptions(taxes);
        // Restore the booking's stored tax — match by _id or find by percentage
        const storedPct = booking.pricingSummary?.taxPercentage ?? 12;
        const match =
          (booking as any).taxGstId
            ? taxes.find((t) => t._id === (booking as any).taxGstId)
            : taxes.find((t) => t.percentage === storedPct);
        setSelectedTaxId(match ? match._id : taxes[0]?._id ?? "");
      } catch (err) {
        console.error("Error fetching taxes:", err);
      }
    };
    fetchTaxes();
  }, [booking.bookingCategory]);

  // Pre-populate selected rooms from booking
  useEffect(() => {
    const loadExistingRooms = async () => {
      if (booking.rooms && booking.rooms.length > 0) {
        const loaded: any[] = [];
        for (const r of booking.rooms) {
          try {
            const res = await api.get(`/rooms/${r.roomId?._id || r.roomId}`);
            const room = res.data.data;
            if (room) {
              loaded.push({
                room: {
                  _id: room._id,
                  roomNumber: room.roomNumber,
                  floor: room.floor,
                  basePrice: room.basePrice,
                  roomType: room.roomType,
                  extraBedAllowed: room.extraBedAllowed || false,
                  extraBedCharge: room.extraBedCharge || 0,
                },
                roomType: room.roomType,
                pricing: {
                  totalPrice: r.pricePerNight * totalNights,
                  nightlyBreakdown: [],
                },
                hasExtraBed: r.hasExtraBed || false,
                extraBedChargeTotal: r.extraBedCharge || 0,
                checkInDate: r.checkInDate,
                checkOutDate: r.checkOutDate,
              });
            }
          } catch (err) {
            console.error("Error loading room:", err);
          }
        }
        setSelectedRooms(loaded);
      }
    };
    loadExistingRooms();
  }, [booking]);

  // Update total nights
  useEffect(() => {
    const nights = differenceInDays(checkOutDate, checkInDate);
    setTotalNights(nights > 0 ? nights : 1);
  }, [checkInDate, checkOutDate]);

  // Search available rooms
  const searchRooms = async () => {
    setSearchingRooms(true);
    try {
      const params: any = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
      };
      if (selectedRoomType) params.roomType = selectedRoomType;

      const res = await api.get("/bookings/available", { params });
      const available = res.data.data?.availableRooms || [];

      // Filter out already selected rooms
      const filtered = available.filter(
        (r: any) => !selectedRooms.some((s) => s.room._id === r.room._id),
      );
      setSearchResults(filtered);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to search rooms");
    } finally {
      setSearchingRooms(false);
    }
  };

  // Toggle room selection
  const toggleRoomSelection = (room: any) => {
    const isSelected = selectedRooms.find((r) => r.room._id === room.room._id);
    if (isSelected) {
      setSelectedRooms(selectedRooms.filter((r) => r.room._id !== room.room._id));
    } else {
      setSelectedRooms([
        ...selectedRooms,
        {
          ...room,
          hasExtraBed: false,
          extraBedChargeTotal: 0,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
        },
      ]);
    }
  };

  // Toggle extra bed
  const toggleExtraBed = (roomId: string) => {
    setSelectedRooms(
      selectedRooms.map((r) => {
        if (r.room._id === roomId) {
          const newHasExtraBed = !r.hasExtraBed;
          return {
            ...r,
            hasExtraBed: newHasExtraBed,
            extraBedChargeTotal: newHasExtraBed ? r.room.extraBedCharge * totalNights : 0,
          };
        }
        return r;
      }),
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const selectedTax = taxOptions.find((t) => t._id === selectedTaxId);
    const taxRate = selectedTax ? selectedTax.percentage / 100 : 0;
    const roomTotal = selectedRooms.reduce((sum, r) => {
      const basePrice = r.pricing?.totalPrice || r.room.basePrice * totalNights;
      return sum + basePrice + (r.extraBedChargeTotal || 0);
    }, 0);
    const taxAmount = Math.round(roomTotal * taxRate);
    const grandTotal = roomTotal + taxAmount;
    return { roomTotal, taxAmount, grandTotal };
  };

  const { roomTotal, taxAmount, grandTotal } = calculateTotals();

  // Submit update
  const handleUpdate = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill guest name and phone");
      return;
    }
    if (selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    setLoading(true);
    try {
      const rooms = selectedRooms.map((r) => ({
        roomType: r.roomType?._id || r.roomType || booking.rooms?.[0]?.roomType,
        roomId: r.room._id,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        adults: booking.totalAdults || 1,
        children: booking.totalChildren || 0,
        pricePerNight: r.pricing?.totalPrice
          ? r.pricing.totalPrice / totalNights
          : r.room.basePrice,
        hasExtraBed: r.hasExtraBed,
        extraBedCharge: r.hasExtraBed ? r.room.extraBedCharge : 0,
      }));

      const payload: any = {
        customerDetails: customerForm,
        rooms,
        source,
        specialRequests,
        internalNotes,
        advanceAmount,
        paymentMode: advanceAmount > 0 ? paymentMode : undefined,
      };

      if (booking.bookingType === "Corporate" || booking.bookingType === "Corporate") {
        payload.corporateDetails = corporateForm;
      }

      await api.put(`/bookings/${booking._id}`, payload);
      toast.success("Booking updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-blue-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-blue-800">Edit Reservation</h2>
              <p className="text-xs text-blue-500 font-medium">
                {booking.bookingId} • {booking.bookingType === "Corporate" ? "Corporate" : "Individual"}
              </p>
            </div>
            <div className="flex gap-2 border-l border-blue-200 pl-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${booking.bookingType === "Corporate" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>
                {booking.bookingType === "Corporate" ? <><FiBriefcase size={12} className="inline mr-1" />Corporate</> : <><FiUser size={12} className="inline mr-1" />Individual</>}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-lg transition-all text-blue-400 hover:text-blue-600"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* SECTION 1: Guest Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiUser size={14} className="text-blue-600" />
              <h3 className="font-bold text-text-primary text-sm">Guest Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Name *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Phone *</label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone">Phone</option>
                  <option value="Website">Website</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Goibibo">Goibibo</option>
                  <option value="MakeMyTrip">MakeMyTrip</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Travel Agent">Travel Agent</option>
                </select>
              </div>
            </div>

            {/* Corporate Details */}
            {booking.bookingType === "Corporate" && (
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Company</label>
                  <input
                    type="text"
                    value={corporateForm.companyName}
                    onChange={(e) => setCorporateForm({ ...corporateForm, companyName: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">GST</label>
                  <input
                    type="text"
                    value={corporateForm.gstNumber}
                    onChange={(e) => setCorporateForm({ ...corporateForm, gstNumber: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Contact Person</label>
                  <input
                    type="text"
                    value={corporateForm.contactPerson}
                    onChange={(e) => setCorporateForm({ ...corporateForm, contactPerson: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Mobile</label>
                  <input
                    type="text"
                    value={corporateForm.mobile}
                    onChange={(e) => setCorporateForm({ ...corporateForm, mobile: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Rate/Night</label>
                  <input
                    type="number"
                    value={corporateForm.negotiatedRate}
                    onChange={(e) => setCorporateForm({ ...corporateForm, negotiatedRate: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg p-2 text-sm font-bold text-blue-600 bg-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Stay Details & Room Search */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiCalendar size={14} className="text-blue-600" />
              <h3 className="font-bold text-text-primary text-sm">Stay Details & Room Search</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Check In</label>
                <DatePicker
                  selected={checkInDate}
                  onChange={(d) => setCheckInDate(d || new Date())}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                  dateFormat="dd MMM"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Check Out</label>
                <DatePicker
                  selected={checkOutDate}
                  onChange={(d) => setCheckOutDate(d || addDays(new Date(), 1))}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                  dateFormat="dd MMM"
                  minDate={addDays(checkInDate, 1)}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Room Type</label>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                >
                  <option value="">All Types</option>
                  {roomTypes.map((t: any) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={searchRooms}
                  disabled={searchingRooms}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-all"
                >
                  {searchingRooms ? <FiLoader size={12} className="animate-spin" /> : "Search"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Available Rooms</h4>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.room._id}
                      onClick={() => toggleRoomSelection(result)}
                      className={`px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                        selectedRooms.some((r) => r.room._id === result.room._id)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      Room {result.room.roomNumber}
                      <span className="block text-[10px] text-gray-500">₹{result.pricing.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Selected Rooms */}
          {selectedRooms.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-bold text-text-primary text-sm mb-2">Selected Rooms ({selectedRooms.length})</h4>
              <div className="space-y-2">
                {selectedRooms.map((r) => (
                  <div key={r.room._id} className="flex justify-between items-start p-3 bg-white border border-blue-100 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">Room {r.room.roomNumber}</span>
                        <span className="text-xs text-text-secondary">{r.roomType?.name || "Standard"}</span>
                      </div>
                      {r.room.extraBedAllowed && (
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.hasExtraBed}
                            onChange={() => toggleExtraBed(r.room._id)}
                            className="w-4 h-4 accent-blue-600 rounded"
                          />
                          <span className="text-xs font-medium text-text-primary">
                            Extra Bed (+₹{r.room.extraBedCharge}/night)
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-bold text-text-primary">
                          ₹{(r.pricing?.totalPrice || r.room.basePrice * totalNights).toLocaleString()}
                        </span>
                        {r.hasExtraBed && (
                          <p className="text-[10px] text-blue-600 font-bold">
                            +₹{r.extraBedChargeTotal.toLocaleString()}
                          </p>
                        )}
                        <p className="text-[9px] text-text-secondary">{totalNights} nights</p>
                      </div>
                      <button
                        onClick={() => setSelectedRooms(selectedRooms.filter((s) => s.room._id !== r.room._id))}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: Notes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiMessageSquare size={14} className="text-blue-600" />
              <h3 className="font-bold text-text-primary text-sm">Notes & Requests</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Special Requests</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none resize-none"
                  rows={2}
                  placeholder="Guest's special requests..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Internal Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-gray-50 outline-none resize-none"
                  rows={2}
                  placeholder="Internal notes (staff only)..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Payment */}
          <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
            <h3 className="font-bold text-text-primary text-sm mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Advance Amount</label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full border border-border rounded-lg p-2 text-sm font-bold text-blue-600 bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Tax / GST</label>
                <select
                  value={selectedTaxId}
                  onChange={(e) => setSelectedTaxId(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                >
                  <option value="">No Tax</option>
                  {taxOptions.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.percentage}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Updated Total</label>
                <div className="p-2 bg-white border border-blue-200 rounded-lg">
                  <div className="text-xs text-text-secondary">Room Total</div>
                  <div className="font-bold text-blue-700">₹{roomTotal.toLocaleString()}</div>
                  {taxAmount > 0 && (
                    <div className="text-xs text-text-secondary">
                      +{" "}
                      {(() => {
                        const t = taxOptions.find((x) => x._id === selectedTaxId);
                        return t ? `${t.name} (${t.percentage}%)` : "Tax";
                      })()}{" "}
                      ₹{taxAmount.toLocaleString()}
                    </div>
                  )}
                  <div className="font-bold text-blue-800 border-t border-blue-200 mt-1 pt-1">₹{grandTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !customerForm.name || !customerForm.phone || selectedRooms.length === 0}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? <FiLoader size={16} className="animate-spin" /> : <FiCheckCircle size={16} />}
            {loading ? "Updating..." : "Update Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;