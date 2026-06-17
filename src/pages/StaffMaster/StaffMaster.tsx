import { useState } from "react";
import { FiUserPlus } from "react-icons/fi";
import { useStaffData } from "./useStaffData";
import { useStaffFilters } from "./useStaffFilters";
import type { StaffMember, StaffFormPayload } from "./types";
import AddStaffModal from "./Components/AddStaffModal";
import DeleteModal from "./Components/DeleteModal";
import StaffFiltersBar from "./Components/StaffFiltersBar";
import StaffTable from "./Components/StaffTable";

const StaffMaster = () => {
  const {
    staffList,
    isLoading,
    toggleStatus,
    createStaff,
    updateStaff,
    deleteStaff,
  } = useStaffData();

  const {
    roleFilter,
    setRoleFilter,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    filteredStaffList,
  } = useStaffFilters(staffList);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async (payload: StaffFormPayload): Promise<boolean> => {
    const ok = selectedStaff
      ? await updateStaff(selectedStaff._id, payload)
      : await createStaff(payload);
    if (ok) handleCloseModal();
    return ok;
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    const ok = await deleteStaff(staffToDelete);
    setIsDeleting(false);
    if (ok) setStaffToDelete(null);
  };

  return (
    <div className="flex flex-col w-full h-full py-8 page-container max-w-500 mx-auto relative">
      {isModalOpen && (
        <AddStaffModal
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          editData={selectedStaff}
        />
      )}

      <DeleteModal
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Staff Member?"
        message={`Are you sure you want to permanently delete ${staffToDelete?.fullName}? This action cannot be undone and will revoke all their access to the ERP immediately.`}
      />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Staff Master</h1>
          <p className="text-base text-text-secondary mt-1">
            Manage roles, permissions, and directory for property personnel.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary flex items-center gap-2"
        >
          <FiUserPlus size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      <StaffFiltersBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      <StaffTable
        rows={filteredStaffList}
        totalStaffCount={staffList.length}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(staff) => setStaffToDelete(staff)}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
};

export default StaffMaster;
