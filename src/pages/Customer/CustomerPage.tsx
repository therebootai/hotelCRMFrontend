import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiMail,
  FiPhone,
  FiMapPin,
  FiTag,
  FiFileText,
  FiEdit2,
  FiTrash2,
  FiCompass,
  FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../lib/axios";

interface CustomerProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyTier?: string;
  companyName?: string;
  companyGST?: string;
  preferences?:
    | string[]
    | {
        smokingRoom?: boolean;
        highFloor?: boolean;
        nearLift?: boolean;
        bedType?: string;
        notes?: string;
      };
  internalNotes?: string;
  createdAt: string;
}

interface CustomerDetail extends CustomerProfile {
  history?: {
    bookings: any[];
    checkins: any[];
  };
}

const CustomerPage = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    companyName: "",
    companyGST: "",
    loyaltyTier: "Bronze",
    preferences: "",
    internalNotes: "",
  });

  const fetchCustomers = async () => {
    setLoadingList(true);
    try {
      const response = await api.get(
        `/customers?query=${searchQuery}&page=${page}&limit=10`,
      );
      if (response.data?.success) {
        const list = response.data.data.customers || [];
        setCustomers(list);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        if (list.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(list[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching customers list:", error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/customers/${id}`);
      if (response.data?.success) {
        setSelectedCustomer(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, page]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      companyName: "",
      companyGST: "",
      loyaltyTier: "Bronze",
      preferences: "",
      internalNotes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: CustomerProfile) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      companyName: customer.companyName || "",
      companyGST: customer.companyGST || "",
      loyaltyTier: customer.loyaltyTier || "Bronze",
      preferences: Array.isArray(customer.preferences)
        ? (customer.preferences as string[]).join(", ")
        : Object.entries(customer.preferences || {})
            .filter(([, v]) => v === true)
            .map(([k]) => k)
            .join(", "),
      internalNotes: customer.internalNotes || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      preferences: formData.preferences
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    };

    try {
      let response;
      if (editingId) {
        response = await api.put(`/customers/${editingId}`, payload);
      } else {
        response = await api.post("/customers", payload);
      }

      if (response.data?.success) {
        toast.success(editingId ? "Customer updated" : "Customer created");
        setIsModalOpen(false);
        fetchCustomers();
        if (editingId) {
          fetchCustomerDetails(editingId);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this customer profile?")
    )
      return;
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data?.success) {
        toast.success("Customer profile deleted");
        setSelectedCustomerId(null);
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-0 flex flex-col animate-fade-in">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiUsers className="text-primary" size={24} />
            Customer Management
          </h1>
          <p className="text-text-secondary text-sm">
            Create, search, and view historical stays for repeat guest profile
            loyalty.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary flex items-center gap-1.5 px-4 py-2.5 cursor-pointer"
        >
          <FiPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Left Side: Directory List */}
        <div className="w-88 flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-sm shrink-0 min-h-0">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search phone, name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-gray-50 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingList ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : customers.length > 0 ? (
              customers.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelectedCustomerId(c._id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50/50 transition-colors flex justify-between items-center ${
                    selectedCustomerId === c._id
                      ? "bg-primary/[0.03] border-l-4 border-primary pl-3"
                      : ""
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-text-primary text-xs truncate max-w-[180px]">
                      {c.name}
                    </h4>
                    <p className="text-[10px] text-text-secondary mt-1">
                      {c.phone}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      c.loyaltyTier === "Gold"
                        ? "bg-amber-100 text-amber-700"
                        : c.loyaltyTier === "Silver"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {c.loyaltyTier || "Bronze"}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-text-secondary">
                No guest profiles found.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border flex justify-between items-center bg-gray-50 text-[10px] font-semibold text-text-secondary shrink-0">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {/* Right Side: Profile Details */}
        <div className="flex-1 min-w-0 bg-white border border-border rounded-2xl overflow-y-auto shadow-sm p-8 flex flex-col justify-between min-h-0">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : selectedCustomer ? (
            <div className="flex flex-col gap-6">
              {/* Profile Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedCustomer.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <FiPhone size={14} />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <FiMail size={14} />
                        {selectedCustomer.email}
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <FiMapPin size={14} />
                        {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 cursor-pointer"
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer._id)}
                    className="p-2 border border-border rounded-xl text-danger hover:bg-red-50 cursor-pointer"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta details */}
                <div className="border border-border p-5 rounded-2xl flex flex-col gap-4">
                  <h3 className="text-xs uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1">
                    <FiFileText size={14} />
                    Company & Loyalty details
                  </h3>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-semibold text-text-secondary">
                      Loyalty Membership
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {selectedCustomer.loyaltyTier || "Bronze"}
                    </span>
                  </div>
                  {selectedCustomer.companyName && (
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-xs font-semibold text-text-secondary">
                        Company Name
                      </span>
                      <span className="text-xs font-medium text-text-primary">
                        {selectedCustomer.companyName}
                      </span>
                    </div>
                  )}
                  {selectedCustomer.companyGST && (
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-xs font-semibold text-text-secondary">
                        Company GST Number
                      </span>
                      <span className="text-xs font-medium text-text-primary">
                        {selectedCustomer.companyGST}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preferences */}
                <div className="border border-border p-5 rounded-2xl flex flex-col gap-3">
                  <h3 className="text-xs uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1">
                    <FiTag size={14} />
                    Preferences & Notes
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedCustomer?.preferences &&
                    selectedCustomer?.preferences?.length > 0 ? (
                      selectedCustomer?.preferences?.map((p, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-secondary italic">
                        No preferences tagged
                      </span>
                    )}
                  </div>
                  {selectedCustomer.internalNotes && (
                    <p className="text-[11px] text-text-secondary bg-gray-50 p-2.5 rounded-lg border border-border/40 mt-2">
                      <strong>Notes:</strong> {selectedCustomer.internalNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Booking History */}
              <div className="mt-4">
                <h3 className="text-xs uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5 mb-3">
                  <FiCalendar size={14} />
                  Stay History
                </h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        <th className="px-4 py-2">Booking ID</th>
                        <th className="px-4 py-2">Dates</th>
                        <th className="px-4 py-2">Total Amount</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {selectedCustomer.history?.bookings &&
                      selectedCustomer.history.bookings.length > 0 ? (
                        selectedCustomer.history.bookings.map((b) => (
                          <tr key={b._id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 font-semibold text-primary">
                              {b.bookingId || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-text-secondary">
                              {b.rooms?.[0]?.checkInDate
                                ? new Date(
                                    b.rooms[0].checkInDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}{" "}
                              —{" "}
                              {b.rooms?.[0]?.checkOutDate
                                ? new Date(
                                    b.rooms[0].checkOutDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="px-4 py-2">
                              {typeof b.pricingSummary?.grandTotal === "number"
                                ? `₹${b.pricingSummary.grandTotal.toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  b.status === "Confirmed"
                                    ? "bg-blue-50 text-blue-700"
                                    : b.status === "Checked-In"
                                      ? "bg-green-50 text-green-700"
                                      : b.status === "Checked-Out"
                                        ? "bg-slate-100 text-slate-700"
                                        : b.status === "Cancelled"
                                          ? "bg-red-50 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {b.status || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-6 text-text-secondary italic"
                          >
                            No booking history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary">
              <FiCompass size={40} className="mb-2 text-gray-300 animate-pulse" />
              <p className="text-sm">
                Select a guest from the directory list to display customer
                profile metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full sm:w-auto mx-auto p-6 shadow-xl border border-border">
            <h3 className="font-bold text-text-primary text-base mb-4">
              {editingId ? "Update Profile" : "Register Guest Profile"}
            </h3>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Loyalty Tier
                  </label>
                  <select
                    value={formData.loyaltyTier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        loyaltyTier: e.target.value,
                      }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">
                    Company GST
                  </label>
                  <input
                    type="text"
                    value={formData.companyGST}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyGST: e.target.value,
                      }))
                    }
                    className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary">
                  Preferences (comma separated tags)
                </label>
                <input
                  type="text"
                  placeholder="AC required, Higher Floor, Near Elevator"
                  value={formData.preferences}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferences: e.target.value,
                    }))
                  }
                  className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary">
                  Internal Notes
                </label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      internalNotes: e.target.value,
                    }))
                  }
                  rows={2}
                  className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
