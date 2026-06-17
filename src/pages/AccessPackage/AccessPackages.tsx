import { useState, useEffect } from "react";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useDebounce } from "../../hooks/useDebounce";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiLoader,
  FiCalendar,
} from "react-icons/fi";
import AccessPackageModal, {
  type AccessPackageData,
} from "../../components/access-package/AccessPackageModal";
import DeleteModal from "../StaffMaster/Components/DeleteModal";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { AxiosError } from "axios";

export default function AccessPackages() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<AccessPackageData | null>(
    null,
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AccessPackageData | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { getParam, updateFilters } = useQueryParams();

  const search = getParam("search") ?? "";
  const packageType = getParam("packageType") ?? "all";
  const statusFilter = getParam("status") ?? "all";
  const debouncedSearch = useDebounce(search, 300);

  const [packages, setPackages] = useState<AccessPackageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (packageType !== "all") params.packageType = packageType;
      if (statusFilter !== "all") params.isActive = statusFilter;

      const response = await api.get("/access-packages", { params });
      const data = response.data?.data?.packages || [];
      setPackages(data);
    } catch (err) {
      console.error(err);
      let errMsg = "Failed to fetch access packages";
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || err.message;
      }
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, packageType, statusFilter]);

  const handleEditClick = (pkg: AccessPackageData) => {
    setEditingData(pkg);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (pkg: AccessPackageData) => {
    setItemToDelete(pkg);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?._id) return;
    try {
      setIsDeleting(true);
      await api.delete(`/access-packages/${itemToDelete._id}`);
      toast.success("Day Access Package deleted successfully!");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
      let errMsg = "Failed to delete package";
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || err.message;
      }
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (pkg: AccessPackageData) => {
    const updatedStatus = !pkg.isActive;

    // Optimistic Update
    setPackages((prev) =>
      prev.map((p) =>
        p._id === pkg._id ? { ...p, isActive: updatedStatus } : p,
      ),
    );

    try {
      await api.put(`/access-packages/${pkg._id}`, {
        isActive: updatedStatus,
      });
      toast.success(
        `Package status updated to ${updatedStatus ? "Active" : "Inactive"}`,
      );
    } catch (err) {
      console.error(err);
      // Revert on failure
      setPackages((prev) =>
        prev.map((p) =>
          p._id === pkg._id ? { ...p, isActive: pkg.isActive } : p,
        ),
      );
      toast.error("Failed to update status");
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditingData(null);
  };

  return (
    <div className="flex flex-col w-full h-full py-8 max-w-500 mx-auto relative page-container animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Day Access Packages
          </h1>
          <p className="text-base text-text-secondary mt-1">
            Configure premium combo or corporate day pass offerings, pricing,
            inclusions and add-ons.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingData(null);
            setIsAddModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          <span>Add Pass Package</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-gray-50/80 p-2 rounded-xl mb-6">
        <div className="flex-1 relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) =>
              updateFilters("search", e.target.value, { replace: true })
            }
            placeholder="Search by package name or ID..."
            className="input-field pl-10 py-2.5"
          />
        </div>

        <div className="relative min-w-40">
          <select
            value={packageType}
            onChange={(e) =>
              updateFilters(
                "packageType",
                e.target.value === "all" ? "" : e.target.value,
              )
            }
            className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-base font-medium text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Premium Combo">Premium Combo</option>
            <option value="Corporate">Corporate</option>
          </select>
          <FiChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            size={16}
          />
        </div>

        <div className="relative min-w-40">
          <select
            value={statusFilter}
            onChange={(e) =>
              updateFilters(
                "status",
                e.target.value === "all" ? "" : e.target.value,
              )
            }
            className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-base font-medium text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
          <FiChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            size={16}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-border">
                <th className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider py-4 px-10 w-[35%]">
                  Package Details
                </th>
                <th className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider py-4 px-10">
                  Price
                </th>
                <th className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider py-4 px-10">
                  Timings
                </th>
                <th className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider py-4 px-10">
                  Status
                </th>
                <th className="text-[10px] 3xl:text-[14px] font-bold text-text-secondary uppercase tracking-wider py-4 px-10 text-right w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-text-secondary"
                  >
                    <div className="flex justify-center items-center gap-3">
                      <FiLoader className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-base font-medium">
                        Loading packages...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-text-secondary text-base"
                  >
                    No access packages registered yet.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr
                    key={pkg._id}
                    className={`hover:bg-gray-50/30 transition-colors group ${
                      !pkg.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="py-4 px-10">
                      <div className="flex items-start gap-4">
                        {pkg.cover_img?.secure_url ? (
                          <img
                            src={pkg.cover_img.secure_url}
                            alt={pkg.packageName}
                            className="w-14 h-14 rounded-lg object-cover border border-border bg-gray-50 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 border border-border flex items-center justify-center text-gray-400 shrink-0">
                            <FiCalendar size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-base font-bold text-text-primary truncate">
                            {pkg.packageName}
                          </p>
                          <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                            {pkg.package_id}
                          </p>
                          <span className="inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {pkg.packageType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-10">
                      <div>
                        <p className="text-base font-bold text-text-primary">
                          Adult: ₹{pkg.adult_price.toLocaleString("en-IN")}
                        </p>
                        <p className="text-sm text-text-secondary mt-0.5">
                          Child: ₹{pkg.child_price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-10">
                      <div>
                        <p className="text-base font-semibold text-text-primary">
                          {pkg.entry_time} - {pkg.exit_time}
                        </p>
                        {pkg.duration && (
                          <p className="text-sm text-text-secondary mt-0.5">
                            Duration: {Math.floor(pkg.duration / 60)}h{" "}
                            {pkg.duration % 60}m
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-10">
                      <button
                        onClick={() => handleToggleStatus(pkg)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          pkg.isActive ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                            pkg.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-10">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(pkg)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pkg)}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
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

      {/* Modals */}
      <AccessPackageModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchPackages}
        initialData={editingData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Access Package"
        message={`Are you sure you want to permanently delete "${itemToDelete?.packageName}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
