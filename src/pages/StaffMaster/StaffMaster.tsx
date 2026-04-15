import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  ListFilter,
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";

import AddStaffModal from "./Components/AddStaffModal";

export interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "receptionist";
  isActive: boolean;
  mobile: string;
  loginId: string;
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

const StaffMaster = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users");
      setStaffList(response.data.data);
    } catch (error) {
      console.error("Failed to fetch staff list", error);
      toast.error("Failed to load staff directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (
    staffId: string,
    currentStatus: boolean,
  ) => {
    setStaffList((prevList) =>
      prevList.map((staff) =>
        staff._id === staffId ? { ...staff, isActive: !currentStatus } : staff,
      ),
    );

    try {
      const response = await api.patch(`/users/${staffId}/toggle-status`);

      const finalStatus = response.data.data.isActive;
      setStaffList((prevList) =>
        prevList.map((staff) =>
          staff._id === staffId ? { ...staff, isActive: finalStatus } : staff,
        ),
      );

      toast.success(finalStatus ? "Account activated" : "Account disabled");
    } catch (error) {
      console.error("Failed to toggle status", error);

      setStaffList((prevList) =>
        prevList.map((staff) =>
          staff._id === staffId ? { ...staff, isActive: currentStatus } : staff,
        ),
      );

      toast.error("Failed to update status. Change reverted.");
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-orange-100 text-orange-600";
      case "receptionist":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-300 mx-auto relative">
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        onSuccess={fetchStaff}
        editData={selectedStaff}
      />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Staff Master</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage roles, permissions, and directory for property personnel.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStaff(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-gray-50/80 p-2 rounded-xl mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, mobile or email..."
            className="input-field pl-10 py-2.5"
          />
        </div>

        <div className="relative min-w-45">
          <select
            defaultValue="All Roles"
            className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
          >
            <option>All Roles</option>
            <option>Admin</option>
            <option>Reception</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            size={16}
          />
        </div>

        <button className="btn-secondary flex items-center gap-2 py-2.5">
          <ListFilter size={16} />
          <span>More Filters</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="table-container w-full min-w-200">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">
                  Name
                </th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">
                  Role
                </th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">
                  Mobile
                </th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">
                  Login ID
                </th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-left py-3 px-4">
                  Status
                </th>
                <th className="text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right py-3 px-4 pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 6. Handle Loading State */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center items-center gap-3 text-text-secondary">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">
                        Loading staff directory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-text-secondary text-sm"
                  >
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr
                    key={staff._id}
                    className="group hover:bg-gray-50/50 border-b border-border last:border-none"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${staff.fullName}&backgroundColor=e2e8f0`}
                          alt={staff.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {staff.fullName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${getRoleBadgeStyle(staff.role)}`}
                      >
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-text-secondary">
                        {staff.mobile || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-text-secondary max-w-25 block wrap-break-word">
                        {staff.loginId || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          isActive={staff.isActive}
                          onToggle={() =>
                            handleToggleStatus(staff._id, staff.isActive)
                          }
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 pr-8">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsModalOpen(true);
                          }}
                          className="text-text-secondary hover:text-primary transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button className="text-text-secondary hover:text-danger transition-colors">
                          <Trash2 size={16} />
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

export default StaffMaster;
