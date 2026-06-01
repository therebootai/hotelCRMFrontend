import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { StaffMember } from "../types";
import ToggleSwitch from "./ToggleSwitch";

interface StaffTableProps {
  rows: StaffMember[];
  totalStaffCount: number;
  isLoading: boolean;
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  onToggleStatus: (staffId: string, currentStatus: boolean) => void;
}

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

const StaffTable = ({
  rows,
  totalStaffCount,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: StaffTableProps) => {
  return (
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
            ) : totalStaffCount === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-text-secondary text-sm"
                >
                  No staff members found.
                </td>
              </tr>
            ) : (
              rows.map((staff) => (
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
                        onToggle={() => onToggleStatus(staff._id, staff.isActive)}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 pr-8">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => onEdit(staff)}
                        className="text-text-secondary hover:text-primary transition-colors"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(staff)}
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
  );
};

export default StaffTable;
