import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiFileText, FiPlus, FiCheckCircle, FiClock, FiDollarSign } from "react-icons/fi";
import api from "../../lib/axios";
import toast from "react-hot-toast";

// Subcomponents
import BillingTable from "../../components/billingComp/BillingTable";
import BillingDetailsModal from "../../components/billingComp/BillingDetailsModal";
import ProcessBillingModal from "../../components/billingComp/ProcessBillingModal";

export interface BillingItem {
  _id: string;
  invoiceNumber: string;
  invoiceType: string;
  billingStatus: string;
  settlementStatus: string;
  checkInId?: any;
  bookingId?: any;
  customerId?: any;
  totalRoomCharges: number;
  subTotal: number;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    totalTax: number;
  };
  discount: number;
  advanceDeducted: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  payments: any[];
  extraServices: any[];
  facilityCharges: any[];
  roomChargesBreakdown?: any[];
  notes?: string;
  createdAt: string;
}

const BillingPage = () => {
  // Page state
  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillingItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch Billings List
  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search,
        status: statusFilter
      };
      const res = await api.get("/billing/list", { params });
      if (res.data && res.data.success) {
        setBillings(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch billing list");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleOpenDetails = (bill: BillingItem) => {
    setSelectedBill(bill);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-[#F8F9FA] scroll-smooth">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA]/90 backdrop-blur-md py-4 flex flex-row justify-between items-center border-b border-gray-100">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
            <FiFileText className="text-orange-500" size={24} />
            Billing & Invoices
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Checkout settlement & Payments record
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-[2.8rem] px-6 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95"
        >
          <FiPlus size={16} /> Process Billing / Checkout
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Invoices</span>
            <h3 className="text-xl font-black text-gray-800 mt-1">{billings.length}</h3>
          </div>
          <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
            <FiFileText size={20} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider">Paid Invoices</span>
            <h3 className="text-xl font-black text-green-600 mt-1">
              {billings.filter(b => b.paymentStatus === "Paid").length}
            </h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">Partial Dues</span>
            <h3 className="text-xl font-black text-yellow-600 mt-1">
              {billings.filter(b => b.paymentStatus === "Partial").length}
            </h3>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <FiClock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Total Pending Dues</span>
            <h3 className="text-xl font-black text-red-600 mt-1">
              ₹{billings.reduce((sum, b) => sum + (b.dueAmount || 0), 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <FiDollarSign size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by invoice code, guest name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-gray-500"
          >
            <option value="">All Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* TABLE AND PAGINATION */}
      <BillingTable
        billings={billings}
        loading={loading}
        onViewDetails={handleOpenDetails}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getStatusBadge={getStatusBadge}
      />

      {/* INVOICE DETAILS MODAL */}
      <BillingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        selectedBill={selectedBill}
      />

      {/* PROCESS BILLING MODAL */}
      <ProcessBillingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchBillings}
      />


    </div>
  );
};

export default BillingPage;
