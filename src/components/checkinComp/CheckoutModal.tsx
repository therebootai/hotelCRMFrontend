import React, { useState, useEffect } from "react";
import {
 FiX,
 FiFileText,
 FiSave,
 FiLogOut,
 FiAlertCircle,
 FiCreditCard,
 FiDollarSign,
 FiPhone,
 FiUser,
 FiCalendar,
} from "react-icons/fi";
import api from "../../lib/axios";

import { FaUtensils } from "react-icons/fa";
import { BiBuilding } from "react-icons/bi";
import useClickOutside from "../../hooks/useClickOutside";

const CheckoutModal = ({ checkIn, onClose, onSuccess }: { checkIn: any; onClose: () => void; onSuccess: () => void; }) => {
 const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  // Verification states
  const [verification, setVerification] = useState({
    guestVacated: false,
    keyReturned: false,
    roomChecked: false,
    noDamage: false,
    damageFound: false,
    damageAmount: "",
    damageRemarks: "",
    staffNotes: "",
    departmentsVerified: false
  });

  // Editable states
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [restaurantCharges, setRestaurantCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [taxOptions, setTaxOptions] = useState<any[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState("");
  const [taxPercentage, setTaxPercentage] = useState(12); // Default to 12% if none chosen

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState<string | number>("");
  const [paymentNote, setPaymentNote] = useState("");

  const isDayAccess = checkIn.bookingCategory === "Day Access";

  const modalRef = useClickOutside<HTMLDivElement>(
    () => {
      if (!submitting) onClose();
    },
    true,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [billRes, taxRes] = await Promise.all([
          api.get(`/billing/preview/${checkIn._id}`),
          api.get(`/tax-gst`, { params: { activeOnly: "true" } }),
        ]);
 if (billRes.data.success) {
 const d = billRes.data.data;

 setBillData(d);
 setBillData(d);

 setExtraServices(d.extraServices || []);
 setRestaurantCharges(d.restaurantCharges || 0);
 setDiscount(d.discount || 0);
 setNotes(d.notes || "");
 const storedPct = d.taxPercentage ?? 12;
 setTaxPercentage(storedPct);
 setTaxOptions(taxRes.data.data || []);

 // Restore the booking's tax GST record for display
 if (d.taxGstId) {
 const match = (taxRes.data.data || []).find((t: any) => t._id === d.taxGstId);
 setSelectedTaxId(match ? match._id : "");
 } else {
 const match = (taxRes.data.data || []).find((t: any) => t.percentage === storedPct);
 setSelectedTaxId(match ? match._id : "");
 }

 const lastPayment =
 d.payments?.length > 0 ? d.payments[d.payments.length - 1] : null;

 setPaymentMethod(lastPayment?.method || "Cash");
 setPaymentNote(lastPayment?.note || "");

 setReceivedAmount("");

        setBillData({
          ...d,
          paidAmount: d.paidAmount || 0,
          dueAmount: d.dueAmount || 0,
          payments: d.payments || [],
          advancePaymentsHistory: d.advancePaymentsHistory || [],
        });
      }
    } catch (err) {
      console.error(err);
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, [checkIn._id]);

 // ─── Calculations ────────────────────────────────────────────────
 // Derive roomTotal from breakdown array (API doesn't always send totalRoomCharges)
 const roomTotal =
 billData?.roomChargesBreakdown?.reduce(
 (acc: number, r: any) => acc + (Number(r.totalRoomCharge) || 0),
 0,
 ) ??
 billData?.totalRoomCharges ??
 0;

 const servicesTotal = extraServices.reduce(
 (acc, s) => acc + (Number(s.total) || 0),
 0,
 );

 // 👉 Round subtotal immediately
 const subTotal = Math.round(
 roomTotal + servicesTotal + Number(restaurantCharges),
 );

 // 👉 Round tax (no decimals)
 const taxAmount = Math.round((subTotal * taxPercentage) / 100);

 // 👉 Round grand total
 const grandTotal = Math.round(subTotal + taxAmount - Number(discount));

 const advancePaid = Math.round(billData?.advanceDeducted || 0);

 const existingPaid = Math.round(billData?.paidAmount || 0);

 const alreadyPaid = advancePaid + existingPaid;

 const numReceived = Math.round(Number(receivedAmount) || 0);

 // total payable after previous payments
 const netPayable = Math.max(0, Math.round(grandTotal - alreadyPaid));

 // after current input payment
 const dueAfterPayment = Math.max(0, Math.round(netPayable - numReceived));

 const isFullyPaid = numReceived >= netPayable && netPayable > 0;
 const isZeroBalance = netPayable === 0;

 const canCheckout = isFullyPaid || isZeroBalance;


 const handleAction = async (isCheckout: boolean) => {
 if (isCheckout && !canCheckout) return;
 try {
 setSubmitting(true);
 const payload = {
 checkInId: checkIn._id,
 extraServices,
 restaurantCharges: Number(restaurantCharges),
 facilityCharges: [],
 discount: Number(discount),
 taxPercentage: Number(taxPercentage),
 notes,
 isCheckout,
 payment:
 numReceived > 0
 ? {
 amount: numReceived,
 method: paymentMethod,
 note:
 paymentNote ||
 (isCheckout ? "Checkout settlement" : "Partial payment"),
 }
 : undefined,
 checkoutVerification: isCheckout ? {
   guestVacated: verification.guestVacated,
   keyReturned: verification.keyReturned,
   roomChecked: verification.roomChecked,
   noDamage: verification.noDamage,
   damageFound: verification.damageFound,
   damageAmount: Number(verification.damageAmount) || 0,
   damageRemarks: verification.damageRemarks,
   staffNotes: verification.staffNotes,
 } : undefined,
 };
 const res = await api.post("/billing/process-checkout", payload);
 if (res.data.success) {
 alert(isCheckout ? "✅ Checkout complete!" : "💾 Draft saved!");
 onSuccess();
 onClose();
 }
 } catch (err) {
 alert("Error processing request. Please try again.");
 } finally {
  setSubmitting(false);
  }
  };

  const handleContinueToSettlement = () => {
    if (verification.damageFound && verification.damageAmount && Number(verification.damageAmount) > 0) {
      const existingDamage = extraServices.find(es => es.serviceName === "Damage Charges");
      if (!existingDamage) {
        setExtraServices([
          ...extraServices,
          { serviceName: "Damage Charges", quantity: 1, rate: Number(verification.damageAmount), total: Number(verification.damageAmount) }
        ]);
      } else {
        setExtraServices(extraServices.map(es => es.serviceName === "Damage Charges" ? { ...es, rate: Number(verification.damageAmount), total: Number(verification.damageAmount) } : es));
      }
    } else {
      setExtraServices(extraServices.filter(es => es.serviceName !== "Damage Charges"));
    }
    setStep(2);
  };

  const paymentMethods = [
 { value: "Cash", label: "Cash", icon: FiDollarSign },
 { value: "UPI", label: "UPI", icon: FiPhone },
 { value: "Card", label: "Card", icon: FiCreditCard },
 { value: "Bank Transfer", label: "Bank Transfer", icon: BiBuilding },
 ];

 if (loading && !billData) {
 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
 <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
 <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
 <p className="font-bold text-gray-500 text-base uppercase tracking-widest">
 Loading Bill Data...
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
 <div
 ref={modalRef}
 className="bg-[#f8f8f6] w-full max-w-6xl rounded-[2rem] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border border-gray-200"
 >
 {/* ── HEADER ── */}
 <div className="px-8 py-4 border-b border-gray-200 bg-white flex justify-between items-center rounded-t-[2rem]">
 <div className="flex items-center gap-4">
 <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">
   <FiX size={20} />
 </button>
 <div>
 <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
 {step === 1 ? "CHECKOUT VERIFICATION" : "CHECKOUT SETTLEMENT"}
 </h2>
 <p className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-widest">
 Step {step} of 2 - {step === 1 ? "Room Clearance & Verification" : "Financial Settlement & Checkout"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
   <div className={`flex items-center gap-2 ${step === 1 ? "text-orange-500" : "text-green-500"}`}>
     <span className={`w-5 h-5 flex items-center justify-center rounded-full text-white ${step === 1 ? "bg-orange-500" : "bg-green-500"}`}>
       {step === 1 ? "1" : "✓"}
     </span>
     Verification
   </div>
   <div className="w-8 h-px bg-gray-200"></div>
   <div className={`flex items-center gap-2 ${step === 2 ? "text-orange-500" : "text-gray-400"}`}>
     <span className={`w-5 h-5 flex items-center justify-center rounded-full ${step === 2 ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
       2
     </span>
     Settlement & Payment
   </div>
 </div>
 </div>

 {/* ── GUEST SUMMARY (Always Visible) ── */}
 <div className="px-8 py-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
   <div className="flex items-center gap-3">
     <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
       <FiUser size={18} />
     </div>
     <div>
       <span className="text-[9px] font-black text-gray-400 uppercase block">Guest Name</span>
       <span className="text-sm font-bold text-gray-800">{checkIn.checkInType === "Corporate" ? checkIn.corporateCheckInDetails?.companyName : checkIn.guests[0]?.name}</span>
       <span className="text-[10px] text-gray-500 block font-bold">{checkIn.checkInType === "Corporate" ? checkIn.corporateCheckInDetails?.contactMobile : checkIn.guests[0]?.mobileNo}</span>
     </div>
   </div>
   <div className="flex items-center gap-3">
     <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
       <FiFileText size={18} />
     </div>
     <div>
       <span className="text-[9px] font-black text-gray-400 uppercase block">Check-in ID</span>
       <span className="text-sm font-bold text-gray-800">{checkIn.checkInId}</span>
       <span className="text-[10px] text-gray-500 uppercase block font-bold">{checkIn.checkInType}</span>
     </div>
   </div>
   <div className="flex items-center gap-3">
     <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
       <BiBuilding size={18} />
     </div>
     <div>
       <span className="text-[9px] font-black text-gray-400 uppercase block">Rooms</span>
       <span className="text-sm font-bold text-gray-800">{checkIn.roomDetails?.map((r: any) => r.roomNumber).join(", ") || (isDayAccess ? "DA-01" : "N/A")}</span>
       <span className="text-[10px] text-gray-500 block font-bold">{checkIn.roomDetails?.map((r: any) => r.roomType?.name).join(", ") || (isDayAccess ? "Day Access" : "Room")}</span>
     </div>
   </div>
   <div className="flex items-center gap-3">
     <div className="p-2 bg-green-50 text-green-500 rounded-lg">
       <FiCalendar size={18} />
     </div>
     <div>
       <span className="text-[9px] font-black text-gray-400 uppercase block">Stay Duration</span>
       <span className="text-sm font-bold text-gray-800">{isDayAccess ? "Day Access" : `${Math.max(1, Math.ceil(Math.abs(new Date(checkIn.expectedCheckOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60 * 24)))} Nights`}</span>
       <span className="text-[10px] text-gray-500 block font-bold">{new Date(checkIn.checkInTime).toLocaleDateString()} - {new Date(checkIn.expectedCheckOutTime).toLocaleDateString()}</span>
     </div>
   </div>
 </div>

 {/* ── BODY ── */}
 <div className="flex-1 overflow-y-auto">
 {step === 1 ? (
   <>
   <div className="p-6 flex flex-col xl:flex-row gap-6">
     {/* STEP 1 - LEFT COLUMN */}
     <div className="flex-1 space-y-6">
       <Section title="Room Occupancy Summary" accent="blue">
         <table className="w-full text-sm text-left">
           <thead>
             <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <th className="pb-3">Room No.</th>
               <th className="pb-3">Room Type</th>
               <th className="pb-3">Occupants</th>
               <th className="pb-3">Room Status</th>
             </tr>
           </thead>
           <tbody>
             {checkIn.roomDetails?.map((r: any, idx: number) => (
               <tr key={idx} className="border-b border-gray-50">
                 <td className="py-3 font-bold text-gray-800">{r.roomNumber}</td>
                 <td className="py-3 text-gray-600">{r.roomType?.name}</td>
                 <td className="py-3 text-gray-600 font-semibold">{checkIn.checkInType === "Corporate" ? checkIn.corporateCheckInDetails?.companyName : checkIn.guests[0]?.name}</td>
                 <td className="py-3">
                   <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full">Occupied</span>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </Section>

       <Section title="Verification Checklist" accent="purple">
         <div className="space-y-4">
           <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Room Verification</p>
           {[
             { id: "guestVacated", label: "Guest Vacated Room" },
             { id: "keyReturned", label: "Room Key Returned" },
             { id: "roomChecked", label: "Room Physically Checked by Staff" },
             { id: "noDamage", label: "No Major Damage Found" },
           ].map(item => (
             <label key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-200">
               <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${verification[item.id as keyof typeof verification] ? "bg-purple-500 border-purple-500 text-white" : "border-gray-300 bg-white"}`}>
                 {verification[item.id as keyof typeof verification] && <span className="text-xs">✓</span>}
               </div>
               <input type="checkbox" className="hidden" checked={!!verification[item.id as keyof typeof verification]} onChange={(e) => setVerification({ ...verification, [item.id]: e.target.checked })} />
               <span className="font-bold text-gray-700 text-sm">{item.label}</span>
               {verification[item.id as keyof typeof verification] && <span className="ml-auto text-green-500 font-bold text-sm">✓</span>}
             </label>
           ))}
           <div className="mt-4 pt-4 border-t border-gray-100">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Staff Notes / Remarks (Optional)</label>
             <textarea
               className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-purple-500 text-sm font-semibold transition-colors"
               rows={3}
               placeholder="Enter any additional notes or remarks..."
               value={verification.staffNotes}
               onChange={(e) => setVerification({ ...verification, staffNotes: e.target.value })}
             />
           </div>
         </div>
       </Section>
     </div>

     {/* STEP 1 - RIGHT COLUMN */}
     <div className="w-full xl:w-[400px] flex flex-col gap-6">
        <Section title="Department Clearance" accent="blue">
          <div className="space-y-4">
            {restaurantCharges > 0 && (
              <div className="flex items-start justify-between border-b border-gray-50 pb-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 text-orange-500">
                    <FaUtensils size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Restaurant Bills</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Food & Beverages</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-gray-800">₹{restaurantCharges}</span>
                </div>
              </div>
            )}
            {extraServices.map((es, idx) => (
              <div key={idx} className="flex items-start justify-between border-b border-gray-50 pb-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-500">
                    <FiFileText size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{es.serviceName || "Extra Service"}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Qty: {es.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-gray-800">₹{es.total}</span>
                </div>
              </div>
            ))}
            {restaurantCharges === 0 && extraServices.length === 0 && (
              <p className="text-sm text-gray-500 font-semibold italic text-center py-4">No additional department charges.</p>
            )}
            
            <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors mt-4">
               <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${verification.departmentsVerified ? "bg-blue-500 border-blue-500 text-white" : "border-blue-300 bg-white"}`}>
                 {verification.departmentsVerified && <span className="text-xs">✓</span>}
               </div>
               <input type="checkbox" className="hidden" checked={!!verification.departmentsVerified} onChange={(e) => setVerification({ ...verification, departmentsVerified: e.target.checked })} />
               <span className="font-bold text-blue-800 text-sm">All department charges are verified</span>
            </label>
          </div>
        </Section>

       <Section title="Damage / Remarks (Optional)" accent="red">
         <div className="space-y-4">
           <div className="flex items-center gap-6">
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Damage Found?</label>
               <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="radio" name="damageFound" checked={!verification.damageFound} onChange={() => setVerification({ ...verification, damageFound: false })} className="accent-red-500" />
                   <span className="text-sm font-bold text-gray-700">No</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="radio" name="damageFound" checked={verification.damageFound} onChange={() => setVerification({ ...verification, damageFound: true })} className="accent-red-500" />
                   <span className="text-sm font-bold text-gray-700">Yes</span>
                 </label>
               </div>
             </div>
             {verification.damageFound && (
               <div className="flex-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Damage Amount (₹)</label>
                 <input type="number" value={verification.damageAmount} onChange={(e) => setVerification({ ...verification, damageAmount: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 outline-none focus:border-red-500 text-sm font-semibold" placeholder="0.00" />
               </div>
             )}
           </div>
           {verification.damageFound && (
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Damage Remarks</label>
               <textarea value={verification.damageRemarks} onChange={(e) => setVerification({ ...verification, damageRemarks: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-red-500 text-sm font-semibold" rows={3} placeholder="Enter damage details if any..."></textarea>
             </div>
           )}
         </div>
       </Section>
     </div>
   </div>
   <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-4 rounded-b-[2rem]">
     <button onClick={onClose} className="px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
      <button
        onClick={handleContinueToSettlement}
        disabled={!(verification.guestVacated && verification.keyReturned && verification.roomChecked && verification.noDamage && verification.departmentsVerified)}
        className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${verification.guestVacated && verification.keyReturned && verification.roomChecked && verification.noDamage && verification.departmentsVerified ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
      >
        Continue to Settlement <span>→</span>
      </button>
   </div>
   </>
 ) : (
 <div className="p-6 flex flex-col xl:flex-row gap-6">
 {/* ══ LEFT COLUMN ══ */}
 <div className="flex-1 space-y-5">
 {/* ── Package Charges (Day Access only) ── */}
 {isDayAccess && (
 <Section title="Package Charges" accent="amber">
 <table className="w-full text-base">
 <thead>
 <tr className="border-b border-gray-100">
 <th className="text-left pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">Package</th>
 <th className="text-center pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">Entry</th>
 <th className="text-center pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">Exit</th>
 <th className="text-right pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">Total</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-gray-50">
 <td className="py-3 font-bold text-gray-800">
 {checkIn.packageDetails?.packageName || "Day Access Package"}
 </td>
 <td className="py-3 text-center text-gray-600 text-sm">
 {checkIn.packageDetails?.entryTime
 ? new Date(checkIn.packageDetails.entryTime).toLocaleTimeString("en-IN", {
 hour: "2-digit",
 minute: "2-digit",
 })
 : "—"}
 </td>
 <td className="py-3 text-center text-gray-600 text-sm">
 {checkIn.packageDetails?.exitTime
 ? new Date(checkIn.packageDetails.exitTime).toLocaleTimeString("en-IN", {
 hour: "2-digit",
 minute: "2-digit",
 })
 : "—"}
 </td>
 <td className="py-3 text-right font-black text-amber-600">
 ₹{Number(roomTotal).toLocaleString()}
 </td>
 </tr>
 </tbody>
 </table>
 </Section>
 )}

 {/* 1. Room Stay Breakdown */}
 <Section title="Room Stay Charges" accent="orange">
 <table className="w-full text-base">
 <thead>
 <tr className="border-b border-gray-100">
 <th className="text-left pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Room
 </th>
 <th className="text-center pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Check-In
 </th>
 <th className="text-center pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Check-Out
 </th>
 <th className="text-center pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Nights
 </th>
 <th className="text-right pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Rate/Night
 </th>
 <th className="text-right pb-3 text-sm font-black text-gray-400 uppercase tracking-wider">
 Total
 </th>
 </tr>
 </thead>
 <tbody>
 {!isDayAccess && billData?.roomChargesBreakdown?.length > 0 ? (
 billData.roomChargesBreakdown.map(
 (room: any, i: number) => (
 <tr
 key={i}
 className="border-b border-gray-50 last:border-0"
 >
 <td className="py-3 font-bold text-gray-800">
 Room {room.roomNumber}
 <span className="ml-2 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
 {room.roomType}
 </span>
 </td>
 <td className="py-3 text-center text-gray-600 text-sm">
 {room.checkInDate
 ? new Date(room.checkInDate).toLocaleDateString(
 "en-IN",
 )
 : "—"}
 </td>
 <td className="py-3 text-center text-gray-600 text-sm">
 {room.checkOutDate
 ? new Date(
 room.checkOutDate,
 ).toLocaleDateString("en-IN")
 : "—"}
 </td>
 <td className="py-3 text-center font-bold text-gray-700">
 {room.nights}
 </td>
 <td className="py-3 text-right text-gray-700 font-semibold">
 ₹{Number(room.ratePerNight).toLocaleString()}
 </td>
 <td className="py-3 text-right font-black text-orange-600">
 ₹{Number(room.totalRoomCharge).toLocaleString()}
 </td>
 </tr>
 ),
 )
 ) : (
 <tr>
 <td
 colSpan={6}
 className="py-6 text-center text-gray-400 text-sm"
 >
 {isDayAccess
 ? "No room charges — this is a Day Access booking."
 : "No room charges found"}
 </td>
 </tr>
 )}
 </tbody>
 <tfoot>
 <tr className="border-t-2 border-orange-100">
 <td
 colSpan={5}
 className="pt-3 text-sm font-black text-gray-500 uppercase"
 >
 Total Room Charges
 </td>
 <td className="pt-3 text-right font-black text-orange-600 text-base">
 ₹{Number(roomTotal).toLocaleString()}
 </td>
 </tr>
 </tfoot>
 </table>
 </Section>

 {/* 2. Restaurant Charges */}
 <Section title="Restaurant / Food Charges" accent="blue">
 <div className="flex items-center gap-4">
 <FaUtensils
 size={16}
 className="text-blue-400 flex-shrink-0"
 />
 <span className="flex-1 text-sm font-bold text-gray-800">
 Total Restaurant Bill
 </span>
 <span className="text-base font-black text-blue-600 w-28 text-right">
 ₹{Number(restaurantCharges).toLocaleString()}
 </span>
 </div>
 </Section>

 {/* 3. Extra Services */}
 <Section title="Extra Services" accent="purple">
 <div className="space-y-3">
 {extraServices.length === 0 && (
 <p className="text-center text-sm text-gray-400 py-4">
 No extra services added.
 </p>
 )}
 {extraServices.map((s, i) => (
 <div
 key={i}
 className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
 >
 <div>
 <p className="font-bold text-gray-800 text-sm">
 {s.serviceName || "Extra Service"}
 </p>
 <p className="text-[10px] text-gray-500 mt-0.5">
 Qty: {s.quantity} @ ₹{s.rate}
 </p>
 </div>
 <div className="text-right font-black text-purple-600 text-sm">
 ₹{Number(s.total).toLocaleString()}
 </div>
 </div>
 ))}
 {extraServices.length > 0 && (
 <div className="flex justify-between px-2 pt-2 border-t border-gray-100">
 <span className="text-sm font-black text-gray-500 uppercase">
 Extra Services Total
 </span>
 <span className="text-base font-black text-purple-600">
 ₹{servicesTotal.toLocaleString()}
 </span>
 </div>
 )}
 </div>
 </Section>

 {/* 4. Advance Payments History */}
 <Section title="Advance Payment History" accent="green">
 {billData?.advancePaymentsHistory?.length > 0 ? (
 <table className="w-full text-base">
 <thead>
 <tr className="border-b border-gray-100">
 <th className="text-left pb-2 text-sm font-black text-gray-400 uppercase tracking-wider">
 #
 </th>
 <th className="text-left pb-2 text-sm font-black text-gray-400 uppercase tracking-wider">
 Date
 </th>
 <th className="text-left pb-2 text-sm font-black text-gray-400 uppercase tracking-wider">
 Method
 </th>
 <th className="text-left pb-2 text-sm font-black text-gray-400 uppercase tracking-wider">
 Note
 </th>
 <th className="text-right pb-2 text-sm font-black text-gray-400 uppercase tracking-wider">
 Amount
 </th>
 </tr>
 </thead>
 <tbody>
 {billData.advancePaymentsHistory.map(
 (p: any, i: number) => (
 <tr
 key={i}
 className="border-b border-gray-50 last:border-0"
 >
 <td className="py-2.5 text-sm text-gray-400">
 {i + 1}
 </td>
 <td className="py-2.5 text-sm text-gray-600">
 {new Date(p.paidAt).toLocaleDateString("en-IN")}
 </td>
 <td className="py-2.5 text-sm">
 <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
 {p.paymentMode || p.method || "Cash"}
 </span>
 </td>
 <td className="py-2.5 text-sm text-gray-500">
 {p.note || "—"}
 </td>
 <td className="py-2.5 text-right font-black text-green-600">
 ₹{Number(p.amount).toLocaleString()}
 </td>
 </tr>
 ),
 )}
 </tbody>
 <tfoot>
 <tr className="border-t-2 border-green-100">
 <td
 colSpan={4}
 className="pt-2.5 text-sm font-black text-green-600 uppercase"
 >
 Total Advance Paid
 </td>
 <td className="pt-2.5 text-right font-black text-green-600 text-base">
 ₹{Number(advancePaid).toLocaleString()}
 </td>
 </tr>
 </tfoot>
 </table>
 ) : (
 <p className="text-center text-sm text-gray-400 py-4">
 No advance payments recorded.
 </p>
 )}
 </Section>

 {/* 5. Notes */}
 <Section title="Notes / Remarks" accent="gray">
 <textarea
 rows={2}
 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 outline-none focus:border-gray-400 resize-none"
 placeholder="Any remarks or notes for this bill…"
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 />
 </Section>
 </div>

 {/* ══ RIGHT COLUMN — Bill Summary & Settlement ══ */}
 <div className="w-full xl:w-[380px] flex-shrink-0">
 <div className="sticky top-0 space-y-4">
 {/* Bill Summary Card */}
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-6 py-4 bg-gray-900 text-white">
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
 Bill Summary
 </p>
 <p className="text-sm text-gray-300 font-medium">
 {checkIn.guests?.[0]?.name} · Room{" "}
 {checkIn.roomDetails?.[0]?.roomNumber}
 </p>
 </div>

 <div className="p-6 space-y-3">
 <LineItem label="Room Stay" value={roomTotal} />
 <LineItem
 label="Restaurant / Food"
 value={Number(restaurantCharges)}
 />
 <LineItem label="Extra Services" value={servicesTotal} />

 <div className="border-t border-dashed border-gray-200 pt-3 space-y-3">
 <LineItem label={`Subtotal`} value={subTotal} bold />
 <LineItem
 label={`Tax (${taxPercentage}%)`}
 value={taxAmount}
 color="text-gray-500"
 />

 {/* Discount input inline */}
 <div className="flex items-center justify-between">
 <span className="text-sm font-black text-red-500 uppercase">
 Discount (₹)
 </span>
 <input
 type="number"
 min={0}
 className="w-28 p-2 bg-red-50 border border-red-100 rounded-lg text-right text-sm font-black text-red-600 outline-none focus:border-red-300"
 value={discount}
 onChange={(e) => setDiscount(Number(e.target.value))}
 />
 </div>
 </div>

 {/* Grand Total */}
 <div className="bg-orange-500 rounded-xl px-5 py-4 flex justify-between items-center">
 <span className="text-sm font-black text-orange-100 uppercase tracking-wider">
 Grand Total
 </span>
 <span className="text-2xl font-black text-white">
 ₹{grandTotal.toLocaleString()}
 </span>
 </div>

 {/* Advance deducted */}
 <div className="bg-green-50 rounded-xl px-5 py-3 flex justify-between items-center border border-green-100">
 <span className="text-sm font-black text-green-700 uppercase">
 Already Paid
 </span>
 <span className="text-base font-black text-green-600">
 − ₹{Number(alreadyPaid).toLocaleString()}
 </span>
 </div>

 {/* Net Payable */}
 <div
 className={`rounded-xl px-5 py-4 flex justify-between items-center border-2 ${netPayable === 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
 >
 <span className="text-sm font-black uppercase text-gray-700 tracking-wider">
 Net Payable Now
 </span>
 <span
 className={`text-2xl font-black ${netPayable === 0 ? "text-blue-600" : "text-red-600"}`}
 >
 ₹{netPayable.toLocaleString()}
 </span>
 </div>
 </div>
 </div>

 {/* Payment Settlement Card */}
 {netPayable > 0 && (
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
 Payment Settlement
 </p>

 {/* Payment Method */}
 <div className="grid grid-cols-2 gap-2">
 {paymentMethods.map(({ value, label, icon: Icon }) => (
 <button
 key={value}
 onClick={() => setPaymentMethod(value)}
 className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
 paymentMethod === value
 ? "bg-gray-900 text-white border-gray-900"
 : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
 }`}
 >
 <Icon size={13} />
 {label}
 </button>
 ))}
 </div>

 {/* Amount Paying Now */}
 <div>
 <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">
 Amount Paying Now
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-base">
 ₹
 </span>
 <input
 type="text"
 inputMode="numeric"
 min={0}
 className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-black text-gray-900 outline-none focus:border-orange-400 transition-colors"
 placeholder={`0 – ${netPayable.toLocaleString()}`}
 value={receivedAmount}
 onChange={(e) => {
 const value = e.target.value;

 if (/^\d*$/.test(value)) {
 setReceivedAmount(
 value === "" ? "" : Number(value),
 );
 }
 }}
 />
 </div>
 </div>

 {/* Payment note */}
 <div>
 <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">
 Payment Note (optional)
 </label>
 <input
 type="text"
 className="w-full p-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-gray-400"
 placeholder="e.g. partial payment, card swipe..."
 value={paymentNote}
 onChange={(e) => setPaymentNote(e.target.value)}
 />
 </div>

 {/* Paid / Due Summary */}
 <div className="rounded-xl overflow-hidden border border-gray-200">
 <div className="grid grid-cols-2 divide-x divide-gray-200">
 <div
 className={`p-4 text-center ${numReceived > 0 ? "bg-green-50" : "bg-gray-50"}`}
 >
 <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
 Paying Now
 </p>
 <p
 className={`text-xl font-black ${numReceived > 0 ? "text-green-600" : "text-gray-400"}`}
 >
 ₹{numReceived.toLocaleString()}
 </p>
 </div>
 <div
 className={`p-4 text-center ${dueAfterPayment > 0 ? "bg-red-50" : "bg-green-50"}`}
 >
 <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
 {dueAfterPayment > 0 ? "Still Due" : "Balance"}
 </p>
 <p
 className={`text-xl font-black ${dueAfterPayment > 0 ? "text-red-600" : "text-green-600"}`}
 >
 ₹{dueAfterPayment.toLocaleString()}
 </p>
 </div>
 </div>
 {numReceived > 0 && (
 <div
 className={`px-4 py-2 text-center text-[10px] font-black uppercase tracking-wide ${isFullyPaid ? "bg-green-500 text-white" : "bg-amber-400 text-white"}`}
 >
 {isFullyPaid
 ? "✓ Full Payment — Ready to Checkout"
 : `⏳ Partial Payment — ₹${dueAfterPayment.toLocaleString()} still pending`}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Checkout status indicator */}
 {!canCheckout && netPayable > 0 && (
 <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
 <FiAlertCircle
 size={14}
 className="text-amber-500 mt-0.5 flex-shrink-0"
 />
 <p className="text-sm text-amber-700 font-semibold">
 Full payment required for checkout. Save as draft if
 partial payment is collected.
 </p>
 </div>
 )}

 {/* Action Buttons */}
 <div className="space-y-2.5">
 <div className="flex gap-4">
   <button
     onClick={() => setStep(1)}
     className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all whitespace-nowrap"
   >
     ← Back
   </button>
   <button
 onClick={() => handleAction(true)}
 disabled={submitting || !canCheckout}
 className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
 canCheckout
 ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100 active:scale-95"
 : "bg-gray-100 text-gray-400 cursor-not-allowed"
 }`}
 >
 {submitting ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <FiLogOut size={15} />
 )}
 {isZeroBalance
 ? "Confirm Checkout (No Balance)"
 : "Confirm Checkout (Full Payment)"}
 </button>
 </div>


 <div className="flex gap-4">
   <button
     onClick={onClose}
     disabled={submitting}
     className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-400 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 transition-all flex items-center justify-center gap-2"
   >
     <FiX size={14} />
     Cancel
   </button>
   <button
   onClick={() => handleAction(false)}
   disabled={submitting}
   className="flex-1 py-3.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
   >
   <FiSave size={14} />
   Save as Draft{" "}
   {numReceived > 0 &&
   `(₹${numReceived.toLocaleString()} collected)`}
   </button>
 </div>
 </div>

 {/* Tax GST selector */}
 <div className="flex items-center justify-between px-2">
 <span className="text-sm text-gray-400 font-bold">Tax GST</span>
 <select
 className="text-sm font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none text-gray-600 bg-white max-w-[140px]"
 value={selectedTaxId}
 onChange={(e) => {
 const selected = taxOptions.find((t: any) => t._id === e.target.value);
 setSelectedTaxId(e.target.value);
 if (selected) {
 setTaxPercentage(selected.percentage);
 }
 }}
 >
 <option value="">— Select —</option>
 {taxOptions.map((t: any) => (
 <option key={t._id} value={t._id}>
 {t.name} ({t.percentage}%)
 </option>
 ))}
 </select>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

// ─── Helper Components ────────────────────────────────────────────
const Section = ({
 title,
 accent,
 children,
}: {
 title: string;
 accent: string;
 children: React.ReactNode;
}) => {
 const colors: Record<string, string> = {
 orange: "text-orange-500",
 blue: "text-blue-500",
 purple: "text-purple-500",
 green: "text-green-600",
 gray: "text-gray-500",
 };
 return (
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
 <h3
 className={`text-[10px] font-black uppercase tracking-[0.18em] mb-4 ${colors[accent] || "text-gray-500"}`}
 >
 {title}
 </h3>
 {children}
 </div>
 );
};

const LineItem = ({
 label,
 value,
 bold,
 color,
}: {
 label: string;
 value: number;
 bold?: boolean;
 color?: string;
}) => (
 <div className="flex justify-between items-center">
 <span
 className={`text-sm ${bold ? "font-black text-gray-800" : "text-gray-500 font-semibold"}`}
 >
 {label}
 </span>
 <span
 className={`text-base ${bold ? "font-black text-gray-900" : color || "text-gray-700 font-semibold"}`}
 >
 ₹{value.toLocaleString()}
 </span>
 </div>
);

export default CheckoutModal;
