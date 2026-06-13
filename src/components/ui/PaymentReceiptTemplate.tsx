import { useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";

export interface PaymentReceiptData {
  bookingId: string;
  bookingDate: string;
  bookingStatus: string;
  guest: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    noOfGuests: string;
    idProofType: string;
  };
  stay: {
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
    noOfNights: string;
    view: string;
    district: string;
  };
  services: {
    service: string;
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }[];
  payment: {
    roomCharges: number;
    roomChargesDesc: string;
    servicesTotal: number;
    taxAmount: number;
    grandTotal: number;
    advancePaid: number;
    balanceDue: number;
    paymentMode: string;
  };
}

export interface PaymentReceiptRef {
  exportToPDF: () => void;
}

interface Props {
  data: PaymentReceiptData | null;
}

const PaymentReceiptTemplate = forwardRef<PaymentReceiptRef, Props>(({ data }, ref) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Booking_Confirmation_${data?.bookingId || "Receipt"}`,
  });

  useImperativeHandle(ref, () => ({
    exportToPDF: () => {
      if (data) handlePrint();
    },
  }));

  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body { margin: 0; background: white; }
          .print-container { width: 100% !important; height: auto !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="hidden print:flex print:justify-center">
        <div
          ref={printRef}
          className="print-container w-[210mm] min-h-[297mm] bg-white text-black p-8 mx-auto relative font-sans text-xs"
        >
          {/* Header section */}
          <div className="flex justify-between items-center mb-2">
            <div className="w-24 h-24 border border-gray-300 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              LOGO
            </div>
            <div className="flex-1 text-center px-4">
              <h1 className="text-4xl font-bold text-[#0b1b3d] tracking-wider mb-2">SIDDHARAJ RESORT</h1>
              <div className="flex items-center justify-center text-gray-700 mb-1 gap-1">
                <span>📍</span>
                <span>Bataigol, Neora Majhiali, Mal Bazar, West Bengal - 735221</span>
              </div>
              <p className="text-[#a47e3c] font-semibold text-[10px] mb-1">A UNIT OF SIDDHARAJ ESTATE AND HOSPITALITY PRIVATE LIMITED</p>
              <p className="text-gray-600 text-[10px]">CIN - U45400WB2015PTC207217</p>
            </div>
            <div className="w-24 flex flex-col items-center">
              <div className="w-20 h-20 border border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 mb-1">QR</div>
              <span className="text-[8px] font-bold">SCAN FOR LOCATION</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-800 pb-2 border-b-2 border-[#a47e3c] mb-6 px-4">
            <div className="flex items-center gap-1">📞 +91 9147368813 / 9062558303</div>
            <div className="flex items-center gap-1">✉️ siddharajresortmalbazar@gmail.com</div>
            <div className="flex items-center gap-1">🌐 https://siddharajhotelandresort.com/</div>
          </div>

          <h2 className="text-2xl font-bold text-center text-[#0b1b3d] mb-6 tracking-wide">BOOKING CONFIRMATION</h2>

          {/* Top Bar */}
          <div className="border border-gray-300 rounded-lg p-3 flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Booking ID</p>
              <p className="font-bold text-sm">{data.bookingId}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Booking Date</p>
              <p className="font-bold text-sm">{data.bookingDate}</p>
            </div>
            <div className="text-right flex items-center gap-4">
              <p className="text-[10px] text-gray-500 font-semibold">Booking Status</p>
              <div className="border border-green-500 text-green-600 px-3 py-1 rounded font-bold uppercase tracking-wider text-xs">
                {data.bookingStatus}
              </div>
            </div>
          </div>

          {/* Guest & Stay Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Guest Details */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-[#0b1b3d] text-white px-3 py-2 flex items-center gap-2 font-semibold">
                <span>👤</span> GUEST DETAILS
              </div>
              <div className="p-3 space-y-2">
                <div className="flex"><span className="w-28 text-gray-600">Guest Name</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.name}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">Mobile Number</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.mobile}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">Email ID</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.email}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">Address</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.address}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">No. of Guests</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.noOfGuests}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">ID Proof Type</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.guest.idProofType}</span></div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-[#0b1b3d] text-white px-3 py-2 flex items-center gap-2 font-semibold">
                <span>📅</span> STAY DETAILS
              </div>
              <div className="p-3 space-y-2">
                <div className="flex"><span className="w-28 text-gray-600">Room Type</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.roomType}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">Check-in Date</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.checkInDate}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">Check-out Date</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.checkOutDate}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">No. of Nights</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.noOfNights}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">View</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.view}</span></div>
                <div className="flex"><span className="w-28 text-gray-600">District</span><span className="w-4">:</span><span className="font-bold text-gray-900 flex-1">{data.stay.district}</span></div>
              </div>
            </div>
          </div>

          {/* Additional Services */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
            <div className="bg-[#0b1b3d] text-white px-3 py-2 flex items-center gap-2 font-semibold">
              <span>🛎️</span> ADDITIONAL SERVICES
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 text-[10px] text-gray-600 uppercase">
                  <th className="px-3 py-2 font-bold w-1/4">SERVICE</th>
                  <th className="px-3 py-2 font-bold w-1/3">DESCRIPTION</th>
                  <th className="px-3 py-2 font-bold text-center">QTY</th>
                  <th className="px-3 py-2 font-bold text-right">UNIT PRICE (₹)</th>
                  <th className="px-3 py-2 font-bold text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500 border-b border-gray-200">No additional services</td>
                  </tr>
                ) : (
                  data.services.map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-2">{s.service}</td>
                      <td className="px-3 py-2">{s.description}</td>
                      <td className="px-3 py-2 text-center">{s.qty}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(s.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(s.amount)}</td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-bold text-[10px] text-gray-600 uppercase border-t border-gray-300">TOTAL ADDITIONAL SERVICES</td>
                  <td className="px-3 py-2 text-right font-bold border-t border-gray-300">₹ {formatCurrency(data.payment.servicesTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
            <div className="bg-[#0b1b3d] text-white px-3 py-2 flex items-center gap-2 font-semibold">
              <span>💳</span> PAYMENT SUMMARY
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 text-[10px] text-gray-600 uppercase">
                  <th className="px-3 py-2 font-bold w-1/2">DESCRIPTION</th>
                  <th className="px-3 py-2 font-bold text-right">AMOUNT (₹)</th>
                  <th className="px-3 py-2 font-bold text-right">TAX (GST) (₹)</th>
                  <th className="px-3 py-2 font-bold text-right">TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2">{data.payment.roomChargesDesc}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.roomCharges)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.taxAmount)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.roomCharges + data.payment.taxAmount)}</td>
                </tr>
                {data.payment.servicesTotal > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2">Additional Services</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(data.payment.servicesTotal)}</td>
                    <td className="px-3 py-2 text-right">0.00</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(data.payment.servicesTotal)}</td>
                  </tr>
                )}
                <tr className="bg-[#fdf8f0] font-bold text-[11px]">
                  <td className="px-3 py-2 uppercase">GRAND TOTAL</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.roomCharges + data.payment.servicesTotal)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.taxAmount)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(data.payment.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Breakdown Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">₹</div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">ADVANCE PAID</p>
                <p className="font-bold text-sm">₹ {formatCurrency(data.payment.advancePaid)}</p>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl">💳</div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">BALANCE DUE</p>
                <p className="font-bold text-sm">₹ {formatCurrency(data.payment.balanceDue)}</p>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xl">🏧</div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">PAYMENT MODE</p>
                <p className="font-bold text-sm">{data.payment.paymentMode}</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
            <div className="bg-[#0b1b3d] text-white px-3 py-2 flex items-center gap-2 font-semibold">
              <span>📋</span> IMPORTANT NOTES
            </div>
            <div className="p-3 text-[10px] text-gray-700 leading-relaxed">
              <ul className="list-disc pl-4 space-y-1">
                <li>Rooms are subject to availability at the time of check-in.</li>
                <li>Amount once paid may not be refundable as per hotel policy.</li>
                <li>For any issue or dispute, please contact hotel management immediately.</li>
                <li>If you have any specific meal preferences, allergies, or pets, please inform the hotel in advance.</li>
                <li>Standard Check-in Time: 12:00 PM | Check-out Time: 11:00 AM</li>
                <li>Management reserves the right to change or modify booking without prior notice.</li>
                <li>Please carry a valid ID proof at the time of check-in.</li>
              </ul>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pb-4 pt-4 border-t border-gray-200">
            <p className="text-lg text-[#0b1b3d] font-serif italic font-medium">Thank you for choosing Siddharaj Resort.</p>
            <p className="text-lg text-[#0b1b3d] font-serif italic font-medium">We look forward to hosting you!</p>
          </div>

        </div>
      </div>
    </>
  );
});

PaymentReceiptTemplate.displayName = "PaymentReceiptTemplate";

export default PaymentReceiptTemplate;
