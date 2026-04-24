import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Calendar,
  Upload,
  Plus,
  Trash2,
  Building2,
  CheckCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, differenceInDays, format } from "date-fns";
import api from "../../lib/axios";

interface CheckInProps {
  bookingData: any;
  onClose: () => void;
}

const CheckInForm = ({ bookingData, onClose }: CheckInProps) => {
  const [activeTab, setActiveTab] = useState<"Individual" | "Corporate">(
    bookingData?.bookingType || "Individual",
  );
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(
    bookingData?.rooms?.[0]?.roomType?._id || "",
  );
  const [isExtraBedActive, setIsExtraBedActive] = useState(false);
  const [currentRoomSpecs, setCurrentRoomSpecs] = useState<any>(null);

  // Schema-wise Initial State
  const [formData, setFormData] = useState({
    bookingId: bookingData?._id || "",
 roomIds:
  bookingData?.bookingType === "Corporate"
    ? bookingData?.rooms
        ?.map((r: any) =>
          typeof r.roomId === "object" ? r.roomId?._id : r.roomId
        )
        .filter(Boolean) || []
    : bookingData?.rooms?.[0]?.roomId
      ? [
          typeof bookingData.rooms[0].roomId === "object"
            ? bookingData.rooms[0].roomId._id
            : bookingData.rooms[0].roomId,
        ]
      : [],
    guests: bookingData?.customerId
      ? [
          {
            name: bookingData.customerId.name,
            mobileNo: bookingData.customerId.phone,
            idType: "Aadhar Card",
            idNumber: "",
            idDocument: { public_id: "", secure_url: "" },
            idFile: null as File | null,
            isPrimary: true,
          },
        ]
      : [
          {
            name: "",
            mobileNo: "",
            idType: "Aadhar Card",
            idNumber: "",
            idDocument: { public_id: "", secure_url: "" },

            isPrimary: true,
          },
        ],
    corporateCheckInDetails: {
      companyName: bookingData?.corporateDetails?.companyName || "",
      companyGST: bookingData?.corporateDetails?.gstNumber || "",
      companyAddress: "",
      companyEmail: bookingData?.corporateDetails?.email || "",
      companyPhone: bookingData?.corporateDetails?.mobile || "",

      contactPersonName: bookingData?.corporateDetails?.contactPerson || "",
      designation: "",
      contactMobile: "",
      contactEmail: "",

      contactIdType: "Voter Card",
      contactIdNumber: "",

      // ✅ FIXED: Added missing document object
      contactIdDocument: {
        public_id: "",
        secure_url: "",
      },
      contactIdFile: null as File | null,

      // ✅ Already present but improved naming consistency
      guestListImage: {
        public_id: "",
        secure_url: "",
      },
      guestListFile: null as File | null,

      // ✅ NEW: Company document (missing earlier)
      companyDocument: {
        public_id: "",
        secure_url: "",
      },
      companyDocumentFile: null as File | null,

      totalGuests: bookingData?.corporateDetails?.totalGuests || 1,
      department: "",
      visitPurpose: "",

      // ✅ NEW: remarks (missing earlier)
      remarks: "",
    },
    checkInTime: new Date(),
    expectedCheckOutTime: bookingData?.rooms?.[0]?.checkOutDate
      ? new Date(bookingData.rooms[0].checkOutDate)
      : addDays(new Date(), 1),
    extraBed: {
      hasExtraBed: bookingData?.rooms?.[0]?.hasExtraBed || false,
      chargePerNight: bookingData?.rooms?.[0]?.extraBedCharge || 0,
    },
    initialPayment: {
      amount: 0,
      paymentMode: "Cash",
      transactionId: "",
      note: "Initial Check-in Advance",
    },
    
    notes: "",
  });

  const bookingAdvance = bookingData?.advanceAmount || 0;
  const currentCheckInAdvance = Number(formData.initialPayment.amount) || 0;
const totalAdvanceAtCheckIn = bookingAdvance + currentCheckInAdvance;
  // Function to handle multiple guests (Array logic)
  const addGuest = () => {
    setFormData({
      ...formData,
      guests: [
        ...formData.guests,
        {
          name: "",
          mobileNo: "",
          idType: "Aadhar Card",
          idNumber: "",
          idDocument: { public_id: "", secure_url: "" },
          isPrimary: false,
        },
      ],
    });
  };

  const handleCheckoutDateChange = (date: Date | null) => {
    if (date) {
      const updatedDate = new Date(date);

      if (updatedDate.getHours() === 0 && updatedDate.getMinutes() === 0) {
        updatedDate.setHours(10, 0, 0, 0);
      }

      setFormData({
        ...formData,
        expectedCheckOutTime: updatedDate,
      });
    }
  };
  const removeGuest = (index: number) => {
    const list = [...formData.guests];
    list.splice(index, 1);
    setFormData({ ...formData, guests: list });
  };

  const handleGuestChange = (index: number, field: string, value: any) => {
    const list = [...formData.guests];
    (list[index] as any)[field] = value;
    setFormData({ ...formData, guests: list });
  };

  useEffect(() => {
    const initFetch = async () => {
      try {
        const res = await api.get("/room-types?activeOnly=true");
        setRoomTypes(res.data.data);

        // Jodi bookingData-te room type thake, tar available rooms-o load koro
        if (bookingData?.rooms?.[0]?.roomType?._id) {
          handleRoomTypeChange(bookingData.rooms[0].roomType._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initFetch();
  }, [bookingData]);

  useEffect(() => {
    if (bookingData?.rooms?.[0]?.roomId) {
      setCurrentRoomSpecs(bookingData.rooms[0].roomId);
    }
  }, [bookingData]);

  const handleRoomTypeChange = async (typeId: string) => {
    setSelectedRoomType(typeId);

    try {
      const res = await api.get(`/rooms/available`, {
        params: {
          roomType: typeId,
          checkIn: formData.checkInTime,
          checkOut: formData.expectedCheckOutTime,
        },
      });
      setAvailableRooms(res.data.data.rooms);

      if (res.data.data.rooms.length > 0) {
        const firstRoom = res.data.data.rooms[0];
        setAvailableRooms(res.data.data.rooms);

        setCurrentRoomSpecs(firstRoom);

        setFormData((prev) => ({
          ...prev,
          roomIds: [firstRoom._id],
          extraBed: {
            ...prev.extraBed,
            chargePerNight: firstRoom.extraBedCharge || 0,
          },
        }));
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };
const handleRoomNumberChange = (roomId: string) => {
  const roomObject = availableRooms.find((r: any) => r._id === roomId);
  if (!roomObject) return;

  setCurrentRoomSpecs(roomObject);

  setFormData((prev) => {
    let updatedRoomIds = [...prev.roomIds];

    if (activeTab === "Corporate") {
      // toggle multi select
      if (updatedRoomIds.includes(roomId)) {
        updatedRoomIds = updatedRoomIds.filter((id) => id !== roomId);
      } else {
        updatedRoomIds.push(roomId);
      }
    } else {
      // individual = single room only
      updatedRoomIds = [roomId];
    }

    return {
      ...prev,
      roomIds: updatedRoomIds,
      extraBed: {
        hasExtraBed: false,
        chargePerNight: roomObject.extraBedCharge || 0,
      },
    };
  });
};

  // Payment handler
  const handleAdvanceChange = (amount: number) => {
    setFormData((prev) => ({
      ...prev,
      initialPayment: {
        ...prev.initialPayment,
        amount: amount,
      },
    }));
  };

  const generatePaymentNote = (paymentData: any) => {
    if (!paymentData || Number(paymentData.amount) <= 0) return "";
    const dateStr = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `Initial Advance of ₹${paymentData.amount} received via ${paymentData.paymentMode} on ${dateStr}.`;
  };

const handleFinalCheckIn = async () => {
  // 1. Mandatory Validations
  const primaryGuest = formData.guests[0];
  if (!primaryGuest.name || !primaryGuest.mobileNo || !primaryGuest.idNumber) {
    alert("❌ Primary Guest Name, Mobile, and ID Number are mandatory!");
    return;
  }

  if (activeTab === "Corporate" && !formData.corporateCheckInDetails.companyName) {
    alert("❌ Company Name is mandatory for Corporate check-in!");
    return;
  }

  if (formData.roomIds.length === 0) {
    alert("❌ Please allocate at least one room!");
    return;
  }

  try {
    setLoading(true);
    const data = new FormData();

    // 2. Advanced Payment History Synchronization Logic
    const bookingAdvance = bookingData?.advanceAmount || 0; // JSON logic (₹2000)
    const checkInAdvance = Number(formData.initialPayment.amount) || 0;
    const totalAdvanceAccumulated = bookingAdvance + checkInAdvance;

    const paymentEntries = [];

    // Entry 1: Booking deposit (Jodi thake)
    if (bookingAdvance > 0) {
      paymentEntries.push({
        amount: bookingAdvance,
        paymentMode: "Online", // Booking usually online hoy
        note: "Advance deposit received during booking phase",
        paidAt: bookingData.createdAt || new Date()
      });
    }

    // Entry 2: Current Check-in payment (Jodi manager ekhon ney)
    if (checkInAdvance > 0) {
      paymentEntries.push({
        amount: checkInAdvance,
        paymentMode: formData.initialPayment.paymentMode,
        transactionId: formData.initialPayment.transactionId || "",
        note: formData.initialPayment.note || "Additional advance collected during check-in",
        paidAt: new Date()
      });
    }

    // 3. System Note Generation (Auto-Audit)
    const paymentNote = generatePaymentNote(formData.initialPayment);
    const finalNoteToSubmit = formData.notes 
      ? `${formData.notes}${paymentNote ? `\n[System]: ${paymentNote}` : ""}`
      : paymentNote ? `[System]: ${paymentNote}` : "";

    // 4. Basic Data Append
    data.append("bookingId", formData.bookingId);
    data.append("checkInType", activeTab);
    data.append("notes", finalNoteToSubmit);
    data.append("extraBed", JSON.stringify(formData.extraBed));
    
    // Schema logic: History array pathano hochhe
    data.append("advancePayments", JSON.stringify(paymentEntries));
    data.append("totalAdvanceAmount", totalAdvanceAccumulated.toString());

    // 5. Room Selections for 'roomDetails' Schema
    const roomSelections = formData.roomIds.map((id: string) => {
      const bookingRoom = bookingData.rooms.find((r: any) => r.roomId?._id === id);
      return {
        roomId: id,
        roomType: bookingRoom?.roomType?._id || bookingRoom?.roomId?.roomType,
        roomNumber: bookingRoom?.roomId?.roomNumber || "",
        originalPrice: bookingRoom?.roomId?.basePrice || 0,
        appliedPrice: bookingRoom?.roomId?.basePrice || 0, // Manual adjustment thakle ekhane change hobe
        // Guest Mapping
        guestNames: activeTab === "Individual" 
          ? [formData.guests.find((g, i) => formData.roomIds[i] === id)?.name || primaryGuest.name]
          : [primaryGuest.name],
        mobileNos: [primaryGuest.mobileNo]
      };
    });
    data.append("roomSelections", JSON.stringify(roomSelections));

    // 6. Corporate & Files handling
    if (activeTab === "Corporate") {
      data.append("corporateData", JSON.stringify(formData.corporateCheckInDetails));
      if (formData.corporateCheckInDetails.guestListFile) 
        data.append("guestListFile", formData.corporateCheckInDetails.guestListFile);
      if (formData.corporateCheckInDetails.contactIdFile) 
        data.append("contactIdFile", formData.corporateCheckInDetails.contactIdFile);
      if (formData.corporateCheckInDetails.companyDocumentFile) 
        data.append("companyDocumentFile", formData.corporateCheckInDetails.companyDocumentFile);
    } else {
      formData.guests.forEach((guest, i) => {
        if (guest.idFile) data.append(`idProof_${i}`, guest.idFile);
      });
    }

    // 7. API Processing
    const res = await api.post("/checkin/process", data);
    
    if (res.data.success) {
      alert("✅ Check-in Processed Successfully!");
      
      onClose();   // Close modal
    }
  } catch (err: any) {
    console.error("Check-in Submit Error:", err);
    alert(err.response?.data?.message || "Check-in Failed. Internal Server Error.");
  } finally {
    setLoading(false);
  }
};
  const nights = Math.max(
    1,
    differenceInDays(
      new Date(formData.expectedCheckOutTime),
      new Date(formData.checkInTime),
    ),
  );

  // Price components
  // 1. Booking er base price (Jeta booking korar somoy chilo)
  const bookingBasePrice = bookingData?.totalEstimatedAmount || 0;

  // 2. Extra Bed charge calculation
  const extraBedTotal = formData.extraBed.hasExtraBed
    ? formData.extraBed.chargePerNight * nights
    : 0;

  // 3. Check-in er somoy total koto bill hochhe (Base + Extra Bed)
  const totalAtCheckIn = bookingBasePrice + extraBedTotal;

  // 4. Advance Payment Logic (Booking Deposit + Current Initial Payment)
  const totalAdvancePaid =
    (bookingData?.advanceAmount || 0) + // Jeta booking er somoy diyechilo
    (formData.initialPayment?.amount || 0); // ✅ FIXED: initialPayment use koro

  // 5. Checkout-er somoy estimated koto baki thakbe
  const remainingAtCheckout = totalAtCheckIn - totalAdvancePaid;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#F8F9FA] w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col h-fit max-h-[95vh]">
        {/* Header - Figma Wise */}
        <div className="px-10 py-6 border-b bg-white flex justify-between items-center rounded-t-[2.5rem]">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
              Check-in Guest
            </h2>
            <p className="text-sm text-gray-400 font-bold tracking-wide">
              ID Verification & Room Allocation
            </p>
          </div>
          <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("Individual")}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              Individual
            </button>
            <button
              onClick={() => setActiveTab("Corporate")}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              Corporate
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
          {/* LEFT: Guest Information Section */}
          <div className="flex-[1.5] space-y-8">
            {activeTab === "Individual" ? (
              <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest flex items-center gap-2">
                    <User size={18} className="text-orange-500" /> Primary Guest
                    Information
                  </h3>
                  <button
                    onClick={addGuest}
                    className="flex items-center gap-1 text-orange-600 font-black text-[10px] uppercase bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-all"
                  >
                    <Plus size={14} /> Add co-Guest
                  </button>
                </div>

                {formData.guests.map((guest, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border ${guest.isPrimary ? "border-orange-100 bg-orange-50/20" : "border-gray-50 bg-gray-50/50"} relative space-y-6`}
                  >
                    {!guest.isPrimary && (
                      <button
                        onClick={() => removeGuest(idx)}
                        className="absolute -top-3 -right-3 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                          Guest Name
                        </label>
                        <input
                          type="text"
                          value={guest.name}
                          onChange={(e) =>
                            handleGuestChange(idx, "name", e.target.value)
                          }
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-orange-500 font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                          Guest Phone No
                        </label>
                        <input
                          type="tel"
                          value={guest.mobileNo}
                          onChange={(e) =>
                            handleGuestChange(idx, "mobileNo", e.target.value)
                          }
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-orange-500 font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                          ID Type
                        </label>
                        <select
                          value={guest.idType}
                          onChange={(e) =>
                            handleGuestChange(idx, "idType", e.target.value)
                          }
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                        >
                          <option>Aadhar Card</option>
                          <option>Voter Card</option>
                          <option>Passport</option>
                          <option>Driving License</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                          ID Number
                        </label>
                        <input
                          type="text"
                          value={guest.idNumber}
                          onChange={(e) =>
                            handleGuestChange(idx, "idNumber", e.target.value)
                          }
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                        />
                      </div>
                    </div>

                    {/* ID Document Upload UI - Figma Style */}
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all group cursor-pointer relative">
                      {/* Hidden Input Field */}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleGuestChange(idx, "idFile", file); // State-e file-ta set hobe
                        }}
                      />

                      <div className="p-4 bg-gray-100 rounded-full text-gray-400 group-hover:text-orange-500 transition-all mb-3">
                        {guest.idFile ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Upload size={24} />
                        )}
                      </div>

                      <p className="text-sm font-bold text-gray-700 text-center">
                        {guest.idFile ? (
                          <span className="text-green-600 uppercase tracking-tighter text-[10px]">
                            {guest.idFile.name} Selected
                          </span>
                        ) : (
                          "Drag and drop or click to upload ID"
                        )}
                      </p>

                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 text-center">
                        Passport, Driver's License or National ID (Max 5MB)
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                <h3 className="font-black text-blue-700 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={18} /> Corporate Check-in Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Company Name */}
                  <div className="md:col-span-2">
                    <label className="label">Company Name</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.companyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            companyName: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* GST */}
                  <div>
                    <label className="label">Company GST</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.companyGST}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            companyGST: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Company Email */}
                  <div>
                    <label className="label">Company Email</label>
                    <input
                      type="email"
                      value={formData.corporateCheckInDetails.companyEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            companyEmail: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="label">Company Phone</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.companyPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            companyPhone: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="label">Company Address</label>
                    <textarea
                      value={formData.corporateCheckInDetails.companyAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            companyAddress: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="label">Contact Person Name</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.contactPersonName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            contactPersonName: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Designation</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            designation: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Contact Mobile</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.contactMobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            contactMobile: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Contact Email</label>
                    <input
                      type="email"
                      value={formData.corporateCheckInDetails.contactEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            contactEmail: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* ID Info */}
                  <div>
                    <label className="label">ID Type</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.contactIdType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            contactIdType: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">ID Number</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.contactIdNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            contactIdNumber: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="label">Total Guests</label>
                    <input
                      type="number"
                      value={formData.corporateCheckInDetails.totalGuests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            totalGuests: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Department</label>
                    <input
                      type="text"
                      value={formData.corporateCheckInDetails.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            department: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Purpose */}
                  <div className="md:col-span-2">
                    <label className="label">Visit Purpose</label>
                    <textarea
                      value={formData.corporateCheckInDetails.visitPurpose}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            visitPurpose: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="md:col-span-2">
                    <label className="label">Remarks</label>
                    <textarea
                      value={formData.corporateCheckInDetails.remarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          corporateCheckInDetails: {
                            ...formData.corporateCheckInDetails,
                            remarks: e.target.value,
                          },
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* File Uploads */}
                  {/* Contact ID Document */}
                  <div className="md:col-span-2 border-2 border-dashed border-blue-100 rounded-2xl p-6 text-center relative cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            corporateCheckInDetails: {
                              ...formData.corporateCheckInDetails,
                              contactIdFile: file,
                            },
                          });
                        }
                      }}
                    />

                    <p>
                      {formData.corporateCheckInDetails.contactIdFile
                        ? formData.corporateCheckInDetails.contactIdFile.name
                        : "Upload Contact ID"}
                    </p>
                  </div>

                  {/* Guest List Image */}
                  <div className="md:col-span-2 border-2 border-dashed border-blue-100 rounded-2xl p-6 text-center relative cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            corporateCheckInDetails: {
                              ...formData.corporateCheckInDetails,
                              guestListFile: file,
                            },
                          });
                        }
                      }}
                    />

                    <p>
                      {formData.corporateCheckInDetails.guestListFile
                        ? formData.corporateCheckInDetails.guestListFile.name
                        : "Upload Guest List"}
                    </p>
                  </div>

                  {/* Company Document */}
                  <div className="md:col-span-2 border-2 border-dashed border-blue-100 rounded-2xl p-6 text-center relative cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            corporateCheckInDetails: {
                              ...formData.corporateCheckInDetails,
                              companyDocumentFile: file,
                            },
                          });
                        }
                      }}
                    />

                    <p>
                      {formData.corporateCheckInDetails.companyDocumentFile
                        ? formData.corporateCheckInDetails.companyDocumentFile
                            .name
                        : "Upload Company Document"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* STAY SUMMARY - Figma Step 2/3 style */}
            <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                <Calendar size={18} className="text-orange-500" /> Stay Timing &
                Room Allocation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Date & Time */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">
                    Check-in Date & Time
                  </label>
                  <DatePicker
                    selected={formData.checkInTime}
                    onChange={(d: Date) =>
                      setFormData({ ...formData, checkInTime: d })
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black"
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                  />
                </div>

                {/* Expected Checkout - Default 10:00 AM logic */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">
                    Expected Checkout
                  </label>
                  <DatePicker
                    selected={formData.expectedCheckOutTime}
                    onChange={(date: Date | null) =>
                      handleCheckoutDateChange(date)
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black text-orange-600"
                    dateFormat="dd/MM/yyyy h:mm aa" // Din ebong somoy duto-i dekhabe
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    timeCaption="Time"
                  />
                  <span className="text-[9px] text-gray-400 font-bold mt-1 block">
                    * Default Checkout: 10:00 AM
                  </span>
                </div>

                {/* Room Type - Changeable */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">
                    Room Type
                  </label>
                  <select
                    value={selectedRoomType} // Local state use koro
                    onChange={(e) => handleRoomTypeChange(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map((t: any) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

            <div>
  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">
    Assign Room No.
  </label>

  {activeTab === "Corporate" ? (
    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 border rounded-xl bg-gray-50">
      {availableRooms.map((r: any) => (
        <label
          key={r._id}
          className="flex items-center gap-2 text-sm font-bold p-2 bg-white rounded-lg border"
        >
          <input
            type="checkbox"
            checked={formData.roomIds.includes(r._id)}
            onChange={() => handleRoomNumberChange(r._id)}
          />
          Room {r.roomNumber}
        </label>
      ))}
    </div>
  ) : (
    <select
      value={formData.roomIds[0] || ""}
      onChange={(e) => handleRoomNumberChange(e.target.value)}
      className="w-full p-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-sm font-black outline-none"
    >
      <option value="">Select Room</option>
      {availableRooms.map((r: any) => (
        <option key={r._id} value={r._id}>
          Room {r.roomNumber}
        </option>
      ))}
    </select>
  )}
</div>

                <div
                  className={`p-5 rounded-2xl border transition-all ${formData.extraBed.hasExtraBed ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-gray-50/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                        Extra Bed Service
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {currentRoomSpecs?.extraBedAllowed
                          ? `Available at ₹${currentRoomSpecs.extraBedCharge}/night`
                          : "Not available for this room"}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={!currentRoomSpecs?.extraBedAllowed}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          extraBed: {
                            ...formData.extraBed,
                            hasExtraBed: !formData.extraBed.hasExtraBed,
                          },
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.extraBed.hasExtraBed ? "bg-orange-500" : "bg-gray-200"} ${!currentRoomSpecs?.extraBedAllowed && "opacity-30 cursor-not-allowed"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.extraBed.hasExtraBed ? "left-7" : "left-1"}`}
                      ></div>
                    </button>
                  </div>
                </div>
               
              </div>
               <div className="p-8 bg-green-50/50 rounded-[2.5rem] border border-green-100 space-y-6 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-green-800 uppercase tracking-tighter">
                          Initial Advance
                        </h3>
                        <p className="text-[10px] font-bold text-green-400 uppercase italic">
                          Will be added to payment history
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Deposit</span>
    <span className="text-sm font-black text-green-400">₹{bookingAdvance} Paid</span>
  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.initialPayment.amount}
                        onChange={(e) =>
                          handleAdvanceChange(Number(e.target.value))
                        } // ✅ Updated handler use koro
                        className="w-full p-4 bg-white border-2 border-green-100 rounded-2xl font-black text-green-700 outline-none focus:border-green-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-2">
                        Payment Mode
                      </label>
                      <select
                        value={formData.initialPayment.paymentMode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialPayment: {
                              ...formData.initialPayment,
                              paymentMode: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-white border-2 border-green-100 rounded-2xl font-bold text-sm text-green-700 outline-none focus:border-green-400 transition-all appearance-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>

                  {/* Transaction ID (Conditional) */}
                  {formData.initialPayment.paymentMode !== "Cash" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-2">
                        Transaction / Ref Number
                      </label>
                      <input
                        type="text"
                        value={formData.initialPayment.transactionId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialPayment: {
                              ...formData.initialPayment,
                              transactionId: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-white border-2 border-green-100 rounded-2xl font-bold text-sm outline-none focus:border-green-400"
                        placeholder="Enter TXN ID..."
                      />
                    </div>
                  )}
                </div>
            </section>
          </div>

          {/* RIGHT: Stay Estimations & Protocols */}
          <div className="lg:w-96 space-y-6">
            <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-6">
                Booking Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium opacity-70">
                    Guest Name
                  </span>
                  <span className="text-sm font-bold">
                    {formData.guests[0].name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium opacity-70">
                    Stay Duration
                  </span>
                  <span className="text-sm font-bold">3 Nights</span>
                </div>
                <div className="h-px bg-white/10 my-4"></div>
                <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>Base Booking</span>
                    <span>₹{bookingBasePrice}</span>
                  </div>
                  {formData.extraBed.hasExtraBed && (
                    <div className="flex justify-between text-[11px] text-orange-300 font-bold">
                      <span>Extra Bed ({nights} nights)</span>
                      <span>+₹{extraBedTotal}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between text-xs font-black">
                    <span>Grand Total</span>
                    <span>₹{totalAtCheckIn}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-green-400">
                    <span>Total Advance</span>
                    <span>-₹{totalAdvancePaid}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8">
              <h4 className="text-[10px] font-black text-orange-600 uppercase mb-4 flex items-center gap-2">
                <CheckCircle size={14} /> Check-in Protocol
              </h4>
              <ul className="space-y-3 text-[11px] font-bold text-orange-800 opacity-80 leading-relaxed">
                <li>
                  • Verify original ID documents physically even if uploaded.
                </li>
                <li>
                  • Collect emergency contact if guest is travelling alone.
                </li>
                <li>• Take signature on physical registration form.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-10 py-6 border-t bg-white flex justify-between items-center rounded-b-[2.5rem]">
          <button
            onClick={onClose}
            className="text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-800 transition-colors"
          >
            Cancel Check-in
          </button>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
              Print Reg Form
            </button>
            <button
              onClick={handleFinalCheckIn}
              disabled={loading}
              className="px-10 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-600 transform active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? "Processing..." : "Confirm Check-in"}{" "}
              <CheckCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInForm;
