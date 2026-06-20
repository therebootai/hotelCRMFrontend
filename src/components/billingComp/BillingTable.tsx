import React from "react";
import { FiUser, FiPhone, FiEye } from "react-icons/fi";
import { format } from "date-fns";
import type { BillingItem } from "../../pages/billing/BillingPage";

interface BillingTableProps {
  billings: BillingItem[];
  loading: boolean;
  onViewDetails: (bill: BillingItem) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getStatusBadge: (status: string) => string;
}

const BillingTable: React.FC<BillingTableProps> = ({
  billings,
  loading,
  onViewDetails,
  currentPage,
  totalPages,
  onPageChange,
  getStatusBadge,
}) => {
  return (
    <div className="space-y-4">
      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center bg-gray-50/70 border-b font-semibold border-gray-100 px-6 py-3 text-[10px] 3xl:text-[14px] 4xl:text-[16px] text-gray-600">
          <h1 className="flex-1 text-center font-bold">Invoice No</h1>
          <h1 className="flex-1 text-center font-bold">Guest details</h1>
          <h1 className="flex-1 text-center font-bold">Grand Total</h1>
          <h1 className="flex-1 text-center font-bold">Paid Amount</h1>
          <h1 className="flex-1 text-center font-bold">Due / Baki</h1>
          <h1 className="w-28 text-center font-bold">Payment Status</h1>
          <h1 className="flex-1 text-center font-bold">Invoice Date</h1>
          <h1 className="flex-1 text-center font-bold">Actions</h1>
        </div>

        {/* Table Body */}
        <div className="divide-y text-center divide-gray-50">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-400 font-bold">
                Loading billing history...
              </p>
            </div>
          ) : billings.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold text-base">
              No bills found in history
            </div>
          ) : (
            billings.map((bill) => {
              // Gracefully handle guest details populating from checkIn list or customer
              const primaryGuest =
                bill.checkInId?.guests?.find((g: any) => g.isPrimary) ||
                bill.checkInId?.guests?.[0];
              const guestName =
                bill.customerId?.name || primaryGuest?.name || "N/A";
              const guestPhone =
                bill.customerId?.phone || primaryGuest?.mobileNo || "N/A";

              return (
                <div
                  key={bill._id}
                  className="flex items-center px-6 py-3.5 hover:bg-gray-50/50 transition-all"
                >
                  {/* Invoice Code */}
                  <div className="flex-1">
                    <span className="font-bold text-sm 3xl:text-[14px] 4xl:text-[16px] text-orange-600 block">
                      {bill.invoiceNumber}
                    </span>
                    <span className="text-[9px] 3xl:text-[12px] 4xl:text-[14px] text-gray-400 uppercase font-semibold">
                      {bill.invoiceType}
                    </span>
                  </div>

                  {/* Guest Info */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <FiUser size={10} className="text-gray-400" />
                      <span className="text-sm 3xl:text-[14px] 4xl:text-[16px] font-bold text-gray-800">
                        {guestName}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] 3xl:text-[12px] 4xl:text-[14px] text-gray-500 mt-0.5">
                      <FiPhone size={10} className="text-gray-400" />
                      <span>{guestPhone}</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="flex-1 text-center">
                    <span className="font-bold text-gray-800 text-sm 3xl:text-[14px] 4xl:text-[16px]">
                      ₹{bill.grandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Paid Amount */}
                  <div className="flex-1 text-center">
                    <span className="font-bold text-green-600 text-sm 3xl:text-[14px] 4xl:text-[16px]">
                      ₹{bill.paidAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Remaining Due / Baki */}
                  <div className="flex-1 text-center">
                    <span
                      className={`font-bold text-sm 3xl:text-[14px] 4xl:text-[16px] ${bill.dueAmount > 0 ? "text-red-500" : "text-gray-400"}`}
                    >
                      ₹{bill.dueAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="w-28 flex justify-center">
                    <span
                      className={`px-2.5 py-0.5 border rounded-full text-[9px] 3xl:text-[12px] 4xl:text-[14px] font-black uppercase ${getStatusBadge(bill.paymentStatus)}`}
                    >
                      {bill.paymentStatus}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex-1 text-center">
                    <span className="text-[10px] 3xl:text-[12px] 4xl:text-[14px] text-gray-500 font-bold">
                      {format(new Date(bill.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex-1 flex items-center justify-center">
                    <button
                      onClick={() => onViewDetails(bill)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all text-[10px] 3xl:text-[12px] 4xl:text-[14px] font-bold"
                    >
                      <FiEye size={12} /> View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-sm text-gray-500 font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingTable;
