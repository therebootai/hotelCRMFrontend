import { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Briefcase,
  CreditCard,
  CheckCircle,
  Search,
  Loader2,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Bath,
  Calendar,
  BedDouble,
  Car,
  FileText,
  MessageSquare,
  Plus,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, addDays } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/axios";

// Amenity icon mapping
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  tv: Tv,
  ac: Wind,
  coffee: Coffee,
  bath: Bath,
};

interface RoomSearchResult {
  room: {
    _id: string;
    roomNumber: string;
    floor: string;
    maxAdults: number;
    maxChildren: number;
    basePrice: number;
    extraBedAllowed: boolean;
    extraBedCharge: number;
  };
  roomType: { _id: string; name: string; description?: string };
  amenities: { _id: string; name: string; icon: string }[];
  pricing: {
    nightlyBreakdown: {
      date: string;
      finalPrice: number;
      isOverridden: boolean;
    }[];
    totalNights: number;
    totalPrice: number;
  };
  isAvailable: boolean;
  unavailableReason?: string;
}

interface SelectedRoom extends RoomSearchResult {
  hasExtraBed: boolean;
  extraBedChargeTotal: number;
}

const CreateBooking = ({
  onClose,
  refreshBookings,
}: {
  onClose: () => void;
  refreshBookings?: () => void;
}) => {
  // State
  const [loading, setLoading] = useState(false);
  const [searchingRooms, setSearchingRooms] = useState(false);

  // Booking Category & Type
  const [bookingCategory, setBookingCategory] = useState<
    "Room Stay" | "Day Access"
  >("Room Stay");
  const [bookingType, setBookingType] = useState<"Individual" | "Corporate">(
    "Individual",
  );

  // Search & Dates
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(
    addDays(new Date(), 1),
  );
  const [totalNights, setTotalNights] = useState(1);

  // Day Access Package Specifics
  const [accessPackages, setAccessPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [visitDate, setVisitDate] = useState<Date>(new Date());

  // Search Filters
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [adultsFilter, setAdultsFilter] = useState(1);
  const [childrenFilter, setChildrenFilter] = useState(0);

  // Search Results
  const [searchResults, setSearchResults] = useState<RoomSearchResult[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);

  // Customer Details
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Corporate Details
  const [corporateForm, setCorporateForm] = useState({
    companyName: "",
    gstNumber: "",
    contactPerson: "",
    mobile: "",
    negotiatedRate: 0,
  });

  // Source & Preferences
  const [source, setSource] = useState("Walk-in");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Vehicles
  const [vehicles, setVehicles] = useState<
    {
      vehicleNumber: string;
      vehicleType: string;
      driverName: string;
      driverContact: string;
    }[]
  >([]);

  // Payment
  const [paymentForm, setPaymentForm] = useState({
    advanceAmount: 0,
    paymentMode: "Cash",
  });

  // Room Types List
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  // Load room types and access packages
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get("/room-types");
        setRoomTypes(res.data.data || []);
      } catch (err) {
        console.error("Error fetching room types:", err);
      }
    };
    const fetchAccessPackages = async () => {
      try {
        const res = await api.get("/access-packages");
        setAccessPackages(res.data.data?.packages || res.data.data || []);
      } catch (err) {
        console.error("Error fetching access packages:", err);
      }
    };
    fetchRoomTypes();
    fetchAccessPackages();
  }, []);

  // Update total nights
  useEffect(() => {
    const nights = differenceInDays(checkOutDate, checkInDate);
    setTotalNights(nights > 0 ? nights : 1);
  }, [checkInDate, checkOutDate]);

  // Search available rooms
  const searchRooms = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill guest name and phone first");
      return;
    }
    setSearchingRooms(true);
    try {
      const params: any = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
      };
      if (roomTypeFilter) params.roomType = roomTypeFilter;

      const res = await api.get("/bookings/available", { params });
      setSearchResults(res.data.data?.availableRooms || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to search rooms");
    } finally {
      setSearchingRooms(false);
    }
  };

  // Toggle room selection with extra bed
  const toggleRoomSelection = (room: RoomSearchResult) => {
    const isSelected = selectedRooms.find((r) => r.room._id === room.room._id);
    if (isSelected) {
      setSelectedRooms(
        selectedRooms.filter((r) => r.room._id !== room.room._id),
      );
    } else {
      setSelectedRooms([
        ...selectedRooms,
        {
          ...room,
          hasExtraBed: false,
          extraBedChargeTotal: 0,
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
            extraBedChargeTotal: newHasExtraBed
              ? r.room.extraBedCharge * totalNights
              : 0,
          };
        }
        return r;
      }),
    );
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    if (bookingCategory === "Day Access") {
      const pkg = accessPackages.find((p) => p._id === selectedPackageId);
      const rate = pkg ? pkg.adult_price : 0;
      const count = Number(adultsFilter) + Number(childrenFilter);
      const roomTotal = rate * count;
      const extraBedTotal = 0;
      const subtotal = roomTotal;
      const taxAmount = Math.round(subtotal * 0.12);
      const grandTotal = subtotal + taxAmount;
      const paidAmount = paymentForm.advanceAmount || 0;
      const dueAmount = grandTotal - paidAmount;
      return {
        roomTotal,
        extraBedTotal,
        subtotal,
        taxAmount,
        grandTotal,
        paidAmount,
        dueAmount,
      };
    }

    const roomTotal = selectedRooms.reduce(
      (sum, r) => sum + r.pricing.totalPrice,
      0,
    );
    const extraBedTotal = selectedRooms.reduce(
      (sum, r) => sum + r.extraBedChargeTotal,
      0,
    );
    const subtotal = roomTotal + extraBedTotal;
    const taxAmount = Math.round(subtotal * 0.12);
    const grandTotal = subtotal + taxAmount;
    const paidAmount = paymentForm.advanceAmount || 0;
    const dueAmount = grandTotal - paidAmount;

    return {
      roomTotal,
      extraBedTotal,
      subtotal,
      taxAmount,
      grandTotal,
      paidAmount,
      dueAmount,
    };
  }, [
    selectedRooms,
    paymentForm.advanceAmount,
    totalNights,
    bookingCategory,
    selectedPackageId,
    accessPackages,
    adultsFilter,
    childrenFilter,
  ]);

  const {
    roomTotal,
    extraBedTotal,
    subtotal,
    taxAmount,
    grandTotal,
    paidAmount,
    dueAmount,
  } = calculateTotals();

  // Add vehicle
  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      { vehicleNumber: "", vehicleType: "", driverName: "", driverContact: "" },
    ]);
  };

  // Remove vehicle
  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  // Update vehicle
  const updateVehicle = (index: number, field: string, value: string) => {
    const updated = [...vehicles];
    (updated[index] as any)[field] = value;
    setVehicles(updated);
  };

  // Submit booking
  const submitBooking = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill guest name and phone");
      return;
    }
    if (bookingCategory === "Room Stay" && selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }
    if (bookingCategory === "Day Access" && !selectedPackageId) {
      toast.error("Please select an access package");
      return;
    }

    setLoading(true);
    try {
      const rooms =
        bookingCategory === "Room Stay"
          ? selectedRooms.map((r) => ({
              roomType: r.roomType?._id || r.roomType,
              roomId: r.room._id,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              adults: adultsFilter,
              children: childrenFilter,
              pricePerNight:
                (r.pricing.totalPrice + r.extraBedChargeTotal) / totalNights,
              hasExtraBed: r.hasExtraBed,
              extraBedCharge: r.hasExtraBed ? r.room.extraBedCharge : 0,
            }))
          : undefined;

      const payload: any = {
        customerDetails: customerForm,
        bookingCategory,
        bookingType,
        source,
        advanceAmount: paymentForm.advanceAmount,
        paymentMode:
          paymentForm.advanceAmount > 0 ? paymentForm.paymentMode : undefined,
        specialRequests,
        internalNotes,
        vehicleDetails: vehicles,
        adults: adultsFilter,
        children: childrenFilter,
      };

      if (bookingCategory === "Day Access") {
        payload.accessPackageId = selectedPackageId;
        payload.visitDate = visitDate.toISOString();
      } else {
        payload.rooms = rooms;
      }

      if (bookingType === "Corporate") {
        payload.corporateDetails = corporateForm;
      }

      const res = await api.post("/bookings/create", payload);
      toast.success(res.data.message || "Booking created successfully");

      if (refreshBookings) refreshBookings();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-primary text-white">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold">New Reservation</h2>
              <p className="text-xs text-white/70">
                {bookingCategory === "Day Access"
                  ? `${format(visitDate, "dd MMM yyyy")} • Day Access`
                  : `${format(checkInDate, "dd MMM")} - ${format(checkOutDate, "dd MMM")} • ${totalNights} Night(s)`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setBookingCategory("Room Stay")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingCategory === "Room Stay" ? "bg-white text-primary" : "bg-primary/50 text-white"}`}
              >
                Room Stay
              </button>
              <button
                onClick={() => setBookingCategory("Day Access")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingCategory === "Day Access" ? "bg-white text-primary" : "bg-primary/50 text-white"}`}
              >
                Day Access
              </button>
            </div>
            <div className="flex gap-2 border-l border-white/20 pl-2">
              <button
                onClick={() => setBookingType("Individual")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingType === "Individual" ? "bg-white text-primary" : "bg-primary/50 text-white"}`}
              >
                <User size={12} className="inline mr-1" /> Individual
              </button>
              <button
                onClick={() => setBookingType("Corporate")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingType === "Corporate" ? "bg-white text-blue-600" : "bg-blue-400 text-white"}`}
              >
                <Briefcase size={12} className="inline mr-1" /> Corporate
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* SECTION 1: Guest Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Guest Information
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Name *
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Guest Name"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Phone *
                </label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Mobile"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Email
                </label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Source
                </label>
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
            {bookingType === "Corporate" && (
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={corporateForm.companyName}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                    placeholder="Company"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    GST
                  </label>
                  <input
                    type="text"
                    value={corporateForm.gstNumber}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        gstNumber: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                    placeholder="GST No."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={corporateForm.contactPerson}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                    placeholder="Contact"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={corporateForm.mobile}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        mobile: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                    placeholder="Mobile"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Rate/Night
                  </label>
                  <input
                    type="number"
                    value={corporateForm.negotiatedRate}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        negotiatedRate: Number(e.target.value),
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm font-bold text-primary bg-white outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Stay Details OR Day Access Package selector */}
          {bookingCategory === "Day Access" ? (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-primary" />
                <h3 className="font-bold text-text-primary text-sm">
                  Day Access stay & Package details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Visit Date
                  </label>
                  <DatePicker
                    selected={visitDate}
                    onChange={(d) => setVisitDate(d || new Date())}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                    dateFormat="dd MMM yyyy"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Select Package *
                  </label>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  >
                    <option value="">-- Choose Access Package --</option>
                    {accessPackages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.packageName} (Adult: ₹{pkg.adult_price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Adults
                  </label>
                  <select
                    value={adultsFilter}
                    onChange={(e) => setAdultsFilter(Number(e.target.value))}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Children
                  </label>
                  <select
                    value={childrenFilter}
                    onChange={(e) => setChildrenFilter(Number(e.target.value))}
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-primary" />
                <h3 className="font-bold text-text-primary text-sm">
                  Stay Details & Room Search
                </h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Check In
                  </label>
                  <DatePicker
                    selected={checkInDate}
                    onChange={(d) => setCheckInDate(d || new Date())}
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                    dateFormat="dd MMM"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Check Out
                  </label>
                  <DatePicker
                    selected={checkOutDate}
                    onChange={(d) =>
                      setCheckOutDate(d || addDays(new Date(), 1))
                    }
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                    dateFormat="dd MMM"
                    minDate={addDays(checkInDate, 1)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Adults
                  </label>
                  <select
                    value={adultsFilter}
                    onChange={(e) => setAdultsFilter(Number(e.target.value))}
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Children
                  </label>
                  <select
                    value={childrenFilter}
                    onChange={(e) => setChildrenFilter(Number(e.target.value))}
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Room Type
                  </label>
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                  >
                    <option value="">All Types</option>
                    {roomTypes.map((t: any) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={searchRooms}
                    disabled={
                      searchingRooms ||
                      !customerForm.name ||
                      !customerForm.phone
                    }
                    className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-all"
                  >
                    {searchingRooms ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    {searchingRooms ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Available Rooms (only for Room Stay category) */}
          {bookingCategory === "Room Stay" && searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                  <BedDouble size={14} className="text-primary" />
                  Available Rooms ({searchResults.length})
                </h4>
                <span className="text-xs text-text-secondary">
                  {selectedRooms.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                {searchResults.map((result) => {
                  const isSelected = selectedRooms.find(
                    (r) => r.room._id === result.room._id,
                  );
                  return (
                    <div
                      key={result.room._id}
                      onClick={() => toggleRoomSelection(result)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm">
                            Room {result.room.roomNumber}
                          </h4>
                          <p className="text-[10px] text-text-secondary">
                            {result.roomType.name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${isSelected ? "bg-primary text-white" : "bg-gray-100 text-text-secondary"}`}
                        >
                          {isSelected ? "✓" : "+"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.amenities.slice(0, 3).map((a) => {
                          const Icon = amenityIcons[a.icon] || Wifi;
                          return (
                            <span
                              key={a._id}
                              className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] text-text-secondary flex items-center gap-0.5"
                            >
                              <Icon size={8} /> {a.name}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-[10px] text-text-secondary">
                          Base: ₹{result.room.basePrice}
                        </span>
                        <span className="font-bold text-primary text-sm">
                          ₹{result.pricing.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: Selected Rooms with Extra Bed (only for Room Stay category) */}
          {bookingCategory === "Room Stay" && selectedRooms.length > 0 && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-4">
              <h4 className="font-bold text-text-primary text-sm mb-2">
                Selected Rooms
              </h4>
              <div className="space-y-2">
                {selectedRooms.map((r) => (
                  <div
                    key={r.room._id}
                    className="flex justify-between items-start p-3 bg-white border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">
                          Room {r.room.roomNumber}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {r.roomType.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a._id}
                            className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] text-text-secondary"
                          >
                            {a.name}
                          </span>
                        ))}
                      </div>
                      {/* Extra Bed Option */}
                      {r.room.extraBedAllowed && (
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.hasExtraBed}
                            onChange={() => toggleExtraBed(r.room._id)}
                            className="w-4 h-4 accent-primary rounded"
                          />
                          <span className="text-xs font-medium text-text-primary">
                            Extra Bed (+₹{r.room.extraBedCharge}/night = ₹
                            {r.room.extraBedCharge * totalNights} for{" "}
                            {totalNights} nights)
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-bold text-text-primary">
                          ₹{r.pricing.totalPrice.toLocaleString()}
                        </span>
                        {r.hasExtraBed && (
                          <p className="text-[10px] text-primary font-bold">
                            +₹{r.extraBedChargeTotal.toLocaleString()} (Extra
                            Bed)
                          </p>
                        )}
                        <p className="text-[9px] text-text-secondary">
                          {totalNights} nights
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedRooms(
                            selectedRooms.filter(
                              (s) => s.room._id !== r.room._id,
                            ),
                          )
                        }
                        className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: Special Requests & Internal Notes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Special Requests & Notes
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                  <FileText size={10} /> Special Requests (Guest)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none resize-none"
                  rows={2}
                  placeholder="Guest's special requests..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                  <MessageSquare size={10} /> Internal Notes (Staff Only)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs bg-gray-50 outline-none resize-none"
                  rows={2}
                  placeholder="Internal notes (not visible to guest)..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Vehicle Details */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Car size={14} className="text-primary" />
                Vehicle Details
              </h4>
              <button
                onClick={addVehicle}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <Plus size={12} /> Add Vehicle
              </button>
            </div>
            {vehicles.length > 0 ? (
              <div className="space-y-2">
                {vehicles.map((vehicle, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <input
                      type="text"
                      placeholder="Vehicle No."
                      value={vehicle.vehicleNumber}
                      onChange={(e) =>
                        updateVehicle(idx, "vehicleNumber", e.target.value)
                      }
                      className="p-1.5 border border-border rounded text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Type (Car/Bike)"
                      value={vehicle.vehicleType}
                      onChange={(e) =>
                        updateVehicle(idx, "vehicleType", e.target.value)
                      }
                      className="p-1.5 border border-border rounded text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Driver Name"
                      value={vehicle.driverName}
                      onChange={(e) =>
                        updateVehicle(idx, "driverName", e.target.value)
                      }
                      className="p-1.5 border border-border rounded text-xs bg-white outline-none"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Contact"
                        value={vehicle.driverContact}
                        onChange={(e) =>
                          updateVehicle(idx, "driverContact", e.target.value)
                        }
                        className="flex-1 p-1.5 border border-border rounded text-xs bg-white outline-none"
                      />
                      <button
                        onClick={() => removeVehicle(idx)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary text-center py-2">
                No vehicles added
              </p>
            )}
          </div>

          {/* SECTION 7: Payment */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Payment Details
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Advance Amount
                </label>
                <input
                  type="number"
                  value={paymentForm.advanceAmount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      advanceAmount: Number(e.target.value),
                    })
                  }
                  className="w-full border border-border rounded-lg p-2 text-sm font-bold text-primary bg-white outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Payment Mode
                </label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMode: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Price Summary
                </label>
                <div className="p-2 bg-white border border-border rounded-lg space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Room Total</span>
                    <span className="font-bold">
                      ₹{roomTotal.toLocaleString()}
                    </span>
                  </div>
                  {extraBedTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">
                        Extra Bed ({totalNights} nights)
                      </span>
                      <span className="font-bold">
                        ₹{extraBedTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Tax (12%)</span>
                    <span className="font-bold">
                      ₹{taxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-border">
                    <span className="font-bold text-success">Grand Total</span>
                    <span className="font-bold text-success">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                  {paymentForm.advanceAmount > 0 && (
                    <div className="flex justify-between text-xs text-primary">
                      <span>Advance ({paymentForm.paymentMode})</span>
                      <span className="font-bold">
                        -₹{paidAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {paymentForm.advanceAmount > 0 && (
                    <div className="flex justify-between text-xs pt-1 border-t border-border text-danger">
                      <span className="font-bold">Due Amount</span>
                      <span className="font-bold">
                        ₹{dueAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitBooking}
            disabled={
              loading ||
              !customerForm.name ||
              !customerForm.phone ||
              (bookingCategory === "Room Stay" && selectedRooms.length === 0) ||
              (bookingCategory === "Day Access" && !selectedPackageId)
            }
            className="px-8 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            {loading ? "Creating..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
