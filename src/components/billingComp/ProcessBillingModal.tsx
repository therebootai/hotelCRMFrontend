import React, { useState, useEffect, useRef } from "react";
import {
  FiPlus,
  FiX,
  FiTrash2,
  FiChevronDown,
  FiAlertCircle,
  FiShield,
  FiSearch,
  FiCalendar,
  FiDollarSign,
  FiCheck,
  FiCreditCard,
  FiFileText,
} from "react-icons/fi";
import api from "../../lib/axios";
import toast from "react-hot-toast";

interface TaxOption {
  _id: string;
  name: string;
  percentage: number;
  type: "Room" | "Food" | "Service";
  isActive: boolean;
}

interface ProcessBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProcessBillingModal: React.FC<ProcessBillingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeCheckIns, setActiveCheckIns] = useState<any[]>([]);
  const [dbExtraServices, setDbExtraServices] = useState<any[]>([]);

  // Stays lookup search dropdown states
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedCheckInId, setSelectedCheckInId] = useState("");
  // Removed unused loadingCheckIns and submitting state variables
  const [showPaymentWarningModal, setShowPaymentWarningModal] = useState(false);
  const [pendingIsCheckoutFlag, setPendingIsCheckoutFlag] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [billPreview, setBillPreview] = useState<any>(null);

  // Extra service autocomplete states
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  // Custom billing inputs
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [restaurantCharges, setRestaurantCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(12); // Default GST
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // New Payment inputs
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentTxnId, setPaymentTxnId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Fetch stays & services when open
  useEffect(() => {
    const fetchActiveCheckIns = async () => {
      try {
        const res = await api.get("/checkin/list?status=Active&limit=100");
        if (res.data && res.data.success) {
          setActiveCheckIns(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching active check-ins:", err);
      }
    };

    const fetchDbExtraServices = async () => {
      try {
        const res = await api.get("/extra-services?activeOnly=true");
        if (res.data && res.data.success) {
          setDbExtraServices(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching database extra services:", err);
      }
    };

    const fetchTaxes = async () => {
      try {
        const res = await api.get("/tax-gst", {
          params: { activeOnly: "true" },
        });
        setTaxOptions(res.data.data || []);
      } catch (err) {
        console.error("Error fetching taxes:", err);
      }
    };

    if (isOpen) {
      fetchActiveCheckIns();
      fetchDbExtraServices();
      fetchTaxes();
      resetForm();
    }
  }, [isOpen]);

  // Click outside listener for stays lookup and extra service row autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle checkin search dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      // Handle extra service autocompletes
      const target = event.target as HTMLElement;
      if (!target.closest(".service-search-container")) {
        setFocusedRowIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter stays list dynamically based on search query
  const filteredStays = activeCheckIns.filter((ci) => {
    const primary = ci.guests?.find((g: any) => g.isPrimary) || ci.guests?.[0];
    const rooms =
      ci.roomDetails?.map((r: any) => r.roomNumber).join(", ") || "";
    const query = searchQuery.toLowerCase();

    return (
      ci.checkInId?.toLowerCase().includes(query) ||
      primary?.name?.toLowerCase().includes(query) ||
      primary?.mobileNo?.includes(query) ||
      rooms.includes(query)
    );
  });

  // Fetch Bill Preview for selected Check-In
  const handleCheckInSelect = async (checkIn: any) => {
    setSelectedCheckInId(checkIn._id);
    const primary =
      checkIn.guests?.find((g: any) => g.isPrimary) || checkIn.guests?.[0];
    const rooms = checkIn.roomDetails?.map((r: any) => r.roomNumber).join(", ");
    setSearchQuery(
      `${checkIn.checkInId} - ${primary?.name || "Guest"} (Rooms: ${rooms})`,
    );
    setShowDropdown(false);

    try {
      setPreviewLoading(true);
      const res = await api.get(`/billing/preview/${checkIn._id}`);
      if (res.data && res.data.success) {
        const preview = res.data.data;
        setBillPreview(preview);

        // Populate default values from existing draft or calculate fresh
        const mappedServices = (preview.extraServices || []).map((s: any) => {
          const match = dbExtraServices.find(
            (ds) => ds.name.toLowerCase() === s.serviceName.toLowerCase(),
          );
          return {
            serviceName: s.serviceName,
            quantity: s.quantity || 1,
            rate: s.rate || 0,
            total: s.total || 0,
            dbServiceId: match ? match._id : "",
          };
        });

        setExtraServices(mappedServices);
        setRestaurantCharges(preview.restaurantCharges || 0);
        setDiscount(preview.discount || 0);
        setTaxPercentage(preview.taxPercentage || 12);
        setNotes(preview.notes || "");

        // Restore the booking's tax GST record for display
        const storedPct = preview.taxPercentage ?? 12;
        if (preview.taxGstId) {
          const match = taxOptions.find((t) => t._id === preview.taxGstId);
          setSelectedTaxId(match ? match._id : "");
        } else {
          const match = taxOptions.find((t) => t.percentage === storedPct);
          setSelectedTaxId(match ? match._id : "");
        }

        // Calculate recommended payment based on Net Payable (Grand Total - Advance)
        const roomTotal = preview.totalRoomCharges || 0;
        const subTotal =
          roomTotal +
          (preview.extraServices || []).reduce(
            (acc: number, s: any) => acc + (s.total || 0),
            0,
          );
        const taxAmt = (subTotal * (preview.taxPercentage || 12)) / 100;
        const grandTotal = subTotal + taxAmt - (preview.discount || 0);
        const netPayable = Math.max(
          0,
          grandTotal - (preview.advanceDeducted || 0),
        );
        const due = Math.max(0, netPayable - (preview.paidAmount || 0));

        setPaymentAmount(parseFloat(due.toFixed(2)));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to load check-in ledger details",
      );
      setBillPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Helper to add extra service input row
  const addExtraServiceRow = () => {
    setExtraServices([
      ...extraServices,
      { serviceName: "", quantity: 1, rate: 0, total: 0, dbServiceId: "" },
    ]);
  };

  // Helper to remove extra service input row
  const removeExtraServiceRow = (index: number) => {
    const updated = extraServices.filter((_, idx) => idx !== index);
    setExtraServices(updated);
  };

  // Helper to update extra service details
  const updateExtraServiceRow = (index: number, field: string, value: any) => {
    const updated = [...extraServices];
    updated[index][field] = value;

    if (field === "quantity" || field === "rate") {
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].total = Math.round(q * r);
    }
    setExtraServices(updated);
  };

  // Save custom service directly to database and auto-select
  const handleSaveCustomServiceToDb = async (
    index: number,
    customName: string,
  ) => {
    if (!customName.trim()) {
      toast.error("Please type a service name first.");
      return;
    }

    try {
      const res = await api.post("/extra-services", {
        name: customName.trim(),
        isActive: true,
      });
      if (res.data && res.data.success) {
        const newService = res.data.data;
        toast.success(`Service "${newService.name}" saved in Master Database!`);

        // Refresh dynamic list of services from backend
        const freshRes = await api.get("/extra-services?activeOnly=true");
        if (freshRes.data && freshRes.data.success) {
          setDbExtraServices(freshRes.data.data);
        }

        // Auto select this newly created service in the current row
        const updated = [...extraServices];
        updated[index].dbServiceId = newService._id;
        updated[index].serviceName = newService.name;
        setExtraServices(updated);

        // Close active dropdown
        setFocusedRowIndex(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Failed to register custom service in database",
      );
    }
  };

  // Dynamic calculations
  const roomChargesTotal = billPreview?.totalRoomCharges || 0;
  const extraServicesTotal = extraServices.reduce(
    (sum, s) => sum + (Number(s.total) || 0),
    0,
  );
  const subTotalAmount = Math.round(
    roomChargesTotal + extraServicesTotal + Number(restaurantCharges || 0),
  );
  const calculatedTax = Math.round(
    (subTotalAmount * Number(taxPercentage || 0)) / 100,
  );
  const calculatedGrandTotal = Math.round(
    subTotalAmount + calculatedTax - Number(discount || 0),
  );

  // Advance payment deduction display logic
  const advanceAmount = billPreview?.advanceDeducted || 0;

  const netPayableAmount = Math.round(
    Math.max(0, calculatedGrandTotal - advanceAmount),
  );
  const previouslyPaid = billPreview?.paidAmount || 0;

  // Total paid after this transaction
  const finalPaidAmount = Math.round(
    previouslyPaid + Number(paymentAmount || 0),
  );
  const remainingDue = Math.round(
    Math.max(0, netPayableAmount - finalPaidAmount),
  );

  // Process Checkout submission
  const handleSubmitBilling = async (isCheckoutFlag: boolean) => {
    if (finalPaidAmount > netPayableAmount && paymentAmount > 0) {
      setPendingIsCheckoutFlag(isCheckoutFlag);
      setShowPaymentWarningModal(true);
      return;
    }

    proceedWithBilling(isCheckoutFlag);
  };

  const proceedWithBilling = async (isCheckoutFlag: boolean) => {
    if (!selectedCheckInId) {
      toast.error("Please select a check-in record.");
      return;
    }

    if (isCheckoutFlag && remainingDue > 0) {
      toast.error(
        `Cannot complete checkout. Outstanding due of ₹${remainingDue} must be fully paid.`,
      );
      return;
    }

    if (paymentAmount > 0 && paymentMethod !== "Cash" && !paymentTxnId.trim()) {
      toast.error(
        `Please provide a Transaction ID for ${paymentMethod} payments.`,
      );
      return;
    }

    const payload = {
      checkInId: selectedCheckInId,
      extraServices: extraServices.filter((s) => s.serviceName.trim() !== ""),
      restaurantCharges: Number(restaurantCharges),
      discount: Number(discount),
      taxPercentage: Number(taxPercentage),
      notes,
      isCheckout: isCheckoutFlag,
      payment:
        paymentAmount > 0
          ? {
              amount: Number(paymentAmount),
              method: paymentMethod,
              transactionId:
                paymentMethod !== "Cash" ? paymentTxnId.trim() : undefined,
              note:
                paymentNote ||
                (isCheckoutFlag ? "Checkout settlement" : "Partial payment"),
            }
          : undefined,
    };

    try {
      setSubmitLoading(true);
      const res = await api.post("/billing/process-checkout", payload);
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Billing processed successfully.");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process billing");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCheckInId("");
    setSearchQuery("");
    setShowDropdown(false);
    setBillPreview(null);
    setExtraServices([]);
    setRestaurantCharges(0);
    setDiscount(0);
    setTaxPercentage(12);
    setSelectedTaxId("");
    setNotes("");
    setPaymentAmount(0);
    setPaymentMethod("Cash");
    setPaymentTxnId("");
    setPaymentNote("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-gray-100 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in duration-250">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FiPlus className="text-orange-500" size={20} />
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
              Process Room Billing & Checkout Settlement
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Searchable Stay Selector */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] 3xl:text-[14px] uppercase font-black text-gray-400 tracking-wider block mb-2">
              Search & Select Active In-House Check-In Record
            </label>
            <div className="relative">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Type Guest Name, Check-in ID, or Mobile number to search..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 focus:border-orange-300 focus:bg-white focus:ring-1 focus:ring-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700 shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setSelectedCheckInId("");
                    setBillPreview(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200/50 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Custom Search Dropdown Autocomplete Overlay */}
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-gray-50">
                {filteredStays.length > 0 ? (
                  filteredStays.map((ci) => {
                    const primary =
                      ci.guests?.find((g: any) => g.isPrimary) ||
                      ci.guests?.[0];
                    const rooms = ci.roomDetails
                      ?.map((r: any) => r.roomNumber)
                      .join(", ");
                    const isSelected = ci._id === selectedCheckInId;

                    return (
                      <button
                        key={ci._id}
                        type="button"
                        onClick={() => handleCheckInSelect(ci)}
                        className={`w-full text-left px-4 py-3 hover:bg-orange-50/40 transition-all text-sm font-bold flex justify-between items-center ${
                          isSelected
                            ? "bg-orange-50/20 text-orange-700"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-orange-600 font-black text-sm flex items-center gap-1.5">
                            {ci.checkInId} - {primary?.name || "Guest"}
                            {isSelected && (
                              <FiCheck
                                size={12}
                                className="text-orange-600 font-bold"
                              />
                            )}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Mobile: {primary?.mobileNo || "N/A"} | Rooms:{" "}
                            <span className="font-bold text-gray-600">
                              {rooms || "N/A"}
                            </span>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 rounded text-[9px] uppercase font-black tracking-wide">
                          Active In-House
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-5 text-center text-sm text-gray-400 font-bold">
                    No active staying guests found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {previewLoading && (
            <div className="py-24 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-400 font-bold">
                Recalculating stays & pulling active ledger reports...
              </p>
            </div>
          )}

          {/* Form Content - only visible after check-in selection */}
          {!previewLoading && billPreview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form Inputs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stay Summary Info */}
                <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/50 grid grid-cols-2 gap-4 text-sm font-bold text-gray-700">
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 font-black tracking-wider block mb-0.5">
                      Primary Guest
                    </span>
                    <p className="text-gray-900 font-black">
                      {billPreview.primaryGuest?.name ||
                        billPreview.customerId?.name ||
                        "N/A"}
                    </p>
                    {(billPreview.primaryGuest?.mobileNo ||
                      billPreview.customerId?.phone) && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Mobile:{" "}
                        {billPreview.primaryGuest?.mobileNo ||
                          billPreview.customerId?.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 font-black tracking-wider block mb-0.5">
                      Room Breakdown
                    </span>
                    <p className="text-orange-600">
                      {billPreview.roomChargesBreakdown
                        ?.map((r: any) => `${r.roomNumber} (${r.roomType})`)
                        .join(", ") || "N/A"}
                    </p>
                  </div>
                </div>

                {/* ADVANCE PAYMENTS BLOCK */}
                {advanceAmount > 0 && (
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center justify-between text-sm font-bold">
                    <div className="flex gap-2.5 items-center">
                      <FiDollarSign className="text-green-600" size={18} />
                      <div>
                        <h5 className="text-green-800 font-black">
                          Advance Payments Collected
                        </h5>
                        <p className="text-[10px] text-green-600 font-medium">
                          This amount was paid during check-in and will be
                          deducted from total.
                        </p>
                      </div>
                    </div>
                    <span className="px-3.5 py-1 bg-green-600 text-white font-black rounded-lg text-sm shadow-sm">
                      - ₹{advanceAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Room Rates Breakdown */}
                <div>
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2 flex items-center gap-1">
                    <FiCalendar size={12} /> Calculated Room Stays & Durations
                  </h4>
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5">Room No</th>
                          <th className="px-4 py-2.5 text-center">
                            Nights Stayed
                          </th>
                          <th className="px-4 py-2.5 text-right">
                            Applied Rate
                          </th>
                          <th className="px-4 py-2.5 text-right">
                            Total Stay Charge
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-bold text-gray-700 bg-white">
                        {billPreview.roomChargesBreakdown?.map(
                          (room: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-orange-600">
                                {room.roomNumber}{" "}
                                <span className="text-[10px] text-gray-400 font-medium">
                                  ({room.roomType})
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {room.nights} night(s)
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                ₹{room.ratePerNight}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                ₹{room.totalRoomCharge}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Extra Services Items Selection Stepper Form */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider flex items-center gap-1">
                      <FiFileText size={12} /> Extra Services / Amenities
                      Additions
                    </h4>
                    <button
                      type="button"
                      onClick={addExtraServiceRow}
                      className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 bg-orange-50 px-2 py-1 rounded"
                    >
                      <FiPlus size={10} /> Add Service Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {extraServices.map((service, index) => {
                      const isCustom =
                        service.serviceName.trim() &&
                        !dbExtraServices.some(
                          (ds) =>
                            ds.name.toLowerCase() ===
                            service.serviceName.trim().toLowerCase(),
                        );

                      return (
                        <div
                          key={index}
                          className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-2.5 shadow-sm service-search-container"
                        >
                          <div className="flex gap-2 items-center">
                            {/* Autocomplete Search input directly inside the row */}
                            <div className="relative flex-1">
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder="Search or type service name (e.g. Laundry)..."
                                  className="w-full pl-3 pr-20 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 shadow-sm focus:border-orange-300 focus:ring-1 focus:ring-orange-100 transition-all"
                                  value={service.serviceName}
                                  onChange={(e) => {
                                    updateExtraServiceRow(
                                      index,
                                      "serviceName",
                                      e.target.value,
                                    );
                                    setFocusedRowIndex(index);
                                  }}
                                  onFocus={() => setFocusedRowIndex(index)}
                                />

                                {/* Dynamic right-aligned button/icon for standard dropdown toggle or custom addition */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  {isCustom ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveCustomServiceToDb(
                                          index,
                                          service.serviceName,
                                        )
                                      }
                                      title="Add this custom service to Master Database"
                                      className="px-2.5 py-1 bg-linear-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-black text-[9px] uppercase rounded-lg transition-all active:scale-95 shadow-md shadow-orange-100 flex items-center gap-0.5"
                                    >
                                      <FiPlus size={10} /> Add
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFocusedRowIndex(
                                          focusedRowIndex === index
                                            ? null
                                            : index,
                                        );
                                      }}
                                      className="p-1 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                                    >
                                      <FiChevronDown
                                        size={14}
                                        className={`transform transition-transform duration-200 ${focusedRowIndex === index ? "rotate-180" : ""}`}
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Autocomplete Dropdown overlay for this specific row */}
                              {focusedRowIndex === index && (
                                <div className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                  {dbExtraServices
                                    .filter((ds) =>
                                      ds.name
                                        .toLowerCase()
                                        .includes(
                                          service.serviceName.toLowerCase(),
                                        ),
                                    )
                                    .map((ds) => (
                                      <button
                                        key={ds._id}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...extraServices];
                                          updated[index].dbServiceId = ds._id;
                                          updated[index].serviceName = ds.name;
                                          setExtraServices(updated);
                                          setFocusedRowIndex(null); // Close dropdown
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50/40 transition-all text-sm font-bold text-gray-700 flex justify-between items-center"
                                      >
                                        <span>{ds.name}</span>
                                        <span className="text-[9px] text-orange-600 font-bold font-mono uppercase bg-orange-50 px-1.5 py-0.5 rounded">
                                          Master
                                        </span>
                                      </button>
                                    ))}

                                  {/* If no exact match and user has typed something custom */}
                                  {service.serviceName.trim() &&
                                    !dbExtraServices.some((ds) =>
                                      ds.name
                                        .toLowerCase()
                                        .includes(
                                          service.serviceName.toLowerCase(),
                                        ),
                                    ) && (
                                      <div className="p-3 text-center text-[10px] text-gray-400 font-bold italic">
                                        No master service matches. Click "Add"
                                        button inside the input to save it!
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>

                            <input
                              type="number"
                              placeholder="Qty"
                              min="1"
                              className="w-16 px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm text-center font-bold focus:border-orange-300 focus:ring-1 focus:ring-orange-100 transition-all"
                              value={service.quantity}
                              onChange={(e) =>
                                updateExtraServiceRow(
                                  index,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                            />

                            <input
                              type="text"
                              placeholder="Rate"
                              className="w-20 px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm text-right font-bold focus:border-orange-300 focus:ring-1 focus:ring-orange-100 transition-all"
                              value={service.rate || ""}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                );
                                updateExtraServiceRow(
                                  index,
                                  "rate",
                                  cleaned === "" ? 0 : Number(cleaned),
                                );
                              }}
                            />

                            <span className="w-20 text-right text-sm font-black text-gray-700 px-1">
                              ₹{(service.total || 0).toLocaleString()}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeExtraServiceRow(index)}
                              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl hover:text-red-700 transition-colors"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {extraServices.length === 0 && (
                      <p className="text-[11px] text-gray-400 font-bold italic py-4 text-center border border-dashed border-gray-100 rounded-xl">
                        No additional laundry, food, or amenities services
                        logged yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Restaurant charges, Discount, Taxes, & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Restaurant Charges (₹)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none text-sm font-bold"
                      value={restaurantCharges || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, "");
                        setRestaurantCharges(
                          cleaned === "" ? 0 : Number(cleaned),
                        );
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Discount Amount (₹)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none text-sm font-bold text-red-500"
                      value={discount || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, "");
                        setDiscount(cleaned === "" ? 0 : Number(cleaned));
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Tax GST
                    </label>
                    <select
                      className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none text-sm font-bold text-gray-500"
                      value={selectedTaxId}
                      onChange={(e) => {
                        const selected = taxOptions.find(
                          (t) => t._id === e.target.value,
                        );
                        setSelectedTaxId(e.target.value);
                        if (selected) {
                          setTaxPercentage(selected.percentage);
                        }
                      }}
                    >
                      <option value="">— Select Tax —</option>
                      {taxOptions.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.percentage}%)
                        </option>
                      ))}
                    </select>
                    {selectedTaxId && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {taxOptions.find((t) => t._id === selectedTaxId)?.type}{" "}
                        · {taxPercentage}% applied
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                    Billing Notes / Comments
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none text-sm font-medium"
                    placeholder="Specify comments or reasons for adjustments/discounts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Right Column: Invoice Calculation & Payments details */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-6">
                {/* LIVE BILLING BREAKDOWN */}
                <div>
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-200/50 pb-2 mb-3">
                    Total Billing Calculation
                  </h4>
                  <div className="space-y-2 text-sm font-bold text-gray-600">
                    <div className="flex justify-between">
                      <span>Room Charges:</span>
                      <span>₹{roomChargesTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Services:</span>
                      <span>₹{extraServicesTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restaurant Charge:</span>
                      <span>₹{Number(restaurantCharges).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span>Sub Total:</span>
                      <span>₹{subTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Tax ({taxPercentage}%):</span>
                      <span>₹{calculatedTax.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Discount:</span>
                        <span>-₹{Number(discount).toLocaleString()}</span>
                      </div>
                    )}
                    {advanceAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Advance Paid:</span>
                        <span>-₹{advanceAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {previouslyPaid > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Previously Paid:</span>
                        <span>-₹{previouslyPaid.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-800 bg-orange-50/50 p-2 rounded-lg border">
                      <span>Grand Total:</span>
                      <span>₹{calculatedGrandTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-base font-black text-orange-600 bg-white p-2 rounded-lg border border-gray-100">
                      <span>Net Payable:</span>
                      <span>₹{netPayableAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* NEW PAYMENT COLLECTION BLOCK */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                    Record New Payment
                  </h4>

                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Payment Amount (₹)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-orange-200 rounded-xl outline-none text-sm font-bold text-green-600 shadow-sm animate-pulse"
                      value={paymentAmount || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, "");
                        setPaymentAmount(cleaned === "" ? 0 : Number(cleaned));
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Payment Mode
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-600 shadow-sm"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">
                        Bank Transfer (IMPS/NEFT)
                      </option>
                      <option value="Wallet">Digital Wallet</option>
                    </select>
                  </div>

                  {paymentMethod !== "Cash" && (
                    <div className="animate-in slide-in-from-top-1 duration-150">
                      <label className="text-[9px] uppercase font-black text-red-500 tracking-wider mb-1 flex items-center gap-1">
                        Transaction Ref ID{" "}
                        <span className="font-bold text-[8px] px-1 bg-red-100 text-red-600 rounded">
                          Required
                        </span>
                      </label>
                      <div className="relative">
                        {paymentMethod === "UPI" ? (
                          <FiDollarSign
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                        ) : paymentMethod === "Card" ? (
                          <FiCreditCard
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                        ) : (
                          <FiDollarSign
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                        )}
                        <input
                          type="text"
                          required
                          placeholder="Enter payment reference transaction ID..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 focus:border-red-200 focus:ring-1 focus:ring-red-100 rounded-xl outline-none text-sm font-mono font-bold"
                          value={paymentTxnId}
                          onChange={(e) => setPaymentTxnId(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider block mb-1">
                      Payment note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Check-in settlement payment"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>

                  {/* DUE AMOUNT LIVE CALCULATION */}
                  <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl font-bold space-y-1 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Paid Now:</span>
                      <span>₹{Number(paymentAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600 border-t border-red-200/50 pt-1.5">
                      <span>Remaining Balance Due:</span>
                      <span className="font-black text-base">
                        ₹{remainingDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* INSTRUCTIONS ALERT */}
                <div className="bg-gray-100/70 p-3 rounded-xl border border-gray-200/40 flex gap-2 items-start text-[10px] text-gray-500 font-bold leading-relaxed">
                  <FiAlertCircle
                    size={14}
                    className="text-gray-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-gray-600">
                      Final checkout changes the guest status and frees the
                      assigned room only if the Due Balance is completely zero
                      (₹0).
                    </p>
                    <p className="mt-1 text-gray-400">
                      Save Draft records partial payments without checking out
                      the guests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedCheckInId && (
            <div className="py-24 text-center text-gray-400 font-bold text-sm space-y-2 border border-dashed border-gray-100 rounded-2xl">
              <FiShield
                size={32}
                className="mx-auto text-gray-300 animate-bounce"
              />
              <p>
                Search and select an active guest check-in at the top to load
                invoices & details.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 font-bold text-sm"
          >
            Cancel
          </button>

          {billPreview && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitLoading}
                onClick={() => handleSubmitBilling(false)}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 font-bold text-sm active:scale-95 transition-all disabled:opacity-40"
              >
                {submitLoading ? "Processing..." : "Save Bill Draft"}
              </button>
              <button
                type="button"
                disabled={remainingDue > 0 || submitLoading}
                onClick={() => handleSubmitBilling(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
              >
                {submitLoading ? "Processing..." : "Complete Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Warning Modal */}
      {showPaymentWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                onClick={() => setShowPaymentWarningModal(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all flex-1"
              >
                No, Edit Amount
              </button>
              <button
                onClick={() => {
                  setShowPaymentWarningModal(false);
                  proceedWithBilling(pendingIsCheckoutFlag);
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

export default ProcessBillingModal;
