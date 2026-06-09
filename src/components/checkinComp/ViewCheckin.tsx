import { FiX, FiUser, FiCalendar, FiUsers, FiCreditCard, FiFileText, FiShield, FiCoffee } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BiBuilding } from "react-icons/bi";
import { format } from "date-fns";

interface ViewCheckinProps {
 checkIn: any;
 onClose: () => void;
}

const ViewCheckin = ({ checkIn, onClose }: ViewCheckinProps) => {
 if (!checkIn) return null;

 const primaryGuest = checkIn.guests?.find((g: any) => g.isPrimary) || checkIn.guests?.[0];
 const nights = Math.max(1, Math.ceil((new Date(checkIn.expectedCheckOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60 * 24)));

 return (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
 <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl max-h-[95vh] flex flex-col">
 {/* Header */}
 <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-100 rounded-lg">
 <FiFileText size={18} className="text-blue-600" />
 </div>
 <div>
 <h2 className="text-base font-black text-gray-800 uppercase">Check-in Details</h2>
 <p className="text-[10px] text-gray-500 font-bold">{checkIn.checkInId} • {checkIn.bookingId?.bookingId || checkIn.bookingId}</p>
 </div>
 </div>
 <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
 <FiX size={18} className="text-gray-400" />
 </button>
 </div>

 {/* Content - Compact Scrollable */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {/* Status Bar */}
 <div className="flex items-center gap-2 text-[10px]">
 <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${checkIn.status === "Active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
 {checkIn.status}
 </span>
 <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${checkIn.paymentStatus === "Paid" ? "bg-green-100 text-green-600" : checkIn.paymentStatus === "Partial" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
 {checkIn.paymentStatus}
 </span>
 <span className="px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-600">
 {checkIn.checkInType}
 </span>
 </div>

 {/* 2 Column Grid for Main Info */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {/* Guest Details */}
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FiUser size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">Primary Guest</span>
 </div>
 <div className="space-y-1 text-[10px]">
 <div className="flex justify-between">
 <span className="text-gray-400">Name</span>
 <span className="font-bold text-gray-800">{primaryGuest?.name || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Mobile</span>
 <span className="font-bold text-gray-800">{primaryGuest?.mobileNo || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">ID Type</span>
 <span className="font-bold text-gray-800">{primaryGuest?.idType || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">ID Number</span>
 <span className="font-bold text-gray-800">{primaryGuest?.idNumber || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Nationality</span>
 <span className="font-bold text-gray-800">{primaryGuest?.nationality || "Indian"}</span>
 </div>
 </div>
 </div>

 {/* Stay Details */}
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FiCalendar size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">Stay Info</span>
 </div>
 <div className="space-y-1 text-[10px]">
 <div className="flex justify-between">
 <span className="text-gray-400">Check-in</span>
 <span className="font-bold text-gray-800">{checkIn.checkInTime ? format(new Date(checkIn.checkInTime), "dd MMM yy HH:mm") : "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Checkout</span>
 <span className="font-bold text-gray-800">{checkIn.expectedCheckOutTime ? format(new Date(checkIn.expectedCheckOutTime), "dd MMM yy HH:mm") : "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Nights</span>
 <span className="font-bold text-orange-600">{nights}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Category</span>
 <span className="font-bold text-gray-800">{checkIn.bookingCategory || "Room Stay"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Stay Type</span>
 <span className="font-bold text-gray-800">{checkIn.stayType || "Original"}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Rooms */}
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FiCoffee size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">Rooms ({checkIn.roomDetails?.length || 0})</span>
 </div>
 <div className="space-y-1">
 {checkIn.roomDetails?.map((room: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-[10px]">
 <div className="flex items-center gap-2">
 <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-black text-[10px]">{room.roomNumber || "TBD"}</span>
 <div>
 <span className="font-bold text-gray-800">{room.roomType?.name || "Standard"}</span>
 <span className="text-gray-400 ml-2">₹{room.appliedPrice || 0}/night</span>
 </div>
 </div>
 <span className="font-bold text-orange-600">₹{((room.appliedPrice || 0) * nights).toLocaleString()}</span>
 </div>
 ))}
 </div>
 </div>

 {/* All Guests */}
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FiUsers size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">Guests ({checkIn.guests?.length || 0})</span>
 </div>
 <div className="space-y-1">
 {checkIn.guests?.map((guest: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-[10px]">
 <div className="flex items-center gap-2">
 <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${guest.isPrimary ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
 {guest.name?.charAt(0) || "?"}
 </span>
 <span className="font-bold text-gray-800">{guest.name || "Guest"}</span>
 {guest.isPrimary && <span className="px-1 py-0.5 bg-orange-100 text-orange-600 rounded text-[8px] font-bold">Primary</span>}
 </div>
 <span className="text-gray-500">{guest.mobileNo || "No phone"}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Payment Summary */}
 <div className="bg-green-50 rounded-lg p-3 border border-green-100">
 <div className="flex items-center gap-2 mb-2">
 <FiCreditCard size={12} className="text-green-600" />
 <span className="text-[10px] font-black text-green-700 uppercase">Payment Summary</span>
 </div>
 <div className="grid grid-cols-3 gap-2">
 <div className="bg-white rounded p-2 text-center border border-green-100">
 <span className="text-[9px] text-gray-400 block">Total</span>
 <span className="text-base font-black text-gray-800">₹{checkIn.paymentSummary?.totalAmount?.toLocaleString() || 0}</span>
 </div>
 <div className="bg-white rounded p-2 text-center border border-green-100">
 <span className="text-[9px] text-gray-400 block">Paid</span>
 <span className="text-base font-black text-green-600">₹{checkIn.paymentSummary?.totalPaid?.toLocaleString() || 0}</span>
 </div>
 <div className="bg-white rounded p-2 text-center border border-green-100">
 <span className="text-[9px] text-gray-400 block">Due</span>
 <span className="text-base font-black text-red-500">₹{checkIn.paymentSummary?.dueAmount?.toLocaleString() || 0}</span>
 </div>
 </div>
 {checkIn.payments?.length > 0 && (
 <div className="mt-2 space-y-1">
 {checkIn.payments.map((payment: any, idx: number) => (
 <div key={idx} className="flex justify-between text-[10px] p-1 bg-white rounded border border-green-100">
 <span className="text-gray-500">{payment.paymentMode}: ₹{payment.amount?.toLocaleString()}</span>
 <span className="text-gray-400">{payment.paidAt ? format(new Date(payment.paidAt), "dd MMM") : ""}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Vehicle Details */}
 {checkIn.vehicleDetails?.length > 0 && checkIn.vehicleDetails.some((v: any) => v.vehicleNumber) && (
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FaCar size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">Vehicles</span>
 </div>
 <div className="space-y-1">
 {checkIn.vehicleDetails.filter((v: any) => v.vehicleNumber).map((vehicle: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-[10px]">
 <span className="font-bold text-gray-800">{vehicle.vehicleNumber}</span>
 <span className="text-gray-500">{vehicle.vehicleType}</span>
 <span className="text-gray-400">{vehicle.driverName}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* GRC Details */}
 {checkIn.grcDetails?.length > 0 && (
 <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
 <div className="flex items-center gap-2 mb-2">
 <FiFileText size={12} className="text-purple-600" />
 <span className="text-[10px] font-black text-purple-700 uppercase">GRC Details</span>
 </div>
 <div className="space-y-1">
 {checkIn.grcDetails.map((grc: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-purple-100 text-[10px]">
 <div className="flex items-center gap-2">
 <span className="font-bold text-gray-800">{grc.grcNumber}</span>
 <span className="px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-bold">{grc.grcType}</span>
 </div>
 <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${grc.isSigned ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
 {grc.isSigned ? "Signed" : "Pending"}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Corporate Details */}
 {checkIn.checkInType === "Corporate" && checkIn.corporateCheckInDetails && (
 <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
 <div className="flex items-center gap-2 mb-2">
 <BiBuilding size={12} className="text-blue-600" />
 <span className="text-[10px] font-black text-blue-700 uppercase">Corporate Details</span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[10px]">
 <div className="flex justify-between">
 <span className="text-gray-400">Company</span>
 <span className="font-bold text-gray-800">{checkIn.corporateCheckInDetails.companyName || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">GST</span>
 <span className="font-bold text-gray-800">{checkIn.corporateCheckInDetails.companyGST || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Contact</span>
 <span className="font-bold text-gray-800">{checkIn.corporateCheckInDetails.contactPersonName || "N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">Mobile</span>
 <span className="font-bold text-gray-800">{checkIn.corporateCheckInDetails.contactMobile || "N/A"}</span>
 </div>
 </div>
 </div>
 )}

 {/* ID Document */}
 {primaryGuest?.idDocument?.secure_url && (
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <FiShield size={12} className="text-gray-400" />
 <span className="text-[10px] font-black text-gray-500 uppercase">ID Document</span>
 </div>
 <a href={primaryGuest.idDocument.secure_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold">
 View Document
 </a>
 </div>
 )}

 {/* Special Requests */}
 {checkIn.specialRequests && (
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Special Requests</span>
 <p className="text-[10px] text-gray-600">{checkIn.specialRequests}</p>
 </div>
 )}

 {/* Notes */}
 {checkIn.notes && (
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
 <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Notes</span>
 <p className="text-[10px] text-gray-600">{checkIn.notes}</p>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-4 py-3 border-t bg-gray-50/50 rounded-b-xl flex justify-between items-center">
 <span className="text-[9px] text-gray-400 font-bold uppercase">Created: {checkIn.createdAt ? format(new Date(checkIn.createdAt), "dd MMM yy HH:mm") : ""}</span>
 <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-[10px] uppercase hover:bg-gray-200 transition-all">
 Close
 </button>
 </div>
 </div>
 </div>
 );
};

export default ViewCheckin;