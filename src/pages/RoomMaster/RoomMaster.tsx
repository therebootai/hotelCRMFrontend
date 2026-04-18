import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Loader2, CalendarRange } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { AxiosError } from "axios";

// Components
import RoomTable, { type Room } from "./components/RoomTable";
import RoomTabs from "./components/RoomTabs";
import RoomFilters from "./components/RoomFilters";
import ComingSoon from "./components/ComingSoon";
import AddRoomForm from "./components/AddRoomForm";
import RoomTypeMaster from "./components/RoomTypeMaster";
import AmenitiesMaster from "./components/AmenitiesMaster";
import TaxGstMaster from "./components/TaxGstMaster";
import DeleteModal from "../StaffMaster/Components/DeleteModal";

export default function RoomMaster() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Room Master");
  const [view, setView] = useState<"list" | "add">("list");

  // Real Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Backend Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 40;

  // Edit/Delete State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings Modals State
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

  const [filters, setFilters] = useState({ roomType: '', status: '' });

  const fetchRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.roomType && { roomType: filters.roomType }),
      });
      const res = await api.get(`/rooms?${queryParams.toString()}`);

      const payload = res.data?.data;

      const fetchedRooms = payload.rooms || [];
      const pagination = payload.pagination || {
        totalPages: 1,
        totalItems: fetchedRooms.length,
      };

      setRooms(Array.isArray(fetchedRooms) ? fetchedRooms : []);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
    } catch (error: unknown) {
      let errorMsg = "Failed to fetch rooms";
      if (error instanceof AxiosError)
        errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Room Master") {
      fetchRooms();
    }
  }, [activeTab, currentPage, filters]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setView("add");
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/rooms/${roomToDelete._id}`);
      toast.success(`Room ${roomToDelete.roomNumber} deleted successfully`);
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);

      if (rooms.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchRooms();
      }
    } catch (error: unknown) {
      let errorMsg = "Failed to delete room";
      if (error instanceof AxiosError)
        errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingRoom(null);
    setView("add");
  };

  const handleCloseForm = () => {
    setView("list");
    setEditingRoom(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    fetchRooms();
  };

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {view === "add" ? (
          <div className="flex items-center gap-4 animate-fade-in">
            <button
              onClick={handleCloseForm}
              className="p-2 bg-card border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-text-primary">
              {editingRoom
                ? `Edit Room #${editingRoom.roomNumber}`
                : "Add New Room"}
            </h1>
          </div>
        ) : (
          <RoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {view === "list" && (
          <div className="flex items-center gap-3 animate-fade-in">
            {activeTab === "Room Master" && (
              <>
                <button
                  onClick={() => navigate('/master/rooms/rates')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors border bg-card border-border text-text-primary hover:bg-background"
                >
                  <CalendarRange size={16} /> Manage Rates
                </button>
                <button
                  onClick={handleOpenAddForm}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5"
                >
                  <Plus size={18} /> Add Room
                </button>
              </>
            )}
            {activeTab === "Room Type Master" && (
              <button
                onClick={() => setIsRoomTypeModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <Plus size={18} /> Add Room Type
              </button>
            )}
            {activeTab === "Amenities Master" && (
              <button
                onClick={() => setIsAmenityModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <Plus size={18} /> Add Amenities
              </button>
            )}
            {activeTab === "Tax / GST Master" && (
              <button
                onClick={() => setIsTaxModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <Plus size={18} /> Add Tax/GST
              </button>
            )}
          </div>
        )}
      </div>

      {view === "add" ? (
        <AddRoomForm
          onCancel={handleCloseForm}
          onSuccess={handleFormSuccess}
          initialData={editingRoom}
        />
      ) : activeTab === "Room Master" ? (
        <>
          <RoomFilters
            filters={filters}
            onFilterChange={(key, value) => {
              setFilters((prev) => ({ ...prev, [key]: value }));
              setCurrentPage(1);
            }}
          />
          <div className="mt-4 flex flex-col lg:flex-row items-start gap-6">
            <div className="flex-1 min-w-0 transition-all duration-300 w-full">
              {isLoadingRooms ? (
                <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-text-secondary">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="font-medium">Loading rooms...</p>
                </div>
              ) : (
                <RoomTable
                  rooms={rooms}
                  selectedRoomIds={[]}
                  onSelectionChange={() => {}}
                  isSelectionMode={false}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </>
      ) : activeTab === "Room Type Master" ? (
        <RoomTypeMaster
          isAddModalOpen={isRoomTypeModalOpen}
          setIsAddModalOpen={setIsRoomTypeModalOpen}
        />
      ) : activeTab === "Amenities Master" ? (
        <AmenitiesMaster
          isAddModalOpen={isAmenityModalOpen}
          setIsAddModalOpen={setIsAmenityModalOpen}
        />
      ) : activeTab === "Tax / GST Master" ? (
        <TaxGstMaster
          isAddModalOpen={isTaxModalOpen}
          setIsAddModalOpen={setIsTaxModalOpen}
        />
      ) : (
        <ComingSoon moduleName={activeTab} />
      )}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete Room #${roomToDelete?.roomNumber}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}