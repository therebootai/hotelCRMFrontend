import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
 FiX,
 FiUser,
 FiCreditCard,
 FiCheckCircle,
 FiChevronRight,
 FiChevronLeft,
 FiDollarSign,
 FiPhone,
 FiPrinter,
 FiImage,
 FiFile,
 FiLoader,
 FiTrendingUp,
 FiBriefcase,
 FiPlus,
 FiChevronDown,
 FiChevronUp,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, differenceInCalendarDays, differenceInHours, format } from "date-fns";
import api from "../../lib/axios";
import GuestRegistrationCard from "./GuestRegistrationCard";


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
 onClose?: () => void;
 editMode?: boolean;
 existingCheckIn?: any;
 onSuccess?: () => void;
 inline?: boolean;
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
 email?: string;
 address?: string;
 relationship?: string;
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
 slotIndex?: number; // which booking.rooms[] entry this belongs to
 requiredRoomTypeId?: string; // expected room type for this slot (for filtering)
 maxAdults?: number;
 maxChildren?: number;
}

const Counter = ({ value, onChange, min = 0, max = 10 }: any) => (
  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white h-8 w-20">
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onChange(Math.max(min, value - 1)); }}
      disabled={value <= min}
      className="px-2 h-full hover:bg-slate-50 disabled:opacity-30 text-gray-500 transition-all font-bold"
    >
      -
    </button>
    <span className="flex-1 text-center font-bold text-xs text-gray-800">
      {value}
    </span>
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onChange(Math.min(max, value + 1)); }}
      disabled={value >= max}
      className="px-2 h-full hover:bg-slate-50 disabled:opacity-30 text-gray-500 transition-all font-bold"
    >
      +
    </button>
  </div>
);

const CheckInForm = ({
 bookingData,
 onClose,
 editMode = false,
 existingCheckIn,
 onSuccess,
 inline = false,
}: CheckInProps) => {
 const [currentStep, setCurrentStep] = useState(1);
 const [loading, setLoading] = useState(false);
 const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
 const [loadingStep, setLoadingStep] = useState<string>("");
 const [showSuccessActions, setShowSuccessActions] = useState(false);
  const navigate = useNavigate();
 const [roomTypes, setRoomTypes] = useState<any[]>([]);
 const [availableRooms, setAvailableRooms] = useState<any[]>([]);
 const [loadingRooms, setLoadingRooms] = useState(false);
 const grcCardRef = useRef<any>(null);

 // GRC Modal State
 const [showGRCModal, setShowGRCModal] = useState(false);
 const [grcData, setGrcData] = useState<GRCData | null>(null);

 // Signed GRC State
 const [signedGRCFile, setSignedGRCFile] = useState<File | null>(null);
 const [signedGRCPreview, setSignedGRCPreview] = useState<string | null>(null);

 // Extra Services State
 const [extraServices, setExtraServices] = useState<any[]>([]);
 const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
 const [roomSearchQuery, setRoomSearchQuery] = useState("");

  const handleAddCoGuest = (roomId: string) => {
    const newGuest = {
      id: `g-${Date.now()}`,
      name: "",
      mobileNo: "",
      idType: "Not Required",
      idNumber: "",
      gender: "",
      age: "",
      nationality: "Indian",
      isPrimary: false,
      assignedRoomId: roomId,
      idDocument: null,
      pendingDocFile: null,
      pendingDocPreview: null,
    };
    setGuests(prev => [...prev, newGuest as any]);
  };


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
 companyName: existingCheckIn.corporateCheckInDetails.companyName || "",
 companyGST: existingCheckIn.corporateCheckInDetails.companyGST || "",
 companyAddress: existingCheckIn.corporateCheckInDetails.companyAddress || "",
 companyEmail: existingCheckIn.corporateCheckInDetails.companyEmail || "",
 companyPhone: existingCheckIn.corporateCheckInDetails.companyPhone || "",
 contactPersonName: existingCheckIn.corporateCheckInDetails.contactPersonName || "",
 designation: existingCheckIn.corporateCheckInDetails.designation || "",
 contactMobile: existingCheckIn.corporateCheckInDetails.contactMobile || "",
 contactEmail: existingCheckIn.corporateCheckInDetails.contactEmail || "",
 department: existingCheckIn.corporateCheckInDetails.department || "",
 visitPurpose: existingCheckIn.corporateCheckInDetails.visitPurpose || "",
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

  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");

  // Form State - Step 1
  const isDayAccess = bookingData?.bookingCategory === "Day Access" || (!bookingData && urlCategory === "Day Access");

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
 name: bookingData?.bookingContact?.name || bookingData?.customerId?.name || "",
 mobileNo: bookingData?.bookingContact?.mobile || bookingData?.customerId?.phone || "",
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

   // Dynamic Documents
  const [dynamicDocs, setDynamicDocs] = useState<Array<{ id: string; type: string; file: File | null }>>([]);

  // Corporate Details
 const [corporateDetails, setCorporateDetails] = useState({
 companyName: bookingData?.corporateDetails?.companyName || "",
 companyGST: bookingData?.corporateDetails?.gstNumber || "",
 companyAddress: "",
 companyEmail: "",
 companyPhone: "",
 contactPersonName: bookingData?.corporateDetails?.contactPerson || "",
 designation: "",
 contactMobile: bookingData?.corporateDetails?.mobile || "",
 contactEmail: "",
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

 // Set of roomIds that are currently occupied by an active check-in
 const [occupiedRoomIds, setOccupiedRoomIds] = useState<Set<string>>(new Set());

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
 extraBedCharge: Number(roomIdObj?.extraBedCharge || r.extraBedCharge) || 0,
 extraBedAllowed: !!(roomIdObj?.extraBedAllowed || r.extraBedAllowed),
 maxAdults: Number(roomIdObj?.maxAdults || r.maxAdults) || 2,
 maxChildren: Number(roomIdObj?.maxChildren || r.maxChildren) || 0,
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
 setLoadingRooms(true);
 const res = await api.get("/rooms?status=Active&availableOnly=true&limit=500");
 setAvailableRooms(res.data.data?.rooms || []);
 } catch (err) {
 console.error("Error fetching rooms:", err);
 } finally {
 setLoadingRooms(false);
 }
 };
 const fetchOccupiedRooms = async () => {
 try {
 const res = await api.get("/checkin/list", { params: { status: "Active", limit: 500 } });
 const activeCheckIns: any[] = res.data.data || [];
 const ids = new Set<string>();
 for (const ci of activeCheckIns) {
 for (const rd of ci.roomDetails || []) {
 const id = rd.roomId?._id || rd.roomId;
 if (id) ids.add(id.toString());
 }
 }
 setOccupiedRoomIds(ids);
 } catch (err) {
 console.error("Error fetching occupied rooms:", err);
 }
 };
 const fetchExtraServices = async () => {
 try {
 const res = await api.get("/extra-services?activeOnly=true");
 const services = res.data.data || [];
 setExtraServices(services);
 // Pre-select services that were booked as add-ons
 if (bookingData?.addons?.length) {
 setSelectedAddons(bookingData.addons);
 }
 } catch (err) {
 console.error("Error fetching extra services:", err);
 }
 };
 fetchRoomTypes();
 fetchAllRooms();
 fetchOccupiedRooms();
 fetchExtraServices();
 }, []);

 // Fetch all rooms when type filter changes
 const fetchRoomsByType = async (typeId?: string) => {
 try {
 setLoadingRooms(true);
 let res;
 if (typeId) {
 res = await api.get(`/rooms?status=Active&availableOnly=true&roomType=${typeId}&limit=500`);
 } else {
 res = await api.get("/rooms?status=Active&availableOnly=true&limit=500");
 }
 setAvailableRooms(res.data.data?.rooms || []);
 } catch (err) {
 console.error("Error fetching rooms:", err);
 } finally {
 setLoadingRooms(false);
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

  let addonsTotal = 0;
  let addonsTaxAmount = 0;
  selectedAddons.forEach((addon: any) => {
    addonsTotal += addon.total || 0;
    addonsTaxAmount += addon.taxAmount || 0;
  });

  const subTotal = roomTotal + addonsTotal;
  const taxRate = bookingData?.pricingSummary?.taxPercentage ? bookingData.pricingSummary.taxPercentage / 100 : 0.12;
  const roomTaxAmount = roomTotal * taxRate;
  const taxAmount = Math.round(roomTaxAmount + addonsTaxAmount);
  const grandTotal = subTotal + taxAmount;

 const bookingAdvance = bookingData?.advanceAmount || 0;
 const checkInAdvance = paymentData.checkInAdvance;
 const totalPaid = bookingAdvance + checkInAdvance;
 const dueAmount = Math.max(0, grandTotal - totalPaid);

 // Toggle room selection
 const toggleRoom = (room: any) => {
 const isSelected = selectedRooms.some((r) => r.roomId === room._id);
 const bookingRoomsCount = bookingData?.rooms?.length || 0;

 if (isSelected) {
 const roomIdToRemove = room._id;
 const removeIdx = selectedRooms.findIndex((r) => r.roomId === roomIdToRemove);

 if (removeIdx !== -1) {
 // Clear guest assignments for that room
 setGuests(
 guests.map((g) =>
 g.assignedRoomId === roomIdToRemove
 ? { ...g, assignedRoomId: null }
 : g
 )
 );

 if (removeIdx < bookingRoomsCount) {
 // It's a core booking slot.
 // Find if there's any appended slot (index >= bookingRoomsCount) that is assigned
 const appendedIdx = selectedRooms.findIndex(
 (r, idx) => idx >= bookingRoomsCount && !!r.roomId
 );

 if (appendedIdx !== -1) {
 // Move the appended room details into this core slot
 const updated = [...selectedRooms];
 updated[removeIdx] = {
 ...updated[removeIdx],
 roomId: updated[appendedIdx].roomId,
 roomNumber: updated[appendedIdx].roomNumber,
 basePrice: updated[appendedIdx].basePrice,
 roomType: updated[appendedIdx].roomType,
 roomTypeName: updated[appendedIdx].roomTypeName,
 hasExtraBed: updated[appendedIdx].hasExtraBed,
 extraBedCharge: updated[appendedIdx].extraBedCharge,
 extraBedAllowed: updated[appendedIdx].extraBedAllowed,
 };
 // Remove the appended slot
 updated.splice(appendedIdx, 1);
 setSelectedRooms(updated);
 } else {
 // No appended slot to pull from, reset core slot to TBD
 setSelectedRooms(
 selectedRooms.map((r, idx) =>
 idx === removeIdx
 ? {
 ...r,
 roomId: "",
 roomNumber: "TBD",
 hasExtraBed: false,
 }
 : r
 )
 );
 }
 } else {
 // It's an appended slot. Simply remove it.
 const updated = [...selectedRooms];
 updated.splice(removeIdx, 1);
 setSelectedRooms(updated);
 }
 }
 } else {
 const roomTypeObj = room.roomType;
 const extraBedAllowed = room.extraBedAllowed || room.extraBedCharge > 0;

 // Find first unassigned slot in selectedRooms
 const unassignedIndex = selectedRooms.findIndex((r) => !r.roomId);

 if (unassignedIndex !== -1) {
 const updated = [...selectedRooms];
 updated[unassignedIndex] = {
 ...updated[unassignedIndex],
 roomId: room._id,
 roomNumber: room.roomNumber,
 basePrice: Number(room.basePrice) || 0,
 roomType: roomTypeObj,
 roomTypeName: roomTypeObj?.name || "",
 hasExtraBed: false,
 extraBedCharge: Number(room.extraBedCharge) || 0,
 extraBedAllowed,
 maxAdults: Number(room.maxAdults) || 2,
 maxChildren: Number(room.maxChildren) || 0,
 };
 setSelectedRooms(updated);
 } else {
 // All slots assigned, append a new room slot
 setSelectedRooms([
 ...selectedRooms,
 {
 roomId: room._id,
 roomNumber: room.roomNumber,
 basePrice: Number(room.basePrice) || 0,
 roomType: roomTypeObj,
 roomTypeName: roomTypeObj?.name || "",
 hasExtraBed: false,
 extraBedCharge: Number(room.extraBedCharge) || 0,
 extraBedAllowed,
 maxAdults: Number(room.maxAdults) || 2,
 maxChildren: Number(room.maxChildren) || 0,
 },
 ]);
 }
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
 if (partyType === "Corporate" && (!corporateDetails.companyName.trim() || !corporateDetails.contactPersonName?.trim() || !corporateDetails.contactMobile?.trim())) {
   return false;
 }
 if (!isDayAccess) {
    const assignedCount = selectedRooms.filter((s) => !!s.roomId).length;
    if (assignedCount === 0) return false;

    if (bookingData?.rooms?.length > 0 && assignedCount !== selectedRooms.length) {
      return false;
    }
  }

 // Occupancy Validation
 if (!isDayAccess) {
   const totalCapacity = selectedRooms.reduce((sum, r) => sum + (r.roomId ? ((Number(r.maxAdults) || 2) + (Number(r.maxChildren) || 0) + (r.hasExtraBed ? 1 : 0)) : 0), 0);
   if (totalCapacity > 0 && guests.length > totalCapacity) return false;
 }
 return true;
 }
 case 2: {
  const primaryGuests = guests.filter(g => g.isPrimary);
  if (primaryGuests.length === 0) return false;
  const validPrimary = primaryGuests.every(
    (g) => g.name?.trim() && g.mobileNo?.trim() && g.age?.trim() && g.gender && g.idNumber?.trim() && (g.pendingDocFile || g.idDocument)
  );
  if (!validPrimary) return false;
   
  if (partyType === "Corporate") {
    if (!corporateDetails.companyName.trim()) return false;
    const validDocs = dynamicDocs.filter(d => d.type.trim() && d.file);
    if (validDocs.length === 0) return false;
  }
   
  const coGuests = guests.filter(g => !g.isPrimary);
  return coGuests.every(g => {
    const hasSomeData = g.name?.trim() || g.age?.trim() || g.gender;
    if (!hasSomeData) return true; // Ignore completely empty rows
    return !!g.name?.trim(); // Name is required if they started filling
  });
 }
 case 3:
 return true;
 default:
 return false;
 }
 };

 // Get step validation error for footer display
 const getProceedError = (step: number): string => {
   switch (step) {
     case 1:
       if (partyType === "Corporate" && (!corporateDetails.companyName.trim() || !corporateDetails.contactPersonName?.trim() || !corporateDetails.contactMobile?.trim())) {
           return "Company Name, Contact Person, and Mobile are required.";
       }
       if (!isDayAccess) {
         if (selectedRooms.length === 0) return "Please assign at least one room to continue.";
         
         const assignedCount = selectedRooms.filter((s) => !!s.roomId).length;
         if (assignedCount === 0) return "Please assign at least one room to continue.";
         
         const unassignedCount = selectedRooms.filter((s) => !s.roomId).length;
         if (unassignedCount > 0) return `Please assign all booked rooms to continue (${unassignedCount} left).`;

         const totalCapacity = selectedRooms.reduce((sum, r) => sum + (r.roomId ? ((Number(r.maxAdults) || 2) + (Number(r.maxChildren) || 0) + (r.hasExtraBed ? 1 : 0)) : 0), 0);
         if (totalCapacity > 0 && guests.length > totalCapacity) return "Total guests exceed the maximum capacity of assigned rooms.";
       }
       return "";
     case 2:
       return getStep2Validation();
     default:
       return "";
   }
 };

 // Get validation message for step 2
 const getStep2Validation = (): string => {
  const primaryGuests = guests.filter(g => g.isPrimary);
  if (primaryGuests.length === 0) return "At least one primary guest is required";

  for (let i = 0; i < primaryGuests.length; i++) {
    const primary = primaryGuests[i];
    if (!primary?.name?.trim()) return `Primary guest name is required (Room ${i + 1})`;
    if (!primary?.mobileNo?.trim()) return `Primary guest mobile is required (Room ${i + 1})`;
    if (!primary?.age?.trim()) return `Primary guest age is required (Room ${i + 1})`;
    if (!primary?.gender) return `Primary guest gender is required (Room ${i + 1})`;
    if (!primary?.idNumber?.trim()) return `Primary guest ID number is required (Room ${i + 1})`;
    if (!primary?.pendingDocFile && !primary?.idDocument) return `Primary guest ID document must be uploaded (Room ${i + 1})`;
  }

  const coGuests = guests.filter(g => !g.isPrimary);
  for (let i = 0; i < coGuests.length; i++) {
    const cg = coGuests[i];
    const hasSomeData = cg.name?.trim() || cg.age?.trim() || cg.gender;
    if (hasSomeData && !cg.name?.trim()) {
      return `Co-guest name is required (Row ${i + 1})`;
    }
  }

  if (partyType === "Corporate") {
    if (!corporateDetails.companyName.trim()) {
      return "Company name is required for corporate bookings.";
    }
    const validDocs = dynamicDocs.filter(d => d.type.trim() && d.file);
    if (validDocs.length === 0) {
      return "Corporate check-in requires at least one Company Document to be uploaded";
    }
  }

  return "";
 };

 // Generate GRC Data for PDF
 const generateGRCData = (): GRCData => {
 const primary = getPrimaryGuest();
 const grcNumber = `GRC-${Date.now().toString().slice(-6)}`;
 const bookingAdv = bookingData?.advanceAmount || 0;
 const checkInAdv = paymentData.checkInAdvance;
 const totalPaidAmount = bookingAdv + checkInAdv;
 const balanceDue = Math.max(0, grandTotal - totalPaidAmount);

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
  const handleResetForm = () => {
    setShowSuccessActions(false);
    setCurrentStep(1);
    setRoomSearchQuery("");
    setRoomTypeFilterId("");
    setSelectedRooms([]);
    setGuests([{
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
    }]);
    setVehicles([{ vehicleNumber: "", vehicleType: "", driverName: "", driverContact: "" }]);
    setPaymentData({ paymentMode: "Cash", checkInAdvance: 0, transactionId: "", paymentNote: "" });
    setSignedGRCFile(null);
    setSignedGRCPreview(null);
    setDynamicDocs([]);
    setSelectedAddons([]);
    setStayFormData({
      checkInTime: new Date(),
      expectedCheckOutTime: addDays(new Date(), 1),
      specialRequests: "",
    });
    setPartyType("Individual");
    setCorporateDetails({
      companyName: "",
      companyGST: "",
      companyAddress: "",
      companyEmail: "",
      companyPhone: "",
      contactPersonName: "",
      designation: "",
      contactMobile: "",
      contactEmail: "",
      department: "",
      visitPurpose: "",
      remarks: "",
    });
  };

  const handleOpenGRC = () => {
 const data = generateGRCData();
 setGrcData(data);
 setShowGRCModal(true);
 };

  const handleNextStep = () => {
    if (!canProceed(currentStep)) return;

    if (currentStep === 1) {
      // Distribute guests to rooms: ensuring exactly 1 Primary Guest per assigned room.
      let updatedGuests = [...guests];
      const rooms = selectedRooms.filter(r => !!r.roomId);

      if (rooms.length > 0) {
        rooms.forEach((room, index) => {
          if (updatedGuests[index]) {
            updatedGuests[index].assignedRoomId = room.roomId;
            updatedGuests[index].isPrimary = true;
          } else {
            updatedGuests.push({
              id: `g-${Date.now()}-${Math.random()}`,
              name: "",
              mobileNo: "",
              idType: "Aadhar Card",
              idNumber: "",
              gender: "",
              age: "30",
              nationality: "Indian",
              isPrimary: true,
              assignedRoomId: room.roomId,
              idDocument: null,
              pendingDocFile: null,
              pendingDocPreview: null,
            });
          }
        });

        // Remaining guests become co-guests distributed across rooms
        for (let i = rooms.length; i < updatedGuests.length; i++) {
          updatedGuests[i].isPrimary = false;
          const roomIndex = i % rooms.length;
          updatedGuests[i].assignedRoomId = rooms[roomIndex].roomId;
        }

        setGuests(updatedGuests);
      }
    }

    setCurrentStep(currentStep + 1);
  };

  // Final submit - SINGLE API CALL with FormData
 const handleFinalCheckIn = async () => {
 if (loading) return;

 try {
 setLoading(true);

 const primaryGuests = guests.filter(g => g.isPrimary);
 for (let i = 0; i < primaryGuests.length; i++) {
  const primary = primaryGuests[i];
  if (!primary?.name || !primary?.mobileNo || !primary?.age || !primary?.gender || !primary?.idNumber) {
    alert(`Primary guest name, mobile, age, gender, and ID number are required (Room ${i + 1})!`);
    setLoading(false);
    return;
  }
 }

 // Validate signed GRC upload
 if (!editMode && !signedGRCFile) {
   alert("GRC must be signed and uploaded before checking in!");
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
 primaryGuest: primaryGuests[0] ? {
  id: primaryGuests[0].id || "",
  name: primaryGuests[0].name,
  mobileNo: primaryGuests[0].mobileNo,
  idType: primaryGuests[0].idType,
  idNumber: primaryGuests[0].idNumber,
  gender: primaryGuests[0].gender,
  age: primaryGuests[0].age,
  nationality: primaryGuests[0].nationality,
  isPrimary: true,
  assignedRoomId: primaryGuests[0].assignedRoomId,
  idDocument: primaryGuests[0].idDocument?.secure_url
  ? primaryGuests[0].idDocument
  : null,
  } : null,
 guests: guests.filter(g => g.isPrimary || g.name?.trim()).map((g) => ({
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
  extraServices: selectedAddons.map((a: any) => ({
    serviceId: a.serviceId,
    serviceName: a.serviceName,
    quantity: a.quantity,
    rate: a.rate,
    total: a.total,
    taxPercentage: a.taxPercentage || 0,
    taxAmount: a.taxAmount || 0
  })),
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

 // Append dynamic docs
  const validDynamicDocs = dynamicDocs.filter(d => d.type.trim() && d.file);
  validDynamicDocs.forEach((d) => {
    multipartFormData.append("dynamicDocFiles", d.file as File);
  });
  if (validDynamicDocs.length > 0) {
    multipartFormData.append("dynamicDocTypes", JSON.stringify(validDynamicDocs.map(d => d.type.trim())));
  }

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

 // Keep unused helpers to avoid TS unused local errors
 if (false as boolean) {
 console.log(
 preferredRoomTypeName,
 toggleExtraBed,
 setPrimaryGuest,
 getFileIcon,
 getRoomOccupancy,
 addVehicle,
 removeVehicle,
 updateVehicle,
 handleSignedGRCUpload,
 handleRemoveSignedGRC,
 getStep2Validation,
 stepLabels,
 signedGRCPreview,
 );
 }

 return (
 <div className={inline ? "w-full flex flex-col checkin-modal-container relative" : "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto checkin-modal-container"}>
 <style>{`
 /* Scoped styles for the check-in modal to scale for larger screens */
 .checkin-modal-container .custom-scroll::-webkit-scrollbar {
 width: 6px;
 height: 6px;
 }
 .checkin-modal-container .custom-scroll::-webkit-scrollbar-track {
 background: transparent;
 }
 .checkin-modal-container .custom-scroll::-webkit-scrollbar-thumb {
 background: #cbd5e1;
 border-radius: 9999px;
 }
 .checkin-modal-container .custom-scroll::-webkit-scrollbar-thumb:hover {
 background: #94a3b8;
 }

 /* 3xl Screens (Full HD, 1920px) */
 @media (min-width: 1920px) {
 .checkin-modal-container .max-w-6xl {
 max-width: 1760px !important;
 }
 .checkin-modal-container .text-[8px] { font-size: 11px !important; }
 .checkin-modal-container .text-[9px] { font-size: 12px !important; }
 .checkin-modal-container .text-[10px] { font-size: 14px !important; }
 .checkin-modal-container .text-sm { font-size: 15px !important; }
 .checkin-modal-container .text-base { font-size: 16px !important; }
 .checkin-modal-container .text-base { font-size: 18px !important; }
 .checkin-modal-container .text-lg { font-size: 22px !important; }
 .checkin-modal-container .text-xl { font-size: 24px !important; }
 
 .checkin-modal-container .p-2 { padding: 0.75rem !important; }
 .checkin-modal-container .p-3 { padding: 1.15rem !important; }
 .checkin-modal-container .p-4 { padding: 1.5rem !important; }
 .checkin-modal-container .p-5 { padding: 2rem !important; }
 .checkin-modal-container .p-6 { padding: 2.5rem !important; }
 .checkin-modal-container .gap-3 { gap: 1rem !important; }
 .checkin-modal-container .gap-4 { gap: 1.25rem !important; }
 
 .checkin-modal-container input, 
 .checkin-modal-container select, 
 .checkin-modal-container textarea {
 font-size: 14px !important;
 padding: 0.75rem 1rem !important;
 }
 .checkin-modal-container button {
 font-size: 14px !important;
 }
 .checkin-modal-container svg {
 transform: scale(1.35);
 }
 .checkin-modal-container .font-black {
 font-weight: 950 !important;
 }
 .checkin-modal-container .font-bold {
 font-weight: 800 !important;
 }
 .checkin-modal-container .font-medium {
 font-weight: 600 !important;
 }
 }

 /* 4xl Screens (2K / QHD, 2560px) */
 @media (min-width: 2560px) {
 .checkin-modal-container .max-w-6xl {
 max-width: 2350px !important;
 }
 .checkin-modal-container .text-[8px] { font-size: 14px !important; }
 .checkin-modal-container .text-[9px] { font-size: 15px !important; }
 .checkin-modal-container .text-[10px] { font-size: 17px !important; }
 .checkin-modal-container .text-sm { font-size: 19px !important; }
 .checkin-modal-container .text-base { font-size: 21px !important; }
 .checkin-modal-container .text-base { font-size: 23px !important; }
 .checkin-modal-container .text-lg { font-size: 27px !important; }
 .checkin-modal-container .text-xl { font-size: 30px !important; }
 
 .checkin-modal-container .p-2 { padding: 1rem !important; }
 .checkin-modal-container .p-3 { padding: 1.5rem !important; }
 .checkin-modal-container .p-4 { padding: 2rem !important; }
 .checkin-modal-container .p-5 { padding: 2.75rem !important; }
 .checkin-modal-container .p-6 { padding: 3.5rem !important; }
 .checkin-modal-container .gap-3 { gap: 1.35rem !important; }
 .checkin-modal-container .gap-4 { gap: 1.75rem !important; }
 
 .checkin-modal-container input, 
 .checkin-modal-container select, 
 .checkin-modal-container textarea {
 font-size: 18px !important;
 padding: 1rem 1.35rem !important;
 }
 .checkin-modal-container button {
 font-size: 18px !important;
 }
 .checkin-modal-container svg {
 transform: scale(1.7);
 }
 .checkin-modal-container .font-black {
 font-weight: 950 !important;
 }
 .checkin-modal-container .font-bold {
 font-weight: 800 !important;
 }
 .checkin-modal-container .font-medium {
 font-weight: 600 !important;
 }
 }

 /* 5xl Screens (4K / UHD, 3440px) */
 @media (min-width: 3440px) {
 .checkin-modal-container .max-w-6xl {
 max-width: 3100px !important;
 }
 .checkin-modal-container .text-[8px] { font-size: 18px !important; }
 .checkin-modal-container .text-[9px] { font-size: 20px !important; }
 .checkin-modal-container .text-[10px] { font-size: 22px !important; }
 .checkin-modal-container .text-sm { font-size: 24px !important; }
 .checkin-modal-container .text-base { font-size: 26px !important; }
 .checkin-modal-container .text-base { font-size: 28px !important; }
 .checkin-modal-container .text-lg { font-size: 32px !important; }
 .checkin-modal-container .text-xl { font-size: 36px !important; }
 
 .checkin-modal-container .p-2 { padding: 1.35rem !important; }
 .checkin-modal-container .p-3 { padding: 2rem !important; }
 .checkin-modal-container .p-4 { padding: 2.75rem !important; }
 .checkin-modal-container .p-5 { padding: 3.75rem !important; }
 .checkin-modal-container .p-6 { padding: 4.75rem !important; }
 .checkin-modal-container .gap-3 { gap: 1.75rem !important; }
 .checkin-modal-container .gap-4 { gap: 2.5rem !important; }
 
 .checkin-modal-container input, 
 .checkin-modal-container select, 
 .checkin-modal-container textarea {
 font-size: 22px !important;
 padding: 1.35rem 1.75rem !important;
 }
 .checkin-modal-container button {
 font-size: 22px !important;
 }
 .checkin-modal-container svg {
 transform: scale(2.2);
 }
 .checkin-modal-container .font-black {
 font-weight: 950 !important;
 }
 .checkin-modal-container .font-bold {
 font-weight: 800 !important;
 }
 .checkin-modal-container .font-medium {
 font-weight: 600 !important;
 }
 }
 `}</style>
 <div className={`bg-[var(--color-background)] w-full flex flex-col ${inline ? "h-full bg-transparent" : "max-w-6xl rounded-2xl border border-border max-h-[95vh]"}`}>
  {/* Header Stepper */}
  <div className={`px-4 sm:px-8 pt-4 pb-2 sm:pt-5 sm:pb-3 bg-white border-b border-border relative ${inline ? "rounded-t-2xl" : "rounded-t-2xl"}`}>

  {/* Close Button - kept only if not inline (modal context) so users can close the modal */}
  {!inline && (
  <button
  onClick={onClose}
  className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full transition-all bg-white shadow-sm border border-gray-100 z-20"
  >
  <FiX size={16} className="text-gray-400" />
  </button>
  )}

  <div className="w-full relative">
  {/* Background Line */}
  <div className="absolute top-[11px] sm:top-[15px] left-[15%] right-[15%] h-[3px] bg-gray-100 z-0 rounded-full"></div>
  
  {/* Active Line */}
  <div 
  className="absolute top-[11px] sm:top-[15px] left-[15%] h-[3px] bg-[#FE5F30] z-0 transition-all duration-500 ease-in-out rounded-full shadow-[0_0_8px_rgba(254,95,48,0.4)]"
  style={{ width: `${(Math.max(0, currentStep - 1) / 2) * 70}%` }}
  ></div>

  <div className="flex justify-between relative z-10 w-full px-[2%] sm:px-[5%]">
  {[1, 2, 3].map((step) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;
  const stepName = isDayAccess
  ? ["Day Access Setup", "Guest & Liability Details", "Payment & Confirmation"][step - 1]
  : ["Party & Stay Setup", "Guest / Document Details", "Payment & Confirmation"][step - 1];
  
  return (
  <div key={step} className="flex flex-col items-center gap-2 sm:gap-3 w-1/3">
  <div
  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-all duration-300 ${
  isActive || isCompleted
  ? "bg-[#FE5F30] text-white shadow-[0_0_12px_rgba(254,95,48,0.4)]"
  : "bg-[#E2E8F0] text-[#64748B]"
  }`}
  >
  {step}
  </div>
  <div className="flex flex-col items-center text-center">
  <span
  className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${
  isActive || isCompleted ? "text-[#FE5F30]" : "text-[#475569]"
  }`}
  >
  {stepName}
  </span>
  {isActive && (
  <span className="text-[8px] text-[#FE5F30] font-bold mt-0.5 opacity-80">
  (Current)
  </span>
  )}
  </div>
  </div>
  );
  })}
  </div>
  </div>
  </div>

 {/* Loading Overlay */}
 {loading && (
 <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
 <div className="text-center">
 <FiLoader
 size={40}
 className="animate-spin text-[var(--color-primary)] mx-auto mb-3"
 />
 <p className="text-base font-bold text-gray-700">
 {loadingStep || "Processing..."}
 </p>
 </div>
 </div>
 )}

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50/50 space-y-3">
 
 {/* Horizontal Summary Bar */}
 {/* <div className="bg-white rounded-xl border border-border p-3 flex flex-wrap items-center justify-between gap-4 text-sm">
 {isDayAccess ? (
 // Day Access Horizontal Bar
 <>
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiUser size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Check-in Type</p>
 <p className="font-bold text-gray-800">Day Access</p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiBriefcase size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Party Type</p>
 <p className="font-bold text-gray-800">
 {partyType === "Corporate" ? "Corporate / Company" : "Individual / Family"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiCalendar size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Visit Date</p>
 <p className="font-bold text-gray-800">
 {format(stayFormData.checkInTime, "dd May yyyy")}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiClock size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Entry Time</p>
 <p className="font-bold text-gray-800">
 {format(stayFormData.checkInTime, "hh:mm a")}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiClock size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Exit Time</p>
 <p className="font-bold text-gray-800">
 {format(stayFormData.expectedCheckOutTime, "hh:mm a")}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiUserCheck size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Total Guests</p>
 <p className="font-bold text-gray-800">
 {guests.length} ({guests.filter(g => Number(g.age) > 12 || !g.age).length} Adults, {guests.filter(g => Number(g.age) <= 12 && g.age).length} Children)
 </p>
 </div>
 </div>
 </>
 ) : (
 // Room Stay Horizontal Bar
 <>
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiUser size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Check-in Type</p>
 <p className="font-bold text-gray-800">Room Stay Booking</p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiBriefcase size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Party Type</p>
 <p className="font-bold text-gray-800">
 {partyType === "Corporate" ? "Corporate / Company" : "Individual / Family"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiHome size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Rooms Selected</p>
 <p className="font-bold text-gray-800">
 {selectedRooms.length > 0
 ? `${selectedRooms.map(r => r.roomNumber || "TBD").join(", ")} (${selectedRooms.length} Room${selectedRooms.length > 1 ? "s" : ""})`
 : "None Selected"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiUserCheck size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Guests</p>
 <p className="font-bold text-gray-800">
 {guests.length} ({guests.filter(g => Number(g.age) > 12 || !g.age).length} Adults, {guests.filter(g => Number(g.age) <= 12 && g.age).length} Children)
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiCalendar size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Stay Duration</p>
 <p className="font-bold text-gray-800">
 {format(stayFormData.checkInTime, "dd May")} - {format(stayFormData.expectedCheckOutTime, "dd May yyyy")} ({nights} Nights)
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
 <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
 <FiUserCheck size={14} />
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase font-black">Total Capacity</p>
 <p className="font-bold text-gray-800">
 {selectedRooms.length * 2 + selectedRooms.filter(r => r.hasExtraBed).length} Guests
 </p>
 </div>
 </div>
 </>
 )}
 </div> */}

 {/* STEP 1: Setup */}
 {currentStep === 1 && (
 <div className="space-y-3 animate-fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
 
 {/* Left Column (Forms & Info) */}
 <div className="lg:col-span-3 space-y-3">
 {/* Section A: Party Type */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">A</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Party Type
 </h3>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => setPartyType("Individual")}
 className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${partyType === "Individual" ? "border-orange-500 bg-orange-50/50" : "border-border hover:border-gray-300"}`}
 >
 <FiUser size={14} className={partyType === "Individual" ? "text-orange-500" : "text-gray-400"} />
 <span className="font-bold text-sm text-gray-800">Individual / Family</span>
 </button>
 <button
 onClick={() => setPartyType("Corporate")}
 className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${partyType === "Corporate" ? "border-blue-500 bg-blue-50/50" : "border-border hover:border-gray-300"}`}
 >
 <FiBriefcase size={14} className={partyType === "Corporate" ? "text-blue-500" : "text-gray-400"} />
 <span className="font-bold text-sm text-gray-800">Corporate / Company</span>
 </button>
 </div>
 </div>

 {/* Section B-1: Corporate / Company Details */}
 {partyType === "Corporate" && (
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">B</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Corporate / Company Details
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Company Name *</label>
 <input type="text" value={corporateDetails.companyName} onChange={(e) => setCorporateDetails({ ...corporateDetails, companyName: e.target.value })} placeholder="Acme Corp" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Company GSTIN</label>
 <input type="text" value={corporateDetails.companyGST} onChange={(e) => setCorporateDetails({ ...corporateDetails, companyGST: e.target.value })} placeholder="29AAAAA0000A1Z5" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div className="md:col-span-1">
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Company Address</label>
 <input type="text" value={corporateDetails.companyAddress} onChange={(e) => setCorporateDetails({ ...corporateDetails, companyAddress: e.target.value })} placeholder="Address" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Company Email</label>
 <input type="email" value={corporateDetails.companyEmail} onChange={(e) => setCorporateDetails({ ...corporateDetails, companyEmail: e.target.value })} placeholder="Email" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Company Phone</label>
 <input type="tel" value={corporateDetails.companyPhone} onChange={(e) => setCorporateDetails({ ...corporateDetails, companyPhone: e.target.value })} placeholder="Phone" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 </div>
 
 <div className="flex items-center gap-2 mt-4 mb-3 pt-3 border-t border-gray-100">
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Contact Person Details</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Contact Name *</label>
 <input type="text" value={corporateDetails.contactPersonName} onChange={(e) => setCorporateDetails({ ...corporateDetails, contactPersonName: e.target.value })} placeholder="John Doe" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Mobile *</label>
 <input type="tel" value={corporateDetails.contactMobile} onChange={(e) => setCorporateDetails({ ...corporateDetails, contactMobile: e.target.value })} placeholder="Mobile Number" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Email</label>
 <input type="email" value={corporateDetails.contactEmail} onChange={(e) => setCorporateDetails({ ...corporateDetails, contactEmail: e.target.value })} placeholder="Email" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Designation</label>
 <input type="text" value={corporateDetails.designation} onChange={(e) => setCorporateDetails({ ...corporateDetails, designation: e.target.value })} placeholder="Manager" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
 </div>
 </div>
 </div>
 )}

 {isDayAccess ? (
 // Day Access Setup Sections
 <>
 {/* Section A: Day Access Package */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">A</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Select Day Access Package
 </h3>
 </div>
 <p className="text-[10px] text-gray-400 mb-3">Choose a pre-defined package for today's visit</p>
 
 <div className="flex gap-2 mb-3">
 <select className="flex-1 p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none">
 <option>{bookingData?.accessPackageId?.packageName || "Pool + Locker + Lunch (Premium Package)"}</option>
 </select>
 <button className="px-3 py-2 border border-orange-500 text-orange-500 font-bold text-sm rounded-lg hover:bg-orange-50 transition-all">
 View All Packages
 </button>
 </div>

 {/* Package Details Box */}
 <div className="flex gap-4 p-3 bg-gray-50 border border-border rounded-xl">
 <div className="w-28 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
 <FiImage size={24} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-sm text-gray-800">
 {bookingData?.accessPackageId?.packageName || "Pool + Locker + Lunch (Premium Package)"}
 </h4>
 <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full font-black text-[8px] uppercase">Active</span>
 </div>
 <div className="flex flex-wrap gap-2 mt-2 text-[9px] text-gray-500 font-medium">
 <span>🏊 Swimming Pool</span>
 <span>🔒 Locker</span>
 <span>🍽️ Lunch</span>
 <span>🧼 Towel</span>
 <span>🚿 Changing Room</span>
 </div>
 <p className="text-[9px] text-gray-400 mt-2 font-bold">
 Valid Time: 10:00 AM - 06:00 PM | Adult Price: ₹1,200 | Child Price: ₹800 (5-12 Yrs)
 </p>
 </div>
 </div>
 </div>

 {/* Section B: Visit & Guest Info */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">B</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Visit & Guest Information
 </h3>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Visit Date *</label>
 <DatePicker
 selected={stayFormData.checkInTime}
 onChange={(date: Date | null) => date && setStayFormData({ ...stayFormData, checkInTime: date })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 dateFormat="dd MMM yyyy"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Entry Time *</label>
 <DatePicker
 selected={stayFormData.checkInTime}
 onChange={(date: Date | null) => date && setStayFormData({ ...stayFormData, checkInTime: date })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 showTimeSelect
 showTimeSelectOnly
 timeIntervals={30}
 timeCaption="Time"
 dateFormat="h:mm aa"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Exit Time *</label>
 <DatePicker
 selected={stayFormData.expectedCheckOutTime}
 onChange={(date: Date | null) => date && setStayFormData({ ...stayFormData, expectedCheckOutTime: date })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 showTimeSelect
 showTimeSelectOnly
 timeIntervals={30}
 timeCaption="Time"
 dateFormat="h:mm aa"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Total Duration</label>
 <input
 type="text"
 value={`${durationHours} Hours`}
 disabled
 className="w-full p-2 bg-gray-100 border border-border rounded-lg text-sm font-bold text-gray-500 text-center outline-none"
 />
 </div>
 </div>

 {/* Guest Counters */}
 <div className="grid grid-cols-3 gap-4 mb-4">
 <div className="flex flex-col items-center p-2 bg-gray-50 border border-border rounded-xl">
 <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Adults (Above 12)</span>
 <div className="flex items-center gap-3">
 <button
 onClick={() => {
 if (guests.length > 1) removeGuest(guests[guests.length - 1].id);
 }}
 className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
 >
 -
 </button>
 <span className="font-black text-base">{guests.filter(g => Number(g.age) > 12 || !g.age).length}</span>
 <button
 onClick={addGuest}
 className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
 >
 +
 </button>
 </div>
 </div>


 <div className="flex flex-col items-center p-2 bg-gray-50 border border-border rounded-xl">
 <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Children (5-12)</span>
 <div className="flex items-center gap-3">
 <button className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">-</button>
 <span className="font-black text-base">{guests.filter(g => Number(g.age) <= 12 && Number(g.age) >= 5 && g.age).length}</span>
 <button className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">+</button>
 </div>
 </div>
 <div className="flex flex-col items-center p-2 bg-gray-50 border border-border rounded-xl">
 <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Children (Below 5)</span>
 <div className="flex items-center gap-3">
 <button className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">-</button>
 <span className="font-black text-base">{guests.filter(g => Number(g.age) < 5 && g.age).length}</span>
 <button className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">+</button>
 </div>
 </div>
 </div>

 {/* Add-ons Checklist */}
 <div className="mb-4">
 <label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">Add-ons & Facilities (Optional)</label>
 <div className="grid grid-cols-2 gap-2">
 {extraServices.map((service: any) => {
 const existing = selectedAddons.find((a: any) => a.serviceId === service._id);
 const isSelected = !!existing;
 return (
 <div
 key={service._id}
 className={`flex flex-col p-2.5 rounded-lg border-2 transition-all ${
 isSelected ? "border-orange-500 bg-orange-50/50" : "border-border hover:border-gray-300 bg-white"
 }`}
 >
 <label className="flex items-center justify-between cursor-pointer w-full">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => {
 if (isSelected) {
 setSelectedAddons(selectedAddons.filter((a: any) => a.serviceId !== service._id));
 } else {
 setSelectedAddons([...selectedAddons, { serviceId: service._id, serviceName: service.name, quantity: 1, rate: service.price || 0, total: service.price || 0, taxPercentage: service.taxPercentage || 0, taxAmount: ((service.price || 0) * (service.taxPercentage || 0)) / 100 }]);
 }
 }}
 className="accent-orange-500 w-4 h-4"
 />
 <div>
 <p className="font-bold text-[10px] text-gray-800">{service.name}</p>
 <p className="text-[8px] text-gray-400">₹{service.price} / {service.chargeType || "Unit"}</p>
 </div>
 </div>
 </label>
 {isSelected && (
 <div className="mt-2 pt-2 border-t border-dashed border-orange-200 flex items-center justify-between">
 <span className="text-[9px] text-gray-500 font-bold uppercase">Qty</span>
 <div className="flex items-center gap-2">
 <Counter
 value={existing.quantity}
 onChange={(val: number) => setSelectedAddons(selectedAddons.map((a: any) => a.serviceId === service._id ? { ...a, quantity: val, total: val * a.rate, taxAmount: (val * a.rate * a.taxPercentage) / 100 } : a))}
 min={1}
 max={50}
 />
 <span className="text-[10px] font-bold text-gray-800 ml-1">₹{existing.total.toLocaleString()}</span>
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Special Requests */}
 <div>
 <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Special Requests (Optional)</label>
 <textarea
 value={stayFormData.specialRequests}
 onChange={(e) => setStayFormData({ ...stayFormData, specialRequests: e.target.value })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none resize-none"
 placeholder="Need pool-facing deck chairs, birthday setup, etc."
 rows={2}
 />
 </div>
 </div>
 </>
 ) : (
 // Room Stay Setup Sections
 <>


 {/* Section B: Stay Details */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">B</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Stay Details
 </h3>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Check-in Date & Time *</label>
 <DatePicker
 selected={stayFormData.checkInTime}
 onChange={(date: Date | null) => date && setStayFormData({ ...stayFormData, checkInTime: date })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[10px] font-bold outline-none"
 dateFormat="dd MMM yyyy, hh:mm a"
 showTimeSelect
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Expected Check-out *</label>
 <DatePicker
 selected={stayFormData.expectedCheckOutTime}
 onChange={(date: Date | null) => date && setStayFormData({ ...stayFormData, expectedCheckOutTime: date })}
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-[10px] font-bold outline-none"
 dateFormat="dd MMM yyyy, hh:mm a"
 showTimeSelect
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Total Nights</label>
 <div className="p-2 bg-gray-100 border border-border rounded-lg text-center font-bold text-sm text-gray-600">
 {nights} Night(s)
 </div>
 </div>
 </div>

  {/* Guest Counters */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div className="flex flex-col items-center justify-center p-2.5 bg-gray-50 border border-border rounded-xl">
      <span className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Adults *</span>
      <div className="flex items-center gap-4">
      <button
      onClick={(e) => {
        e.preventDefault();
        const adultGuests = guests.filter(g => Number(g.age) > 12 || !g.age);
        if (adultGuests.length > 0 && guests.length > 1) {
          removeGuest(adultGuests[adultGuests.length - 1].id);
        }
      }}
      className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 shadow-sm transition-colors"
      >
      -
      </button>
      <span className="font-black text-lg w-4 text-center">{guests.filter(g => Number(g.age) > 12 || !g.age).length}</span>
      <button
      onClick={(e) => {
        e.preventDefault();
        addGuest();
      }}
      className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 shadow-sm transition-colors"
      >
      +
      </button>
      </div>
    </div>
    <div className="flex flex-col items-center justify-center p-2.5 bg-gray-50 border border-border rounded-xl">
      <span className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Children (Below 18 yrs)</span>
      <div className="flex items-center gap-4">
      <button 
      onClick={(e) => {
        e.preventDefault();
        const childGuests = guests.filter(g => Number(g.age) <= 12 && g.age);
        if (childGuests.length > 0 && guests.length > 1) {
          removeGuest(childGuests[childGuests.length - 1].id);
        }
      }}
      className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 shadow-sm transition-colors">-</button>
      <span className="font-black text-lg w-4 text-center">{guests.filter(g => Number(g.age) <= 12 && g.age).length}</span>
      <button 
      onClick={(e) => {
        e.preventDefault();
        setGuests([
          ...guests,
          {
            id: `g-${Date.now()}`,
            name: "",
            mobileNo: "",
            idType: "Aadhar Card",
            idNumber: "",
            gender: "",
            age: "10",
            nationality: "Indian",
            isPrimary: false,
            assignedRoomId: selectedRooms.length > 0 ? selectedRooms[0].roomId : null,
            idDocument: null,
            pendingDocFile: null,
            pendingDocPreview: null,
          }
        ]);
      }}
      className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 shadow-sm transition-colors">+</button>
      </div>
    </div>
  </div>

  {/* Extra Beds */}
  <div className="flex flex-col mb-4">
    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Extra Bed Configurations</span>
      <div className="w-full flex-1 min-h-[58px] bg-gray-50 border border-border rounded-xl p-1.5 shadow-inner">
      {selectedRooms.filter((r: any) => r.extraBedAllowed).length === 0 ? (
        <div className="text-[10px] text-gray-400 text-center py-3 font-bold">No rooms allow extra beds</div>
      ) : (
        <div className="flex flex-col gap-1.5 px-1">
          {selectedRooms.filter((r: any) => r.extraBedAllowed).map((r: any) => (
            <label key={r.roomId || r.slotIndex} className={`flex items-center justify-between gap-2 text-[10px] font-bold ${!r.roomId ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'} py-1 border-b border-gray-100 last:border-0`}>
              <div className="flex items-center gap-2 truncate">
                <input 
                  type="checkbox" 
                  checked={r.hasExtraBed} 
                  disabled={!r.roomId}
                  onChange={() => toggleExtraBed(r.roomId)}
                  className="accent-orange-500 w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                />
                <span className="truncate">{r.roomId ? `Room ${r.roomNumber}` : 'Assign room first'}</span>
              </div>
              {r.roomId && r.extraBedCharge > 0 && <span className="text-gray-400 flex-shrink-0 font-bold">₹{r.extraBedCharge}</span>}
            </label>
          ))}
        </div>
      )}
      </div>
    </div>

 {/* Add-ons Checklist */}
 <div className="mb-4">
 <label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">Add-ons & Facilities (Optional)</label>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {extraServices.map((service: any) => {
 const existing = selectedAddons.find((a: any) => a.serviceId === service._id);
 const isSelected = !!existing;
 return (
 <div
 key={service._id}
 className={`flex flex-col p-2.5 rounded-lg border-2 transition-all ${
 isSelected ? "border-orange-500 bg-orange-50/50" : "border-border hover:border-gray-300 bg-white"
 }`}
 >
 <label className="flex items-center justify-between cursor-pointer w-full">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => {
 if (isSelected) {
 setSelectedAddons(selectedAddons.filter((a: any) => a.serviceId !== service._id));
 } else {
 setSelectedAddons([...selectedAddons, { serviceId: service._id, serviceName: service.name, quantity: 1, rate: service.price || 0, total: service.price || 0, taxPercentage: service.taxPercentage || 0, taxAmount: ((service.price || 0) * (service.taxPercentage || 0)) / 100 }]);
 }
 }}
 className="accent-orange-500 w-4 h-4"
 />
 <div>
 <p className="font-bold text-[10px] text-gray-800">{service.name}</p>
 <p className="text-[8px] text-gray-400">₹{service.price} / {service.chargeType || "Unit"}</p>
 </div>
 </div>
 </label>
 {isSelected && (
 <div className="mt-2 pt-2 border-t border-dashed border-orange-200 flex items-center justify-between">
 <span className="text-[9px] text-gray-500 font-bold uppercase">Qty</span>
 <div className="flex items-center gap-2">
 <Counter
 value={existing.quantity}
 onChange={(val: number) => setSelectedAddons(selectedAddons.map((a: any) => a.serviceId === service._id ? { ...a, quantity: val, total: val * a.rate, taxAmount: (val * a.rate * a.taxPercentage) / 100 } : a))}
 min={1}
 max={50}
 />
 <span className="text-[10px] font-bold text-gray-800 ml-1">₹{existing.total.toLocaleString()}</span>
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Special Request & Remarks */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Special Request (Optional)</label>
 <input
 type="text"
 value={stayFormData.specialRequests}
 onChange={(e) => setStayFormData({ ...stayFormData, specialRequests: e.target.value })}
 placeholder="Example: Early check-in, Decoration, High floor, etc."
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Booking Reference / Remarks (Optional)</label>
 <input
 type="text"
 value={corporateDetails.remarks}
 onChange={(e) => setCorporateDetails({ ...corporateDetails, remarks: e.target.value })}
 placeholder="Any booking source, agent name, remarks..."
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>
 </div>
 </div>
 </>
 )}
 </div>

 {/* Right Column (Room Selection / Package Info) */}
 <div className="lg:col-span-2 space-y-3">
 {isDayAccess ? (
 // Day Access Step 1 Right Side
 <>
 {/* Section C: Package Inclusions */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">C</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Package Inclusions
 </h3>
 </div>
 <ul className="space-y-2 text-[10px] text-gray-600 font-bold">
 <li className="flex items-center gap-2 text-green-600">✅ Swimming Pool Access</li>
 <li className="flex items-center gap-2 text-green-600">✅ Locker Facility (1 Locker)</li>
 <li className="flex items-center gap-2 text-green-600">✅ Lunch (Veg / Non-Veg Options)</li>
 <li className="flex items-center gap-2 text-green-600">✅ Clean Towels Provided</li>
 <li className="flex items-center gap-2 text-green-600">✅ Changing Room / Shower Access</li>
 <li className="flex items-center gap-2 text-green-600">✅ Safe Parking (One Vehicle)</li>
 <li className="flex items-center gap-2 text-green-600">✅ Wi-Fi Access in Common Areas</li>
 <li className="flex items-center gap-2 text-green-600">✅ Valid from 10:00 AM to 06:00 PM</li>
 </ul>
 </div>

 {/* Section D: Price Summary */}
 <div className="bg-white rounded-xl border border-border p-4 space-y-3">
 <div className="flex items-center gap-2 mb-1">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">D</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Price Summary
 </h3>
 </div>
 
 <div className="space-y-2 text-[11px] font-bold text-gray-600">
 <div className="flex justify-between">
 <span>Package Amount</span>
 <span>₹{packagePrice.toLocaleString()}</span>
 </div>
 {roomAddOnTotal > 0 && (
 <div className="flex justify-between">
 <span>Room Add-on</span>
 <span>₹{roomAddOnTotal.toLocaleString()}</span>
 </div>
 )}
 {selectedAddons.length > 0 && (
 <div className="flex justify-between">
 <span>Selected Add-ons</span>
 <span>₹{selectedAddons.reduce((sum, a: any) => sum + (a.total || 0), 0).toLocaleString()}</span>
 </div>
 )}
 <div className="h-px bg-gray-100" />
 <div className="flex justify-between text-sm font-black text-gray-800">
 <span>Sub Total</span>
 <span>₹{subTotal.toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-[10px] text-gray-400">
 <span>Tax Breakdown</span>
 </div>
 <div className="flex justify-between text-[10px] text-gray-400 pl-2">
 <span>Room Tax ({(bookingData?.pricingSummary?.taxPercentage || 12)}%)</span>
 <span>₹{Math.round(roomTotal * (bookingData?.pricingSummary?.taxPercentage ? bookingData.pricingSummary.taxPercentage / 100 : 0.12)).toLocaleString()}</span>
 </div>
 {selectedAddons.filter((a: any) => a.taxAmount > 0).map((addon: any, idx) => (
 <div key={`addon-tax-${idx}`} className="flex justify-between text-[10px] text-gray-400 pl-2">
 <span>{addon.serviceName} Tax ({addon.taxPercentage}%)</span>
 <span>₹{Math.round(addon.taxAmount).toLocaleString()}</span>
 </div>
 ))}
 <div className="flex justify-between items-center p-3 bg-orange-50 text-orange-500 rounded-xl mt-2 border border-orange-100">
 <span className="text-sm font-black">Estimated Total</span>
 <span className="text-base font-black">₹{grandTotal.toLocaleString()}</span>
 </div>
 </div>
 
 <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-bold">
 ℹ️ Actual amount may change slightly in final step based on offers / taxes.
 </div>
 </div>
 </>
 ) : (
 // Room Stay Step 1 Right Side
 <>
 {/* Section C: Room Selection Table */}
 <div className="bg-white rounded-xl border border-border p-4 flex flex-col">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">C</span>
 <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
 Room Selection
 </h3>
 </div>
 <select
 value={roomTypeFilterId}
 onChange={(e) => {
 setRoomTypeFilterId(e.target.value);
 fetchRoomsByType(e.target.value || undefined);
 }}
 className="p-1.5 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 >
 <option value="">All Rooms</option>
 {roomTypes.map((type: any) => (
 <option key={type._id} value={type._id}>
 {type.name}
 </option>
 ))}
 </select>
 </div>

 {/* Summary of Booked vs Assigned */}
 {(() => {
   const bookedSummary = bookingData?.rooms?.reduce((acc: any, room: any) => {
     const name = room.roomTypeName || room.roomType?.name || "Any";
     acc[name] = (acc[name] || 0) + 1;
     return acc;
   }, {});
   const bookedSummaryText = bookedSummary ? Object.entries(bookedSummary).map(([k, v]) => `${k} - ${v}`).join(", ") : "None";

   const selectedSummary = selectedRooms.filter(r => r.roomId).reduce((acc: any, r: any) => {
     const name = r.roomTypeName || "Any";
     acc[name] = (acc[name] || 0) + 1;
     return acc;
   }, {});
   const selectedSummaryText = Object.keys(selectedSummary).length > 0 ? Object.entries(selectedSummary).map(([k, v]) => `${k} - ${v}`).join(", ") : "None";

   return (
     <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3 text-sm font-bold">
       <div className="flex items-center gap-2 mb-1">
         <span className="text-gray-400 uppercase tracking-wide w-16">Booked:</span> 
         <span className="text-gray-700">{bookedSummaryText}</span>
       </div>
       <div className="flex items-center gap-2">
         <span className="text-gray-400 uppercase tracking-wide w-16">Assigned:</span> 
         <span className="text-orange-600">{selectedSummaryText}</span>
       </div>
     </div>
   );
 })()}

 {/* Selected room tags */}
 {selectedRooms.length > 0 && (
 <div className="flex flex-wrap gap-2 p-2 bg-orange-50/50 border border-orange-100 rounded-xl mb-3">
 {selectedRooms.map((room) => {
   const isUnassigned = !room.roomId;
   let typeName = room.roomTypeName || "Any Room Type";
   if (isUnassigned && room.requiredRoomTypeId) {
     const origType = roomTypes.find((t: any) => t._id === room.requiredRoomTypeId);
     if (origType) typeName = origType.name;
   }

   return (
     <div
     key={room.roomId || `tbd-${room.slotIndex}`}
     onClick={() => {
       if (isUnassigned && room.requiredRoomTypeId) {
         setRoomTypeFilterId(room.requiredRoomTypeId);
         fetchRoomsByType(room.requiredRoomTypeId);
       }
     }}
     className={`inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border ${isUnassigned ? 'border-orange-300 border-dashed' : 'border-orange-200'} text-orange-600 rounded-lg text-sm font-black shadow-sm ${isUnassigned && room.requiredRoomTypeId ? 'cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all' : ''}`}
     title={isUnassigned && room.requiredRoomTypeId ? "Click to filter table by this category" : ""}
     >
     <span className="text-gray-500 uppercase tracking-widest text-xs mr-1 border-r border-orange-200 pr-1.5">{typeName}</span>
     <span className={isUnassigned ? "text-orange-400" : "text-gray-800"}>{room.roomNumber || "Select Room"}</span>
     {!isUnassigned && (
     <button onClick={(e) => { e.stopPropagation(); toggleRoom({ _id: room.roomId }); }} className="hover:text-red-500 font-bold ml-1.5 text-lg leading-none transition-colors">
     ×
     </button>
     )}
     </div>
   );
 })}
 </div>
 )}

 {/* Search rooms input */}
 <div className="relative mb-2">
 <input
 type="text"
 placeholder="Search room number or type..."
 value={roomSearchQuery}
 onChange={(e) => setRoomSearchQuery(e.target.value)}
 className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none focus:border-orange-400"
 />
 </div>

 {/* Rooms Table */}
 <div className="flex-1 border border-border rounded-xl">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-gray-50 border-b border-border sticky top-0 z-10">
 <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Select</th>
 <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Room No.</th>
 <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Room Type</th>
 <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Tariff</th>
 <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Status</th>
 </tr>
 </thead>
 <tbody>
 {loadingRooms ? (
   <tr>
     <td colSpan={5} className="p-8 text-center text-gray-400">
       <FiLoader className="animate-spin mx-auto mb-2 text-orange-500" size={24} />
       <p>Loading rooms...</p>
     </td>
   </tr>
 ) : availableRooms
 .filter((room: any) => {
 // Type Filter
 if (roomTypeFilterId) {
 const roomTypeId = typeof room.roomType === "object" ? room.roomType?._id : room.roomType;
 if (String(roomTypeId) !== String(roomTypeFilterId)) return false;
 }
 // Text Filter
 if (roomSearchQuery) {
 const q = roomSearchQuery.toLowerCase();
 const matchNo = String(room.roomNumber || "").toLowerCase().includes(q);
 const matchType = String(room.roomType?.name || "").toLowerCase().includes(q);
 return matchNo || matchType;
 }
 return true;
 })
 .map((room: any) => {
 const isOccupied = occupiedRoomIds.has(room._id?.toString());
 const isSelected = selectedRooms.some((r) => r.roomId === room._id);
 const roomTypeName = room.roomType?.name || "";
 return (
 <tr
 key={room._id}
 className={`border-b border-border transition-all ${
 isOccupied
 ? "opacity-50 cursor-not-allowed bg-red-50/30"
 : isSelected
 ? "bg-orange-50/50 cursor-pointer"
 : "hover:bg-gray-50/50 cursor-pointer"
 }`}
 onClick={() => !isOccupied && toggleRoom(room)}
 >
 <td className="p-2">
 <input
 type="checkbox"
 checked={isSelected}
 disabled={isOccupied}
 onChange={() => {}}
 className="accent-orange-500"
 />
 </td>
 <td className="p-2 font-bold text-gray-800">{room.roomNumber}</td>
 <td className="p-2 text-gray-600 truncate max-w-[80px]">{roomTypeName}</td>
 <td className="p-2 font-bold text-gray-700">₹{(Number(room.basePrice) || 0).toLocaleString()}</td>
 <td className="p-2">
 {isOccupied ? (
 <span className="px-1.5 py-1 bg-red-100 text-red-600 rounded font-bold text-xs uppercase">
 Occupied
 </span>
 ) : (
 <span className="px-1.5 py-1 bg-green-100 text-green-600 rounded font-bold text-xs uppercase">
 Available
 </span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Occupancy Validation */}
 {(() => {
   const totalCapacity = selectedRooms.reduce((sum, r) => sum + (r.roomId ? ((Number(r.maxAdults) || 2) + (Number(r.maxChildren) || 0) + (r.hasExtraBed ? 1 : 0)) : 0), 0);
   
   if (totalCapacity === 0) {
     return (
       <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-bold flex items-center justify-between">
         <span>🕒 Occupancy Validation: Pending Room Assignment</span>
         <span className="px-1.5 py-1 bg-gray-200 text-gray-600 rounded text-xs uppercase font-black">Pending</span>
       </div>
     );
   }

   const isValid = guests.length <= totalCapacity;

   return (
     <div className={`mt-3 p-2.5 border rounded-xl text-sm font-bold flex items-center justify-between ${isValid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
       <span>{isValid ? '💚' : '⚠️'} Occupancy Validation: {isValid ? 'Valid' : 'Exceeds Capacity'} (Guests: {guests.length} / Capacity: {totalCapacity})</span>
       <span className={`px-1.5 py-1 rounded text-xs uppercase font-black ${isValid ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
         {isValid ? 'Valid' : 'Over Limit'}
       </span>
     </div>
   );
 })()}
 </div>
 </>
 )}
 </div>
 </div>

 {/* Step 1 Bottom Row (Room Stay Only) */}
 {!isDayAccess && (
 <>
 {/* Section D: Stay Summary */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">D</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Stay Summary (Auto Calculated)
 </h3>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm pt-3 border-t border-gray-100">
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Total Guests</p>
 <p className="font-bold text-gray-800 text-base">{guests.length}</p>
 <p className="text-[8px] text-gray-400">{guests.filter(g => Number(g.age) > 12 || !g.age).length} Adults, {guests.filter(g => Number(g.age) <= 12 && g.age).length} Children</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Selected Rooms</p>
 <p className="font-bold text-gray-800 text-base">{selectedRooms.length}</p>
 <p className="text-[8px] text-gray-400">{selectedRooms.map(r => r.roomNumber).join(", ") || "None"}</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Total Capacity</p>
 <p className="font-bold text-gray-800 text-base">{selectedRooms.length * 2} Guests</p>
 <p className="text-[8px] text-gray-400">From Selected Rooms</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Stay Duration</p>
 <p className="font-bold text-gray-800 text-base">{nights} Nights</p>
 <p className="text-[8px] text-gray-400">({format(stayFormData.checkInTime, "dd May")} - {format(stayFormData.expectedCheckOutTime, "dd May")})</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Estimated Room Rent</p>
 <p className="font-bold text-orange-600 text-base">₹{grandTotal.toLocaleString()}</p>
 <p className="text-[8px] text-gray-400">Total Including Tax</p>
 </div>
 <div>
 <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Rate Plan / Tariff</p>
 <p className="font-bold text-gray-800 text-base">Best Available Rate</p>
 <p className="text-[8px] text-orange-500 font-bold hover:underline cursor-pointer">Change Tariff</p>
 </div>
 </div>
 </div>

 {/* Room Holding Banner */}
 <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-[10px] font-bold flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
 Room(s) will be held for 10 minutes while you complete the check-in.
 </div>
 </>
 )}
 </div>
 )}

 {/* STEP 2: Guest Details */}
 {currentStep === 2 && (
 <div className="space-y-3 animate-fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
 
 {/* Left Column (Guests, IDs, Photos) */}
 <div className="lg:col-span-3 space-y-3">
 
  {/* Guest List rendering based on isDayAccess or partyType */}
  {partyType === "Corporate" || selectedRooms.filter(r => !!r.roomId).length === 0 ? (
    <div className="bg-white rounded-xl border border-border p-4 mb-3">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">{isDayAccess ? "Day Access Guests" : "Primary Guest Info"}</h3>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded font-black text-[8px] uppercase">{guests.length} Guest(s)</span>
        </div>
        
        {/* Render Primary Guest */}
        {(() => {
            const primaryGuest = guests.find(g => g.isPrimary) || guests[0];
            const coGuests = guests.filter(g => g.id !== primaryGuest?.id);
            if (!primaryGuest) return null;
            return (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded font-black text-[8px] uppercase">Primary Guest</span>
                    <span className="text-[10px] font-black text-gray-700">{primaryGuest.name || "Pending Name"}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                    <div className="md:col-span-2">
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Full Name *</label>
                        <input type="text" value={primaryGuest.name || ""} onChange={(e) => updateGuest(primaryGuest.id, "name", e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Mobile Number *</label>
                        <input type="tel" value={primaryGuest.mobileNo || ""} onChange={(e) => updateGuest(primaryGuest.id, "mobileNo", e.target.value)} placeholder="e.g. 98765 43210" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Age *</label>
                        <input type="text" value={primaryGuest.age || ""} onChange={(e) => { const val = e.target.value; if (/^[0-9]*$/.test(val)) updateGuest(primaryGuest.id, "age", val); }} placeholder="e.g. 32" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Gender *</label>
                        <select value={primaryGuest.gender || ""} onChange={(e) => updateGuest(primaryGuest.id, "gender", e.target.value)} className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        </select>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">ID Proof Type *</label>
                        <select value={primaryGuest.idType} onChange={(e) => updateGuest(primaryGuest.id, "idType", e.target.value)} className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none">
                        <option>Aadhaar Card</option>
                        <option>PAN Card</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">ID Number *</label>
                        <input type="text" value={primaryGuest.idNumber || ""} onChange={(e) => updateGuest(primaryGuest.id, "idNumber", e.target.value)} placeholder="ID Number" className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none" />
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Upload ID Proof *</label>
                        {primaryGuest.pendingDocFile ? (
                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold">
                            <span className="truncate text-green-600 max-w-[100px]">{primaryGuest.pendingDocFile?.name}</span>
                            <button onClick={() => handleRemoveDocument(primaryGuest.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                        </div>
                        ) : (
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleDocumentUpload(primaryGuest.id, e.target.files[0])} className="w-full text-sm text-gray-400 font-bold" />
                        )}
                    </div>
                    </div>

                    {/* Co-Guests Table */}
                    {true && (
                    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[10px]">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                            <tr>
                            <th className="p-2 font-black uppercase tracking-wider">Full Name</th>
                            <th className="p-2 font-black uppercase tracking-wider w-16">Age</th>
                            <th className="p-2 font-black uppercase tracking-wider w-24">Gender</th>
                            <th className="p-2 font-black uppercase tracking-wider w-32">ID Proof</th>
                            <th className="p-2 font-black uppercase tracking-wider w-12 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {coGuests.map((g) => (
                            <tr key={g.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-2">
                                <input type="text" value={g.name || ""} onChange={(e) => updateGuest(g.id, "name", e.target.value)} placeholder="e.g. Guest Name" className="w-full bg-transparent outline-none font-bold text-gray-700 placeholder-gray-300" />
                                </td>
                                <td className="p-2">
                                <input type="text" value={g.age || ""} onChange={(e) => { const val = e.target.value; if (/^[0-9]*$/.test(val)) updateGuest(g.id, "age", val); }} placeholder="Age" className="w-full bg-transparent outline-none font-bold text-gray-700 placeholder-gray-300" />
                                </td>
                                <td className="p-2">
                                <select value={g.gender || ""} onChange={(e) => updateGuest(g.id, "gender", e.target.value)} className="w-full bg-transparent outline-none font-bold text-gray-700 cursor-pointer">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                </td>
                                <td className="p-2">
                                <div className="flex flex-col gap-1">
                                <select value={g.idType || "Not Required"} onChange={(e) => updateGuest(g.id, "idType", e.target.value)} className="w-full bg-transparent outline-none font-bold text-gray-500 cursor-pointer text-[9px]">
                                    <option>Not Required</option>
                                    <option>Aadhaar Card</option>
                                    <option>PAN Card</option>
                                    <option>Passport</option>
                                    <option>Driving License</option>
                                </select>
                                {g.idType !== "Not Required" && (
                                  g.pendingDocFile ? (
                                    <div className="flex items-center justify-between p-1 bg-green-50 border border-green-200 rounded text-[8px] font-bold mt-1">
                                      <span className="truncate text-green-600 max-w-[80px]">{g.pendingDocFile.name}</span>
                                      <button onClick={() => handleRemoveDocument(g.id)} className="text-red-500 hover:text-red-700 ml-1 font-black text-xs">×</button>
                                    </div>
                                  ) : (
                                    <input
                                      type="file"
                                      onChange={(e) => e.target.files?.[0] && handleDocumentUpload(g.id, e.target.files[0])}
                                      className="w-full mt-1 text-[8px] text-gray-400 font-bold file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                                    />
                                  )
                                )}
                                </div>
                                </td>
                                <td className="p-2 text-center">
                                <button onClick={() => setGuests(prev => prev.filter(pg => pg.id !== g.id))} className="text-red-400 hover:text-red-600 p-1 opacity-50 group-hover:opacity-100 transition-opacity" title="Remove Guest">
                                    🗑️
                                </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                        <div className="bg-gray-50 p-2 border-t border-gray-200">
                        <button onClick={() => handleAddCoGuest("")} className="w-full py-1.5 border border-dashed border-gray-300 text-gray-500 rounded text-[9px] font-black uppercase tracking-wider hover:border-orange-400 hover:text-orange-500 transition-all flex items-center justify-center gap-1">
                            Add Co-Guest
                        </button>
                        </div>
                    </div>
                    )}
                </div>
            );
        })()}


    </div>
  ) : (
    /* Grouped Guests by Room */
    selectedRooms.filter(r => !!r.roomId).map((room, roomIdx) => {
    const roomGuests = guests.filter(g => g.assignedRoomId === room.roomId);
    const primaryGuest = roomGuests.find(g => g.isPrimary) || roomGuests[0];
    const coGuests = roomGuests.filter(g => g.id !== primaryGuest?.id);

    return (
      <div key={room.roomId} className="bg-white rounded-xl border border-border p-4 mb-3">
        <div 
          className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3 cursor-pointer select-none hover:opacity-80 transition-opacity"
          onClick={() => setExpandedRooms(prev => ({ ...prev, [room.roomId]: prev[room.roomId] === false ? true : false }))}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">{roomIdx + 1}</span>
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
              Room {room.roomNumber} - {room.roomTypeName}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded font-black text-[8px] uppercase">{roomGuests.length} Guest(s)</span>
            {expandedRooms[room.roomId] !== false ? <FiChevronUp className="text-gray-400" size={16} /> : <FiChevronDown className="text-gray-400" size={16} />}
          </div>
        </div>

        {expandedRooms[room.roomId] !== false && (
          <div className="animate-fade-in-down">
            {/* Primary Guest for this room */}
        {primaryGuest && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
               <span className="px-2 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded font-black text-[8px] uppercase">Primary Guest</span>
               <span className="text-[10px] font-black text-gray-700">{primaryGuest.name || "Pending Name"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={primaryGuest.name || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={primaryGuest.mobileNo || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "mobileNo", e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Age *</label>
                <input
                  type="text"
                  value={primaryGuest.age || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*$/.test(val)) updateGuest(primaryGuest.id, "age", val);
                  }}
                  placeholder="e.g. 32"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Gender *</label>
                <select
                  value={primaryGuest.gender || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "gender", e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={primaryGuest.email || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "email", e.target.value)}
                  placeholder="Email"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={primaryGuest.address || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "address", e.target.value)}
                  placeholder="Address"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              {roomIdx === 0 && (
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Purpose of Visit</label>
                <select
                  value={corporateDetails.visitPurpose}
                  onChange={(e) => setCorporateDetails({ ...corporateDetails, visitPurpose: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                >
                  <option value="">Select Purpose</option>
                  <option value="Leisure / Holiday">Leisure / Holiday</option>
                  <option value="Business / Meeting">Business / Meeting</option>
                  <option value="Medical Tourism">Medical Tourism</option>
                  <option value="Personal Stay">Personal Stay</option>
                </select>
              </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">ID Proof Type *</label>
                <select
                  value={primaryGuest.idType}
                  onChange={(e) => updateGuest(primaryGuest.id, "idType", e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                >
                  <option>Aadhaar Card</option>
                  <option>PAN Card</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">ID Number *</label>
                <input
                  type="text"
                  value={primaryGuest.idNumber || ""}
                  onChange={(e) => updateGuest(primaryGuest.id, "idNumber", e.target.value)}
                  placeholder="ID Number"
                  className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Upload ID Proof *</label>
                {primaryGuest.pendingDocFile ? (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold">
                    <span className="truncate text-green-600 max-w-[100px]">{primaryGuest.pendingDocFile?.name}</span>
                    <button onClick={() => handleRemoveDocument(primaryGuest.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleDocumentUpload(primaryGuest.id, e.target.files[0])}
                    className="w-full text-sm text-gray-400 font-bold"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Co-guests Table */}
        {coGuests.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
             <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Co-Guests in Room</h4>
             <div className="overflow-x-auto border border-border rounded-xl">
               <table className="w-full text-left border-collapse text-[10px]">
                 <thead>
                   <tr className="bg-gray-50 border-b border-border">
                     <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Full Name</th>
                     <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Age</th>
                     <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Gender</th>
                     <th className="p-2 font-black text-gray-400 uppercase tracking-wider">ID Proof</th>
                     <th className="p-2 font-black text-gray-400 uppercase tracking-wider">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {coGuests.map((g) => {
                     return (
                       <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                         <td className="p-2">
                           <input
                             type="text"
                             value={g.name}
                             onChange={(e) => updateGuest(g.id, "name", e.target.value)}
                             className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-bold text-gray-700 placeholder-gray-300"
                             placeholder="Guest Name"
                           />
                         </td>
                         <td className="p-2">
                           <input
                             type="text"
                             value={g.age}
                             onChange={(e) => {
                               const val = e.target.value;
                               if (/^[0-9]*$/.test(val) || val === "") updateGuest(g.id, "age", val);
                             }}
                             className="w-12 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-bold text-gray-700"
                             placeholder="Age"
                           />
                         </td>
                         <td className="p-2">
                           <select
                             value={g.gender}
                             onChange={(e) => updateGuest(g.id, "gender", e.target.value)}
                             className="w-20 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-bold text-gray-700"
                           >
                             <option value="">Select</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                           </select>
                         </td>
                         <td className="p-2">
                           <div className="flex flex-col gap-1">
                             <select
                               value={g.idType}
                               onChange={(e) => updateGuest(g.id, "idType", e.target.value)}
                               className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-bold text-gray-700 text-[9px]"
                             >
                               <option value="Not Required">Not Required</option>
                               <option value="Aadhaar Card">Aadhaar Card</option>
                               <option value="PAN Card">PAN Card</option>
                               <option value="Passport">Passport</option>
                               <option value="Driving License">Driving License</option>
                             </select>
                             {g.idType !== "Not Required" && (
                               g.pendingDocFile ? (
                                 <div className="flex items-center justify-between p-1 bg-green-50 border border-green-200 rounded text-[8px] font-bold mt-1">
                                   <span className="truncate text-green-600 max-w-[80px]">{g.pendingDocFile.name}</span>
                                   <button onClick={() => handleRemoveDocument(g.id)} className="text-red-500 hover:text-red-700 ml-1 font-black text-xs">×</button>
                                 </div>
                               ) : (
                                 <input
                                   type="file"
                                   onChange={(e) => e.target.files?.[0] && handleDocumentUpload(g.id, e.target.files[0])}
                                   className="w-full mt-1 text-[8px] text-gray-400 font-bold file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                                 />
                               )
                             )}
                           </div>
                         </td>
                         <td className="p-2">
                           <button
                             onClick={() => removeGuest(g.id)}
                             className="text-red-400 hover:text-red-600 transition-colors p-1"
                             title="Remove Guest"
                           >
                             <FiX size={12} />
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => handleAddCoGuest(room.roomId)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 border border-border font-bold text-[9px] uppercase rounded-lg hover:bg-gray-100 transition-all"
          >
            <FiPlus size={10} /> Add Co-Guest
          </button>
        </div>
          </div>
        )}
      </div>
    );
  })
 )}

 <div className="bg-white rounded-xl border border-border p-4 mb-3">
        {/* Dynamic Documents Section */}
        <div className="">
            <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                {partyType === 'Corporate' ? 'Company Documents' : 'Other Documents'} <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${partyType === 'Corporate' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-100'}`}>{partyType === 'Corporate' ? '(Required for Corporate)' : '(Optional)'}</span>
            </h4>
            <div className="space-y-3">
                {dynamicDocs.map((doc, idx) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-2 border border-gray-200 rounded-lg">
                        <div className="flex-1 w-full">
                            <input 
                                type="text" 
                                placeholder="Document Name (e.g. Company ID Card)" 
                                value={doc.type} 
                                onChange={(e) => {
                                    const newDocs = [...dynamicDocs];
                                    newDocs[idx].type = e.target.value;
                                    setDynamicDocs(newDocs);
                                }}
                                className="w-full p-2 bg-white border border-border rounded-lg text-xs font-bold outline-none"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <input 
                                type="file" 
                                onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                        const newDocs = [...dynamicDocs];
                                        newDocs[idx].file = e.target.files[0];
                                        setDynamicDocs(newDocs);
                                    }
                                }}
                                className="w-full text-xs text-gray-500 font-bold"
                            />
                        </div>
                        <button 
                            onClick={() => setDynamicDocs(dynamicDocs.filter(d => d.id !== doc.id))}
                            className="text-red-500 hover:text-red-700 p-2 self-end sm:self-center bg-red-50 rounded-lg"
                            title="Remove Document"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => setDynamicDocs([...dynamicDocs, { id: `doc-${Date.now()}`, type: "", file: null }])}
                className="mt-3 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:border-orange-400 hover:text-orange-500 transition-all flex items-center gap-1"
            >
                + Add Document
            </button>
        </div>
 </div>

 {/* Section D: Vehicle Details */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">D</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Vehicle Details (Optional)
 </h3>
 </div>
 <button
 onClick={addVehicle}
 className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white font-bold text-[9px] uppercase rounded-lg hover:bg-orange-600 transition-all"
 >
 <FiPlus size={10} /> Add Vehicle
 </button>
 </div>

 <div className="space-y-3">
 {vehicles.map((v, index) => (
 <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-gray-50 border border-border rounded-xl relative">
 {vehicles.length > 1 && (
 <button
 onClick={() => removeVehicle(index)}
 className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
 >
 ×
 </button>
 )}
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Vehicle Number</label>
 <input
 type="text"
 value={v.vehicleNumber}
 onChange={(e) => updateVehicle(index, "vehicleNumber", e.target.value)}
 placeholder="KA 03 MX 1234"
 className="w-full p-2 bg-white border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Vehicle Type</label>
 <select
 value={v.vehicleType}
 onChange={(e) => updateVehicle(index, "vehicleType", e.target.value)}
 className="w-full p-2 bg-white border border-border rounded-lg text-sm font-bold outline-none"
 >
 <option value="">Select Type</option>
 <option value="Car">Car</option>
 <option value="Bike">Bike</option>
 <option value="SUV">SUV</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Driver Name</label>
 <input
 type="text"
 value={v.driverName}
 onChange={(e) => updateVehicle(index, "driverName", e.target.value)}
 placeholder="Driver Name"
 className="w-full p-2 bg-white border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Driver Contact</label>
 <input
 type="tel"
 value={v.driverContact}
 onChange={(e) => updateVehicle(index, "driverContact", e.target.value)}
 placeholder="Mobile Number"
 className="w-full p-2 bg-white border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>
 </div>
 ))}
 </div>
 </div>


 </div>

 {/* Right Column (Guest Insights & Summary) */}
 <div className="lg:col-span-2 space-y-3">
 {/* Section D: Room & Stay Summary */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">D</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Room & Stay Summary
 </h3>
 </div>
 <div className="space-y-2 text-sm font-bold text-gray-600">
 <div className="flex justify-between">
 <span>Rooms Selected</span>
 <span className="text-gray-800">{selectedRooms.map(r => r.roomNumber).join(", ") || "None"}</span>
 </div>
 <div className="flex justify-between">
 <span>Check-in</span>
 <span className="text-gray-800">{format(stayFormData.checkInTime, "dd May yyyy, hh:mm a")}</span>
 </div>
 <div className="flex justify-between">
 <span>Check-out</span>
 <span className="text-gray-800">{format(stayFormData.expectedCheckOutTime, "dd May yyyy, hh:mm a")}</span>
 </div>
 <div className="flex justify-between">
 <span>Stay Duration</span>
 <span className="text-gray-800">{nights} Night(s)</span>
 </div>
 <div className="flex justify-between">
 <span>Guests</span>
 <span className="text-gray-800">{guests.length} ({guests.filter(g => Number(g.age) > 12 || !g.age).length} Adults, {guests.filter(g => Number(g.age) <= 12 && g.age).length} Children)</span>
 </div>
 </div>
 </div>

 {/* Section E: Guest Insights */}
 <div className="bg-white rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">E</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Guest Insights
 </h3>
 </div>
 <div className="flex items-center gap-3 p-3 bg-gray-50 border border-border rounded-xl mb-3">
 <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-base uppercase">
 {getPrimaryGuest()?.name?.substring(0, 2) || "G"}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-sm text-gray-800">{getPrimaryGuest()?.name || "Guest"}</h4>
 <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[8px] font-black uppercase">Regular Guest</span>
 </div>
 <p className="text-[9px] text-gray-400 mt-0.5">Guest ID: GUEST-68421</p>
 </div>
 </div>
 
 <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-gray-100 pt-3 font-bold text-gray-600">
 <div>
 <p className="text-[8px] text-gray-400 uppercase">Previous Stays</p>
 <p className="font-black text-base text-gray-800">7</p>
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase">Total Nights</p>
 <p className="font-black text-base text-gray-800">18</p>
 </div>
 <div>
 <p className="text-[8px] text-gray-400 uppercase">Total Spent</p>
 <p className="font-black text-base text-orange-600">₹48,250</p>
 </div>
 </div>
 <div className="mt-3 text-center">
 <a href="#" className="text-[9px] font-black text-orange-500 uppercase hover:underline">View Guest Profile</a>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* STEP 3: Payment & GRC Upload */}
 {currentStep === 3 && (
 <div className="space-y-3 animate-fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 
 {/* Column 1: Payment Overview */}
 <div className="bg-white rounded-xl border border-border p-4 space-y-3">
 <div className="flex items-center gap-2 mb-1">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">A</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Payment Overview
 </h3>
 </div>

 <div className="p-3 bg-gray-50 border border-border rounded-xl space-y-2 text-sm font-bold text-gray-600">
 <div className="flex justify-between">
 <span>Total Estimated Amount</span>
 <span className="text-gray-800">₹{grandTotal.toLocaleString()}</span>
 </div>
 <div className="flex justify-between">
 <span>Advance Amount Paid</span>
 <span className="text-green-600">₹{bookingAdvance.toLocaleString()}</span>
 </div>
 {checkInAdvance > 0 && (
 <div className="flex justify-between">
 <span>Check-in Payment</span>
 <span className="text-green-600">₹{checkInAdvance.toLocaleString()}</span>
 </div>
 )}
 <div className="h-px bg-gray-200" />
 <div className="flex justify-between items-center text-base font-black text-orange-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100">
 <span>Balance Payable Now</span>
 <span className="text-base">₹{dueAmount.toLocaleString()}</span>
 </div>
 </div>

 {/* Collect Payment */}
 <div className="space-y-3">
 <h4 className="font-bold text-[10px] text-gray-500 uppercase">Collect Payment</h4>
 
 <div className="grid grid-cols-3 gap-1.5">
 {paymentModes.map((mode) => (
 <button
 key={mode.value}
 onClick={() => setPaymentData({ ...paymentData, paymentMode: mode.value })}
 className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
 paymentData.paymentMode === mode.value
 ? "border-orange-500 bg-orange-50/50"
 : "border-border hover:border-gray-300"
 }`}
 >
 <mode.icon size={14} className={paymentData.paymentMode === mode.value ? "text-orange-500" : "text-gray-400"} />
 <span className="font-bold text-[9px] text-gray-800">{mode.label}</span>
 </button>
 ))}
 </div>

 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Amount Received *</label>
 <input
 type="text"
 value={paymentData.checkInAdvance || ""}
 onChange={(e) => {
 const val = e.target.value;
 if (/^\d*$/.test(val)) {
 setPaymentData({ ...paymentData, checkInAdvance: val === "" ? 0 : Number(val) });
 }
 }}
 placeholder="₹16,000"
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none focus:border-orange-400"
 />
 </div>

 <div>
 <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Transaction / Reference ID</label>
 <input
 type="text"
 value={paymentData.transactionId}
 onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
 placeholder="REF1234567890"
 className="w-full p-2 bg-gray-50 border border-border rounded-lg text-sm font-bold outline-none"
 />
 </div>

 <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 font-bold rounded-lg text-[9px]">
 ✅ Payment will be recorded and reflected in billing.
 </div>
 </div>
 </div>

 {/* Column 2: Booking Summary */}
 <div className="bg-white rounded-xl border border-border p-4 space-y-3">
 <div className="flex items-center gap-2 mb-1">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">B</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 Booking Summary
 </h3>
 </div>

 <div className="space-y-3">
 <div>
 <span className="text-[8px] font-bold text-gray-400 uppercase block">Primary Guest</span>
 <div className="flex items-center gap-1.5">
 <span className="font-bold text-sm text-gray-800">{getPrimaryGuest()?.name}</span>
 <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[7px] font-black uppercase">Primary</span>
 </div>
 <p className="text-[9px] text-gray-500 font-medium">📱 {getPrimaryGuest()?.mobileNo} | 🆔 {getPrimaryGuest()?.idType} ({getPrimaryGuest()?.idNumber})</p>
 </div>

 <div>
 <span className="text-[8px] font-bold text-gray-400 uppercase block">Stay & Room Details</span>
 <p className="font-bold text-sm text-gray-800">Rooms: {selectedRooms.map(r => r.roomNumber).join(", ")}</p>
 <p className="text-[9px] text-gray-500 font-medium">📅 Check-in: {format(stayFormData.checkInTime, "dd May yyyy, hh:mm a")}</p>
 <p className="text-[9px] text-gray-500 font-medium">📅 Check-out: {format(stayFormData.expectedCheckOutTime, "dd May yyyy, hh:mm a")}</p>
 <p className="text-[9px] text-gray-500 font-medium">👤 Guests: {guests.length} ({guests.filter(g => Number(g.age) > 12 || !g.age).length} Adults, {guests.filter(g => Number(g.age) <= 12 && g.age).length} Children)</p>
 </div>

 <div>
 <span className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Tariff & Charges Summary</span>
 <div className="p-2.5 bg-gray-50 border border-border rounded-lg space-y-1.5 text-[10px] font-bold text-gray-500">
 {selectedRooms.map((room) => (
 <div key={room.roomId || room.slotIndex} className="flex justify-between">
 <span>Room {room.roomNumber} ({room.roomTypeName})</span>
 <span>₹{((Number(room.basePrice) || 0) * nights).toLocaleString()}</span>
 </div>
 ))}
 {selectedRooms.some(r => r.hasExtraBed) && (
 <div className="flex justify-between text-orange-500">
 <span>Extra Bed Fee</span>
 <span>₹{(selectedRooms.filter(r => r.hasExtraBed).reduce((sum, r) => sum + (Number(r.extraBedCharge) || 0), 0) * nights).toLocaleString()}</span>
 </div>
 )}
 <div className="h-px bg-gray-200" />
 <div className="flex justify-between text-gray-800 font-black">
 <span>Total Amount</span>
 <span>₹{roomTotal.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Column 3: GRC & Checklist */}
 <div className="bg-white rounded-xl border border-border p-4 space-y-3">
 <div className="flex items-center gap-2 mb-1">
 <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">C</span>
 <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
 GRC & Checklist
 </h3>
 </div>

 <div className="space-y-3">
 {/* GRC Generated & Upload */}
 <div className="p-3 bg-gray-50 border border-border rounded-xl space-y-3">
 <div>
 <p className="font-bold text-sm text-gray-800">GRC / Registration Card</p>
 <p className="text-[8px] text-gray-400 mt-0.5">Download GRC card, take guest signature and upload.</p>
 </div>
 
 <div className="flex gap-2">
 <button
 onClick={handleOpenGRC}
 className="flex-1 py-1.5 border border-purple-500 text-purple-600 font-black text-[9px] uppercase rounded hover:bg-purple-50 transition-all flex items-center justify-center gap-1"
 >
 👁️ Preview GRC
 </button>
 <button
 onClick={handleOpenGRC}
 className="flex-1 py-1.5 bg-orange-500 text-white font-black text-[9px] uppercase rounded hover:bg-orange-600 transition-all flex items-center justify-center gap-1"
 >
 📥 Download & Print
 </button>
 </div>

 <div className="border-t border-gray-200 pt-2.5">
 <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Upload Signed GRC *</label>
 {signedGRCFile || signedGRCPreview ? (
 <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold">
 <span className="truncate text-green-600 max-w-[150px]">{signedGRCFile?.name || "GRC_Signed.pdf"}</span>
 <button onClick={handleRemoveSignedGRC} className="text-red-500 hover:text-red-700 font-bold">
 🗑️
 </button>
 </div>
 ) : (
 <input
 type="file"
 onChange={(e) => e.target.files?.[0] && handleSignedGRCUpload(e.target.files[0])}
 className="w-full text-sm text-gray-400 font-bold"
 />
 )}
 </div>
 </div>

 {/* Verified ID documents */}
 <div className="p-3 bg-gray-50 border border-border rounded-xl">
 <div className="flex justify-between items-center mb-2">
 <p className="font-bold text-[9px] text-gray-400 uppercase mb-2">Government ID Proofs</p>
 <span className="text-[8px] text-green-600 font-black uppercase">
 Uploaded ({guests.filter(g => g.idType !== "Not Required" && (g.idDocument || g.pendingDocFile)).length} / {guests.filter(g => g.idType !== "Not Required").length})
 </span>
 </div>
 <div className="space-y-2">
 {guests.map((g) => {
 const hasId = g.idType !== "Not Required";
 const isUploaded = g.idDocument || g.pendingDocFile;
 return (
 <div key={g.id} className="flex justify-between items-center text-[10px] font-bold">
 <span className="text-gray-700">{g.name || "Guest"} ({g.idType})</span>
 {hasId ? (
 isUploaded ? (
 <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[7px] uppercase font-black">Verified</span>
 ) : (
 <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[7px] uppercase font-black">Pending</span>
 )
 ) : (
 <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[7px] uppercase font-black">Not Required</span>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Checklist Status */}
 <div className="p-3 bg-gray-50 border border-border rounded-xl">
 <p className="font-bold text-[9px] text-gray-400 uppercase mb-2">Checklist Status</p>
 <ul className="space-y-1 text-[10px] font-bold text-gray-600">
 <li className="flex items-center gap-1.5 text-green-600">
 ✅ Primary Guest Details (Completed)
 </li>
 <li className="flex items-center gap-1.5 text-green-600">
 {guests[0]?.pendingDocFile || guests[0]?.idDocument ? "✅" : "❌"} Primary ID Proof
 </li>
 <li className="flex items-center gap-1.5 text-green-600">
 {guests.every(g => g.idType === "Not Required" || g.pendingDocFile || g.idDocument) ? "✅" : "❌"} Co-Guest IDs (Optional/Uploaded)
 </li>
 <li className="flex items-center gap-1.5 text-green-600">
 {paymentData.checkInAdvance >= dueAmount ? "✅" : "ℹ️"} Payment Collected
 </li>
 <li className="flex items-center gap-1.5 text-green-600">
 {signedGRCFile ? "✅" : "❌"} Signed GRC Uploaded
 </li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-4 sm:px-6 py-3 border-t bg-white flex justify-between items-center rounded-b-2xl">
 {currentStep === 3 ? (
 <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold max-w-[50%]">
 <span className="w-2 h-2 bg-green-500 rounded-full animate-ping flex-shrink-0" />
 <span>Ready to Check-in. All required information and payment are completed.</span>
 </div>
 ) : (
 <button
 onClick={onClose}
 className="text-gray-400 font-bold text-[10px] uppercase tracking-wider hover:text-gray-600"
 >
 Cancel
 </button>
 )}

 <div className="flex flex-col items-end gap-1">
  {!canProceed(currentStep) && currentStep < 3 && getProceedError(currentStep) && (
    <span className="text-[9px] text-red-500 font-bold mb-1">
      ⚠️ {getProceedError(currentStep)}
    </span>
  )}
 <div className="flex items-center gap-3">
 {currentStep > 1 && (
 <button
 onClick={() => setCurrentStep(currentStep - 1)}
 className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-all"
 >
 <FiChevronLeft size={12} /> Back
 </button>
 )}
 {currentStep < 3 ? (
 <button
 onClick={handleNextStep}
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
 : "Confirm Check-in & Assign Room"}
 </button>
 )}
 </div>
 
 {/* Lock / status subtext */}
 <span className="text-[8px] text-gray-400 font-bold mt-0.5">
 {currentStep === 3 
 ? "Room will be assigned and status will change to Checked-In." 
 : "🔒 Your data is safe and secure"}
 </span>
 </div>
 </div>
 </div>

 {/* Success Actions - Post Check-in */}
 {showSuccessActions && (
 <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-white rounded-2xl shadow-2xl p-6 animate-fade-in max-w-[20rem] w-full">
 <div className="text-center mb-6">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <FiCheckCircle size={32} className="text-green-600" />
 </div>
 <h2 className="text-lg font-black text-gray-800 mb-2">
 Check-in Successful!
 </h2>
 <p className="text-sm text-gray-500 font-medium">
 Guest has been checked in successfully
 </p>
 </div>

 <div className="space-y-3">
 
 <button
                          onClick={() => {
                            handleResetForm();
                            if (onClose) onClose();
                          }}
                          className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-orange-600 transition-all mb-3"
                        >
                          New Check-in
                        </button>
                        <button
                          onClick={() => {
                            setShowSuccessActions(false);
                            if (onClose) onClose();
                            navigate('/active-guests');
                          }}
                          className="w-full px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-50 transition-all"
                        >
                          View Active Guests
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
 <div className="flex justify-between items-center mt-4 mb-2">
 <h2 className="text-white font-black text-base uppercase tracking-wider">
 Guest Registration Card - A4 Preview
 </h2>
 <div className="flex gap-3">
 <button
 onClick={() => grcCardRef.current?.exportToPDF()}
 className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600"
 >
 <FiPrinter size={14} /> Print / Save PDF
 </button>
 <button
 onClick={() => setShowGRCModal(false)}
 className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/40"
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
}

export default CheckInForm;
