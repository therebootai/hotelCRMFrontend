import { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiUser,
  FiBriefcase,
  FiCheckCircle,
  FiSearch,
  FiLoader,
  FiPhone,
  FiPlus,
  FiDollarSign,
  FiMapPin,
  FiMail,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, addDays } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import BookingConfirmationReceipt from "./BookingConfirmationReceipt";

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

interface TaxOption {
  _id: string;
  name: string;
  percentage: number;
  type: "Room" | "Food" | "Service";
  isActive: boolean;
}

// Metadata decorator for room types to display sqft, beds, occupancy, and premium images matching mockup
const getRoomTypeMeta = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes("deluxe")) {
    return {
      size: "250 sq.ft.",
      beds: "King Bed",
      occupancy: "2 + 1",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&h=80&fit=crop&q=60",
    };
  }
  if (lowercaseName.includes("premium")) {
    return {
      size: "300 sq.ft.",
      beds: "King Bed",
      occupancy: "2 + 1",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=120&h=80&fit=crop&q=60",
    };
  }
  if (lowercaseName.includes("family")) {
    return {
      size: "450 sq.ft.",
      beds: "2 King Bed",
      occupancy: "4 + 2",
      image:
        "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=120&h=80&fit=crop&q=60",
    };
  }
  if (lowercaseName.includes("luxury") || lowercaseName.includes("suite")) {
    return {
      size: "600 sq.ft.",
      beds: "King Bed",
      occupancy: "2 + 1",
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&h=80&fit=crop&q=60",
    };
  }
  return {
    size: "200 sq.ft.",
    beds: "Queen Bed",
    occupancy: "2 + 0",
    image:
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=120&h=80&fit=crop&q=60",
  };
};

// Custom visual counter component
const Counter = ({ value, onChange, min = 0, max = 10 }: any) => (
  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white h-9">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="px-3 h-full hover:bg-slate-50 disabled:opacity-30 text-text-secondary transition-all font-bold"
    >
      -
    </button>
    <span className="w-10 text-center font-bold text-sm text-text-primary">
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="px-3 h-full hover:bg-slate-50 disabled:opacity-30 text-text-secondary transition-all font-bold"
    >
      +
    </button>
  </div>
);

const CreateBooking = ({
  onClose,
  refreshBookings,
  booking,
  onEditNewlyCreated,
}: {
  onClose: () => void;
  refreshBookings?: () => void;
  booking?: any;
  onEditNewlyCreated?: (booking: any) => void;
}) => {
  // State
  const [loading, setLoading] = useState(false);
  const [searchingRooms, setSearchingRooms] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

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
  const [adultsFilter, setAdultsFilter] = useState(2);
  const [childrenFilter, setChildrenFilter] = useState(0);

  // Specific Room Assignment
  const [isAssignSpecificRoom, setIsAssignSpecificRoom] = useState(false);
  const [availablePhysicalRooms, setAvailablePhysicalRooms] = useState<any[]>(
    [],
  );
  const [fetchingPhysicalRooms, setFetchingPhysicalRooms] = useState(false);
  const [selectedSpecificRooms, setSelectedSpecificRooms] = useState<
    Record<
      string,
      {
        adults: number;
        children: number;
        roomTypeId: string;
        roomTypeName: string;
        basePrice: number;
        roomNumber: string;
      }
    >
  >({});

  // Confirmed Booking State
  const [confirmedBookingDetails, setConfirmedBookingDetails] =
    useState<any>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Search Results
  const [searchResults, setSearchResults] = useState<RoomSearchResult[]>([]);

  // Room Types List
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  // Selected Room Counts mapping: roomTypeId -> { count, adults, children }
  const [selectedCounts, setSelectedCounts] = useState<
    Record<string, { count: number; adults: number; children: number }>
  >({});

  // Customer Details
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Corporate Details
  const [corporateForm, setCorporateForm] = useState({
    companyName: "",
    gstNumber: "",
    contactPerson: "",
    mobile: "",
    negotiatedRate: 0,
  });

  // Source & Tabs
  const [sourceTab, setSourceTab] = useState<string>("Direct / Phone");
  const [source, setSource] = useState("Phone");

  // OTA / Travel Agent specifics
  const [travelAgentName, setTravelAgentName] = useState("");
  const [travelAgentRefId, setTravelAgentRefId] = useState("");

  // Purpose of visit (Section A)
  const [purposeOfVisit, setPurposeOfVisit] = useState("Leisure / Holiday");

  // Booking Status (Section F)
  const [bookingStatus, setBookingStatus] = useState("Tentative");

  const [remarks, setRemarks] = useState("");

  const [specialRequests] = useState("");
  const [internalNotes] = useState("");

  // Vehicles
  const [vehicles, setVehicles] = useState<
    {
      vehicleNumber: string;
      vehicleType: string;
      driverName: string;
      driverContact: string;
    }[]
  >([]);

  // Initialize from booking prop if editing
  useEffect(() => {
    if (booking) {
      setBookingCategory(booking.bookingCategory || "Room Stay");
      setBookingType(booking.bookingType || "Individual");

      if (booking.overallCheckInDate)
        setCheckInDate(new Date(booking.overallCheckInDate));
      if (booking.overallCheckOutDate)
        setCheckOutDate(new Date(booking.overallCheckOutDate));
      if (booking.visitDate) setVisitDate(new Date(booking.visitDate));

      // Map rooms array to selectedCounts and specific rooms
      if (booking.rooms && booking.rooms.length > 0) {
        const counts: Record<
          string,
          { count: number; adults: number; children: number }
        > = {};
        const specificRooms: Record<string, any> = {};

        booking.rooms.forEach((r: any) => {
          const typeId = r.roomType?._id || r.roomType;
          if (counts[typeId]) {
            counts[typeId].count += 1;
            counts[typeId].adults += r.adults || 1;
            counts[typeId].children += r.children || 0;
          } else {
            counts[typeId] = {
              count: 1,
              adults: r.adults || 1,
              children: r.children || 0,
            };
          }

          if (r.roomId) {
            const rId = r.roomId?._id || r.roomId;
            specificRooms[rId] = {
              adults: r.adults || 1,
              children: r.children || 0,
              roomTypeId: typeId,
              roomTypeName: r.roomType?.name || "",
              basePrice: r.pricePerNight || r.roomType?.basePrice || 0,
              discountPercentage: r.discountPercentage || r.roomId?.discountPercentage || 0,
              roomNumber: r.roomId?.roomNumber || "",
            };
          }
        });
        setSelectedCounts(counts);
        setSelectedSpecificRooms(specificRooms);
      }

      setCustomerForm({
        name: booking.customerId?.name || booking.bookingContact?.name || "",
        phone:
          booking.customerId?.phone || booking.bookingContact?.mobile || "",
        email: booking.customerId?.email || booking.bookingContact?.email || "",
        address: booking.customerId?.address || "",
      });

      if (booking.corporateDetails) {
        setCorporateForm({
          companyName: booking.corporateDetails.companyName || "",
          gstNumber: booking.corporateDetails.gstNumber || "",
          contactPerson: booking.corporateDetails.contactPerson || "",
          mobile: booking.corporateDetails.mobile || "",
          negotiatedRate: booking.corporateDetails.negotiatedRate || 0,
        });
      }

      // Source tab & specific source
      const src = booking.source || "Walk-in";
      setSource(src);
      if (src === "Walk-in" || src === "Phone" || src === "Website") {
        setSourceTab("Direct / Phone");
      } else if (src === "Travel Agent") {
        setSourceTab("Travel Agent");
        if (booking.travelAgentInfo) {
          setTravelAgentName(
            booking.travelAgentInfo.name ||
              booking.travelAgentInfo.agentName ||
              "",
          );
          setTravelAgentRefId(booking.travelAgentInfo.referenceId || "");
        }
      } else {
        setSourceTab("OTA");
      }

      setPurposeOfVisit(booking.purposeOfVisit || "Leisure / Holiday");
      setRemarks(booking.notes || booking.remarks || "");
      setBookingStatus(booking.status || "Tentative");

      if (booking.addons) {
        setSelectedAddons(booking.addons);
      }

      if (booking.vehicleDetails && Array.isArray(booking.vehicleDetails)) {
        setVehicles(booking.vehicleDetails);
      }

      setPaymentForm({
        advanceAmount: booking.advanceAmount || 0,
        paymentMode: booking.paymentMode || "UPI",
        paymentRemarks: booking.paymentRemarks || "",
      });

      if (booking.taxGstId) {
        setSelectedTaxId(booking.taxGstId?._id || booking.taxGstId);
      }
    }
  }, [booking]);

  // Add-on Services
  const [extraServices, setExtraServices] = useState<
    { _id: string; name: string; price: number; taxPercentage?: number }[]
  >([]);
  const [selectedAddons, setSelectedAddons] = useState<
    {
      serviceId: string;
      serviceName: string;
      quantity: number;
      rate: number;
      total: number;
      taxPercentage: number;
      taxAmount: number;
    }[]
  >([]);

  // Payment
  const [paymentForm, setPaymentForm] = useState({
    advanceAmount: 0,
    paymentMode: "UPI",
    paymentRemarks: "",
  });

  // Tax
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState("");

  // Load room types, access packages and services
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

  // Fetch available physical rooms if specific room assignment is checked
  useEffect(() => {
    if (
      isAssignSpecificRoom &&
      bookingCategory === "Room Stay" &&
      checkInDate &&
      checkOutDate
    ) {
      const fetchPhysicalRooms = async () => {
        setFetchingPhysicalRooms(true);
        try {
          const params: any = {
            checkIn: checkInDate.toISOString(),
            checkOut: checkOutDate.toISOString(),
          };
          if (booking?._id) {
            params.excludeBookingId = booking._id;
          }
          const res = await api.get("/bookings/available", { params });
          // Filter out unavailable rooms just in case
          const rooms = (res.data.data?.availableRooms || []).filter(
            (r: any) => r.isAvailable,
          );
          setAvailablePhysicalRooms(rooms);
        } catch (error) {
          console.error("Failed to fetch available physical rooms", error);
        } finally {
          setFetchingPhysicalRooms(false);
        }
      };
      fetchPhysicalRooms();
    }
  }, [isAssignSpecificRoom, checkInDate, checkOutDate, bookingCategory]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const checkInTime = checkInDate.getTime();
      const checkOutTime = checkOutDate.getTime();
      if (
        checkInTime >= checkOutTime &&
        checkInDate.toDateString() === checkOutDate.toDateString()
      ) {
        setCheckOutDate(addDays(checkInDate, 1));
      }
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
    setSearchingRooms(true);
    try {
      const params: any = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
      };
      if (booking?._id) {
        params.excludeBookingId = booking._id;
      }
      const res = await api.get("/bookings/available", { params });
      setSearchResults(res.data.data?.availableRooms || []);
    } catch (err: any) {
      console.error("Failed to search rooms:", err);
    } finally {
      setSearchingRooms(false);
    }
  };

  // Trigger room search whenever dates change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchRooms();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [checkInDate, checkOutDate]);

  // Get available rooms count for specific room type ID
  const getAvailableCountForType = (roomTypeId: string) => {
    return searchResults.filter((result) => result.roomType?._id === roomTypeId)
      .length;
  };

  // Handle source tabs selection
  const handleSourceTabClick = (tabId: string) => {
    setSourceTab(tabId);
    if (tabId === "Corporate") {
      setBookingType("Corporate");
      setSource("Corporate");
    } else {
      setBookingType("Individual");
      if (tabId === "Direct / Phone") setSource("Phone");
      else if (tabId === "Walk-in") setSource("Walk-in");
      else if (tabId === "Website") setSource("Website");
      else if (tabId === "OTA / Channel") setSource("Booking.com");
    }
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {


    const selectedRoomTypesList = roomTypes
      .filter((rt) => selectedCounts[rt._id]?.count > 0)
      .map((rt) => ({
        roomTypeId: rt._id,
        roomTypeName: rt.name,
        basePrice: rt.basePrice,
        discountPercentage: rt.discountPercentage || 0,
        count: selectedCounts[rt._id].count,
        adults: selectedCounts[rt._id].adults,
        children: selectedCounts[rt._id].children,
      }));

    let roomTotal = 0;
    let roomTaxAmount = 0;
    const roomBreakdown: { name: string; price: number }[] = [];
    const roomTaxBreakdown: {
      name: string;
      taxPercentage: number;
      taxAmount: number;
    }[] = [];

    if (bookingCategory === "Day Access") {
      const pkg = accessPackages.find((p) => p._id === selectedPackageId);
      const adultRate = pkg ? (pkg.adult_price || 0) : 0;
      const childRate = pkg ? (pkg.child_price || 0) : 0;
      const adultsCount = Number(adultsFilter) || 0;
      const childrenCount = Number(childrenFilter) || 0;
      roomTotal = (adultRate * adultsCount) + (childRate * childrenCount);
      roomBreakdown.push({
        name: `Day Access (${adultsCount} Adult(s), ${childrenCount} Child(ren))`,
        price: roomTotal,
      });

      const pkgTaxPercentage = pkg?.taxPercentage || 0;
      const taxAmt = roomTotal * (pkgTaxPercentage / 100);
      roomTaxAmount += taxAmt;
      roomTaxBreakdown.push({
        name: `Day Access Tax`,
        taxPercentage: pkgTaxPercentage,
        taxAmount: taxAmt,
      });
    } else {
      if (isAssignSpecificRoom) {
        Object.values(selectedSpecificRooms).forEach((room: any) => {
          const discount = room.discountPercentage || 0;
          const discountedRate = room.basePrice * (1 - discount / 100);
          const rTotal = discountedRate * totalNights;
          roomTotal += rTotal;
          roomBreakdown.push({
            name: `Room ${room.roomNumber}`,
            price: rTotal,
          });

          const rt = roomTypes.find((r) => r._id === room.roomTypeId);
          const taxPercentage = rt?.gstId?.percentage || 0;
          const taxAmt = rTotal * (taxPercentage / 100);
          roomTaxAmount += taxAmt;
          if (taxAmt > 0 || taxPercentage > 0) {
            roomTaxBreakdown.push({
              name: `Room ${room.roomNumber} Tax`,
              taxPercentage,
              taxAmount: taxAmt,
            });
          }
        });
      } else {
        selectedRoomTypesList.forEach((entry) => {
          const discountedRate = entry.basePrice * (1 - (entry.discountPercentage || 0) / 100);
          const rTotal = discountedRate * entry.count * totalNights;
          roomTotal += rTotal;
          roomBreakdown.push({
            name: `${entry.roomTypeName} (${entry.count} Rooms)`,
            price: rTotal,
          });

          const rt = roomTypes.find((r) => r._id === entry.roomTypeId);
          const taxPercentage = rt?.gstId?.percentage || 0;
          const taxAmt = rTotal * (taxPercentage / 100);
          roomTaxAmount += taxAmt;
          if (taxAmt > 0 || taxPercentage > 0) {
            roomTaxBreakdown.push({
              name: `${entry.roomTypeName} Tax`,
              taxPercentage,
              taxAmount: taxAmt,
            });
          }
        });
      }
    }

    let addonsTotal = 0;
    let addonsTaxAmount = 0;
    selectedAddons.forEach((a: any) => {
      const aTotal = Number(a.total) || 0;
      const aTaxAmt = Number(a.taxAmount) || 0;
      addonsTotal += aTotal;
      addonsTaxAmount += aTaxAmt;
    });

    const subtotal = roomTotal + addonsTotal;
    const taxAmount = Math.round(roomTaxAmount + addonsTaxAmount);

    const grandTotal = subtotal + taxAmount;
    const paidAmount = paymentForm.advanceAmount || 0;
    const dueAmount = grandTotal - paidAmount;

    return {
      roomTotal,
      roomBreakdown,
      roomTaxBreakdown,
      subtotal,
      taxAmount,
      grandTotal,
      paidAmount,
      dueAmount,
    };
  }, [
    roomTypes,
    selectedCounts,
    totalNights,
    paymentForm.advanceAmount,
    bookingCategory,
    selectedPackageId,
    accessPackages,
    adultsFilter,
    childrenFilter,
    taxOptions,
    selectedTaxId,
    selectedAddons,
    isAssignSpecificRoom,
    selectedSpecificRooms,
  ]);

  const { roomBreakdown, roomTaxBreakdown, taxAmount, grandTotal } =
    calculateTotals();

  const handlePreSubmit = () => {
    const paidAmount = paymentForm.advanceAmount || 0;
    if (paidAmount > grandTotal) {
      setShowPaymentWarning(true);
    } else {
      submitBooking();
    }
  };

  // Submit booking
  const submitBooking = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill guest name and phone");
      return;
    }

    const selectedRoomTypesList = roomTypes
      .filter((rt) => selectedCounts[rt._id]?.count > 0)
      .map((rt) => ({
        roomTypeId: rt._id,
        roomTypeName: rt.name,
        basePrice: rt.basePrice,
        count: selectedCounts[rt._id].count,
        adults: selectedCounts[rt._id].adults,
        children: selectedCounts[rt._id].children,
      }));

    if (
      bookingCategory === "Room Stay" &&
      !isAssignSpecificRoom &&
      selectedRoomTypesList.length === 0
    ) {
      toast.error("Please select at least one room type");
      return;
    }
    if (
      bookingCategory === "Room Stay" &&
      isAssignSpecificRoom &&
      Object.keys(selectedSpecificRooms).length === 0
    ) {
      toast.error("Please select at least one specific room");
      return;
    }
    if (bookingCategory === "Day Access" && !selectedPackageId) {
      toast.error("Please select an access package");
      return;
    }
    if (source === "Travel Agent" && (!travelAgentName || !travelAgentRefId)) {
      toast.error("Please fill travel agent name and reference ID");
      return;
    }

    setLoading(true);
    try {
      const roomTypesData =
        bookingCategory === "Room Stay" && !isAssignSpecificRoom
          ? selectedRoomTypesList.map((entry) => ({
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

      const roomsData =
        bookingCategory === "Room Stay" && isAssignSpecificRoom
          ? Object.entries(selectedSpecificRooms).map(([roomId, data]) => ({
              roomId,
              roomType: data.roomTypeId,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              adults: data.adults,
              children: data.children,
              pricePerNight: data.basePrice,
            }))
          : undefined;

      const mergedSpecialRequests = [
        `[Purpose: ${purposeOfVisit}]`,
        specialRequests,
        remarks,
      ]
        .filter(Boolean)
        .join(" | ");

      const payload: any = {
        customerDetails: {
          name: customerForm.name,
          phone: customerForm.phone,
          address: customerForm.address,
          ...(customerForm.email.trim()
            ? { email: customerForm.email.trim() }
            : {}),
        },
        bookingCategory,
        bookingType,
        source,
        status: bookingStatus,
        advanceAmount: paymentForm.advanceAmount,
        paymentMode:
          paymentForm.advanceAmount > 0 ? paymentForm.paymentMode : undefined,
        paymentRemarks:
          paymentForm.advanceAmount > 0
            ? paymentForm.paymentRemarks
            : undefined,
        specialRequests: mergedSpecialRequests,
        internalNotes,
        vehicleDetails: vehicles,
        adults: adultsFilter,
        children: childrenFilter,
        addons: selectedAddons,
        roomTypesData,
        rooms: roomsData,
        expiresAt: undefined,
      };

      if (bookingCategory === "Day Access") {
        payload.accessPackageId = selectedPackageId;
        payload.visitDate = visitDate.toISOString();
      } else {
        payload.roomTypesData = roomTypesData;
        const totalAdultsPayload = selectedRoomTypesList.reduce(
          (s, e) => s + e.adults * e.count,
          0,
        );
        const totalChildrenPayload = selectedRoomTypesList.reduce(
          (s, e) => s + e.children * e.count,
          0,
        );
        payload.adults = totalAdultsPayload || adultsFilter;
        payload.children = totalChildrenPayload || childrenFilter;
      }

      if (bookingType === "Corporate") {
        payload.corporateDetails = corporateForm;
      }

      if (source === "Travel Agent" && travelAgentName && travelAgentRefId) {
        payload.travelAgentInfo = {
          name: travelAgentName,
          referenceId: travelAgentRefId,
        };
        payload.externalBookingId = travelAgentRefId;
      }

      if (selectedTaxId) {
        payload.selectedTaxId = selectedTaxId;
      }

      let res;
      const targetId = booking?._id || createdBookingId;
      if (targetId) {
        res = await api.put(`/bookings/${targetId}`, payload);
        toast.success(res.data.message || "Booking updated successfully");
      } else {
        res = await api.post("/bookings/create", payload);
        toast.success(res.data.message || "Booking created successfully");
        const newBookingId = res.data.data.booking?._id || res.data.data._id;
        setCreatedBookingId(newBookingId);
      }

      if (refreshBookings) {
        refreshBookings();
      }

      const responseData = res.data.data.booking || res.data.data;

      if (
        responseData.rooms &&
        Array.isArray(responseData.rooms) &&
        payload.roomTypesData
      ) {
        responseData.rooms = responseData.rooms.map((r: any, idx: number) => {
          const match = payload.roomTypesData[idx];
          if (match && (typeof r.roomType === "string" || !r.roomType?.name)) {
            r.roomType = {
              _id:
                typeof r.roomType === "string" ? r.roomType : r.roomType?._id,
              name: match.roomTypeName,
            };
          }
          return r;
        });
      }

      const savedBooking = { ...responseData, isSaved: true, isEdit: true };
      setConfirmedBookingDetails(savedBooking);
      setLoading(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to save booking",
      );
      setLoading(false);
    }
  };

  const totalRoomsNeeded = roomTypes.reduce(
    (sum, rt) => sum + (selectedCounts[rt._id]?.count || 0),
    0,
  );

  if (confirmedBookingDetails) {
    return (
      <BookingConfirmationReceipt
        booking={confirmedBookingDetails}
        onBack={onClose}
        onSave={refreshBookings}
        onEdit={() => {
          if (onEditNewlyCreated && !booking) {
            onEditNewlyCreated(confirmedBookingDetails);
          } else {
            setConfirmedBookingDetails(null);
          }
        }}
        onCreateAnother={() => {
          setConfirmedBookingDetails(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 new-booking-modal-container">
      <style>{`
 /* Scoped to the new booking modal only to prevent leaks */
 .new-booking-modal-container .custom-sidebar-scroll::-webkit-scrollbar {
 width: 6px;
 height: 6px;
 }
 .new-booking-modal-container .custom-sidebar-scroll::-webkit-scrollbar-track {
 background: transparent;
 }
 .new-booking-modal-container .custom-sidebar-scroll::-webkit-scrollbar-thumb {
 background: #cbd5e1;
 border-radius: 9999px;
 }
 .new-booking-modal-container .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
 background: #94a3b8;
 }

 /* Scaled SVG Icons based on current font-size */
 .new-booking-modal-container svg {
 width: 1.2em !important;
 height: 1.2em !important;
 }
 
 /* Icon positioning relative to input padding */
 .new-booking-modal-container .relative > svg {
 left: 0.75rem !important;
 }
 .new-booking-modal-container .relative > svg + input {
 padding-left: 2.5rem !important;
 }
 
 /* Tablet & Mobile Layout Enhancements */
 @media (max-width: 1023px) {
 .new-booking-modal-container .new-booking-modal-card {
 height: 96vh !important;
 max-height: 96vh !important;
 }
 }
 
 /* Laptop & Small Desktop Screen optimizations */
 @media (min-width: 1440px) {
 .new-booking-modal-container .new-booking-modal-card {
 max-width: 1400px !important;
 }
 .new-booking-modal-container .text-sm { font-size: 0.85rem !important; }
 .new-booking-modal-container .text-[10px] { font-size: 0.75rem !important; }
 .new-booking-modal-container .text-base { font-size: 1rem !important; }
 .new-booking-modal-container .p-2 { padding: 0.625rem !important; }
 .new-booking-modal-container .p-3 { padding: 0.75rem !important; }
 .new-booking-modal-container .p-4 { padding: 1.25rem !important; }
 .new-booking-modal-container .p-5 { padding: 1.5rem !important; }
 .new-booking-modal-container .p-6 { padding: 2rem !important; }
 .new-booking-modal-container .gap-3 { gap: 1rem !important; }
 .new-booking-modal-container .gap-4 { gap: 1.25rem !important; }
 .new-booking-modal-container .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; }
 .new-booking-modal-container .relative > svg { left: 0.75rem !important; }
 .new-booking-modal-container .relative > svg + input { padding-left: 2.5rem !important; }
 }

 /* Large Laptops / Full HD Desktops (Original size, scaled up slightly for better visibility) */
 @media (min-width: 1920px) {
 .new-booking-modal-container .new-booking-modal-card {
 max-width: 1760px !important;
 }
 .new-booking-modal-container .text-[9px] { font-size: 0.75rem !important; }
 .new-booking-modal-container .text-[10px] { font-size: 0.85rem !important; }
 .new-booking-modal-container .text-sm { font-size: 0.95rem !important; }
 .new-booking-modal-container .text-base { font-size: 1.1rem !important; }
 .new-booking-modal-container .text-base { font-size: 1.25rem !important; }
 .new-booking-modal-container .text-lg { font-size: 1.45rem !important; }
 .new-booking-modal-container .p-2 { padding: 0.85rem !important; }
 .new-booking-modal-container .p-3 { padding: 1.05rem !important; }
 .new-booking-modal-container .p-4 { padding: 1.55rem !important; }
 .new-booking-modal-container .p-5 { padding: 2.1rem !important; }
 .new-booking-modal-container .p-6 { padding: 2.65rem !important; }
 .new-booking-modal-container .gap-3 { gap: 1.35rem !important; }
 .new-booking-modal-container .gap-4 { gap: 1.65rem !important; }
 .new-booking-modal-container .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem !important; }
 .new-booking-modal-container input, 
 .new-booking-modal-container select, 
 .new-booking-modal-container textarea {
 font-size: 1rem !important;
 padding: 0.8rem 1.05rem !important;
 }
 .new-booking-modal-container .relative > svg { left: 0.95rem !important; }
 .new-booking-modal-container .relative > svg + input { padding-left: 3.15rem !important; }
 .new-booking-modal-container button {
 font-size: 1rem !important;
 }
 .new-booking-modal-container .h-9 {
 height: 2.85rem !important;
 }
 .new-booking-modal-container .h-9 button {
 font-size: 1.5rem !important;
 }
 .new-booking-modal-container .h-9 span {
 font-size: 1.2rem !important;
 }
 }

 /* 2K / QHD Displays (Boro Screen - Scaled up further) */
 @media (min-width: 2560px) {
 .new-booking-modal-container .new-booking-modal-card {
 max-width: 2450px !important;
 height: 90vh !important;
 }
 .new-booking-modal-container .text-[9px] { font-size: 0.9rem !important; }
 .new-booking-modal-container .text-[10px] { font-size: 1rem !important; }
 .new-booking-modal-container .text-sm { font-size: 1.15rem !important; }
 .new-booking-modal-container .text-base { font-size: 1.3rem !important; }
 .new-booking-modal-container .text-base { font-size: 1.45rem !important; }
 .new-booking-modal-container .text-lg { font-size: 1.7rem !important; }
 .new-booking-modal-container .p-2 { padding: 1.15rem !important; }
 .new-booking-modal-container .p-3 { padding: 1.45rem !important; }
 .new-booking-modal-container .p-4 { padding: 2.25rem !important; }
 .new-booking-modal-container .p-5 { padding: 2.95rem !important; }
 .new-booking-modal-container .p-6 { padding: 3.75rem !important; }
 .new-booking-modal-container .gap-3 { gap: 1.85rem !important; }
 .new-booking-modal-container .gap-4 { gap: 2.35rem !important; }
 .new-booking-modal-container .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem !important; }
 .new-booking-modal-container input, 
 .new-booking-modal-container select, 
 .new-booking-modal-container textarea {
 font-size: 1.25rem !important;
 padding: 1.1rem 1.5rem !important;
 }
 .new-booking-modal-container .relative > svg { left: 1.25rem !important; }
 .new-booking-modal-container .relative > svg + input { padding-left: 4.15rem !important; }
 .new-booking-modal-container button {
 font-size: 1.25rem !important;
 }
 .new-booking-modal-container .h-9 {
 height: 3.5rem !important;
 }
 .new-booking-modal-container .h-9 button {
 font-size: 1.8rem !important;
 }
 .new-booking-modal-container .h-9 span {
 font-size: 1.55rem !important;
 }
 }

 /* 34" Ultrawide / 4K Displays (Boro Screen minimum 34 inch responsive) */
 @media (min-width: 3440px) {
 .new-booking-modal-container .new-booking-modal-card {
 max-width: 3100px !important;
 height: 88vh !important;
 }
 .new-booking-modal-container .text-[9px] { font-size: 1.4rem !important; }
 .new-booking-modal-container .text-[10px] { font-size: 1.55rem !important; }
 .new-booking-modal-container .text-sm { font-size: 1.75rem !important; }
 .new-booking-modal-container .text-base { font-size: 2rem !important; }
 .new-booking-modal-container .text-base { font-size: 2.3rem !important; }
 .new-booking-modal-container .text-lg { font-size: 2.8rem !important; }
 .new-booking-modal-container .p-2 { padding: 1.25rem !important; }
 .new-booking-modal-container .p-3 { padding: 1.65rem !important; }
 .new-booking-modal-container .p-4 { padding: 2.65rem !important; }
 .new-booking-modal-container .p-5 { padding: 3.35rem !important; }
 .new-booking-modal-container .p-6 { padding: 4.25rem !important; }
 .new-booking-modal-container .gap-3 { gap: 2.15rem !important; }
 .new-booking-modal-container .gap-4 { gap: 2.65rem !important; }
 .new-booking-modal-container .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.75rem !important; }
 .new-booking-modal-container input, 
 .new-booking-modal-container select, 
 .new-booking-modal-container textarea {
 font-size: 1.75rem !important;
 padding: 1.25rem 1.75rem !important;
 border-radius: 0.75rem !important;
 }
 .new-booking-modal-container .relative > svg { left: 1.5rem !important; }
 .new-booking-modal-container .relative > svg + input { padding-left: 5rem !important; }
 .new-booking-modal-container button {
 font-size: 1.75rem !important;
 padding: 1.15rem 1.75rem !important;
 border-radius: 0.75rem !important;
 }
 .new-booking-modal-container .h-9 {
 height: 4rem !important;
 }
 .new-booking-modal-container .h-9 button {
 font-size: 2rem !important;
 padding-left: 1.35rem !important;
 padding-right: 1.35rem !important;
 }
 .new-booking-modal-container .h-9 span {
 font-size: 1.75rem !important;
 width: 4rem !important;
 }
 /* Custom overrides for image dimensions and other visual sizes */
 .new-booking-modal-container td img {
 width: 6.5rem !important;
 height: 4.5rem !important;
 border-radius: 0.75rem !important;
 }
 }
 `}</style>
      <div className="new-booking-modal-card bg-background w-full max-w-[95vw] xl:max-w-350 2xl:max-w-400 h-[95vh] rounded-2xl shadow-modal overflow-hidden flex flex-col transition-all">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-lg font-black text-text-primary">
                {booking
                  ? "Edit Reservation"
                  : "Step 1: New Room Booking / Reservation"}
              </h2>
              <p className="text-sm text-text-secondary">
                {booking
                  ? `Editing booking ${booking.bookingId}`
                  : "Create a new reservation for your guest"}
              </p>
            </div>

            {/* Booking Category Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBookingCategory("Room Stay")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  bookingCategory === "Room Stay"
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Room Stay
              </button>
              <button
                type="button"
                onClick={() => setBookingCategory("Day Access")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  bookingCategory === "Day Access"
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Day Access
              </button>
            </div>

            {/* Quick Reservation Type Info Box */}
            <div className="hidden md:flex gap-2">
              <span className="px-3 py-1.5 bg-slate-50 border border-border rounded-xl text-[10px] 3xl:text-[12px] font-black text-text-secondary">
                Booking ID (Auto)
              </span>
              <span className="px-3 py-1.5 bg-slate-50 border border-border rounded-xl text-[10px] 3xl:text-[12px] font-black text-text-secondary">
                Date: {format(new Date(), "dd MMM yyyy, hh:mm a")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-text-secondary hover:text-text-primary"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* 2-Column Main Layout Grid */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          {/* LEFT COLUMN (Scrollable Booking Details Form) */}
          <div className="lg:col-span-2 overflow-y-visible lg:overflow-y-auto custom-sidebar-scroll p-6 space-y-4">
            {/* Booking Source Select Tabs */}
            <div>
              <span className="block text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase mb-2">
                Booking Source / Reservation Type
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id: "Direct / Phone",
                    label: "Direct / Phone",
                    icon: FiPhone,
                  },
                  { id: "Walk-in", label: "Walk-in", icon: FiUser },
                  { id: "Website", label: "Website", icon: FiSearch },
                  { id: "Corporate", label: "Corporate", icon: FiBriefcase },
                  {
                    id: "OTA / Channel",
                    label: "OTA / Channel",
                    icon: FiDollarSign,
                  },
                ].map((tab) => {
                  const isSelected = sourceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSourceTabClick(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        isSelected
                          ? "bg-primary/10 text-primary border-primary shadow-sm"
                          : "bg-white text-text-secondary border-border hover:bg-slate-50"
                      }`}
                    >
                      <tab.icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-options for OTA tab */}
              {sourceTab === "OTA / Channel" && (
                <div className="p-4 bg-white border border-border rounded-xl space-y-3 mt-3 animate-fade-in">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Select OTA Channel
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "Booking.com",
                      "Agoda",
                      "Goibibo",
                      "MakeMyTrip",
                      "Travel Agent",
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSource(option)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          source === option
                            ? "bg-primary text-white"
                            : "bg-white text-text-secondary border border-border hover:bg-slate-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {source === "Travel Agent" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                          Travel Agent Name *
                        </label>
                        <input
                          type="text"
                          value={travelAgentName}
                          onChange={(e) => setTravelAgentName(e.target.value)}
                          className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Agency Name"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-secondary uppercase block mb-1">
                          Reference ID *
                        </label>
                        <input
                          type="text"
                          value={travelAgentRefId}
                          onChange={(e) => setTravelAgentRefId(e.target.value)}
                          className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="e.g. TA-001"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Corporate details form */}
              {bookingType === "Corporate" && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-white border border-border rounded-xl mt-3 animate-fade-in">
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
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
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
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
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
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
                      placeholder="Contact Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
                      Mobile *
                    </label>
                    <input
                      type="text"
                      value={corporateForm.mobile}
                      onChange={(e) =>
                        setCorporateForm({
                          ...corporateForm,
                          mobile: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                      placeholder="Mobile"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
                      Rate/Night
                    </label>
                    <input
                      type="text"
                      value={corporateForm.negotiatedRate || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCorporateForm({
                          ...corporateForm,
                          negotiatedRate: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full border border-border rounded-lg p-2 text-sm font-bold text-primary bg-white outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION A: STAY DETAILS */}
            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                  A
                </span>
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Stay Details
                </h3>
              </div>

              {bookingCategory === "Room Stay" ? (
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Check-in Date *
                    </label>
                    <DatePicker
                      selected={checkInDate}
                      onChange={(d: Date | null) => {
                        const newDate = d || new Date();
                        setCheckInDate(newDate);
                        if (checkOutDate <= newDate) {
                          setCheckOutDate(addDays(newDate, 1));
                        }
                      }}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none focus:border-primary"
                      dateFormat="dd MMM yyyy, hh:mm a"
                      showTimeSelect
                      minDate={new Date()}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Expected Check-out Date *
                    </label>
                    <DatePicker
                      selected={checkOutDate}
                      onChange={(d: Date | null) =>
                        setCheckOutDate(d || addDays(checkInDate, 1))
                      }
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none focus:border-primary"
                      dateFormat="dd MMM yyyy, hh:mm a"
                      showTimeSelect
                      minDate={addDays(checkInDate, 1)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Nights
                    </label>
                    <input
                      type="text"
                      disabled
                      value={totalNights}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-slate-50 text-text-secondary text-center font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Purpose of Visit
                    </label>
                    <select
                      value={purposeOfVisit}
                      onChange={(e) => setPurposeOfVisit(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none text-text-primary font-bold"
                    >
                      <option value="Leisure / Holiday">
                        Leisure / Holiday
                      </option>
                      <option value="Business Trip">Business Trip</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Transit">Transit</option>
                      <option value="Personal / Family">
                        Personal / Family
                      </option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Day Access Specific stay details */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Visit Date
                    </label>
                    <DatePicker
                      selected={visitDate}
                      onChange={(d: Date | null) =>
                        setVisitDate(d || new Date())
                      }
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none"
                      dateFormat="dd MMM yyyy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Select Package *
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none font-bold"
                    >
                      <option value="">-- Choose Access Package --</option>
                      {accessPackages.map((pkg) => (
                        <option key={pkg._id} value={pkg._id}>
                          {pkg.packageName} (Adult: ₹{pkg.adult_price} | Child: ₹{pkg.child_price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase mb-1">
                      Adults
                    </span>
                    <Counter
                      value={adultsFilter}
                      onChange={setAdultsFilter}
                      min={1}
                      max={20}
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase mb-1">
                      Children
                    </span>
                    <Counter
                      value={childrenFilter}
                      onChange={setChildrenFilter}
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION B: ROOM AVAILABILITY (only for Room Stay) */}
            {bookingCategory === "Room Stay" && !isAssignSpecificRoom && (
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                      B
                    </span>
                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                      Room Availability (By Room Type)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={searchRooms}
                    disabled={searchingRooms}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-border rounded-xl text-[10px] font-black text-primary hover:bg-slate-100 transition-all uppercase tracking-wide disabled:opacity-50"
                  >
                    {searchingRooms ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiLoader size={12} />
                    )}
                    Refresh Availability
                  </button>
                </div>

                {/* Room availability table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[9px] 3xl:text-[14px] font-black uppercase text-text-secondary tracking-wider">
                        <th className="py-2.5">Room Type</th>
                        <th className="py-2.5 text-center">Max Occupancy</th>
                        <th className="py-2.5 text-center">Available Rooms</th>
                        <th className="py-2.5 text-right">Rate / Night (₹)</th>
                        <th className="py-2.5 text-center">No. of Rooms</th>
                        <th className="py-2.5 text-right pr-2">Select</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roomTypes.map((rt) => {
                        const meta = getRoomTypeMeta(rt.name);
                        const availableCount = getAvailableCountForType(rt._id);
                        const selection = selectedCounts[rt._id] || {
                          count: 0,
                          adults: 2,
                          children: 0,
                        };

                        return (
                          <tr
                            key={rt._id}
                            className={`align-middle hover:bg-slate-50/50 transition-colors ${
                              selection.count > 0 ? "bg-primary/5" : ""
                            }`}
                          >
                            {/* Room info thumbnail & size details */}
                            <td className="py-3 flex items-center gap-3">
                              <img
                                src={meta.image}
                                alt={rt.name}
                                className="w-12 h-8 rounded-lg object-cover bg-slate-100 shrink-0 border border-border"
                              />
                              <div>
                                <span className="font-bold text-text-primary text-sm min-[2000px]:text-lg block">
                                  {rt.name}
                                </span>
                                <span className="text-[12px] min-[2000px]:text-base text-text-secondary">
                                  {meta.size} • {meta.beds}
                                </span>
                              </div>
                            </td>

                            {/* Max Occupancy */}
                            <td className="py-3 text-center text-text-secondary font-bold">
                              👤 {meta.occupancy}
                            </td>

                            {/* Available badge */}
                            <td className="py-3 text-center">
                              {searchingRooms ? (
                                <div className="flex justify-center items-center">
                                  <FiLoader className="animate-spin text-text-secondary" />
                                </div>
                              ) : availableCount > 0 ? (
                                <span
                                  className={`px-2 py-0.5 border rounded-md text-[10px] 3xl:text-[14px] font-bold ${
                                    availableCount - selection.count > 0
                                      ? "bg-green-50 text-green-600 border-green-100"
                                      : "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}
                                >
                                  {Math.max(
                                    0,
                                    availableCount - selection.count,
                                  )}{" "}
                                  {Math.max(
                                    0,
                                    availableCount - selection.count,
                                  ) === 1
                                    ? "Room"
                                    : "Rooms"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-md text-[10px] 3xl:text-[14px] font-bold">
                                  Sold Out
                                </span>
                              )}
                            </td>

                            {/* Rate per night */}
                            <td className="py-3 text-right font-bold text-text-primary flex flex-col items-end">
                              {(rt.discountPercentage && rt.discountPercentage > 0) ? (
                                <>
                                  <span className="text-xs text-text-secondary line-through">
                                    ₹{rt.basePrice?.toLocaleString()}
                                  </span>
                                  <span>
                                    ₹{(rt.basePrice * (1 - rt.discountPercentage / 100)).toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span>₹{rt.basePrice?.toLocaleString()}</span>
                              )}
                              <p className="text-[8px] 3xl:text-[12px] text-text-secondary font-normal block mt-0.5">
                                + ₹
                                {Math.round(
                                  (rt.basePrice * (1 - (rt.discountPercentage || 0) / 100)) *
                                    ((rt.gstId?.percentage || 0) / 100),
                                )}{" "}
                                Taxes
                              </p>
                            </td>

                            {/* Counter counter */}
                            <td className="py-3 text-center">
                              <div className="flex justify-center">
                                <Counter
                                  value={selection.count}
                                  onChange={(val: number) =>
                                    setSelectedCounts({
                                      ...selectedCounts,
                                      [rt._id]: { ...selection, count: val },
                                    })
                                  }
                                  min={0}
                                  max={availableCount}
                                />
                              </div>
                            </td>

                            {/* Checked checkbox */}
                            <td className="py-3 text-right pr-2">
                              <input
                                type="checkbox"
                                checked={selection.count > 0}
                                readOnly
                                className="w-4 h-4 accent-primary rounded cursor-pointer pointer-events-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Room Availability Footer */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <span className="text-sm text-text-secondary font-bold">
                    Selected Rooms:{" "}
                    {
                      Object.values(selectedCounts).filter((v) => v.count > 0)
                        .length
                    }{" "}
                    Types
                  </span>
                  <span className="text-sm font-black text-text-primary">
                    Total Rooms: {totalRoomsNeeded} Rooms
                  </span>
                </div>

                {/* Notice banner */}
                <div className="mt-3 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl flex items-center justify-between text-[11px] 3xl:text-[14px] text-amber-700">
                  <p>
                    ⚠️ Note: Specific Room selection overrides category counts.
                  </p>
                  <label className="flex items-center gap-1 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={isAssignSpecificRoom}
                      onChange={(e) =>
                        setIsAssignSpecificRoom(e.target.checked)
                      }
                      className="w-3.5 h-3.5 3xl:text-[16px] accent-amber-600 rounded"
                    />
                    Assign Specific Room (Optional)
                  </label>
                </div>
              </div>
            )}

            {bookingCategory === "Room Stay" && isAssignSpecificRoom && (
              <div className="bg-white border border-border rounded-xl p-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                      B
                    </span>
                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                      Specific Room Selection
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignSpecificRoom(false);
                      setSelectedSpecificRooms({});
                    }}
                    className="text-[10px] font-bold text-slate-500 underline hover:text-slate-800"
                  >
                    Back to Category Selection
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[9px] 3xl:text-[12px] font-black uppercase text-text-secondary tracking-wider">
                        <th className="py-2.5">Room Number</th>
                        <th className="py-2.5">Type & Info</th>
                        <th className="py-2.5 text-center">Max Occupancy</th>
                        <th className="py-2.5 text-right">Rate / Night (₹)</th>
                        <th className="py-2.5 text-right pr-2">Select</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fetchingPhysicalRooms ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center">
                            <FiLoader className="animate-spin text-primary inline-block mr-2" />
                            <span className="text-text-secondary text-xs">
                              Loading available rooms...
                            </span>
                          </td>
                        </tr>
                      ) : availablePhysicalRooms.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-4 text-center text-text-secondary text-xs"
                          >
                            No physical rooms available for the selected dates.
                          </td>
                        </tr>
                      ) : (
                        availablePhysicalRooms.map((roomData) => {
                          const r = roomData.room;
                          const rt = roomData.roomType;
                          const isSelected = !!selectedSpecificRooms[r._id];
                          return (
                            <tr
                              key={r._id}
                              className={`align-middle hover:bg-slate-50/50 transition-colors ${
                                isSelected ? "bg-primary/5" : ""
                              }`}
                            >
                              <td className="py-3 font-black text-text-primary text-sm">
                                {r.roomNumber}
                              </td>
                              <td className="py-3">
                                <span className="font-bold text-text-primary text-xs block">
                                  {rt?.name || "Unknown"}
                                </span>
                                <span className="text-[10px] text-text-secondary">
                                  Floor {r.floor}
                                </span>
                              </td>
                              <td className="py-3 text-center text-text-secondary text-xs font-bold">
                                👤 {r.maxAdults} Adults, {r.maxChildren} Kids
                              </td>
                              <td className="py-3 text-right font-bold text-text-primary text-sm flex flex-col items-end">
                                {(rt?.discountPercentage && rt.discountPercentage > 0) ? (
                                  <>
                                    <span className="text-xs text-text-secondary line-through">
                                      ₹{rt.basePrice?.toLocaleString()}
                                    </span>
                                    <span>
                                      ₹{(rt.basePrice * (1 - rt.discountPercentage / 100)).toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span>₹{rt?.basePrice?.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="py-3 text-right pr-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSpecificRooms((prev) => ({
                                        ...prev,
                                        [r._id]: {
                                          adults: adultsFilter,
                                          children: childrenFilter,
                                          roomTypeId: rt?._id,
                                          roomTypeName: rt?.name,
                                          basePrice: rt?.basePrice || 0,
                                          discountPercentage: rt?.discountPercentage || 0,
                                          roomNumber: r.roomNumber,
                                        },
                                      }));
                                    } else {
                                      setSelectedSpecificRooms((prev) => {
                                        const clone = { ...prev };
                                        delete clone[r._id];
                                        return clone;
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <span className="text-sm text-text-secondary font-bold">
                    Selected Rooms: {Object.keys(selectedSpecificRooms).length}
                  </span>
                  <span className="text-sm font-black text-text-primary">
                    Total Rooms: {totalRoomsNeeded}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION C: GUEST DETAILS (PRIMARY CONTACT) */}
            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                  C
                </span>
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Guest Details (Primary Contact)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Guest name */}
                <div className="relative">
                  <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                    Guest Name *
                  </label>
                  <div className="relative">
                    <FiUser
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                      size={14}
                    />
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                      placeholder="Rohit Mehta"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <FiPhone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                      size={14}
                    />
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerForm.phone}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <FiMail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                      size={14}
                    />
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      placeholder="rohit.mehta@example.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-full">
                  <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                    Address (Optional)
                  </label>
                  <div className="relative">
                    <FiMapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                      size={14}
                    />
                    <input
                      type="text"
                      value={customerForm.address}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          address: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      placeholder="24, Park Street, 5th Floor, Kolkata, West Bengal - 700016"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION D: ADD-ON SERVICES */}
            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    D
                  </span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                    Add-on Services
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Open template service options dynamically if any service is loaded
                    if (extraServices.length > 0) {
                      const first = extraServices[0];
                      const already = selectedAddons.find(
                        (a) => a.serviceId === first._id,
                      );
                      if (!already) {
                        setSelectedAddons([
                          ...selectedAddons,
                          {
                            serviceId: first._id,
                            serviceName: first.name,
                            quantity: 1,
                            rate: first.price || 0,
                            total: first.price || 0,
                            taxPercentage: first.taxPercentage || 0,
                            taxAmount:
                              ((first.price || 0) *
                                (first.taxPercentage || 0)) /
                              100,
                          },
                        ]);
                        toast.success(`Added ${first.name}`);
                      }
                    }
                  }}
                  className="flex items-center gap-1 text-sm font-black text-primary hover:underline uppercase tracking-wide"
                >
                  <FiPlus size={14} /> Add Add-on Services
                </button>
              </div>

              {extraServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {extraServices.map((service) => {
                    const existing = selectedAddons.find(
                      (a) => a.serviceId === service._id,
                    );
                    const isSelected = !!existing;

                    return (
                      <div
                        key={service._id}
                        className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-sm text-text-primary block">
                              {service.name}
                            </span>
                            <span className="text-[10px] 3xl:text-[12px] text-text-secondary">
                              ₹{(service.price ?? 0).toLocaleString()} / unit
                            </span>
                          </div>
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
                                    rate: service.price || 0,
                                    total: service.price || 0,
                                    taxPercentage: service.taxPercentage || 0,
                                    taxAmount:
                                      ((service.price || 0) *
                                        (service.taxPercentage || 0)) /
                                      100,
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
                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                          />
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-dashed border-border/70 flex items-center justify-between">
                            <span className="text-[10px] text-text-secondary font-bold">
                              Qty
                            </span>
                            <div className="flex items-center gap-2">
                              <Counter
                                value={existing.quantity}
                                onChange={(val: number) =>
                                  setSelectedAddons(
                                    selectedAddons.map((a) =>
                                      a.serviceId === service._id
                                        ? {
                                            ...a,
                                            quantity: val,
                                            total: val * a.rate,
                                            taxAmount:
                                              (val * a.rate * a.taxPercentage) /
                                              100,
                                          }
                                        : a,
                                    ),
                                  )
                                }
                                min={1}
                                max={50}
                              />
                              <span className="text-sm font-bold text-text-primary ml-1">
                                ₹{existing.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-4 bg-slate-50 rounded-xl">
                  No add-on services available
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-slate-50/50 p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between overflow-y-visible lg:overflow-y-auto custom-sidebar-scroll">
            <div className="space-y-4">
              {/* SECTION E: RATE SUMMARY (ESTIMATED) */}
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    E
                  </span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                    Rate Summary (Estimated)
                  </h3>
                </div>

                <div className="space-y-3">
                  {roomBreakdown.map((item, idx) => (
                    <div
                      key={`rb-${idx}`}
                      className="flex justify-between items-center text-sm text-text-secondary"
                    >
                      <span>{item.name}</span>
                      <span className="font-bold text-text-primary">
                        ₹{item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {selectedAddons.map((addon, idx) => (
                    <div
                      key={`ab-${idx}`}
                      className="flex justify-between items-center text-sm text-text-secondary"
                    >
                      <span>
                        {addon.serviceName} (Qty: {addon.quantity})
                      </span>
                      <span className="font-bold text-text-primary">
                        ₹{addon.total.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center text-sm text-text-secondary">
                    <span>Taxes & Charges</span>
                    <span className="font-bold text-text-primary">
                      ₹{taxAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 pb-1 border-b border-border/30">
                    <span className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase">
                      Tax Breakdown
                    </span>
                  </div>

                  {roomTaxBreakdown.map((tax, idx) => (
                    <div
                      key={`rtb-${idx}`}
                      className="flex justify-between items-center text-xs 3xl:text-[14px] text-text-secondary"
                    >
                      <span>
                        {tax.name} ({tax.taxPercentage}%)
                      </span>
                      <span className="font-bold text-text-primary">
                        ₹{Math.round(tax.taxAmount).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {selectedAddons
                    .filter((a) => a.taxAmount > 0)
                    .map((addon, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs 3xl:text-[14px] text-text-secondary"
                      >
                        <span>
                          {addon.serviceName} Tax ({addon.taxPercentage}%)
                        </span>
                        <span className="font-bold text-text-primary">
                          ₹{Math.round(addon.taxAmount).toLocaleString()}
                        </span>
                      </div>
                    ))}

                  {taxOptions.length > 0 && (
                    <div className="pt-2 hidden">
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                        Select Tax Option
                      </label>
                      <select
                        value={selectedTaxId}
                        onChange={(e) => setSelectedTaxId(e.target.value)}
                        disabled
                        className="w-full border border-border rounded-lg p-2 text-sm bg-gray-50 outline-none font-bold text-text-secondary cursor-not-allowed"
                      >
                        {taxOptions.map((tax) => (
                          <option key={tax._id} value={tax._id}>
                            {tax.name} ({tax.percentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-black text-text-primary uppercase">
                      Estimated Total Amount
                    </span>
                    <span className="text-base font-black text-primary">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl text-[10px] min-[2000px]:text-lg text-blue-700 leading-normal flex items-start gap-2">
                  <span>ℹ️</span>
                  <p>
                    Actual amount may change based on final room assignment,
                    taxes & extra usage.
                  </p>
                </div>
              </div>

              {/* SECTION F: BOOKING STATUS */}
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    F
                  </span>
                  <h3 className="font-bold  text-text-primary text-sm uppercase tracking-wider">
                    Booking Status
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Status *
                    </label>
                    <select
                      value={bookingStatus}
                      onChange={(e) => setBookingStatus(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none font-bold"
                    >
                      <option value="Tentative">Tentative</option>
                      <option value="Confirmed">Confirmed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Remarks (Optional)
                    </label>
                    <textarea
                      maxLength={200}
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none resize-none"
                      placeholder="e.g. Guest coming for leisure with family."
                    />
                    <span className="text-[9px] text-text-secondary text-right block mt-1">
                      {remarks.length} / 200
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION G: ADVANCE PAYMENT */}
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    G
                  </span>
                  <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                    Advance Payment
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Advance Amount (₹)
                    </label>
                    <input
                      type="text"
                      value={paymentForm.advanceAmount || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPaymentForm({
                          ...paymentForm,
                          advanceAmount: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none text-text-primary font-bold"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={paymentForm.paymentMode}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentMode: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none font-bold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Wallet">Wallet</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase block mb-1">
                    Payment Remarks
                  </label>
                  <textarea
                    value={paymentForm.paymentRemarks}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentRemarks: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg p-2 text-sm bg-white outline-none resize-none font-medium text-text-primary"
                    placeholder="e.g. UPI Ref: 1234567890"
                    rows={2}
                  />
                </div>

                <div className="p-3 3xl:text-[14px] bg-green-50/50 border border-green-200/50 rounded-xl text-[10px] text-green-700 leading-normal flex items-start gap-2">
                  <span>💡</span>
                  <p>
                    Reminder: Advance amount will be adjusted in final bill
                    during Check-in / Check-out.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER BUTTONS */}
            <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePreSubmit}
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                {loading ? (
                  <FiLoader className="animate-spin" size={14} />
                ) : (
                  <FiCheckCircle size={14} />
                )}
                {booking ? "Update Booking" : "Preview & Confirm Booking"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-border hover:bg-slate-50 text-text-secondary rounded-xl font-bold text-sm transition-all text-center"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Warning Popup */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Payment Exceeds Total Due</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              The payment amount entered exceeds the total due value. Are you sure you want to proceed?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPaymentWarning(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all flex-1"
              >
                No, Edit Amount
              </button>
              <button
                onClick={() => {
                  setShowPaymentWarning(false);
                  submitBooking();
                }}
                className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex-1"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBooking;
