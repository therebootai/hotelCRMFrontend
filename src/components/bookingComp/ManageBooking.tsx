import { useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PaymentReceiptTemplate, {
  type PaymentReceiptRef,
  type PaymentReceiptData,
} from "../ui/PaymentReceiptTemplate";
import {
  FiSearch,
  FiCalendar,
  FiPhone,
  FiUser,
  FiLogIn,
  FiBriefcase,
  FiEdit2,
  FiX,
  FiPrinter,
  FiEye,
  FiMoreVertical,
  FiFilter,
  FiPlus,
  FiCopy,
  FiMail,
  FiLoader,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Pagination from "../layout/Pagination";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/axios";

const ManageBooking = ({
  data,
  loading,
  filters,
  setFilters,
  pagination,
  onPageChange,
  onCheckIn,
  onEdit,
  onCancel,
  onNewBooking,
}: any) => {
  const [viewType, setViewType] = useState<"Individual" | "Corporate">(
    "Individual",
  );
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null);

  const receiptRef = useRef<PaymentReceiptRef>(null);
  const [printData, setPrintData] = useState<PaymentReceiptData | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handlePrint = (item: any) => {
    const roomTypeNames =
      item.rooms?.map((r: any) => r.roomType?.name || r.roomType).join(", ") ||
      "N/A";
    const servicesList = (item.addons || []).map((a: any) => ({
      service: a.serviceName || a.name || "Add-on",
      description: "Additional Service",
      qty: a.quantity || 1,
      unitPrice: a.rate || 0,
      amount: a.total || 0,
      taxAmount: a.taxAmount || 0,
      taxPercentage: a.taxPercentage || 0,
    }));

    const data: PaymentReceiptData = {
      bookingId: item.bookingId || "N/A",
      bookingDate: item.createdAt
        ? format(new Date(item.createdAt), "dd MMM yyyy")
        : format(new Date(), "dd MMM yyyy"),
      bookingStatus: item.status || "CONFIRMED",
      guest: {
        name: item.bookingContact?.name || item.customerId?.name || "Guest",
        mobile:
          item.bookingContact?.mobile ||
          item.customerId?.phone ||
          "Not Provided",
        email:
          item.bookingContact?.email ||
          item.customerId?.email ||
          "Not Provided",
        address: item.customerId?.address || "Not Provided",
        noOfGuests: `${item.adults || 1} Adults${item.children ? ` + ${item.children} Children` : ""}`,
        idProofType: "Not Provided",
      },
      stay: {
        roomType: roomTypeNames,
        checkInDate: item.overallCheckInDate
          ? format(new Date(item.overallCheckInDate), "dd MMM yyyy")
          : "N/A",
        checkOutDate: item.overallCheckOutDate
          ? format(new Date(item.overallCheckOutDate), "dd MMM yyyy")
          : "N/A",
        noOfNights: `${item.totalNights || 1} Nights`,
        view: "Standard View",
        district: "Jalpaiguri",
      },
      services: servicesList,
      payment: {
        roomCharges: item.pricingSummary?.roomTotal || 0,
        roomChargesDesc: `Room Charges (₹${((item.pricingSummary?.roomTotal || 0) / (item.totalNights || 1)).toFixed(2)} × ${item.totalNights || 1} Nights)`,
        servicesTotal: servicesList.reduce(
          (acc: number, s: any) => acc + s.amount,
          0,
        ),
        taxAmount: item.pricingSummary?.taxAmount || 0,
        roomTaxAmount:
          (item.pricingSummary?.taxAmount || 0) -
          servicesList.reduce(
            (acc: number, s: any) => acc + (s.taxAmount || 0),
            0,
          ),
        grandTotal: item.pricingSummary?.grandTotal || 0,
        advancePaid: item.pricingSummary?.paidAmount || item.advanceAmount || 0,
        balanceDue:
          item.pricingSummary?.dueAmount ??
          (item.pricingSummary?.grandTotal || 0) -
            (item.pricingSummary?.paidAmount || item.advanceAmount || 0),
        paymentMode:
          (item.pricingSummary?.paidAmount || item.advanceAmount || 0) > 0
            ? item.paymentMode || "Online / UPI"
            : "N/A",
      },
    };

    setPrintData(data);
    setTimeout(() => {
      receiptRef.current?.exportToPDF();
    }, 100);
  };

  const handleEmail = async (item: any) => {
    const emailToUse = item.bookingContact?.email || item.customerId?.email || item.customerDetails?.email;
    if (!emailToUse) {
      toast.error("No email address found for this guest");
      return;
    }
    setSendingEmailId(item._id);
    try {
      await api.post(`/bookings/${item._id}/email-receipt`, { email: emailToUse });
      toast.success(`Receipt sent to ${emailToUse}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleWhatsapp = async (item: any) => {
    const phoneToUse = item.bookingContact?.mobile || item.customerId?.phone || item.customerDetails?.phone;
    if (!phoneToUse) {
      toast.error("No phone number found for this guest");
      return;
    }
    setSendingWhatsappId(item._id);
    try {
      await api.post(`/bookings/${item._id}/whatsapp-receipt`, { phone: phoneToUse });
      toast.success(`WhatsApp receipt sent to ${phoneToUse}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return {
          bg: "bg-green-500",
          text: "text-white",
          shadow: "shadow-green-100",
        };
      case "Checked-In":
        return {
          bg: "bg-orange-500",
          text: "text-white",
          shadow: "shadow-orange-100",
        };
      case "Checked-Out":
        return {
          bg: "bg-blue-500",
          text: "text-white",
          shadow: "shadow-blue-100",
        };
      case "Cancelled":
        return {
          bg: "bg-red-500",
          text: "text-white",
          shadow: "shadow-red-100",
        };
      case "No-Show":
        return {
          bg: "bg-gray-500",
          text: "text-white",
          shadow: "shadow-gray-100",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", shadow: "" };
    }
  };

  // Payment status badge

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
      {/* --- KPI CARDS SECTION --- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 ">
        {[
          { label: "Today Arrivals", value: 12, color: "text-blue-600" },
          { label: "Pending Advance", value: 18, color: "text-orange-600" },
          { label: "Tentative", value: 7, color: "text-yellow-600" },
          { label: "OTA Reservations", value: 11, color: "text-purple-600" },
          { label: "Corporate Bookings", value: 6, color: "text-emerald-600" },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 flex items-center justify-between gap-3 hover:shadow-md transition-all "
          >
            <span className="text-[10px] 3xl:text-[14px] font-bold text-gray-500 uppercase tracking-wider leading-tight ">
              {kpi.label}
            </span>
            <span className={`text-xl font-black ${kpi.color}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* --- TOP FILTERS SECTION --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm ">
        <div className="flex items-center gap-3 w-full ">
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-gray-100 rounded-lg w-fit shrink-0">
            <button
              onClick={() => {
                setViewType("Individual");
                setFilters({ ...filters, bookingType: "Individual" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-sm 3xl:text-[18px] font-bold transition-all ${viewType === "Individual" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiUser size={12} className=" " /> Individual
            </button>
            <button
              onClick={() => {
                setViewType("Corporate");
                setFilters({ ...filters, bookingType: "Corporate" });
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-sm 3xl:text-[18px] font-bold transition-all ${viewType === "Corporate" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              <FiBriefcase size={12} className=" " /> Corporate
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 "
              size={14}
            />
            <input
              type="text"
              placeholder={`Search by name, phone, booking ID...`}
              className="w-full pl-10 pr-4 py-2.5 3xl:py-3.5 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-sm font-medium text-gray-700 "
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Filter Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 3xl:py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                showFilters ||
                filters.status ||
                filters.startDate ||
                filters.endDate
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <FiFilter size={16} className=" " />
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-[300px] bg-white border border-gray-100 shadow-xl rounded-2xl z-50 p-4 flex flex-col gap-4 ">
                <div className="flex flex-col gap-1.5 ">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ">
                    Date Range
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 ">
                    <div className="flex items-center px-2 gap-1 border-r border-gray-200 flex-1">
                      <FiCalendar size={12} className="text-orange-500 " />
                      <DatePicker
                        selected={filters.startDate}
                        onChange={(date: any) =>
                          setFilters({ ...filters, startDate: date })
                        }
                        placeholderText="From"
                        isClearable
                        className="bg-transparent outline-none text-[10px] font-bold w-full "
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    <div className="flex items-center px-2 gap-1 flex-1">
                      <DatePicker
                        selected={filters.endDate}
                        onChange={(date: any) =>
                          setFilters({ ...filters, endDate: date })
                        }
                        placeholderText="To"
                        isClearable
                        className="bg-transparent outline-none text-[10px] font-bold w-full "
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 ">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ">
                    Status
                  </span>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-gray-700 "
                  >
                    <option value="">All Status</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked-In">Checked-In</option>
                    <option value="Checked-Out">Checked-Out</option>
                    <option value="No-Show">No-Show</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* New Booking Button */}
          <button
            onClick={onNewBooking}
            className="shrink-0 h-[2.5rem] 3xl:h-12 px-5 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95 "
          >
            <FiPlus className=" " />{" "}
            <span className="hidden md:inline">New Booking</span>
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full ">
        {/* Table Header */}
        <div className="flex items-center bg-gray-50/70 border-b border-gray-100 px-4 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest 3xl:text-[14px] min-w-[1050px] lg:min-w-0 ">
          <div className="flex-[0.8]">Booking ID</div>
          <div className="flex-1 text-left leading-tight">
            Guest Name <br /> <span className="opacity-70">Mobile No.</span>
          </div>
          <div className="flex-1 text-center leading-tight">
            Check-In <br /> <span className="opacity-70">Check-Out</span>
          </div>
          <div className="flex-[0.5] text-center">Nights</div>
          <div className="flex-1 text-center leading-tight">
            Room Type <br /> <span className="opacity-70">Rooms</span>
          </div>
          <div className="flex-[0.6] text-center">Source</div>
          <div className="flex-[0.8] text-center leading-tight">
            Adv. Paid <br /> <span className="opacity-70">Total Amount</span>
          </div>
          <div className="flex-[0.8] text-center">Status</div>
          <div className="flex-[0.6] text-center">Held Till</div>
          <div className="text-center flex-1 ">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center ">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto "></div>
              <p className="mt-2 text-sm text-gray-400 font-bold ">
                Loading bookings...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold text-base ">
              No bookings found
            </div>
          ) : (
            data.map((item: any) => {
              const statusBadge = getStatusBadge(item.status);
              const guestName =
                item.bookingContact?.name || item.customerId?.name || "Guest";
              const guestPhone =
                item.bookingContact?.mobile || item.customerId?.phone || "";
              const grandTotal = item.pricingSummary?.grandTotal || 0;

              return (
                <div
                  key={item._id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50/50 transition-all min-w-[1050px] lg:min-w-0 "
                >
                  {/* Booking ID */}
                  <div className="flex-[0.8] flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${viewType === "Corporate" ? "text-blue-600" : "text-orange-500"}`}
                    >
                      {item.bookingId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleCopy(e, item.bookingId, "Booking ID")
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                      title="Copy Booking ID"
                    >
                      <FiCopy size={12} />
                    </button>
                  </div>

                  {/* Guest Name / Mobile No. */}
                  <div className="flex-1">
                    <span className="text-base font-bold text-gray-800 ">
                      {guestName}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 ">
                      <FiPhone size={8} className=" " />
                      {guestPhone}
                      {guestPhone && (
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCopy(e, guestPhone, "Guest Mobile")
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-1 p-0.5 rounded hover:bg-gray-100"
                          title="Copy Mobile Number"
                        >
                          <FiCopy size={10} />
                        </button>
                      )}
                    </div>
                    {viewType === "Corporate" &&
                      item.corporateDetails?.companyName && (
                        <p className="text-[9px] text-blue-600 font-bold ">
                          {item.corporateDetails.companyName}
                        </p>
                      )}
                  </div>

                  {/* Check-In / Check-Out */}
                  <div className="flex-1 text-center flex flex-col items-center">
                    <p className="text-sm font-bold text-gray-700 ">
                      {item.overallCheckInDate || item.rooms?.[0]?.checkInDate
                        ? format(
                            new Date(
                              item.overallCheckInDate ||
                                item.rooms?.[0]?.checkInDate,
                            ),
                            "dd MMM yyyy",
                          )
                        : "TBD"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 ">
                      {item.overallCheckOutDate || item.rooms?.[0]?.checkOutDate
                        ? format(
                            new Date(
                              item.overallCheckOutDate ||
                                item.rooms?.[0]?.checkOutDate,
                            ),
                            "dd MMM yyyy",
                          )
                        : "TBD"}
                    </p>
                  </div>

                  {/* Nights */}
                  <div className="flex-[0.5] text-center">
                    <p className="text-base font-bold text-gray-700 ">
                      {item.totalNights || 1}
                    </p>
                  </div>

                  {/* Room Type / Rooms */}
                  <div className="flex-1 text-center flex flex-col items-center">
                    <span className="text-[11px] font-bold text-gray-800 truncate w-full px-2">
                      {item.rooms?.[0]?.roomType?.name ||
                        item.bookingCategory ||
                        "Room"}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold mt-0.5 ">
                      {item.totalRooms || item.rooms?.length || 0} Room(s)
                    </span>
                  </div>

                  {/* Source */}
                  <div className="flex-[0.6] text-center">
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold ">
                      {item.source || "Walk-In"}
                    </span>
                  </div>

                  {/* Advance Paid / Total Amount */}
                  <div className="flex-[0.8] text-center flex flex-col items-center">
                    <span className="text-sm font-bold text-green-600 ">
                      ₹
                      {(
                        item.advanceAmount ||
                        item.pricingSummary?.paidAmount ||
                        0
                      ).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 border-t border-gray-100 mt-0.5 pt-0.5 w-16 text-center">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex-[0.8] text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Held Till */}
                  <div className="flex-[0.6] text-center">
                    <span className="text-base font-bold text-gray-400 ">
                      —
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex-1 flex items-center justify-center gap-1.5 ">
                    <button
                      onClick={() => onCheckIn(item)}
                      title="Check-in"
                      className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-all "
                    >
                      <FiLogIn size={12} className=" " />
                    </button>

                    <button
                      title="Print"
                      onClick={() => handlePrint(item)}
                      className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-all "
                    >
                      <FiPrinter size={12} className=" " />
                    </button>

                    <button
                      title="WhatsApp"
                      onClick={() => handleWhatsapp(item)}
                      disabled={sendingWhatsappId === item._id}
                      className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all disabled:opacity-50"
                    >
                      {sendingWhatsappId === item._id ? (
                        <FiLoader size={12} className="animate-spin" />
                      ) : (
                        <FaWhatsapp size={12} className=" " />
                      )}
                    </button>

                    <button
                      title="Email"
                      onClick={() => handleEmail(item)}
                      disabled={sendingEmailId === item._id}
                      className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all disabled:opacity-50"
                    >
                      {sendingEmailId === item._id ? (
                        <FiLoader size={12} className="animate-spin" />
                      ) : (
                        <FiMail size={12} className=" " />
                      )}
                    </button>

                    <button
                      title="View"
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all "
                    >
                      <FiEye size={12} className=" " />
                    </button>

                    <div className="relative">
                      <button
                        title="More Options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === item._id ? null : item._id,
                          );
                        }}
                        className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-lg transition-all "
                      >
                        <FiMoreVertical size={12} className=" " />
                      </button>

                      {activeDropdown === item._id && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-100 shadow-lg rounded-xl z-50 overflow-hidden flex flex-col ">
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              onEdit(item);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors w-full text-left "
                          >
                            <FiEdit2 size={10} className=" " /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              onCancel(item);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left border-t border-gray-50"
                          >
                            <FiX size={10} className=" " /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        )}

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

export default ManageBooking;
