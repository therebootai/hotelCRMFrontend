import { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiUser,
  FiBriefcase,
  FiCreditCard,
  FiCheckCircle,
  FiSearch,
  FiLoader,
  FiWifi,
  FiWind,
  FiTv,
  FiCoffee,
  FiCalendar,
  FiPhone,
  FiFileText,
  FiMessageSquare,
  FiPlus,
  FiDollarSign,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, addDays } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/axios";

// Amenity icon mapping
// Amenity icon mapping
import type { IconType } from "react-icons";
const amenityIcons: Record<string, IconType> = {
  wifi: FiWifi,
  tv: FiTv,
  ac: FiWind,
  coffee: FiCoffee,
  bath: FiCoffee,
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

// interface SelectedRoom extends RoomSearchResult {
//   hasExtraBed: boolean;
//   extraBedChargeTotal: number;
// }

interface TaxOption {
  _id: string;
  name: string;
  percentage: number;
  type: "Room" | "Food" | "Service";
  isActive: boolean;
}

interface RoomTypeEntry {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  basePrice: number;
  count: number;
  adults: number;
  children: number;
}

const EditBookingModal = ({
  onClose,
  booking,
  refreshBookings,
}: {
  onClose: () => void;
  booking: any;
  refreshBookings: () => void;
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
  const [roomTypeFilter] = useState("");
  const [adultsFilter, setAdultsFilter] = useState(1);
  const [childrenFilter, setChildrenFilter] = useState(0);

  // Search Results - now reference only, not for selection
  const [searchResults, setSearchResults] = useState<RoomSearchResult[]>([]);

  // Multi-room type selection
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<RoomTypeEntry[]>([
    {
      id: "row-0",
      roomTypeId: "",
      roomTypeName: "",
      basePrice: 0,
      count: 1,
      adults: 1,
      children: 0,
    },
  ]);

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

  // Source & Preferences - changed from dropdown to tabs
  const [sourceTab, setSourceTab] = useState<"Direct" | "OTA" | "Travel Agent">(
    "Direct",
  );
  const [source, setSource] = useState("Walk-in");

  // Travel Agent Reference Info (separate from customer)
  const [travelAgentName, setTravelAgentName] = useState("");
  const [travelAgentRefId, setTravelAgentRefId] = useState("");
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

  // Add-on Services
  const [extraServices, setExtraServices] = useState<
    { _id: string; name: string; price: number }[]
  >([]);
  const [selectedAddons, setSelectedAddons] = useState<
    {
      serviceId: string;
      serviceName: string;
      quantity: number;
      rate: number;
      total: number;
    }[]
  >([]);

  // Payment
  const [paymentForm, setPaymentForm] = useState({
    advanceAmount: 0,
    paymentMode: "Cash",
  });

  // Tax
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState("");

  // Room Types List
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    if (booking) {
      setBookingCategory(booking.bookingCategory || "Room Stay");
      setBookingType(booking.bookingType || "Individual");

      setCustomerForm({
        name: booking.customerId?.name || booking.bookingContact?.name || "",
        phone:
          booking.customerId?.phone || booking.bookingContact?.mobile || "",
        email: booking.customerId?.email || booking.bookingContact?.email || "",
      });

      if (booking.corporateDetails) {
        setCorporateForm({
          companyName: booking.corporateDetails.companyName || "",
          gstNumber:
            booking.corporateDetails.companyGst ||
            booking.corporateDetails.gstNumber ||
            "",
          contactPerson: booking.corporateDetails.contactPerson || "",
          mobile: booking.corporateDetails.mobile || "",
          negotiatedRate: booking.corporateDetails.negotiatedRate || 0,
        });
      }

      setSourceTab(
        booking.source === "OTA" || booking.source === "Travel Agent"
          ? booking.source
          : "Direct",
      );
      setSource(booking.source || "Walk-in");

      if (booking.travelAgentInfo) {
        setTravelAgentName(booking.travelAgentInfo.agentName || "");
        setTravelAgentRefId(booking.travelAgentInfo.referenceId || "");
      }

      if (booking.vehicleDetails && Array.isArray(booking.vehicleDetails)) {
        setVehicles(booking.vehicleDetails);
      } else {
        setVehicles([]);
      }

      if (booking.addons && Array.isArray(booking.addons)) {
        setSelectedAddons(booking.addons);
      } else {
        setSelectedAddons([]);
      }

      setInternalNotes(booking.internalNotes || "");
      setSpecialRequests(booking.specialRequests || "");

      if (booking.bookingCategory === "Day Access") {
        setSelectedPackageId(booking.accessPackageId || "");
        if (booking.visitDate) {
          setVisitDate(new Date(booking.visitDate));
        }
        setAdultsFilter(booking.totalAdults || 1);
        setChildrenFilter(booking.totalChildren || 0);
      } else {
        if (booking.rooms && booking.rooms.length > 0) {
          const typesMap = new Map();
          booking.rooms.forEach((r: any) => {
            const typeId = r.roomType?._id || r.roomType;
            if (typesMap.has(typeId)) {
              const entry = typesMap.get(typeId);
              entry.count += 1;
              entry.adults += r.adults || 1;
              entry.children += r.children || 0;
            } else {
              typesMap.set(typeId, {
                id: Math.random().toString(36).substr(2, 9),
                roomTypeId: typeId,
                roomTypeName: r.roomType?.name || "",
                checkInDate: new Date(r.checkInDate)
                  .toISOString()
                  .split("T")[0],
                checkOutDate: new Date(r.checkOutDate)
                  .toISOString()
                  .split("T")[0],
                count: 1,
                adults: r.adults || 1,
                children: r.children || 0,
                basePrice: r.pricePerNight || 0,
              });
            }
          });
          setSelectedRoomTypes(Array.from(typesMap.values()));
          if (booking.rooms[0]?.checkInDate) {
            setCheckInDate(new Date(booking.rooms[0].checkInDate));
          }
          if (booking.rooms[0]?.checkOutDate) {
            setCheckOutDate(new Date(booking.rooms[0].checkOutDate));
          }
        }
      }
    }
  }, [booking]);

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
    const fetchExtraServices = async () => {
      try {
        const res = await api.get("/extra-services?activeOnly=true");
        setExtraServices(res.data.data || []);
      } catch (err) {
        console.error("Error fetching extra services:", err);
      }
    };
    fetchRoomTypes();
    fetchAccessPackages();
    fetchExtraServices();
  }, []);

  // Fetch taxes filtered by booking category type
  useEffect(() => {
    const fetchTaxes = async () => {
      const taxType = bookingCategory === "Day Access" ? "Service" : "Room";
      try {
        const res = await api.get("/tax-gst", {
          params: { type: taxType, activeOnly: "true" },
        });
        const taxes: TaxOption[] = res.data.data || [];
        setTaxOptions(taxes);
        setSelectedTaxId(taxes.length > 0 ? taxes[0]._id : "");
      } catch (err) {
        console.error("Error fetching taxes:", err);
      }
    };
    fetchTaxes();
  }, [bookingCategory]);

  // Update total nights
  useEffect(() => {
    const nights = differenceInDays(checkOutDate, checkInDate);
    setTotalNights(nights > 0 ? nights : 1);
  }, [checkInDate, checkOutDate]);

  // When check-in changes, ensure check-out remains after check-in
  useEffect(() => {
    if (checkInDate && checkOutDate && checkInDate.getTime() >= checkOutDate.getTime()) {
      setCheckOutDate(addDays(checkInDate, 1));
    }
  }, [checkInDate]);

  // Auto-select Day Access Package based on Booking Type
  useEffect(() => {
    if (bookingCategory === "Day Access" && accessPackages.length > 0) {
      if (bookingType === "Individual") {
        const pkg = accessPackages.find(
          (p) => p.packageName === "Premium Combo",
        );
        if (pkg) setSelectedPackageId(pkg._id);
      } else if (bookingType === "Corporate") {
        const pkg = accessPackages.find((p) => p.packageName === "Corporate");
        if (pkg) setSelectedPackageId(pkg._id);
      }
    }
  }, [bookingType, bookingCategory, accessPackages]);

  // Search available rooms
  const searchRooms = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill guest name and phone first");
      return;
    }
    setSearchingRooms(true);
    try {
      const params: { checkIn: string; checkOut: string; roomType?: string } = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
      };
      if (roomTypeFilter) params.roomType = roomTypeFilter;

      const res = await api.get("/bookings/available", { params });
      setSearchResults(res.data.data?.availableRooms || []);
    } catch (err: any) {
      console.log(err);
      toast.error(err.response?.data?.message || "Failed to search rooms");
    } finally {
      setSearchingRooms(false);
    }
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const selectedTax = taxOptions.find((t) => t._id === selectedTaxId);
    const taxRate = selectedTax ? selectedTax.percentage / 100 : 0;
    const addonTotal = selectedAddons.reduce((s, a) => s + a.total, 0);

    if (bookingCategory === "Day Access") {
      const pkg = accessPackages.find((p) => p._id === selectedPackageId);
      const rate = pkg ? pkg.adult_price : 0;
      const count = Number(adultsFilter) + Number(childrenFilter);
      const roomTotal = rate * count;
      const extraBedTotal = 0;
      const subtotal = roomTotal;
      const taxAmount = Math.round(subtotal * taxRate);
      const grandTotal = subtotal + taxAmount + addonTotal;
      const paidAmount = paymentForm.advanceAmount || 0;
      const dueAmount = grandTotal - paidAmount;
      return {
        roomTotal,
        extraBedTotal,
        addonTotal,
        subtotal,
        taxAmount,
        grandTotal,
        paidAmount,
        dueAmount,
      };
    }

    // Calculate based on all selected room types
    const roomTotal = selectedRoomTypes.reduce(
      (sum, entry) => sum + entry.basePrice * entry.count * totalNights,
      0,
    );
    const extraBedTotal = 0;
    const subtotal = roomTotal + extraBedTotal;
    const taxAmount = Math.round(subtotal * taxRate);
    const grandTotal = subtotal + taxAmount + addonTotal;
    const paidAmount = paymentForm.advanceAmount || 0;
    const dueAmount = grandTotal - paidAmount;

    return {
      roomTotal,
      extraBedTotal,
      addonTotal,
      subtotal,
      taxAmount,
      grandTotal,
      paidAmount,
      dueAmount,
    };
  }, [
    selectedRoomTypes,
    totalNights,
    selectedAddons,
    paymentForm.advanceAmount,
    bookingCategory,
    selectedPackageId,
    accessPackages,
    adultsFilter,
    childrenFilter,
    taxOptions,
    selectedTaxId,
  ]);

  const {
    roomTotal,
    extraBedTotal,
    addonTotal,
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
    if (bookingCategory === "Room Stay" && checkInDate.getTime() >= checkOutDate.getTime()) {
      toast.error("Check-out date must be after check-in date");
      return;
    }
    const validRooms = selectedRoomTypes.filter((e) => e.roomTypeId);
    if (bookingCategory === "Room Stay" && validRooms.length === 0) {
      toast.error("Please select at least one room type");
      return;
    }
    if (
      bookingCategory === "Room Stay" &&
      validRooms.some((e) => e.count < 1)
    ) {
      toast.error("Each room type must have a count of at least 1");
      return;
    }
    if (bookingCategory === "Day Access" && !selectedPackageId) {
      toast.error("Please select an access package");
      return;
    }
    if (
      sourceTab === "Travel Agent" &&
      (!travelAgentName || !travelAgentRefId)
    ) {
      toast.error("Please fill travel agent name and reference ID");
      return;
    }

    setLoading(true);
    try {
      const roomTypesData =
        bookingCategory === "Room Stay"
          ? validRooms.map((entry) => ({
              roomTypeId: entry.roomTypeId,
              roomTypeName: entry.roomTypeName,
              basePrice: entry.basePrice,
              count: entry.count,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              adults: entry.adults,
              children: entry.children,
            }))
          : undefined;

      const payload: any = {
        customerDetails: {
          name: customerForm.name,
          phone: customerForm.phone,
          ...(customerForm.email.trim()
            ? { email: customerForm.email.trim() }
            : {}),
        },
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
        addons: selectedAddons,
      };

      if (bookingCategory === "Day Access") {
        payload.accessPackageId = selectedPackageId;
        payload.visitDate = visitDate.toISOString();
      } else {
        payload.roomTypesData = roomTypesData;
        const totalAdultsPayload = validRooms.reduce(
          (s, e) => s + e.adults * e.count,
          0,
        );
        const totalChildrenPayload = validRooms.reduce(
          (s, e) => s + e.children * e.count,
          0,
        );
        payload.adults = totalAdultsPayload || adultsFilter;
        payload.children = totalChildrenPayload || childrenFilter;
      }

      if (bookingType === "Corporate") {
        payload.corporateDetails = corporateForm;
      }

      // Add travel agent reference when source is Travel Agent
      if (sourceTab === "Travel Agent" && travelAgentName && travelAgentRefId) {
        payload.travelAgentInfo = {
          name: travelAgentName,
          referenceId: travelAgentRefId,
        };
        // Also store reference ID in externalBookingId for OTA/Travel Agent tracking
        payload.externalBookingId = travelAgentRefId;
      }

      if (selectedTaxId) {
        payload.selectedTaxId = selectedTaxId;
      }

      const res = await api.put(`/bookings/${booking._id}`, payload);
      toast.success(res.data.message || "Booking updated successfully");

      if (refreshBookings) refreshBookings();
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
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-primary text-white">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold">Edit Reservation</h2>
              <p className="text-xs text-white/70">
                {bookingCategory === "Day Access"
                  ? `${format(visitDate, "dd MMM yyyy")} • Day Access`
                  : `${format(checkInDate, "dd MMM HH:mm")} - ${format(checkOutDate, "dd MMM HH:mm")} • ${totalNights} Night(s)`}
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
                <FiUser size={12} className="inline mr-1" /> Individual
              </button>
              <button
                onClick={() => setBookingType("Corporate")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingType === "Corporate" ? "bg-white text-blue-600" : "bg-blue-400 text-white"}`}
              >
                <FiBriefcase size={12} className="inline mr-1" /> Corporate
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* SECTION 1: Guest Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiUser size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Guest Information
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
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
              <div className="col-span-4">
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-2 block">
                  Source
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSourceTab("Direct")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      sourceTab === "Direct"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    onClick={() => setSourceTab("OTA")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      sourceTab === "OTA"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    OTA
                  </button>
                  <button
                    onClick={() => setSourceTab("Travel Agent")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      sourceTab === "Travel Agent"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Travel Agent
                  </button>
                </div>
                {/* Sub-options based on selected tab */}
                {sourceTab === "Direct" && (
                  <div className="mt-2 flex gap-2">
                    {["Walk-in", "Phone", "Website"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSource(option)}
                        className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-all ${
                          source === option
                            ? "bg-primary/20 text-primary border border-primary"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {sourceTab === "OTA" && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {["Booking.com", "Agoda", "Goibibo", "MakeMyTrip"].map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setSource(option)}
                          className={`py-1 px-2 rounded text-[10px] font-bold transition-all ${
                            source === option
                              ? "bg-primary/20 text-primary border border-primary"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          {option}
                        </button>
                      ),
                    )}
                  </div>
                )}
                {sourceTab === "Travel Agent" && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Travel Agent Name *
                      </label>
                      <input
                        type="text"
                        value={travelAgentName}
                        onChange={(e) => setTravelAgentName(e.target.value)}
                        className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                        placeholder="Agency name"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Reference ID *
                      </label>
                      <input
                        type="text"
                        value={travelAgentRefId}
                        onChange={(e) => setTravelAgentRefId(e.target.value)}
                        className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                        placeholder="e.g., TA-001, REF-123"
                      />
                    </div>
                    {/* Quick select from common agents */}
                    <div className="col-span-2 mt-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Quick Select
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { name: "ABC Travels", ref: "TA-001" },
                          { name: "XYZ Holidays", ref: "TA-002" },
                          { name: "Global Tours", ref: "TA-003" },
                        ].map((agent) => (
                          <button
                            key={agent.ref}
                            onClick={() => {
                              setTravelAgentName(agent.name);
                              setTravelAgentRefId(agent.ref);
                            }}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-200 transition-all"
                          >
                            {agent.name} ({agent.ref})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                <FiCalendar size={14} className="text-primary" />
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
                    onChange={(d: Date | null) => setVisitDate(d || new Date())}
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
                    {accessPackages
                      .filter((pkg) => {
                        if (bookingType === "Individual") {
                          return (
                            pkg.packageType === "Premium Combo" ||
                            pkg.packageName === "Premium Combo"
                          );
                        }
                        if (bookingType === "Corporate") {
                          return (
                            pkg.packageType === "Corporate" ||
                            pkg.packageName === "Corporate"
                          );
                        }
                        return true;
                      })
                      .map((pkg) => (
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
                <FiCalendar size={14} className="text-primary" />
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
                    onChange={(d: Date | null) =>
                      setCheckInDate(d || new Date())
                    }
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                    dateFormat="dd MMM HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Check Out
                  </label>
                  <DatePicker
                    selected={checkOutDate}
                    onChange={(date: Date | null) => {
                      if (!date) return;
                      const newDate = new Date(date);
                      // Ensure check-out is at least same day as check-in
                      if (newDate < checkInDate) {
                        setCheckOutDate(addDays(checkInDate, 1));
                      } else {
                        setCheckOutDate(newDate);
                      }
                    }}
                    className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                    dateFormat="dd MMM HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    minDate={checkInDate}
                  />
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
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiSearch size={12} />
                    )}
                    {searchingRooms ? "Searching..." : "Search"}
                  </button>
                </div>
                {/* Room Type Rows */}
                <div className="col-span-full mt-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-2">
                    Room Types & Counts *
                  </label>
                  <div className="space-y-2">
                    {selectedRoomTypes.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-6 gap-2 items-end"
                      >
                        {/* Room Type */}
                        <div className="col-span-2">
                          {idx === 0 && (
                            <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                              Room Type
                            </label>
                          )}
                          <select
                            value={entry.roomTypeId}
                            onChange={(e) => {
                              const t = roomTypes.find(
                                (rt: any) => rt._id === e.target.value,
                              );
                              setSelectedRoomTypes(
                                selectedRoomTypes.map((r) =>
                                  r.id === entry.id
                                    ? {
                                        ...r,
                                        roomTypeId: e.target.value,
                                        roomTypeName: t?.name || "",
                                        basePrice: t?.basePrice || 0,
                                      }
                                    : r,
                                ),
                              );
                            }}
                            className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none font-bold"
                          >
                            <option value="">-- Select Room Type --</option>
                            {roomTypes.map((t: any) => (
                              <option key={t._id} value={t._id}>
                                {t.name} (₹{t.basePrice}/night)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Count */}
                        <div>
                          {idx === 0 && (
                            <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                              Rooms
                            </label>
                          )}
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={entry.count}
                            onChange={(e) =>
                              setSelectedRoomTypes(
                                selectedRoomTypes.map((r) =>
                                  r.id === entry.id
                                    ? {
                                        ...r,
                                        count: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      }
                                    : r,
                                ),
                              )
                            }
                            className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none text-center font-bold"
                          />
                        </div>

                        {/* Adults */}
                        <div>
                          {idx === 0 && (
                            <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                              Adults
                            </label>
                          )}
                          <select
                            value={entry.adults}
                            onChange={(e) =>
                              setSelectedRoomTypes(
                                selectedRoomTypes.map((r) =>
                                  r.id === entry.id
                                    ? { ...r, adults: Number(e.target.value) }
                                    : r,
                                ),
                              )
                            }
                            className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                          >
                            {[1, 2, 3, 4].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Children */}
                        <div>
                          {idx === 0 && (
                            <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                              Children
                            </label>
                          )}
                          <select
                            value={entry.children}
                            onChange={(e) =>
                              setSelectedRoomTypes(
                                selectedRoomTypes.map((r) =>
                                  r.id === entry.id
                                    ? { ...r, children: Number(e.target.value) }
                                    : r,
                                ),
                              )
                            }
                            className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                          >
                            {[0, 1, 2, 3].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Subtotal + Remove */}
                        <div className="flex items-end gap-1">
                          <span className="text-xs font-bold text-primary flex-1 text-right pb-2">
                            ₹
                            {(
                              entry.basePrice *
                              entry.count *
                              totalNights
                            ).toLocaleString()}
                          </span>
                          {selectedRoomTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRoomTypes(
                                  selectedRoomTypes.filter(
                                    (r) => r.id !== entry.id,
                                  ),
                                )
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <FiX size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Row + Total Count */}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRoomTypes([
                          ...selectedRoomTypes,
                          {
                            id: `row-${Date.now()}`,
                            roomTypeId: "",
                            roomTypeName: "",
                            basePrice: 0,
                            count: 1,
                            adults: 1,
                            children: 0,
                          },
                        ])
                      }
                      className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                    >
                      <FiPlus size={12} /> Add Room Type
                    </button>
                    <span className="text-xs text-text-secondary font-bold">
                      {selectedRoomTypes.reduce((s, e) => s + e.count, 0)}{" "}
                      room(s) total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Available Rooms (only for Room Stay category) - Reference only */}
          {bookingCategory === "Room Stay" && searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                  <FiDollarSign size={14} className="text-primary" />
                  Available Rooms - Reference ({searchResults.length})
                </h4>
                <span className="text-xs text-text-secondary">
                  Room assignment at check-in
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.room._id}
                    className="p-3 rounded-xl border border-border bg-gray-50"
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
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-600">
                        Available
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.amenities.slice(0, 3).map((a) => {
                        const Icon = amenityIcons[a.icon] || FiWifi;
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
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: Special Requests & Internal Notes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiMessageSquare size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Special Requests & Notes
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                  <FiFileText size={10} /> Special Requests (Guest)
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
                  <FiMessageSquare size={10} /> Internal Notes (Staff Only)
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
                <FiPhone size={14} className="text-primary" />
                Vehicle Details
              </h4>
              <button
                onClick={addVehicle}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <FiPlus size={12} /> Add Vehicle
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
                        <FiX size={12} />
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

          {/* SECTION 7: Add-on Services */}
          {extraServices.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiPlus size={14} className="text-purple-600" />
                <h3 className="font-bold text-purple-800 text-sm">
                  Add-on Services
                </h3>
                <span className="text-[10px] text-purple-500">
                  Optional services included with stay
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {extraServices.map((service) => {
                  const existing = selectedAddons.find(
                    (a) => a.serviceId === service._id,
                  );
                  const isSelected = !!existing;
                  return (
                    <div
                      key={service._id}
                      className={`rounded-lg border-2 p-3 transition-all ${isSelected ? "border-purple-500 bg-purple-100" : "border-purple-200 bg-white hover:border-purple-300"}`}
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons([
                                ...selectedAddons,
                                {
                                  serviceId: service._id,
                                  serviceName: service.name,
                                  quantity: 1,
                                  rate: service.price ?? 0,
                                  total: service.price ?? 0,
                                },
                              ]);
                            } else {
                              setSelectedAddons(
                                selectedAddons.filter(
                                  (a) => a.serviceId !== service._id,
                                ),
                              );
                            }
                          }}
                          className="w-4 h-4 accent-purple-600 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-purple-800 block truncate">
                            {service.name}
                          </span>
                          <span className="text-[10px] text-purple-500">
                            ₹{(service.price ?? 0).toLocaleString()}/unit
                          </span>
                        </div>
                      </label>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-[10px] text-purple-600 font-bold">
                            Qty
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={existing.quantity}
                            onChange={(e) => {
                              const qty = Math.max(1, Number(e.target.value));
                              setSelectedAddons(
                                selectedAddons.map((a) =>
                                  a.serviceId === service._id
                                    ? {
                                        ...a,
                                        quantity: qty,
                                        total: qty * a.rate,
                                      }
                                    : a,
                                ),
                              );
                            }}
                            className="w-14 border border-purple-300 rounded px-1 py-0.5 text-[11px] text-center"
                          />
                          <span className="text-[10px] font-bold text-purple-700 ml-auto">
                            ₹
                            {(
                              existing.quantity * existing.rate
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedAddons.length > 0 && (
                <div className="mt-3 pt-2 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-purple-600">
                    {selectedAddons.length} service(s) selected
                  </span>
                  <span className="text-[11px] font-black text-purple-800">
                    Add-on Total: ₹
                    {selectedAddons
                      .reduce((s, a) => s + a.total, 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 8: Payment */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiCreditCard size={14} className="text-primary" />
              <h3 className="font-bold text-text-primary text-sm">
                Payment Details
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">
                  Tax / GST
                </label>
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
                  {addonTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Add-on Services</span>
                      <span className="font-bold">
                        ₹{addonTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">
                        {(() => {
                          const t = taxOptions.find(
                            (x) => x._id === selectedTaxId,
                          );
                          return t ? `${t.name} (${t.percentage}%)` : "Tax";
                        })()}
                      </span>
                      <span className="font-bold">
                        ₹{taxAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
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
              (bookingCategory === "Room Stay" &&
                !selectedRoomTypes.some((e) => e.roomTypeId)) ||
              (bookingCategory === "Day Access" && !selectedPackageId)
            }
            className="px-8 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiCheckCircle size={16} />
            )}
            {loading ? "Saving..." : "Update Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
