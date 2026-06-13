import { useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";

export interface PaymentReceiptData {
  receiptNo: string;
  date: string;
  receivedFrom: {
    name: string;
    phone: string;
    address?: string;
  };
  referenceNo: string; // Booking ID or Check-in ID
  paymentMode: string;
  amount: number;
  remarks: string;
  cashierName: string;
  hotelDetails?: {
    name: string;
    tagline: string;
    address: string;
    contact: string;
  };
}

export interface PaymentReceiptRef {
  exportToPDF: () => void;
}

interface Props {
  data: PaymentReceiptData;
}

const PaymentReceiptTemplate = forwardRef<PaymentReceiptRef, Props>(
  ({ data }, ref) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Receipt_${data?.receiptNo || "Payment"}`,
    });

    useImperativeHandle(ref, () => ({
      exportToPDF: () => {
        handlePrint();
      },
    }));

    const hotelName = data.hotelDetails?.name || "SIDDHARAJ RESORT";
    const hotelTagline = data.hotelDetails?.tagline || "Premium Hospitality Experience";
    const hotelAddress = data.hotelDetails?.address || "123 Resort Avenue, Beach Road, Puri, Odisha - 752001";
    const hotelContact = data.hotelDetails?.contact || "📞 +91 98765 43210 | 📧 info@siddhrajaresort.com";

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount || 0);
    };

    return (
      <>
        <style>{`
          @media print {
            @page {
              size: A5 portrait;
              margin: 10mm;
            }
            body { margin: 0; }
            .print-container { width: 100% !important; height: auto !important; }
          }
        `}</style>

        <div className="hidden print:flex print:justify-center">
          <div
            ref={printRef}
            className="print-container w-[148mm] min-h-[210mm] bg-white text-black p-6 mx-auto relative font-sans"
          >
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6 flex items-center">
              <div className="w-16 h-16 bg-gray-200 border border-gray-400 flex items-center justify-center mr-4 shrink-0">
                <span className="text-xs font-bold text-gray-500">LOGO</span>
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-black uppercase tracking-wider">{hotelName}</h1>
                <p className="text-xs text-gray-700 mt-1">{hotelTagline}</p>
                <p className="text-[10px] text-gray-600 mt-1">{hotelAddress}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{hotelContact}</p>
              </div>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold uppercase underline tracking-widest inline-block border-black">Payment Receipt</h2>
            </div>

            {/* Receipt Metadata */}
            <div className="flex justify-between items-start mb-6 text-sm">
              <div>
                <p className="mb-1"><span className="font-semibold w-24 inline-block">Receipt No:</span> {data.receiptNo}</p>
                <p><span className="font-semibold w-24 inline-block">Reference No:</span> {data.referenceNo}</p>
              </div>
              <div className="text-right">
                <p className="mb-1"><span className="font-semibold">Date:</span> {data.date}</p>
              </div>
            </div>

            {/* Content Details */}
            <div className="border border-gray-300 rounded-lg p-5 mb-8">
              <div className="space-y-4 text-sm">
                <div className="flex">
                  <span className="font-semibold w-40 shrink-0">Received with thanks from:</span>
                  <span className="font-bold border-b border-dashed border-gray-400 flex-1 pb-1">
                    {data.receivedFrom.name} {data.receivedFrom.phone ? `(${data.receivedFrom.phone})` : ""}
                  </span>
                </div>
                
                <div className="flex">
                  <span className="font-semibold w-40 shrink-0">A sum of Rupees:</span>
                  <span className="font-bold border-b border-dashed border-gray-400 flex-1 pb-1">
                    {formatCurrency(data.amount)}
                  </span>
                </div>

                <div className="flex">
                  <span className="font-semibold w-40 shrink-0">By Payment Mode:</span>
                  <span className="border-b border-dashed border-gray-400 flex-1 pb-1">
                    {data.paymentMode}
                  </span>
                </div>

                <div className="flex">
                  <span className="font-semibold w-40 shrink-0">Towards / Remarks:</span>
                  <span className="border-b border-dashed border-gray-400 flex-1 pb-1">
                    {data.remarks || "Advance Payment"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-16 flex justify-between items-end px-4">
              <div className="text-center">
                <div className="w-40 border-b border-black mb-2"></div>
                <p className="text-xs font-semibold uppercase">Guest Signature</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-black mb-2 flex justify-center pb-1">
                  <span className="text-xs italic text-gray-500">{data.cashierName}</span>
                </div>
                <p className="text-xs font-semibold uppercase">Authorized Signatory</p>
                <p className="text-[9px] text-gray-500 mt-0.5">({data.cashierName})</p>
              </div>
            </div>

            {/* Note */}
            <div className="absolute bottom-6 left-6 right-6 text-center border-t border-gray-300 pt-3">
              <p className="text-[9px] italic text-gray-500">
                This is a computer generated receipt. Valid subject to realization of cheque/draft/transfer.
                This advance will be adjusted against the final invoice.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
);

PaymentReceiptTemplate.displayName = "PaymentReceiptTemplate";

export default PaymentReceiptTemplate;
