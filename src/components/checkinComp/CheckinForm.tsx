import React, { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiUser,
  FiCalendar,
  FiHome,
  FiCreditCard,
  FiCheckCircle,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiDollarSign,
  FiPhone,
  FiUpload,
  FiTrash2,
  FiPrinter,
  FiImage,
  FiFile,
  FiXCircle,
  FiLoader,
  FiTrendingUp,
  FiBriefcase,
  FiCoffee,
  FiUserCheck,
  FiPlus,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, differenceInCalendarDays, differenceInHours, format } from "date-fns";
import api from "../../lib/axios";
import GuestRegistrationCard from "./GuestRegistrationCard";
import { BiShield } from "react-icons/bi";

// GRC Data Type
interface GRCData {
  grcNo: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  noOfNights: number;
  noOfRooms: number;
  guest: {
    fullName: string;
    fatherName: string;
    address: string;
    mobile: string;
    email: string;
    idProofType: string;
    idProofNumber: string;
    nationality: string;
    dob: string;
    gender: string;
  };
  company?: {
    name: string;
    address: string;
    gstin: string;
    contactPerson: string;
    contactNo: string;
    visitPurpose: string;
  };
  rooms: Array<{
    roomNo: string;
    roomType: string;
    adults: number;
    children: number;
    tariff: number;
    checkIn: string;
    checkOut: string;
    guests: string[];
  }>;
  accompanyingGuests: Array<{
    sl: number;
    name: string;
    age: number;
    gender: string;
    idProofType: string;
    idProofNumber: string;
  }>;
  vehicles: Array<{
    vehicleNo: string;
    vehicleType: string;
    driverName: string;
    driverContact: string;
  }>;
  payment: {
    mode: string;
    advanceReceived: number;
    balance: number;
    paidBy: string;
  };
  preparedBy: string;
  verifiedBy: string;
  remarks: string;
}

interface CheckInProps {
  bookingData?: any;
  onClose: () => void;
  editMode?: boolean;
  existingCheckIn?: any;
  onSuccess?: () => void;
}

// Document validation
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_DOC_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

interface GuestEntry {
  id: string;
  name: string;
  mobileNo: string;
  idType: string;
  idNumber: string;
  gender: string;
  age: string;
  nationality: string;
  isPrimary: boolean;
  assignedRoomId: string | null;
  idDocument: { public_id: string; secure_url: string } | null;
  pendingDocFile: File | null;
  pendingDocPreview: string | null;
}

interface RoomEntry {
  roomId: string;
  roomNumber: string;
  basePrice: number;
  roomType: any;
  hasExtraBed: boolean;
  extraBedCharge: number;
  extraBedAllowed: boolean;
  roomTypeName?: string;
  slotIndex?: number;           // which booking.rooms[] entry this belongs to
  requiredRoomTypeId?: string;  // expected room type for this slot (for filtering)
}

const CheckInForm = ({
  bookingData,
  onClose,
  editMode = false,
  existingCheckIn,
  onSuccess,
}: CheckInProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const grcCardRef = useRef<any>(null);

  // GRC Modal State
  const [showGRCModal, setShowGRCModal] = useState(false);
  const [grcData, setGrcData] = useState<GRCData | null>(null);

  // Signed GRC State
  const [signedGRCFile, setSignedGRCFile] = useState<File | null>(null);
  const [signedGRCPreview, setSignedGRCPreview] = useState<string | null>(null);

  // Extra Services State
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Initialize from edit mode data
  useEffect(() => {
    if (editMode && existingCheckIn) {
      // Set check-in/out dates
      setStayFormData({
        checkInTime: existingCheckIn.checkInTime
          ? new Date(existingCheckIn.checkInTime)
          : new Date(),
        expectedCheckOutTime: existingCheckIn.expectedCheckOutTime
          ? new Date(existingCheckIn.expectedCheckOutTime)
          : addDays(new Date(), 1),
        specialRequests: existingCheckIn.specialRequests || "",
      });

      // Set guests from existing check-in - preserve existing IDs for updates
      if (existingCheckIn.guests && existingCheckIn.guests.length > 0) {
        setGuests(
          existingCheckIn.guests.map((g: any, idx: number) => ({
            id: g._id || `g-${Date.now()}-${idx}`,
            name: g.name || "",
            mobileNo: g.mobileNo || "",
            idType: g.idType || "Aadhar Card",
            idNumber: g.idNumber || "",
            gender: g.gender || "",
            age: g.age ? String(g.age) : "",
            nationality: g.nationality || "Indian",
            isPrimary: g.isPrimary || idx === 0,
            assignedRoomId: g.assignedRoomId
              ? typeof g.assignedRoomId === "object"
                ? g.assignedRoomId._id
                : g.assignedRoomId
              : null,
            idDocument:
              g.idDocument && g.idDocument.secure_url ? g.idDocument : null,
            pendingDocFile: null,
            pendingDocPreview: null,
          })),
        );
      } else {
        // Fallback to creating a default guest entry
        setGuests([
          {
            id: `g-${Date.now()}`,
            name: "",
            mobileNo: "",
            idType: "Aadhar Card",
            idNumber: "",
            gender: "",
            age: "",
            nationality: "Indian",
            isPrimary: true,
            assignedRoomId: null,
            idDocument: null,
            pendingDocFile: null,
            pendingDocPreview: null,
          },
        ]);
      }

      // Set vehicles - handle empty array properly
      if (
        existingCheckIn.vehicleDetails &&
        existingCheckIn.vehicleDetails.length > 0
      ) {
        setVehicles(
          existingCheckIn.vehicleDetails.map((v: any) => ({
            vehicleNumber: v.vehicleNumber || "",
            vehicleType: v.vehicleType || "",
            driverName: v.driverName || "",
            driverContact: v.driverContact || "",
          })),
        );
      } else {
        // Initialize with one empty vehicle entry
        setVehicles([
          {
            vehicleNumber: "",
            vehicleType: "",
            driverName: "",
            driverContact: "",
          },
        ]);
      }

      // Set corporate details
      if (existingCheckIn.corporateCheckInDetails) {
        setCorporateDetails({
          companyName:
            existingCheckIn.corporateCheckInDetails.companyName || "",
          companyGST: existingCheckIn.corporateCheckInDetails.companyGST || "",
          contactPersonName:
            existingCheckIn.corporateCheckInDetails.contactPersonName || "",
          contactMobile:
            existingCheckIn.corporateCheckInDetails.contactMobile || "",
          department: existingCheckIn.corporateCheckInDetails.department || "",
          visitPurpose:
            existingCheckIn.corporateCheckInDetails.visitPurpose || "",
          remarks: existingCheckIn.corporateCheckInDetails.remarks || "",
        });
      }

      // Set party type
      setPartyType(
        existingCheckIn.checkInType === "Corporate"
          ? "Corporate"
          : "Individual",
      );

      // Set selected rooms from existing check-in
      if (
        existingCheckIn.roomDetails &&
        existingCheckIn.roomDetails.length > 0
      ) {
        setSelectedRooms(
          existingCheckIn.roomDetails.map((r: any) => ({
            roomId: r.roomId?._id || r.roomId,
            roomNumber: r.roomNumber || "TBD",
            basePrice: r.appliedPrice || r.originalPrice || 0,
            roomType: r.roomType,
            roomTypeName: r.roomType?.name || "",
            hasExtraBed: false,
            extraBedCharge: 0,
            extraBedAllowed: false,
          })),
        );
      }

      // Set signed GRC if exists
      if (existingCheckIn.grcDetails?.[0]?.signedPdfUrl?.secure_url) {
        setSignedGRCPreview(
          existingCheckIn.grcDetails[0].signedPdfUrl.secure_url,
        );
      }
    }
  }, [editMode, existingCheckIn]);

  // Party Type - Initialize from edit mode or booking data
  const [partyType, setPartyType] = useState<"Individual" | "Corporate">(
    existingCheckIn?.checkInType === "Corporate"
      ? "Corporate"
      : bookingData?.bookingType === "Corporate"
        ? "Corporate"
        : "Individual",
  );

  // Form State - Step 1
  const isDayAccess = bookingData?.bookingCategory === "Day Access";

  const getInitialCheckInTime = () => {
    if (isDayAccess && bookingData?.accessPackageId) {
      const pkg = bookingData.accessPackageId;
      const visitDate = bookingData.visitDate
        ? new Date(bookingData.visitDate)
        : new Date();
      const entryStr = pkg.entry_time || "09:00";
      const [entryH, entryM] = entryStr.split(":").map(Number);
      visitDate.setHours(entryH, entryM, 0, 0);
      return visitDate;
    }
    return new Date();
  };

  const getInitialCheckOutTime = () => {
    if (isDayAccess && bookingData?.accessPackageId) {
      const pkg = bookingData.accessPackageId;
      const today = new Date();
      const entryStr = pkg.entry_time || "09:00";
      const exitStr = pkg.exit_time || "18:00";
      const [entryH, entryM] = entryStr.split(":").map(Number);
      const [exitH, exitM] = exitStr.split(":").map(Number);
      const checkOutDate = new Date(today);
      checkOutDate.setHours(exitH, exitM, 0, 0);
      if (exitH < entryH || (exitH === entryH && exitM < entryM)) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }
      return checkOutDate;
    }
    if (bookingData?.rooms?.[0]?.checkOutDate) {
      return new Date(bookingData.rooms[0].checkOutDate);
    }
    return addDays(new Date(), 1);
  };

  const [stayFormData, setStayFormData] = useState({
    checkInTime: getInitialCheckInTime(),
    expectedCheckOutTime: getInitialCheckOutTime(),
    specialRequests: "",
  });

  // Guests with room assignment
  const [guests, setGuests] = useState<GuestEntry[]>([
    {
      id: `g-${Date.now()}`,
      name: bookingData?.customerId?.name || "",
      mobileNo: bookingData?.customerId?.phone || "",
      idType: "Aadhar Card",
      idNumber: "",
      gender: "",
      age: "",
      nationality: "Indian",
      isPrimary: true,
      assignedRoomId: null,
      idDocument: null,
      pendingDocFile: null,
      pendingDocPreview: null,
    },
  ]);

  // Step 3: Payment
  const [paymentData, setPaymentData] = useState({
    checkInAdvance: 0,
    paymentMode: "Cash",
    transactionId: "",
    paymentNote: "",
  });

  // Vehicle - separate state, shown in Step 2
  const [vehicles, setVehicles] = useState<
    Array<{
      vehicleNumber: string;
      vehicleType: string;
      driverName: string;
      driverContact: string;
    }>
  >([
    { vehicleNumber: "", vehicleType: "", driverName: "", driverContact: "" },
  ]);

  // Corporate Details
  const [corporateDetails, setCorporateDetails] = useState({
    companyName: bookingData?.corporateDetails?.companyName || "",
    companyGST: bookingData?.corporateDetails?.gstNumber || "",
    contactPersonName: bookingData?.corporateDetails?.contactPerson || "",
    contactMobile: bookingData?.corporateDetails?.mobile || "",
    department: "",
    visitPurpose: "",
    remarks: "",
  });

  // Calculate nights using calendar days (matches backend eachDayOfInterval logic)
  const nights = Math.max(
    1,
    differenceInCalendarDays(
      new Date(stayFormData.expectedCheckOutTime),
      new Date(stayFormData.checkInTime),
    ),
  );

  // Calculate hours/duration for Day Access
  const durationHours = Math.max(
    1,
    differenceInHours(
      new Date(stayFormData.expectedCheckOutTime),
      new Date(stayFormData.checkInTime),
    ),
  );

  // Selected Rooms
  const [selectedRooms, setSelectedRooms] = useState<RoomEntry[]>([]);

  // Room type filter for the room grid (controlled)
  const [roomTypeFilterId, setRoomTypeFilterId] = useState<string>("");

  // Preferred room type from booking (when no specific room was assigned at booking time)
  const preferredRoomType = (() => {
    const r = bookingData?.rooms?.[0];
    if (!r) return null;
    const roomIdStr = typeof r.roomId === "object" ? r.roomId?._id : r.roomId;
    if (roomIdStr) return null; // specific room already assigned, no preferred type needed
    return r.roomType || null; // populated object { _id, name } or ObjectId string
  })();
  const preferredRoomTypeId: string =
    preferredRoomType?._id?.toString() ||
    (typeof preferredRoomType === "string" ? preferredRoomType : "");
  const preferredRoomTypeName: string = preferredRoomType?.name || "";

  // Initialize selected rooms from bookingData — one slot per booking.rooms[] entry
  useEffect(() => {
    const bookingRooms = bookingData?.rooms || [];
    if (bookingRooms.length === 0) return;

    const slots: RoomEntry[] = bookingRooms.map((r: any, idx: number) => {
      const roomIdObj = typeof r.roomId === "object" ? r.roomId : null;
      const roomIdStr = roomIdObj?._id || (typeof r.roomId === "string" ? r.roomId : "");
      const roomTypeObj = r.roomType || roomIdObj?.roomType || null;
      const requiredRoomTypeId =
        roomTypeObj?._id?.toString() ||
        (typeof roomTypeObj === "string" ? roomTypeObj : "");

      return {
        roomId: roomIdStr || "",
        roomNumber: roomIdStr ? (roomIdObj?.roomNumber || r.roomNumber || "TBD") : "TBD",
        basePrice: r.pricePerNight || r.basePrice || 0,
        roomType: roomTypeObj,
        roomTypeName: roomTypeObj?.name || r.roomTypeName || "",
        hasExtraBed: false,
        extraBedCharge: 0,
        extraBedAllowed: false,
        slotIndex: idx,
        requiredRoomTypeId,
      };
    });

    if (slots.length > 0) {
      setSelectedRooms(slots);
    }
  }, [bookingData]);

  // Auto-filter room grid by preferred room type on open
  useEffect(() => {
    if (!editMode && preferredRoomTypeId) {
      setRoomTypeFilterId(preferredRoomTypeId);
      fetchRoomsByType(preferredRoomTypeId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredRoomTypeId]);

  // Fetch all rooms on mount
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get("/room-types?activeOnly=true");
        setRoomTypes(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchAllRooms = async () => {
      try {
        const res = await api.get("/rooms?status=Active");
        const allRooms = res.data.data?.rooms || [];
        setAvailableRooms(allRooms);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };
    const fetchExtraServices = async () => {
      try {
        const res = await api.get("/extra-services?activeOnly=true");
        const services = res.data.data || [];
        setExtraServices(services);
        // Pre-select services that were booked as add-ons
        if (bookingData?.addons?.length) {
          const preSelected = bookingData.addons
            .map((a: any) => a.serviceId)
            .filter(Boolean);
          setSelectedServices(preSelected);
        }
      } catch (err) {
        console.error("Error fetching extra services:", err);
      }
    };
    fetchRoomTypes();
    fetchAllRooms();
    fetchExtraServices();
  }, []);

  // Fetch all rooms when type filter changes
  const fetchRoomsByType = async (typeId?: string) => {
    try {
      let res;
      if (typeId) {
        res = await api.get(`/rooms?status=Active&roomType=${typeId}`);
      } else {
        res = await api.get("/rooms?status=Active");
      }
      const allRooms = res.data.data?.rooms || [];
      setAvailableRooms(allRooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  // Calculate totals
  // Package price for Day Access
  const packagePrice = isDayAccess
    ? bookingData?.pricingSummary?.grandTotal ||
      bookingData?.accessPackageId?.adult_price ||
      bookingData?.pricingSummary?.roomTotal ||
      0
    : 0;

  // Room add-on charges (for Day Access rooms are charged as flat add-on, not per night)
  const roomAddOnTotal = isDayAccess
    ? selectedRooms.reduce(
        (sum: number, room: RoomEntry) => sum + (Number(room.basePrice) || 0),
        0,
      )
    : 0;

  const roomTotal = isDayAccess
    ? packagePrice + roomAddOnTotal
    : selectedRooms.reduce((sum: number, room: RoomEntry) => {
        const basePrice = Number(room.basePrice) || 0;
        const extraBedPrice = room.hasExtraBed
          ? (Number(room.extraBedCharge) || 0) * nights
          : 0;
        return sum + basePrice * nights + extraBedPrice;
      }, 0);

  const bookingAdvance = bookingData?.advanceAmount || 0;
  const checkInAdvance = paymentData.checkInAdvance;
  const totalPaid = bookingAdvance + checkInAdvance;
  const dueAmount = Math.max(0, roomTotal - totalPaid);

  // Toggle room selection
  const toggleRoom = (room: any) => {
    const isSelected = selectedRooms.some((r) => r.roomId === room._id);
    if (isSelected) {
      if (selectedRooms.length > 1) {
        const roomIdToRemove = room._id;
        // Remove room and clear guest assignments for that room
        setSelectedRooms(
          selectedRooms.filter((r) => r.roomId !== roomIdToRemove),
        );
        setGuests(
          guests.map((g) =>
            g.assignedRoomId === roomIdToRemove
              ? { ...g, assignedRoomId: null }
              : g,
          ),
        );
      }
    } else {
      const roomTypeObj = room.roomType;
      const extraBedAllowed = room.extraBedAllowed || room.extraBedCharge > 0;
      setSelectedRooms([
        ...selectedRooms,
        {
          roomId: room._id,
          roomNumber: room.roomNumber,
          basePrice: Number(room.basePrice) || 0,
          roomType: roomTypeObj,
          roomTypeName: roomTypeObj?.name || "",
          hasExtraBed: extraBedAllowed,
          extraBedCharge: Number(room.extraBedCharge) || 0,
          extraBedAllowed,
        },
      ]);
    }
  };

  // Toggle extra bed
  const toggleExtraBed = (roomId: string) => {
    setSelectedRooms(
      selectedRooms.map((room) =>
        room.roomId === roomId
          ? { ...room, hasExtraBed: !room.hasExtraBed }
          : room,
      ),
    );
  };

  // Remove room
  const removeRoom = (roomId: string) => {
    if (selectedRooms.length > 1) {
      // Remove room and clear guest assignments for that room
      setSelectedRooms(selectedRooms.filter((r) => r.roomId !== roomId));
      setGuests(
        guests.map((g) =>
          g.assignedRoomId === roomId ? { ...g, assignedRoomId: null } : g,
        ),
      );
    }
  };

  // Guest management
  const addGuest = () => {
    setGuests([
      ...guests,
      {
        id: `g-${Date.now()}`,
        name: "",
        mobileNo: "",
        idType: "Aadhar Card",
        idNumber: "",
        gender: "",
        age: "",
        nationality: "Indian",
        isPrimary: false,
        assignedRoomId:
          selectedRooms.length > 0 ? selectedRooms[0].roomId : null,
        idDocument: null,
        pendingDocFile: null,
        pendingDocPreview: null,
      },
    ]);
  };

  const removeGuest = (guestId: string) => {
    if (guests.length > 1) {
      setGuests(guests.filter((g) => g.id !== guestId));
    }
  };

  const updateGuest = (guestId: string, field: string, value: any) => {
    setGuests(
      guests.map((g) => (g.id === guestId ? { ...g, [field]: value } : g)),
    );
  };

  // Set primary guest
  const setPrimaryGuest = (guestId: string) => {
    setGuests(
      guests.map((g) => ({
        ...g,
        isPrimary: g.id === guestId,
      })),
    );
  };

  // Document validation
  const validateDocument = (file: File): string | null => {
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      return "Only JPG, PNG, or PDF files are allowed";
    }
    if (file.size > MAX_DOC_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  // Document upload handler
  const handleDocumentUpload = (guestId: string, file: File) => {
    const error = validateDocument(file);
    if (error) {
      alert(error);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setGuests(
      guests.map((g) =>
        g.id === guestId
          ? {
              ...g,
              pendingDocFile: file,
              pendingDocPreview: previewUrl,
              idDocument: { public_id: previewUrl, secure_url: previewUrl },
            }
          : g,
      ),
    );
  };

  // Remove document handler
  const handleRemoveDocument = (guestId: string) => {
    setGuests(
      guests.map((g) =>
        g.id === guestId
          ? {
              ...g,
              pendingDocFile: null,
              pendingDocPreview: null,
              idDocument: null,
            }
          : g,
      ),
    );
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FiImage size={16} />;
    return <FiFile size={16} />;
  };

  // Get room occupancy info
  const getRoomOccupancy = (roomId: string) => {
    const roomGuests = guests.filter((g) => g.assignedRoomId === roomId);
    return {
      count: roomGuests.length,
      guests: roomGuests,
    };
  };

  // Vehicle management
  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      { vehicleNumber: "", vehicleType: "", driverName: "", driverContact: "" },
    ]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const updateVehicle = (index: number, field: string, value: string) => {
    const newVehicles = [...vehicles];
    (newVehicles[index] as any)[field] = value;
    setVehicles(newVehicles);
  };

  // Signed GRC upload handler
  const handleSignedGRCUpload = (file: File) => {
    const error = validateDocument(file);
    if (error) {
      alert(error);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setSignedGRCFile(file);
    setSignedGRCPreview(previewUrl);
  };

  // Remove signed GRC handler
  const handleRemoveSignedGRC = () => {
    setSignedGRCFile(null);
    setSignedGRCPreview(null);
  };

  // Get primary guest
  const getPrimaryGuest = () => guests.find((g) => g.isPrimary) || guests[0];

  // Step validation
  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: {
        // All booking room slots must be assigned before proceeding
        if (!isDayAccess && bookingData?.rooms?.length > 0) {
          const allAssigned = selectedRooms.every((s) => !!s.roomId);
          if (!allAssigned) return false;
        }
        if (partyType === "Individual") {
          return (
            getPrimaryGuest()?.name?.trim() !== "" &&
            getPrimaryGuest()?.mobileNo?.trim() !== ""
          );
        }
        return corporateDetails.companyName.trim() !== "";
      }
      case 2:
        const primary = getPrimaryGuest();
        return !!(
          primary?.name?.trim() &&
          primary?.mobileNo?.trim() &&
          primary?.idNumber?.trim()
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Get validation message for step 2
  const getStep2Validation = (): string => {
    const primary = getPrimaryGuest();
    if (!primary?.name?.trim()) return "Primary guest name is required";
    if (!primary?.mobileNo?.trim()) return "Primary guest mobile is required";
    if (!primary?.idNumber?.trim())
      return "Primary guest ID number is required";
    return "";
  };

  // Generate GRC Data for PDF
  const generateGRCData = (): GRCData => {
    const primary = getPrimaryGuest();
    const grcNumber = `GRC-${Date.now().toString().slice(-6)}`;
    const bookingAdv = bookingData?.advanceAmount || 0;
    const checkInAdv = paymentData.checkInAdvance;
    const totalPaidAmount = bookingAdv + checkInAdv;
    const balanceDue = Math.max(0, roomTotal - totalPaidAmount);

    // Group guests by room
    const roomGuestMap: Record<string, string[]> = {};
    selectedRooms.forEach((room) => {
      roomGuestMap[room.roomId] = [];
    });

    guests.forEach((g) => {
      if (g.assignedRoomId && roomGuestMap[g.assignedRoomId] !== undefined) {
        roomGuestMap[g.assignedRoomId].push(g.name);
      }
    });

    // Build accompanying guests (non-primary)
    const accompanyingGuests = guests
      .filter((g) => !g.isPrimary)
      .map((g, idx) => ({
        sl: idx + 1,
        name: g.name || "",
        age: Number(g.age) || 0,
        gender: g.gender || "",
        idProofType: g.idType || "Aadhar Card",
        idProofNumber: g.idNumber || "",
      }));

    return {
      grcNo: grcNumber,
      checkInDate: format(stayFormData.checkInTime, "dd MMM yyyy"),
      checkInTime: format(stayFormData.checkInTime, "hh:mm a"),
      checkOutDate: format(stayFormData.expectedCheckOutTime, "dd MMM yyyy"),
      checkOutTime: format(stayFormData.expectedCheckOutTime, "hh:mm a"),
      noOfNights: nights,
      noOfRooms: selectedRooms.length,
      guest: {
        fullName: primary?.name || "",
        fatherName: "",
        address: "",
        mobile: primary?.mobileNo || "",
        email: "",
        idProofType: primary?.idType || "Aadhar Card",
        idProofNumber: primary?.idNumber || "",
        nationality: primary?.nationality || "Indian",
        dob: "",
        gender: primary?.gender || "",
      },
      company:
        partyType === "Corporate" && corporateDetails.companyName
          ? {
              name: corporateDetails.companyName,
              address: "",
              gstin: corporateDetails.companyGST,
              contactPerson: corporateDetails.contactPersonName,
              contactNo: corporateDetails.contactMobile,
              visitPurpose: corporateDetails.visitPurpose,
            }
          : undefined,
      rooms: selectedRooms.map((room) => {
        const roomGuests = roomGuestMap[room.roomId] || [];
        return {
          roomNo: room.roomNumber || "TBD",
          roomType: room.roomTypeName || "Standard",
          adults: roomGuests.length > 0 ? roomGuests.length : 2,
          children: room.hasExtraBed ? 1 : 0,
          tariff: Number(room.basePrice) || 0,
          checkIn: format(stayFormData.checkInTime, "dd MMM yyyy"),
          checkOut: format(stayFormData.expectedCheckOutTime, "dd MMM yyyy"),
          guests: roomGuests,
        };
      }),
      accompanyingGuests,
      vehicles: vehicles
        .filter((v: any) => v.vehicleNumber)
        .map((v) => ({
          vehicleNo: v.vehicleNumber || "",
          vehicleType: v.vehicleType || "",
          driverName: v.driverName || "",
          driverContact: v.driverContact || "",
        })),
      payment: {
        mode: paymentData.paymentMode,
        advanceReceived: totalPaidAmount,
        balance: balanceDue,
        paidBy: partyType === "Corporate" ? "Company" : "Self",
      },
      preparedBy: "",
      verifiedBy: "",
      remarks: stayFormData.specialRequests || "",
    };
  };

  // Open GRC Modal
  const handleOpenGRC = () => {
    const data = generateGRCData();
    setGrcData(data);
    setShowGRCModal(true);
  };

  // Final submit - SINGLE API CALL with FormData
  const handleFinalCheckIn = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const primary = getPrimaryGuest();
      if (!primary?.name || !primary?.mobileNo || !primary?.idNumber) {
        alert("Primary guest name, mobile, and ID number are required!");
        setLoading(false);
        return;
      }

      setLoadingStep("Preparing data...");

      // Build payment entries
      const paymentEntries: Array<{
        amount: number;
        paymentMode: string;
        transactionId?: string;
        note?: string;
        paidAt: string;
      }> = [];

      // Only add booking advance if > 0 and it's from booking (not check-in)
      if (!editMode && Number(bookingAdvance) > 0) {
        paymentEntries.push({
          amount: Number(bookingAdvance),
          paymentMode: "Online",
          note: "Booking advance",
          paidAt: bookingData?.createdAt
            ? new Date(bookingData.createdAt).toISOString()
            : new Date().toISOString(),
        });
      }

      // Add check-in advance with user's selected payment mode
      if (Number(checkInAdvance) > 0) {
        paymentEntries.push({
          amount: Number(checkInAdvance),
          paymentMode: paymentData.paymentMode,
          transactionId: paymentData.transactionId || undefined,
          note: paymentData.paymentNote || "Check-in advance",
          paidAt: new Date().toISOString(),
        });
      }

      // Build final payload (without uploaded URLs - backend will inject them)
      const payload = {
        bookingId: editMode
          ? existingCheckIn?.bookingId?._id || existingCheckIn?.bookingId
          : bookingData?._id,
        checkInType: partyType,
        checkInTime:
          stayFormData.checkInTime instanceof Date
            ? stayFormData.checkInTime.toISOString()
            : stayFormData.checkInTime,
        expectedCheckOutTime:
          stayFormData.expectedCheckOutTime instanceof Date
            ? stayFormData.expectedCheckOutTime.toISOString()
            : stayFormData.expectedCheckOutTime,
        roomSelections: selectedRooms.map((r: RoomEntry) => ({
          roomId: r.roomId,
          roomNumber: r.roomNumber,
          originalPrice: r.basePrice,
          appliedPrice: r.basePrice,
          hasExtraBed: r.hasExtraBed,
          extraBedCharge: r.extraBedCharge,
        })),
        primaryGuest: {
          id: getPrimaryGuest()?.id || "",
          name: primary.name,
          mobileNo: primary.mobileNo,
          idType: primary.idType,
          idNumber: primary.idNumber,
          gender: primary.gender,
          age: primary.age,
          nationality: primary.nationality,
          isPrimary: true,
          assignedRoomId: primary.assignedRoomId,
          idDocument: primary.idDocument?.secure_url
            ? primary.idDocument
            : null,
        },
        guests: guests.map((g) => ({
          id: g.id,
          name: g.name,
          mobileNo: g.mobileNo,
          idType: g.idType,
          idNumber: g.idNumber,
          gender: g.gender,
          age: g.age,
          nationality: g.nationality,
          isPrimary: g.isPrimary,
          assignedRoomId: g.assignedRoomId,
          idDocument: g.idDocument?.secure_url ? g.idDocument : null,
        })),
        vehicleDetails: vehicles.filter(
          (v: any) => v.vehicleNumber && v.vehicleNumber.trim() !== "",
        ),
        extraServices: selectedServices,
        specialRequests: stayFormData.specialRequests,
        notes: stayFormData.specialRequests,
        ...(editMode
          ? {}
          : { advancePayments: paymentEntries, totalAdvanceAmount: totalPaid }),
        generateGRC: !editMode,
        ...(partyType === "Corporate" && { corporateData: corporateDetails }),
      };

      setLoadingStep("Bundling files...");

      // Create multipart FormData for file uploads
      const multipartFormData = new FormData();

      // Append JSON payload
      multipartFormData.append("payload", JSON.stringify(payload));

      // Append guest document files with their indices for proper mapping
      const guestsWithDocs = guests
        .map((g, idx) => ({ guest: g, index: idx }))
        .filter(({ guest }) => guest.pendingDocFile);

      guestsWithDocs.forEach(({ guest }) => {
        if (guest.pendingDocFile) {
          multipartFormData.append("guestDocuments", guest.pendingDocFile);
        }
      });

      // Append mapping of guest document indices (which guest index each file belongs to)
      const guestDocIndices = guestsWithDocs.map(({ index }) => index);
      multipartFormData.append(
        "guestDocIndices",
        JSON.stringify(guestDocIndices),
      );

      // Append signed GRC file if exists (for both new upload and replacement)
      if (signedGRCFile) {
        multipartFormData.append("signedGRC", signedGRCFile);
      }

      setLoadingStep(
        editMode ? "Updating check-in..." : "Processing check-in...",
      );

      // Determine API endpoint based on mode
      const apiEndpoint =
        editMode && existingCheckIn?._id
          ? `/checkin/${existingCheckIn._id}`
          : "/checkin/process";
      const httpMethod = editMode ? "patch" : "post";

      // SINGLE API CALL - all uploads happen on backend
      const res = await api[httpMethod](apiEndpoint, multipartFormData);

      if (res.data.success) {
        setLoadingStep("");
        // Show success actions instead of alert and close
        setShowSuccessActions(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(editMode ? "Update Error:" : "Check-in Error:", err);
      setLoadingStep("");
      alert(
        err.response?.data?.message ||
          (editMode ? "Update failed!" : "Check-in failed!"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Payment modes
  const paymentModes = [
    { value: "Cash", label: "Cash", icon: FiDollarSign },
    { value: "UPI", label: "UPI", icon: FiPhone },
    { value: "Card", label: "Card", icon: FiCreditCard },
    { value: "Bank Transfer", label: "Bank", icon: FiTrendingUp },
    { value: "Wallet", label: "Wallet", icon: FiCreditCard },
  ];

  const stepLabels = ["Party", "Guest", "Payment"];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--color-background)] w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white flex justify-between items-center rounded-t-2xl border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg font-black text-[var(--color-text-primary)] tracking-tight uppercase">
              {editMode ? "Edit Check-in" : "Guest Check-in"}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] font-medium">
              {editMode
                ? `Check-in #${existingCheckIn?.checkInId}`
                : `Booking #${bookingData?.bookingId}`}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {[1, 2, 3].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-all ${
                      currentStep >= step
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step ? <FiCheckCircle size={10} /> : step}
                  </div>
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${
                      currentStep >= step
                        ? "text-[var(--color-text-primary)]"
                        : "text-gray-400"
                    }`}
                  >
                    {stepLabels[step - 1]}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-6 sm:w-8 h-0.5 rounded transition-all ${currentStep > step ? "bg-[var(--color-primary)]" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <FiX size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <FiLoader
                size={40}
                className="animate-spin text-[var(--color-primary)] mx-auto mb-3"
              />
              <p className="text-sm font-bold text-gray-700">
                {loadingStep || "Processing..."}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* STEP 1: Party & Stay Setup */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in">
              {/* Left: Main Content */}
              <div className="lg:col-span-3 space-y-4">
                {/* Party Type */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mb-3">
                    Party Type
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPartyType("Individual")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${partyType === "Individual" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-border hover:border-gray-300"}`}
                    >
                      <FiUser
                        size={16}
                        className={
                          partyType === "Individual"
                            ? "text-[var(--color-primary)]"
                            : "text-gray-400"
                        }
                      />
                      <span className="font-bold text-xs">Individual</span>
                    </button>
                    <button
                      onClick={() => setPartyType("Corporate")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${partyType === "Corporate" ? "border-blue-500 bg-blue-50" : "border-border hover:border-gray-300"}`}
                    >
                      <FiBriefcase
                        size={16}
                        className={
                          partyType === "Corporate"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }
                      />
                      <span className="font-bold text-xs">Corporate</span>
                    </button>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiCalendar
                      size={12}
                      className="text-[var(--color-primary)]"
                    />{" "}
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Check-in
                      </label>
                      <DatePicker
                        selected={stayFormData.checkInTime}
                        onChange={(date: Date | null) =>
                          date && setStayFormData({
                            ...stayFormData,
                            checkInTime: date,
                          })
                        }
                        className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                        dateFormat="dd MMM, HH:mm"
                        showTimeSelect
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Check-out
                      </label>
                      {isDayAccess ? (
                        <div className="w-full p-2 bg-green-50 border border-green-200 rounded-lg text-[11px] font-bold text-green-600">
                          {format(
                            stayFormData.expectedCheckOutTime,
                            "dd MMM, HH:mm",
                          )}
                          <span className="text-[9px] ml-1">
                            (from package)
                          </span>
                        </div>
                      ) : (
                        <DatePicker
                          selected={stayFormData.expectedCheckOutTime}
                          onChange={(date: Date | null) =>
                            date && setStayFormData({
                              ...stayFormData,
                              expectedCheckOutTime: date,
                            })
                          }
                          className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold text-[var(--color-primary)] outline-none"
                          dateFormat="dd MMM, HH:mm"
                          showTimeSelect
                        />
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        {isDayAccess ? "Duration" : "Nights"}
                      </label>
                      <div className="p-2 bg-gray-50 border border-border rounded-lg text-center">
                        <span className="text-sm font-black">
                          {isDayAccess ? `${durationHours}h` : `${nights}N`}
                        </span>
                      </div>
                    </div>
                    {!isDayAccess && (
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Rooms
                        </label>
                        <div className="p-2 bg-gray-50 border border-border rounded-lg text-center">
                          <span className="text-sm font-black">
                            {selectedRooms.length}
                          </span>
                        </div>
                      </div>
                    )}
                    {isDayAccess && (
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Package
                        </label>
                        <div className="p-2 bg-gray-50 border border-border rounded-lg text-center">
                          <span className="text-sm font-black text-green-600">
                            {bookingData?.accessPackageId?.packageName ||
                              "Day Access"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Selection - Hidden for Day Access */}
                {!isDayAccess && (
                  <>
                    <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest flex items-center gap-2">
                            <FiHome
                              size={12}
                              className="text-[var(--color-primary)]"
                            />{" "}
                            Room Selection
                          </h3>
                          {preferredRoomTypeName && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold border border-primary/20">
                              Preferred: {preferredRoomTypeName}
                            </span>
                          )}
                        </div>
                        <select
                          value={roomTypeFilterId}
                          onChange={(e) => {
                            setRoomTypeFilterId(e.target.value);
                            fetchRoomsByType(e.target.value || undefined);
                          }}
                          className="p-1.5 bg-gray-50 border border-border rounded-lg text-[10px] font-bold outline-none"
                        >
                          <option value="">All Rooms</option>
                          {roomTypes.map((type: any) => (
                            <option key={type._id} value={type._id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Per-slot room assignment (when coming from a booking with room type selections) */}
                      {!isDayAccess && bookingData?.rooms?.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <h4 className="text-xs font-bold text-text-primary">Assign Rooms</h4>
                          {selectedRooms.map((slot, idx) => (
                            <div key={`slot-${slot.slotIndex ?? idx}-${slot.requiredRoomTypeId ?? "any"}`} className="border border-border rounded-xl p-3 bg-card">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-primary">
                                  Room {idx + 1}{slot.roomTypeName ? ` · ${slot.roomTypeName}` : ""}
                                </span>
                                {slot.roomId ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-600 rounded">
                                    Assigned: {slot.roomNumber}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded">
                                    Not Assigned
                                  </span>
                                )}
                              </div>

                              <select
                                value={slot.roomId}
                                onChange={(e) => {
                                  const chosenRoom = availableRooms.find((r: any) => r._id === e.target.value);
                                  if (!chosenRoom) return;
                                  setSelectedRooms(
                                    selectedRooms.map((s, i) =>
                                      i === idx
                                        ? {
                                            ...s,
                                            roomId: chosenRoom._id,
                                            roomNumber: chosenRoom.roomNumber,
                                            basePrice: chosenRoom.basePrice,
                                            roomType: chosenRoom.roomType,
                                            roomTypeName: chosenRoom.roomType?.name || "",
                                            extraBedAllowed: chosenRoom.extraBedAllowed || false,
                                            extraBedCharge: chosenRoom.extraBedCharge || 0,
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="w-full border border-border rounded-lg p-2 text-xs bg-white outline-none"
                              >
                                <option value="">-- Select Room --</option>
                                {availableRooms
                                  .filter((r: any) => {
                                    if (!slot.requiredRoomTypeId) return true;
                                    const roomTypeId =
                                      typeof r.roomType === "object" ? r.roomType?._id : r.roomType;
                                    return String(roomTypeId) === String(slot.requiredRoomTypeId);
                                  })
                                  .filter((r: any) =>
                                    !selectedRooms.some((s, i) => i !== idx && s.roomId === r._id)
                                  )
                                  .map((r: any) => (
                                    <option key={r._id} value={r._id}>
                                      Room {r.roomNumber} · {r.roomType?.name || ""} · ₹{r.basePrice}/night
                                    </option>
                                  ))}
                              </select>

                              {slot.roomId && slot.extraBedAllowed && (
                                <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={slot.hasExtraBed}
                                    onChange={(e) =>
                                      setSelectedRooms(
                                        selectedRooms.map((s, i) =>
                                          i === idx ? { ...s, hasExtraBed: e.target.checked } : s
                                        )
                                      )
                                    }
                                  />
                                  Extra Bed (+₹{slot.extraBedCharge}/night)
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* All Rooms Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 sm:max-h-60 overflow-y-auto">
                        {availableRooms.map((room: any) => {
                          const isSelected = selectedRooms.some(
                            (r) => r.roomId === room._id,
                          );
                          const occupancy = getRoomOccupancy(room._id);
                          const roomTypeId =
                            room.roomType?._id?.toString() ||
                            room.roomType?.toString();
                          const isPreferred =
                            !!preferredRoomTypeId &&
                            roomTypeId === preferredRoomTypeId;
                          return (
                            <div
                              key={room._id}
                              onClick={() => toggleRoom(room)}
                              className={`relative p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-orange-500 bg-orange-50"
                                  : isPreferred
                                    ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                                    : "border-border hover:border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                  <FiCheckCircle
                                    size={10}
                                    className="text-white"
                                  />
                                </div>
                              )}
                              {isPreferred && !isSelected && (
                                <div className="absolute top-1 right-1 px-1 py-0.5 bg-primary/20 rounded text-[7px] font-black text-primary leading-none">
                                  Pref
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-1">
                                <FiCoffee
                                  size={12}
                                  className={
                                    isSelected
                                      ? "text-orange-500"
                                      : isPreferred
                                        ? "text-primary"
                                        : "text-gray-400"
                                  }
                                />
                                <span className="text-[10px] sm:text-[11px] font-black">
                                  {room.roomNumber}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold">
                                  ₹{Number(room.basePrice) || 0}
                                </span>
                                {room.extraBedAllowed && (
                                  <span className="text-[8px] sm:text-[9px] text-orange-500 font-bold">
                                    +Extra
                                  </span>
                                )}
                              </div>
                              {occupancy.count > 0 && (
                                <div className="mt-1 text-[8px] text-orange-600 font-bold">
                                  {occupancy.count} guest
                                  {occupancy.count > 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Rooms with Extra Bed */}
                    <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                      <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mb-3">
                        Selected Rooms ({selectedRooms.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedRooms.map((room: RoomEntry) => {
                          const safeBasePrice = Number(room.basePrice) || 0;
                          const occupancy = getRoomOccupancy(room.roomId);
                          return (
                            <div
                              key={room.roomId}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg gap-2"
                            >
                              <div className="flex items-center gap-3">
                                <FiCoffee
                                  size={16}
                                  className="text-orange-500"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs">
                                      Room {room.roomNumber || "TBD"}
                                    </span>
                                    {room.roomTypeName && (
                                      <span className="text-[9px] text-gray-500">
                                        ({room.roomTypeName})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-500 font-bold">
                                      ₹{safeBasePrice}/night
                                    </span>
                                    {occupancy.count > 0 && (
                                      <span className="text-[9px] text-orange-600 font-bold">
                                        {occupancy.count} guest
                                        {occupancy.count > 1 ? "s" : ""}
                                      </span>
                                    )}
                                    {room.hasExtraBed && (
                                      <span className="text-[9px] text-green-600 font-bold bg-green-100 px-1 rounded">
                                        Extra Bed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {room.extraBedAllowed && (
                                  <button
                                    onClick={() => toggleExtraBed(room.roomId)}
                                    className={`px-2 py-1 rounded text-[9px] font-bold ${room.hasExtraBed ? "bg-orange-500 text-white" : "bg-gray-100 text-gray500"}`}
                                  >
                                    Extra Bed{" "}
                                    {room.hasExtraBed
                                      ? `(+₹${Number(room.extraBedCharge) || 0})`
                                      : ""}
                                  </button>
                                )}
                                {selectedRooms.length > 1 && (
                                  <button
                                    onClick={() => removeRoom(room.roomId)}
                                    className="p-1 text-red-400 hover:bg-red-50 rounded"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Day Access Info Banner */}
                {isDayAccess && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} className="text-green-600" />
                        <span className="text-xs font-black text-green-700 uppercase">
                          Day Access Booking
                        </span>
                      </div>
                      <p className="text-[11px] text-green-600 mt-1">
                        Entry: {format(stayFormData.checkInTime, "HH:mm")} |
                        Exit:{" "}
                        {format(stayFormData.expectedCheckOutTime, "HH:mm")} (
                        {durationHours}h)
                      </p>
                    </div>

                    {/* Optional Room Add-on for Day Access */}
                    <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest flex items-center gap-2">
                          <FiHome
                            size={12}
                            className="text-[var(--color-primary)]"
                          />
                          Optional Room Add-on
                        </h3>
                        <span className="text-[9px] text-gray-400 font-bold">
                          Additional charge
                        </span>
                      </div>
                      {selectedRooms.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {selectedRooms.map((room: RoomEntry) => {
                            const safeBasePrice = Number(room.basePrice) || 0;
                            return (
                              <div
                                key={room.roomId}
                                className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <FiCoffee
                                    size={14}
                                    className="text-orange-500"
                                  />
                                  <span className="text-[11px] font-bold">
                                    Room {room.roomNumber || "TBD"}
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    ({room.roomTypeName})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-orange-600">
                                    +₹{safeBasePrice}
                                  </span>
                                  <button
                                    onClick={() => removeRoom(room.roomId)}
                                    className="p-1 text-red-400 hover:bg-red-50 rounded"
                                  >
                                    <FiTrash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <select
                        onChange={(e) => {
                          const roomId = e.target.value;
                          if (!roomId) return;
                          const room = availableRooms.find(
                            (r: any) => r._id === roomId,
                          );
                          if (
                            room &&
                            !selectedRooms.some((r) => r.roomId === room._id)
                          ) {
                            setSelectedRooms([
                              ...selectedRooms,
                              {
                                roomId: room._id,
                                roomNumber: room.roomNumber,
                                basePrice: Number(room.basePrice) || 0,
                                roomType: room.roomType,
                                roomTypeName: room.roomType?.name || "",
                                hasExtraBed: false,
                                extraBedCharge: 0,
                                extraBedAllowed: false,
                              },
                            ]);
                          }
                          e.target.value = "";
                        }}
                        className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[10px] font-bold outline-none"
                      >
                        <option value="">+ Add a room (optional)</option>
                        {availableRooms
                          .filter(
                            (room: any) =>
                              !selectedRooms.some((r) => r.roomId === room._id),
                          )
                          .map((room: any) => (
                            <option key={room._id} value={room._id}>
                              Room {room.roomNumber} - ₹
                              {Number(room.basePrice) || 0} (
                              {room.roomType?.name || "Standard"})
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Corporate Details */}
                {partyType === "Corporate" && (
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                      Company Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Company *
                        </label>
                        <input
                          type="text"
                          value={corporateDetails.companyName}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              companyName: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          GST
                        </label>
                        <input
                          type="text"
                          value={corporateDetails.companyGST}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              companyGST: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="GST No."
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={corporateDetails.contactPersonName}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              contactPersonName: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Mobile
                        </label>
                        <input
                          type="tel"
                          value={corporateDetails.contactMobile}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              contactMobile: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="+91"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={corporateDetails.department}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              department: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="Dept."
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Visit Purpose
                        </label>
                        <input
                          type="text"
                          value={corporateDetails.visitPurpose}
                          onChange={(e) =>
                            setCorporateDetails({
                              ...corporateDetails,
                              visitPurpose: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[11px] font-bold outline-none"
                          placeholder="Purpose"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">
                    Special Requests
                  </h3>
                  <textarea
                    value={stayFormData.specialRequests}
                    onChange={(e) =>
                      setStayFormData({
                        ...stayFormData,
                        specialRequests: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none resize-none"
                    placeholder="Early check-in, extra pillows..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-[var(--color-card)] rounded-xl border border-border p-4 h-fit">
                <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-3 flex items-center gap-2">
                  <FiFileText
                    size={12}
                    className="text-[var(--color-primary)]"
                  />{" "}
                  Stay Summary
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-bold">
                      {format(stayFormData.checkInTime, "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-bold text-[var(--color-primary)]">
                      {format(
                        stayFormData.expectedCheckOutTime,
                        "dd MMM, HH:mm",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-bold">
                      {isDayAccess
                        ? `${durationHours}h`
                        : `${nights} Night${nights !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {!isDayAccess && (
                    <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Rooms</span>
                      <span className="font-bold">{selectedRooms.length}</span>
                    </div>
                  )}
                  {isDayAccess && (
                    <div className="flex justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-green-600">Package</span>
                      <span className="font-bold text-green-600">
                        {bookingData?.accessPackageId?.packageName ||
                          "Day Access"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  {!isDayAccess ? (
                    <>
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">
                        Room Breakdown
                      </p>
                      {selectedRooms.map((room: RoomEntry) => {
                        const safeBasePrice = Number(room.basePrice) || 0;
                        return (
                          <div key={room.roomId} className="mb-2">
                            <div className="flex justify-between text-[11px]">
                              <span>
                                Room {room.roomNumber || "TBD"} × {nights}
                              </span>
                              <span className="font-bold">
                                ₹{(safeBasePrice * nights).toLocaleString()}
                              </span>
                            </div>
                            {room.hasExtraBed && (
                              <div className="flex justify-between text-[10px] text-orange-500">
                                <span>Extra Bed × {nights}</span>
                                <span>
                                  +₹
                                  {(
                                    (Number(room.extraBedCharge) || 0) * nights
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-[9px] font-bold text-green-600 uppercase mb-2">
                      Day Access Package
                    </p>
                  )}
                </div>
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold">
                      {isDayAccess ? "Total" : "Room Total"}
                    </span>
                    <span className="font-black text-[var(--color-primary)]">
                      ₹{roomTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Guest / Document Details */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in">
              {/* Left: Guest Form */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase flex items-center gap-2">
                    <FiUserCheck
                      size={12}
                      className="text-[var(--color-primary)]"
                    />{" "}
                    Guest Details
                  </h3>
                  <button
                    onClick={addGuest}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-[10px] font-bold"
                  >
                    <FiPlus size={10} /> Add Guest
                  </button>
                </div>

                {/* Validation Message */}
                {guests.some((g) => g.isPrimary) && (
                  <div
                    className={`p-2 rounded-lg text-[10px] font-bold ${!canProceed(2) ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"}`}
                  >
                    {canProceed(2)
                      ? "Primary guest details are complete"
                      : getStep2Validation()}
                  </div>
                )}

                {guests.map((guest, idx) => {
                  const assignedRoom = selectedRooms.find(
                    (r) => r.roomId === guest.assignedRoomId,
                  );
                  return (
                    <div
                      key={guest.id}
                      className={`bg-[var(--color-card)] rounded-xl border p-4 ${guest.isPrimary ? "border-orange-200 bg-orange-50/30" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-[var(--color-text-secondary)] uppercase">
                            {guest.isPrimary
                              ? "Primary Guest"
                              : `Guest ${idx + 1}`}
                          </span>
                          {assignedRoom && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold">
                              Room {assignedRoom.roomNumber}
                            </span>
                          )}
                          {!guest.isPrimary && (
                            <button
                              onClick={() => setPrimaryGuest(guest.id)}
                              className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-200"
                            >
                              Set Primary
                            </button>
                          )}
                          {guest.isPrimary && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[9px] font-bold">
                              Primary
                            </span>
                          )}
                        </div>
                        {guests.length > 1 && !guest.isPrimary && (
                          <button
                            onClick={() => removeGuest(guest.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Room Assignment - Hidden for Day Access */}
                      {!isDayAccess && (
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">
                            Assigned Room:
                          </span>
                          <select
                            value={guest.assignedRoomId || ""}
                            onChange={(e) =>
                              updateGuest(
                                guest.id,
                                "assignedRoomId",
                                e.target.value || null,
                              )
                            }
                            className="flex-1 p-1.5 bg-white border border-blue-200 rounded-lg text-[10px] font-bold outline-none"
                          >
                            <option value="">Select Room</option>
                            {selectedRooms.map((room: RoomEntry) => {
                              const occ = getRoomOccupancy(room.roomId);
                              return (
                                <option key={room.roomId} value={room.roomId}>
                                  Room {room.roomNumber || "TBD"} ({occ.count}{" "}
                                  guest{occ.count !== 1 ? "s" : ""})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      {isDayAccess && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <span className="text-[9px] font-black text-green-600">
                            Day Access — No room assignment required
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            Name {guest.isPrimary && "*"}
                          </label>
                          <input
                            type="text"
                            value={guest.name}
                            onChange={(e) =>
                              updateGuest(guest.id, "name", e.target.value)
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                            placeholder="Guest name"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            Mobile {guest.isPrimary && "*"}
                          </label>
                          <input
                            type="tel"
                            value={guest.mobileNo}
                            onChange={(e) =>
                              updateGuest(guest.id, "mobileNo", e.target.value)
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                            placeholder="+91 XXXXX"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            ID Type
                          </label>
                          <select
                            value={guest.idType}
                            onChange={(e) =>
                              updateGuest(guest.id, "idType", e.target.value)
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                          >
                            <option>Aadhar Card</option>
                            <option>Voter Card</option>
                            <option>Passport</option>
                            <option>Driving License</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            ID Number {guest.isPrimary && "*"}
                          </label>
                          <input
                            type="text"
                            value={guest.idNumber}
                            onChange={(e) =>
                              updateGuest(guest.id, "idNumber", e.target.value)
                            }
                            className={`w-full p-2 bg-gray-50 border rounded-lg text-[11px] font-bold outline-none ${guest.isPrimary && !guest.idNumber ? "border-red-400" : "border-border"}`}
                            placeholder="XXXX-XXXX-XXXX"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            Gender
                          </label>
                          <select
                            value={guest.gender}
                            onChange={(e) =>
                              updateGuest(guest.id, "gender", e.target.value)
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            value={guest.age}
                            onChange={(e) =>
                              updateGuest(guest.id, "age", e.target.value)
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                            placeholder="Age"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                            Nationality
                          </label>
                          <input
                            type="text"
                            value={guest.nationality}
                            onChange={(e) =>
                              updateGuest(
                                guest.id,
                                "nationality",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                            placeholder="Nationality"
                          />
                        </div>
                      </div>

                      {/* Document Upload */}
                      <div className="mt-3">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Upload ID Document (JPG, PNG, PDF - Max 5MB)
                        </label>
                        {guest.pendingDocFile ? (
                          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              {getFileIcon(guest.pendingDocFile)}
                              <span className="text-[10px] font-bold text-green-600 truncate max-w-[150px]">
                                {guest.pendingDocFile.name}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                (Pending upload)
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveDocument(guest.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <FiXCircle size={14} />
                            </button>
                          </div>
                        ) : guest.idDocument?.secure_url ? (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <FiFileText size={14} className="text-blue-500" />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-blue-600">
                                Existing Document
                              </span>
                              <a
                                href={guest.idDocument.secure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-blue-500 hover:underline ml-2"
                              >
                                View
                              </a>
                            </div>
                            <button
                              onClick={() => {
                                updateGuest(guest.id, "idDocument", null);
                              }}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="Remove document"
                            >
                              <FiXCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                            <FiUpload size={14} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500">
                              Select ID Document
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(guest.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Vehicle Details */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FiPhone size={14} className="text-gray-400" />
                      <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase">
                        Vehicle Details
                      </h3>
                    </div>
                    <button
                      onClick={addVehicle}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-200"
                    >
                      <FiPlus size={10} /> Add Vehicle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {vehicles.map((vehicle: any, idx: number) => (
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
                          className="p-2 bg-white border border-border rounded-lg text-[11px] font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Type"
                          value={vehicle.vehicleType}
                          onChange={(e) =>
                            updateVehicle(idx, "vehicleType", e.target.value)
                          }
                          className="p-2 bg-white border border-border rounded-lg text-[11px] font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Driver Name"
                          value={vehicle.driverName}
                          onChange={(e) =>
                            updateVehicle(idx, "driverName", e.target.value)
                          }
                          className="p-2 bg-white border border-border rounded-lg text-[11px] font-bold"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Contact"
                            value={vehicle.driverContact}
                            onChange={(e) =>
                              updateVehicle(
                                idx,
                                "driverContact",
                                e.target.value,
                              )
                            }
                            className="flex-1 p-2 bg-white border border-border rounded-lg text-[11px] font-bold"
                          />
                          {vehicles.length > 1 && (
                            <button
                              onClick={() => removeVehicle(idx)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-[var(--color-card)] rounded-xl border border-border p-4 h-fit">
                <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-3 flex items-center gap-2">
                  <BiShield size={12} className="text-[var(--color-primary)]" />{" "}
                  Guest Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-[11px] text-gray-500">
                      Primary Guest
                    </span>
                    <span className="text-[11px] font-bold">
                      {getPrimaryGuest()?.name || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-[11px] text-gray-500">
                      Total Guests
                    </span>
                    <span className="text-[11px] font-bold">
                      {guests.length}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-[11px] text-gray-500">Vehicles</span>
                    <span className="text-[11px] font-bold">
                      {vehicles.filter((v: any) => v.vehicleNumber).length}
                    </span>
                  </div>
                </div>

                {/* Room-Guest Mapping */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">
                    Room Assignment
                  </p>
                  {selectedRooms.map((room: RoomEntry) => {
                    const occ = getRoomOccupancy(room.roomId);
                    return (
                      <div
                        key={room.roomId}
                        className="mb-2 p-2 bg-orange-50 rounded-lg border border-orange-100"
                      >
                        <p className="text-[10px] font-bold text-orange-600">
                          Room {room.roomNumber || "TBD"}
                        </p>
                        <div className="mt-1 space-y-1">
                          {occ.guests.map((g) => (
                            <p key={g.id} className="text-[9px] text-gray-600">
                              • {g.name || "(No name)"}{" "}
                              {g.isPrimary && "(Primary)"}
                            </p>
                          ))}
                          {occ.count === 0 && (
                            <p className="text-[9px] text-gray-400 italic">
                              No guest assigned
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment & GRC */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in">
              {/* Left: Payment & GRC */}
              <div className="lg:col-span-3 space-y-4">
                {/* Payment Summary */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiCreditCard size={16} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-green-800 uppercase">
                        Payment Summary
                      </h3>
                      <p className="text-[9px] text-green-500">
                        Booking #{bookingData?.bookingId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-green-100">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">
                        Booking Advance
                      </span>
                      <p className="text-lg font-black text-green-600">
                        ₹{bookingAdvance.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-100">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">
                        Check-in Advance
                      </span>
                      <p className="text-lg font-black text-[var(--color-text-primary)]">
                        ₹{checkInAdvance.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-lg text-white">
                      <span className="text-[9px] font-bold text-green-100 uppercase">
                        Total Paid
                      </span>
                      <p className="text-lg font-black">
                        ₹{totalPaid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add-on Services */}
                {extraServices.length > 0 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FiPlus size={14} className="text-purple-600" />
                      <h3 className="text-[10px] font-black text-purple-800 uppercase">
                        Add-on Services
                      </h3>
                      <span className="text-[9px] text-purple-500">
                        Optional additional services
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {extraServices.map((service) => (
                        <label
                          key={service._id}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedServices.includes(service._id)
                              ? "border-purple-500 bg-purple-100"
                              : "border-purple-200 bg-white hover:border-purple-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, service._id]);
                              } else {
                                setSelectedServices(
                                  selectedServices.filter((id) => id !== service._id)
                                );
                              }
                            }}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-purple-800 block">
                              {service.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <span className="text-[9px] font-bold text-purple-600">
                          {selectedServices.length} service(s) selected
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Collect Payment */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-3 flex items-center gap-2">
                    <FiDollarSign
                      size={12}
                      className="text-[var(--color-primary)]"
                    />{" "}
                    Collect Check-in Advance
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={paymentData.checkInAdvance}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            checkInAdvance: Number(e.target.value),
                          })
                        }
                        className="w-full p-3 bg-gray-50 border-2 border-border rounded-lg font-black text-lg outline-none focus:border-[var(--color-primary)]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Payment Mode
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {paymentModes.map((mode) => {
                          const Icon = mode.icon;
                          return (
                            <button
                              key={mode.value}
                              onClick={() =>
                                setPaymentData({
                                  ...paymentData,
                                  paymentMode: mode.value,
                                })
                              }
                              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                                paymentData.paymentMode === mode.value
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                  : "border-border hover:border-gray-300"
                              }`}
                            >
                              <Icon
                                size={12}
                                className={
                                  paymentData.paymentMode === mode.value
                                    ? "text-[var(--color-primary)]"
                                    : "text-gray-400"
                                }
                              />
                              <span className="text-[9px] font-bold">
                                {mode.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {paymentData.paymentMode !== "Cash" && (
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={paymentData.transactionId}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              transactionId: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                          placeholder="Enter TXN ID..."
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">
                        Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentData.paymentNote}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            paymentNote: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[11px] font-bold outline-none"
                        placeholder="Add note..."
                      />
                    </div>
                  </div>
                </div>

                {/* Signed GRC Upload */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FiFileText size={14} className="text-purple-600" />
                      <h3 className="text-[10px] font-black text-purple-700 uppercase">
                        Signed GRC Document
                      </h3>
                    </div>
                  </div>

                  {signedGRCFile ? (
                    <div className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-lg">
                      <FiFile size={16} className="text-purple-500" />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-purple-700">
                          {signedGRCFile.name}
                        </p>
                        <p className="text-[9px] text-gray-500">
                          Signed GRC - will upload on submit
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveSignedGRC}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <FiXCircle size={14} />
                      </button>
                    </div>
                  ) : signedGRCPreview ? (
                    <div className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-lg">
                      <FiFileText size={16} className="text-purple-500" />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-purple-700">
                          Existing Signed GRC
                        </p>
                        <a
                          href={signedGRCPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-blue-600 hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                      <button
                        onClick={() => setSignedGRCPreview(null)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                        title="Remove and upload new"
                      >
                        <FiXCircle size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 p-4 border-2 border-dashed border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-all">
                      <FiUpload size={16} className="text-purple-400" />
                      <div>
                        <span className="text-[11px] font-bold text-purple-700">
                          Upload Signed GRC
                        </span>
                        <p className="text-[9px] text-purple-400">
                          JPG, PNG, PDF - Max 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSignedGRCUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* GRC Preview */}
                <div className="bg-[var(--color-card)] rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FiFileText
                        size={14}
                        className="text-[var(--color-primary)]"
                      />
                      <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase">
                        Guest Registration Card (GRC)
                      </h3>
                    </div>
                    <span className="text-[11px] font-black text-[var(--color-primary)]">
                      GRC-{Date.now().toString().slice(-6)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Primary Guest
                      </span>
                      <span className="font-bold">
                        {getPrimaryGuest()?.name || "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Mobile
                      </span>
                      <span className="font-bold">
                        {getPrimaryGuest()?.mobileNo || "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Total Guests
                      </span>
                      <span className="font-bold">{guests.length}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Check-in
                      </span>
                      <span className="font-bold">
                        {format(stayFormData.checkInTime, "dd MMM, HH:mm")}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Check-out
                      </span>
                      <span className="font-bold">
                        {format(
                          stayFormData.expectedCheckOutTime,
                          "dd MMM, HH:mm",
                        )}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-500 block">
                        Rooms
                      </span>
                      <span className="font-bold">{selectedRooms.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenGRC}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-[10px] font-bold hover:bg-purple-600 transition-all"
                  >
                    <FiPrinter size={12} /> Preview & Export GRC
                  </button>
                </div>
              </div>

              {/* Right: Due Summary */}
              <div className="bg-[var(--color-card)] rounded-xl border border-border p-4 h-fit">
                <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-3">
                  {" "}
                  Payment Breakdown
                </h3>
                {/* Payment Breakdown for Room Stay only */}
                {!isDayAccess ? (
                  <div className="space-y-2">
                    {selectedRooms.map((room: RoomEntry) => {
                      const safeBasePrice = Number(room.basePrice) || 0;
                      return (
                        <div
                          key={room.roomId}
                          className="p-2 bg-gray-50 rounded-lg border border-border"
                        >
                          <div className="flex justify-between">
                            <span className="text-[11px] font-bold">
                              Room {room.roomNumber || "TBD"}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              ₹{safeBasePrice} × {nights}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-bold">
                              ₹{(safeBasePrice * nights).toLocaleString()}
                            </span>
                          </div>
                          {room.hasExtraBed && (
                            <span className="text-[9px] text-orange-500 font-bold">
                              + ₹
                              {(
                                (Number(room.extraBedCharge) || 0) * nights
                              ).toLocaleString()}{" "}
                              (Extra Bed)
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Room Total</span>
                      <span className="font-bold">
                        ₹{roomTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-green-500">
                      <span className="text-gray-500">Booking Advance</span>
                      <span className="font-bold">
                        - ₹{bookingAdvance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-green-500">
                      <span className="text-gray-500">Check-in Advance</span>
                      <span className="font-bold">
                        - ₹{checkInAdvance.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center p-3 bg-[var(--color-primary)]/10 rounded-lg">
                      <span className="text-[11px] font-bold text-[var(--color-primary)]">
                        Due at Checkout
                      </span>
                      <span className="text-lg font-black text-[var(--color-primary)]">
                        ₹{dueAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-green-600 font-bold">
                          Day Access Package
                        </span>
                        <span className="text-green-600 font-bold">
                          ₹{packagePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {selectedRooms.length > 0 &&
                      selectedRooms.map((room: RoomEntry) => {
                        const safePrice = Number(room.basePrice) || 0;
                        return (
                          <div
                            key={room.roomId}
                            className="p-2 bg-gray-50 rounded-lg border border-border"
                          >
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold">
                                Room {room.roomNumber || "TBD"} (add-on)
                              </span>
                              <span className="font-bold text-orange-600">
                                +₹{safePrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {selectedRooms.length > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">
                          Room Add-ons Total
                        </span>
                        <span className="font-bold">
                          ₹{roomAddOnTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] font-black border-t border-border pt-2">
                      <span>Total (Package + Rooms)</span>
                      <span className="text-[var(--color-primary)]">
                        ₹{roomTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-green-500">
                      <span className="text-gray-500">Booking Advance</span>
                      <span className="font-bold">
                        - ₹{bookingAdvance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-green-500">
                      <span className="text-gray-500">Check-in Advance</span>
                      <span className="font-bold">
                        - ₹{checkInAdvance.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center p-3 bg-[var(--color-primary)]/10 rounded-lg">
                      <span className="text-[11px] font-bold text-[var(--color-primary)]">
                        Due at Checkout
                      </span>
                      <span className="text-lg font-black text-[var(--color-primary)]">
                        ₹{Math.max(0, roomTotal - totalPaid).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Guest Summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">
                    Primary Guest
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <FiUser size={10} className="text-gray-400" />
                      <span className="font-bold">
                        {getPrimaryGuest()?.name || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>{getPrimaryGuest()?.mobileNo || "No phone"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-white flex justify-between items-center rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-gray-400 font-bold text-[10px] uppercase tracking-wider hover:text-gray-600"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1 px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-all"
              >
                <FiChevronLeft size={12} /> Back
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={() =>
                  canProceed(currentStep) && setCurrentStep(currentStep + 1)
                }
                disabled={!canProceed(currentStep)}
                className={`flex items-center gap-1 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                  canProceed(currentStep)
                    ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue <FiChevronRight size={12} />
              </button>
            ) : (
              <button
                onClick={handleFinalCheckIn}
                disabled={loading}
                className="flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 bg-[var(--color-primary)] text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {loading ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <FiCheckCircle size={14} />
                )}
                {loading
                  ? "Processing..."
                  : editMode
                    ? "Update Check-in"
                    : "Confirm Check-in"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Actions - Post Check-in */}
      {showSuccessActions && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">
                Check-in Successful!
              </h2>
              <p className="text-sm text-gray-500">
                Guest has been checked in successfully
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Open GRC modal
                  handleOpenGRC();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all"
              >
                <FiPrinter size={18} />
                Print Registration Card
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement print key card functionality
                    alert("Print Key Card - Feature coming soon");
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                >
                  <FiFileText size={16} />
                  Print Key Card
                </button>

                <button
                  onClick={() => {
                    // TODO: Implement view folio functionality
                    alert("View Folio - Feature coming soon");
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-all"
                >
                  <FiFileText size={16} />
                  View Folio
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSuccessActions(false);
                  onClose();
                }}
                className="w-full px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRC A4 Print Modal */}
      {showGRCModal && grcData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/10 backdrop-blur p-2 sm:p-4">
          <div className="w-full max-w-4xl h-screen overflow-x-auto no-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mt-4">
              <h2 className="text-white font-black text-base sm:text-lg uppercase tracking-wider">
                Guest Registration Card - A4 Preview
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => grcCardRef.current?.exportToPDF()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-xs hover:bg-green-600"
                >
                  <FiPrinter size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowGRCModal(false)}
                  className="p-2 bg-white/20 text-text-primary rounded-lg hover:bg-white/60"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* GRC Card */}
            <GuestRegistrationCard ref={grcCardRef} data={grcData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
