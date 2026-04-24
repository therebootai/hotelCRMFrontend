import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Briefcase,
  Calendar,
  BedDouble,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  differenceInDays,
} from "date-fns";
import api from "../../lib/axios";

const CreateBooking = ({ onClose }: { onClose: () => void }) => {
  // --- STATE MANAGEMENT ---
  const [bookingType, setBookingType] = useState<"Individual" | "Corporate">(
    "Individual",
  );
  const [durationValue, setDurationValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Master Room Selection State
  const [selectedRooms, setSelectedRooms] = useState<any[]>([
    {
      roomType: "",
      roomId: "",
      adults: 2,
      children: 0,
      pricePerNight: 0,
      hasExtraBed: false,
      extraBedCharge: 0,
      extraBedAllowed: false,
    },
  ]);

  const [formData, setFormData] = useState({
    customerDetails: { name: "", phone: "", email: "", address: "" },
    corporateDetails: {
      companyName: "",
      gstNumber: "",
      contactPerson: "",
      mobile: "",
      totalGuests: 0,
      expectedRooms: 0,
      negotiatedRate: 0,
      notes: "",
    },
    checkInDate: new Date(),
    checkOutDate: addDays(new Date(), 1),
    source: "Phone",
    advanceAmount: 0,
  });

  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRoomsMap, setAvailableRoomsMap] = useState<{
    [key: string]: any[];
  }>({});

  // --- API FETCHING ---
  useEffect(() => {
    api
      .get("/room-types?activeOnly=true")
      .then((res) => setRoomTypes(res.data.data));
  }, []);

  const fetchAvailableRooms = async (roomTypeId: string) => {
    if (!roomTypeId || !formData.checkInDate || !formData.checkOutDate) return;
    try {
      const res = await api.get(`/rooms/available`, {
        params: {
          roomType: roomTypeId,
          checkIn: formData.checkInDate,
          checkOut: formData.checkOutDate,
        },
      });
      setAvailableRoomsMap((prev) => ({
        ...prev,
        [roomTypeId]: res.data.data.rooms,
      }));
    } catch (err) {
      console.error("Error fetching rooms", err);
    }
  };

  // --- HANDLERS ---
  const addRoomRow = () => {
    setSelectedRooms([
      ...selectedRooms,
      {
        roomType: "",
        roomId: "",
        adults: 2,
        children: 0,
        pricePerNight: 0,
        hasExtraBed: false,
        extraBedCharge: 0,
        extraBedAllowed: false,
      },
    ]);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
  setFormData((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
};
  const removeRoomRow = (index: number) => {
    const list = [...selectedRooms];
    list.splice(index, 1);
    setSelectedRooms(list);
  };

  const handleRoomChange = async (index: number, field: string, value: any) => {
    const list = [...selectedRooms];
    list[index][field] = value;

    if (field === "roomType") {
      await fetchAvailableRooms(value);
      list[index].roomId = ""; // Reset room ID if type changes
    }

    if (field === "roomId") {
      const room = availableRoomsMap[list[index].roomType]?.find(
        (r: any) => r._id === value,
      );
      if (room) {
        list[index].pricePerNight = room.basePrice;
        list[index].extraBedCharge = room.extraBedCharge;
        list[index].extraBedAllowed = room.extraBedAllowed;
      }
    }
    setSelectedRooms(list);
  };

  const handleDurationSelect = (
    val: number,
    unit: "days" | "weeks" | "months",
  ) => {
    setDurationValue(val.toString());
    setShowSuggestions(false);
    let newOut =
      unit === "days"
        ? addDays(formData.checkInDate, val)
        : unit === "weeks"
          ? addWeeks(formData.checkInDate, val)
          : addMonths(formData.checkInDate, val);
    setFormData({ ...formData, checkOutDate: newOut });
  };

  const calculateTotal = () => {
    const nights =
      differenceInDays(formData.checkOutDate, formData.checkInDate) || 1;
    if (bookingType === "Corporate") {
      return (
        (formData.corporateDetails.negotiatedRate || 0) *
        (formData.corporateDetails.expectedRooms || 0) *
        nights
      );
    }
    return selectedRooms.reduce((sum, r) => {
      const roomTotal =
        (r.pricePerNight + (r.hasExtraBed ? r.extraBedCharge : 0)) * nights;
      return sum + roomTotal;
    }, 0);
  };

  const submitBooking = async (isDirectCheckIn: boolean) => {
    try {
      const payload = {
        bookingId: `BK-${Date.now().toString().slice(-6)}`,
        customerDetails: formData.customerDetails,
        bookingType,
        corporateDetails:
          bookingType === "Corporate" ? formData.corporateDetails : undefined,
        rooms:
          bookingType === "Individual"
            ? selectedRooms.map((r) => ({
                roomType: r.roomType,
                roomId: r.roomId,
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
                adults: r.adults,
                children: r.children,
                pricePerNight:
                  r.pricePerNight + (r.hasExtraBed ? r.extraBedCharge : 0),
              }))
            : [], // Corporate rooms are handled at check-in
        status: isDirectCheckIn ? "Checked-In" : "Confirmed",
        source: formData.source,
        advanceAmount: formData.advanceAmount,
        totalEstimatedAmount: calculateTotal(),
        isDirectCheckIn,
      };
      await api.post("/bookings/create", payload);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Submission Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-10 py-6 border-b flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              New Reservation
            </h2>
            <div className="flex gap-4 mt-3">
              <button
                onClick={() => setBookingType("Individual")}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${bookingType === "Individual" ? "bg-orange-500 text-white shadow-lg shadow-orange-100" : "bg-gray-100 text-gray-400"}`}
              >
                <User size={16} /> Individual
              </button>
              <button
                onClick={() => setBookingType("Corporate")}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${bookingType === "Corporate" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-gray-100 text-gray-400"}`}
              >
                <Briefcase size={16} /> Corporate
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-8">
            {/* 1. Contact & Stay Info */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Info size={18} className="text-orange-500" /> Contact &
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/10"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerDetails: {
                          ...formData.customerDetails,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                    Mobile
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerDetails: {
                          ...formData.customerDetails,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-3 md:col-span-2 gap-4 border-t pt-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Check-in
                    </label>
                    <DatePicker
                      selected={formData.checkInDate}
                      onChange={(d) =>
                        setFormData({
                          ...formData,
                          checkInDate: d || new Date(),
                        })
                      }
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div className="relative" ref={suggestionRef}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Stay Duration
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationValue}
                      onChange={(e) => {
                        setDurationValue(e.target.value.replace(/\D/g, ""));
                        setShowSuggestions(true);
                      }}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      placeholder="e.g. 2"
                    />
                    {showSuggestions && durationValue && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 mt-2 overflow-hidden">
                        {["days", "weeks", "months"].map((u) => (
                          <div
                            key={u}
                            onClick={() =>
                              handleDurationSelect(
                                parseInt(durationValue),
                                u as any,
                              )
                            }
                            className="p-4 hover:bg-orange-50 cursor-pointer font-bold text-xs capitalize"
                          >
                            {durationValue} {u}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Check-out (Auto)
                    </label>
                    <div className="p-3 bg-orange-50 text-orange-700 font-black rounded-xl border border-orange-100">
                      {format(formData.checkOutDate, "dd MMM, yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Dynamic Room / Corporate Logic */}
            {bookingType === "Individual" ? (
              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <BedDouble size={18} className="text-orange-500" />{" "}
                    Individual Room Allocation
                  </h3>
                  <button
                    onClick={addRoomRow}
                    className="flex items-center gap-1 text-orange-600 font-bold text-xs bg-white border border-orange-100 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all"
                  >
                    <Plus size={14} /> Add Another Room
                  </button>
                </div>
                {selectedRooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group animate-in slide-in-from-top-4"
                  >
                    {selectedRooms.length > 1 && (
                      <button
                        onClick={() => removeRoomRow(idx)}
                        className="absolute -top-2 -right-2 bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                          Room Type
                        </label>
                        <select
                          value={room.roomType}
                          onChange={(e) =>
                            handleRoomChange(idx, "roomType", e.target.value)
                          }
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                        >
                          <option value="">Type</option>
                          {roomTypes.map((t: any) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                          Room No.
                        </label>
                        <select
                          value={room.roomId}
                          onChange={(e) =>
                            handleRoomChange(idx, "roomId", e.target.value)
                          }
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                        >
                          <option value="">No.</option>
                          {(availableRoomsMap[room.roomType] || []).map(
                            (r: any) => (
                              <option key={r._id} value={r._id}>
                                {r.roomNumber}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                          Adults/Child
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={room.adults}
                            onChange={(e) =>
                              handleRoomChange(
                                idx,
                                "adults",
                                Number(e.target.value),
                              )
                            }
                            className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold"
                          />
                          <input
                            type="number"
                            value={room.children}
                            onChange={(e) =>
                              handleRoomChange(
                                idx,
                                "children",
                                Number(e.target.value),
                              )
                            }
                            className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex items-end pb-1">
                        {room.extraBedAllowed && (
                          <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-orange-600">
                            <input
                              type="checkbox"
                              checked={room.hasExtraBed}
                              onChange={(e) =>
                                handleRoomChange(
                                  idx,
                                  "hasExtraBed",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 accent-orange-500"
                            />{" "}
                            Extra Bed
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-blue-700 flex items-center gap-2">
                  <Briefcase size={18} /> Corporate Master Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      onChange={(e) =>
                        handleInputChange(
                          "corporateDetails",
                          "companyName",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      onChange={(e) =>
                        handleInputChange(
                          "corporateDetails",
                          "contactPerson",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Expected Rooms
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      onChange={(e) =>
                        handleInputChange(
                          "corporateDetails",
                          "expectedRooms",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Negotiated Rate / Night
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none font-bold text-blue-700"
                      onChange={(e) =>
                        handleInputChange(
                          "corporateDetails",
                          "negotiatedRate",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Room Type Requested
                    </label>
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                      onChange={(e) =>
                        handleInputChange(
                          "stayDetails",
                          "roomType",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select Type</option>
                      {roomTypes.map((t: any) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-80 space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CreditCard size={18} className="text-orange-500" /> Pricing
              </h3>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Advance Payment
                </label>
                <input
                  type="number"
                  className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600 font-black text-xl"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advanceAmount: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div
                className={`p-8 rounded-[3rem] text-white shadow-2xl transition-all ${bookingType === "Individual" ? "bg-orange-600" : "bg-blue-700"}`}
              >
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">
                  Estimated Total
                </p>
                <h2 className="text-4xl font-black">₹{calculateTotal()}</h2>
                <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-[10px] font-medium opacity-80">
                  <p>
                    Duration:{" "}
                    {differenceInDays(
                      formData.checkOutDate,
                      formData.checkInDate,
                    ) || 1}{" "}
                    Night(s)
                  </p>
                  <p>
                    Allocated:{" "}
                    {bookingType === "Individual"
                      ? selectedRooms.length
                      : formData.corporateDetails.expectedRooms}{" "}
                    Room(s)
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t flex justify-end gap-5 bg-white">
          <button
            onClick={onClose}
            className="text-gray-400 font-bold hover:text-gray-600 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => submitBooking(false)}
            className="px-10 py-4 border-2 border-gray-100 text-gray-800 rounded-2xl font-black hover:bg-gray-50 transition-all"
          >
            Save Booking
          </button>
          <button
            onClick={() => submitBooking(true)}
            className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl transform active:scale-95 transition-all flex items-center gap-2 ${bookingType === "Individual" ? "bg-orange-600" : "bg-blue-700"}`}
          >
            <CheckCircle size={18} />{" "}
            {bookingType === "Individual"
              ? "Confirm & Check-in"
              : "Process Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
