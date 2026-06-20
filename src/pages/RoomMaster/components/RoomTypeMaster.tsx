import { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiLoader,
  FiCoffee,
} from "react-icons/fi";
import RoomTypeModal from "./RoomTypeModal";
import DeleteModal from "../../StaffMaster/Components/DeleteModal";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import { AxiosError } from "axios";

export interface RoomType {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  gstId?: { _id: string; percentage: number; name: string };
}

interface RoomTypeMasterProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function RoomTypeMaster({
  isAddModalOpen,
  setIsAddModalOpen,
}: RoomTypeMasterProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingData, setEditingData] = useState<RoomType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<RoomType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoomTypes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/room-types");
      const data = response.data?.data || [];
      setRoomTypes(data);
    } catch (error: unknown) {
      let errorMsg = "Failed to fetch room types";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // Handlers
  const handleEditClick = (roomType: RoomType) => {
    // We map gstId from the object to just the _id string for the modal form
    setEditingData({
      ...roomType,
      gstId: roomType.gstId?._id,
    } as any);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (roomType: RoomType) => {
    setTypeToDelete(roomType);
    setIsDeleteModalOpen(false);
    setTimeout(() => setIsDeleteModalOpen(true), 0);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/room-types/${typeToDelete._id}`);
      toast.success(`${typeToDelete.name} deleted successfully!`);

      setIsDeleteModalOpen(false);
      setTypeToDelete(null);
      fetchRoomTypes();
    } catch (error: unknown) {
      let errorMsg = "Failed to delete room type";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setEditingData(null), 200);
  };

  const filteredTypes = roomTypes.filter((rt) =>
    rt.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mt-4 animate-fade-in space-y-6">
      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-primary">
            <FiCoffee size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Registered Room Types</h2>
            {!isLoading && (
              <span className="bg-background px-2.5 py-0.5 rounded-full text-sm font-medium text-text-secondary border border-border">
                {filteredTypes.length}
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-10 py-4 text-[11px] 3xl:text-[14px] 4xl-text-[16px] font-semibold text-text-secondary uppercase tracking-wider w-1/4">
                  Type Name
                </th>
                <th className="px-10 py-4 text-[11px] 3xl:text-[14px] 4xl-text-[16px] font-semibold text-text-secondary uppercase tracking-wider w-1/3">
                  Description
                </th>
                <th className="px-10 py-4 text-[11px] 3xl:text-[14px] 4xl-text-[16px] font-semibold text-text-secondary uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-10 py-4 text-[11px] 3xl:text-[14px] 4xl-text-[16px] font-semibold text-text-secondary uppercase tracking-wider">
                  GST %
                </th>
                <th className="px-10 py-4 text-[11px] 3xl:text-[14px] 4xl-text-[16px] font-semibold text-text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-10 py-12 text-center text-text-secondary"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiLoader className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-base">Loading room types...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTypes.length > 0 ? (
                filteredTypes.map((rt) => (
                  <tr
                    key={rt._id}
                    className="hover:bg-background/50 transition-colors group"
                  >
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FiCoffee size={18} />
                        </div>
                        <span className="font-bold text-text-primary text-base">
                          {rt.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <p className="text-base text-text-secondary leading-relaxed max-w-[60%]">
                        {rt.description || (
                          <span className="italic text-text-secondary/50">
                            No description provided
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-10 py-5">
                      <span className="text-base text-text-primary font-medium">
                        ₹{rt.basePrice?.toLocaleString() ?? "—"}
                      </span>
                    </td>
                    <td className="px-10 py-5">
                      <span className="text-base text-text-secondary">
                        {rt.gstId ? `${rt.gstId.percentage}%` : "—"}
                      </span>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(rt)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(rt)}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
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
                    className="px-10 py-12 text-center text-text-secondary"
                  >
                    {searchQuery
                      ? `No room types found matching "${searchQuery}"`
                      : "No room types registered yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RoomTypeModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchRoomTypes}
        initialData={editingData as any}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Room Type"
        message={`Are you sure you want to delete the "${typeToDelete?.name}" room type? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
