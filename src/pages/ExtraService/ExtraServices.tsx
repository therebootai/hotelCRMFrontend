import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiLoader, FiPlus } from "react-icons/fi";
import ExtraServiceModal from "./components/ExtraServiceModal";
import DeleteModal from "../StaffMaster/Components/DeleteModal";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { AxiosError } from "axios";

export interface ExtraService {
  _id: string;
  name: string;
  description?: string;
  price: number;
  taxPercentage: number;
  isActive: boolean;
}

export default function ExtraServiceMaster() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingData, setEditingData] = useState<ExtraService | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExtraService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExtraServices = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/extra-services");
      const data = response.data?.data || [];
      setExtraServices(data);
    } catch (error: unknown) {
      let errorMsg = "Failed to fetch extra services";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraServices();
  }, []);

  const handleEditClick = (service: ExtraService) => {
    setEditingData(service);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (service: ExtraService) => {
    setItemToDelete(service);
    setIsDeleteModalOpen(false);
    setTimeout(() => setIsDeleteModalOpen(true), 0);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/extra-services/${itemToDelete._id}`);
      toast.success(`${itemToDelete.name} deleted successfully!`);

      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchExtraServices();
    } catch (error: unknown) {
      let errorMsg = "Failed to delete extra service";
      if (error instanceof AxiosError) {
        errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setExtraServices((prev) =>
      prev.map((s) => (s._id === id ? { ...s, isActive: !currentStatus } : s)),
    );

    try {
      const response = await api.patch(`/extra-services/${id}/toggle-status`);

      const updatedService = response.data?.data;
      if (updatedService && typeof updatedService.isActive === "boolean") {
        setExtraServices((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, isActive: updatedService.isActive } : s,
          ),
        );
      }

      toast.success(`Service ${!currentStatus ? "activated" : "deactivated"}.`);
    } catch (error: unknown) {
      setExtraServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: currentStatus } : s)),
      );

      let errorMsg = "Failed to update status";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setEditingData(null), 200);
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-8 max-w-300 mx-auto relative page-container animate-fade-in">
      {/* Page Header (Added for standalone page context) */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Extra Services
          </h1>
          <p className="text-base text-text-secondary mt-1">
            Manage additional guest offerings like laundry, ironing, and
            transport.
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
          <span>Add Service</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        {/* Keep horizontal scroll just for mobile/small screens, no vertical scroll restrictions */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* Removed sticky positioning since the whole page will scroll now */}
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-[40%]">
                  Service Name
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Tax Slab
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiLoader className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-base">
                        Loading extra services...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : extraServices.length > 0 ? (
                extraServices.map((service) => (
                  <tr
                    key={service._id}
                    className={`hover:bg-background/50 transition-colors group ${!service.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-text-primary text-base">
                        {service.name}
                      </span>
                      {service.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {service.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base text-text-primary font-medium">
                        ₹{(service.price ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text-secondary">
                        {service.taxPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() =>
                          handleToggleStatus(service._id, service.isActive)
                        }
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${service.isActive ? "bg-primary" : "bg-border"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ${service.isActive ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(service)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service)}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No extra services registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals */}
      <ExtraServiceModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchExtraServices}
        initialData={editingData as any}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Extra Service"
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
}
