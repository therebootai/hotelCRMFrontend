import React, { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiPlus,
  FiList,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiHome,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { isAxiosError } from "axios";

import AddFacilityModal from "./components/AddFacilityModal";
import DeleteModal from "../StaffMaster/Components/DeleteModal"; 
import { useDebounce } from "../../hooks/useDebounce";

export interface Facility {
  _id: string;
  name: string;
  type: "Marriage Hall" | "Banquet Hall" | "Conference Hall" | "Pool" | "Lawn" | "Rooftop" | "Other";
  capacity: number;
  pricingType: "Hourly" | "Slot" | "Full Day";
  basePrice: number;
  description?: string;
  status: "Active" | "Maintenance" | "Blocked";
  amenities:string[];
  createdAt?: string;
}

const ToggleSwitch = ({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
      isActive ? "bg-primary" : "bg-gray-300"
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
        isActive ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </div>
);

const FacilityMaster = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [facilityList, setFacilityList] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput, 300);

  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [sortOrder, setSortOrder] = useState("newest");

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsMoreFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFacilities = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/facilities");
      setFacilityList(response.data.data);
    } catch (error) {
      console.error("Failed to fetch facilities", error);
      toast.error("Failed to load facilities.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleToggleStatus = async (facilityId: string, currentStatus: string) => {
    // Optimistic Update: Switch to Blocked if Active, otherwise Active
    const optimisticStatus = currentStatus === "Active" ? "Blocked" : "Active";
    
    setFacilityList((prevList) =>
      prevList.map((fac) =>
        fac._id === facilityId ? { ...fac, status: optimisticStatus } : fac
      )
    );

    try {
      const response = await api.patch(`/facilities/${facilityId}/toggle-status`);
      const finalStatus = response.data.data.status;
      
      setFacilityList((prevList) =>
        prevList.map((fac) =>
          fac._id === facilityId ? { ...fac, status: finalStatus } : fac
        )
      );
      toast.success(`Status changed to ${finalStatus}`);
    } catch (error) {
      console.error("Failed to toggle status", error);
      // Revert on failure
      setFacilityList((prevList) =>
        prevList.map((fac) =>
          fac._id === facilityId ? { ...fac, status: currentStatus as any } : fac
        )
      );
      toast.error("Failed to update status. Change reverted.");
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Maintenance": return "bg-yellow-100 text-yellow-700";
      case "Blocked": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const filteredFacilityList = facilityList
    .filter((fac) => {
      const matchesType = typeFilter === "all" || fac.type === typeFilter;
      const matchesStatus = statusFilter === "all" || fac.status === statusFilter;
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        !debouncedSearch ||
        fac.name.toLowerCase().includes(searchLower) ||
        fac.description?.toLowerCase().includes(searchLower);

      return matchesType && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const handleDeleteFacility = async () => {
    if (!facilityToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/facilities/${facilityToDelete._id}`);
      setFacilityList((prev) => prev.filter((fac) => fac._id !== facilityToDelete._id));
      toast.success(`${facilityToDelete.name} has been deleted.`);
      setFacilityToDelete(null);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || "Failed to delete facility.";
        toast.error(errorMsg);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-300 mx-auto relative page-container">
      <AddFacilityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFacility(null);
        }}
        onSuccess={fetchFacilities}
        editData={selectedFacility}
      />

      <DeleteModal
        isOpen={!!facilityToDelete}
        onClose={() => setFacilityToDelete(null)}
        onConfirm={handleDeleteFacility}
        isLoading={isDeleting}
        title="Delete Facility?"
        message={`Are you sure you want to permanently delete ${facilityToDelete?.name}? This action cannot be undone.`}
      />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Facility Master</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your property's halls, pools, lawns, and extra spaces.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedFacility(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          <span>Add Facility</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-gray-50/80 p-2 rounded-xl mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by facility name or description..."
            className="input-field pl-10 py-2.5"
          />
        </div>

        <div className="relative min-w-45">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Marriage Hall">Marriage Hall</option>
            <option value="Banquet Hall">Banquet Hall</option>
            <option value="Conference Hall">Conference Hall</option>
            <option value="Pool">Pool</option>
            <option value="Lawn">Lawn</option>
            <option value="Rooftop">Rooftop</option>
            <option value="Other">Other</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>

        <div className="relative" ref={popoverRef}>
          <button 
            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${isMoreFiltersOpen ? 'bg-gray-200 text-text-primary' : 'bg-gray-100 hover:bg-gray-200 text-text-secondary'}`}
          >
            <FiFilter size={16} />
            <span>More Filters</span>
            {(statusFilter !== "all" || sortOrder !== "newest") && (
              <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
            )}
          </button>

          {isMoreFiltersOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-modal z-20 animate-fade-in p-4">
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Facility Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Sort By</label>
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              {(statusFilter !== "all" || sortOrder !== "newest") && (
                <button 
                  onClick={() => { setStatusFilter("all"); setSortOrder("newest"); }}
                  className="w-full mt-4 text-xs font-semibold text-danger hover:text-red-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="table-container w-full min-w-200">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">Name & Type</th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">Capacity</th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">Pricing</th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">Status</th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">Quick Toggle</th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right py-3 px-4 pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center items-center gap-3 text-text-secondary">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Loading facilities...</span>
                    </div>
                  </td>
                </tr>
              ) : facilityList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary text-sm">
                    No facilities found.
                  </td>
                </tr>
              ) : (
                filteredFacilityList.map((fac) => (
                  <tr key={fac._id} className="group hover:bg-gray-50/50 border-b border-border last:border-none">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 border border-border">
                          <FiHome size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{fac.name}</p>
                          <p className="text-xs text-text-secondary">{fac.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-text-secondary">
                        {fac.capacity} pax
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-text-primary">₹{fac.basePrice.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">{fac.pricingType}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${getStatusBadgeStyle(fac.status)}`}>
                        {fac.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ToggleSwitch
                        isActive={fac.status === "Active"}
                        onToggle={() => handleToggleStatus(fac._id, fac.status)}
                      />
                    </td>
                    <td className="py-4 px-4 pr-8">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => {
                            setSelectedFacility(fac);
                            setIsModalOpen(true);
                          }}
                          className="text-text-secondary hover:text-primary transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setFacilityToDelete(fac)}
                          className="text-text-secondary hover:text-danger transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacilityMaster;