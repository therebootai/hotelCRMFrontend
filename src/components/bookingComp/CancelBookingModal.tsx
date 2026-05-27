import { useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../lib/axios";

interface CancelBookingModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CancelBookingModal = ({
  booking,
  onClose,
  onSuccess,
}: CancelBookingModalProps) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  const paidAmount = booking.pricingSummary?.paidAmount || 0;
  const grandTotal = booking.pricingSummary?.grandTotal || 0;

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/bookings/${booking._id}/cancel`, {
        reason,
        refundAmount,
      });
      toast.success("Booking cancelled successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-modal overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-red-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FiAlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-700">Cancel Booking</h2>
              <p className="text-xs text-red-500 font-medium">
                {booking.bookingId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-all text-red-400 hover:text-red-600"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Guest Info Banner */}
        <div className="mx-6 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm font-bold text-gray-800">
            {booking.bookingContact?.name ||
              booking.customerId?.name ||
              "Guest"}
          </p>
          <p className="text-xs text-gray-500">
            {booking.bookingContact?.mobile || booking.customerId?.phone || ""}
          </p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs font-medium text-gray-600">
              Paid:{" "}
              <span className="font-bold text-green-600">
                ₹{paidAmount.toLocaleString()}
              </span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              Total:{" "}
              <span className="font-bold">₹{grandTotal.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Cancellation Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200 resize-none"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
            />
          </div>

          {paidAmount > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
                Refund Amount (₹)
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) =>
                  setRefundAmount(Math.min(Number(e.target.value), paidAmount))
                }
                max={paidAmount}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold bg-white outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
                placeholder={`Max refund: ₹${paidAmount.toLocaleString()}`}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Maximum refundable amount: ₹{paidAmount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mx-6 mb-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-700 font-medium">
            This action cannot be undone. The booking will be permanently
            cancelled.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
