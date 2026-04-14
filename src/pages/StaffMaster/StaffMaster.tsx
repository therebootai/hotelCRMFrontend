import React from "react";
import {
  Search,
  UserPlus,
  ListFilter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const staffData = [
  {
    id: 1,
    name: "Adrian Thorne",
    email: "athorne@gmail.com",
    role: "ADMIN",
    roleClass: "bg-orange-100 text-orange-600",
    mobile: "+91 89654 56880",
    loginId: "ADRIAN_88",
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=adrian",
  },
  {
    id: 2,
    name: "Elena Rodriguez",
    email: "elena.r@gmail.com",
    role: "RECEPTION",
    roleClass: "bg-blue-100 text-blue-600",
    mobile: "+91 89654 56880",
    loginId: "ELENA_RECP",
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=elena",
  },
  {
    id: 3,
    name: "Marco Santini",
    email: "marco.s@gmail.com",
    role: "WAITER",
    roleClass: "bg-emerald-100 text-emerald-600",
    mobile: "+91 89654 56880",
    loginId: "MARCO_FNB",
    status: "Disabled",
    avatar: "https://i.pravatar.cc/150?u=marco",
  },
  {
    id: 4,
    name: "Sophie Chen",
    email: "s.chen@gmail.com",
    role: "RECEPTION",
    roleClass: "bg-blue-100 text-blue-600",
    mobile: "+91 89654 56880",
    loginId: "SCHEN_FRONT",
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=sophie",
  },
];

const ToggleSwitch = ({ isActive }: { isActive: boolean }) => (
  <div
    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${isActive ? "bg-[#FF5A3C]" : "bg-gray-300"}`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${isActive ? "translate-x-4" : "translate-x-0"}`}
    />
  </div>
);

const StaffMaster = () => {
  return (
    <div className="flex flex-col w-full h-full p-8 max-w-300 mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Master</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles, permissions, and directory for property personnel.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 shadow-sm">
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
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#FF5A3C] transition-colors"
          />
        </div>

        <div className="relative min-w-45">
          <select className="w-full appearance-none bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Reception</option>
            <option>Waiter</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            size={16}
          />
        </div>

        <button className="bg-gray-200 text-gray-700 font-medium rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-300 transition-colors">
          <ListFilter size={16} />
          <span>More Filters</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="table-container w-full min-w-200">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Login ID
                </th>
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff) => (
                <tr
                  key={staff.id}
                  className="group hover:bg-gray-50/50 border-b border-gray-100 last:border-none"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {staff.name}
                        </p>
                        <p className="text-xs text-gray-500">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${staff.roleClass}`}
                    >
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {staff.mobile}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500 max-w-25 block wrap-break-word">
                      {staff.loginId}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${staff.status === "Active" ? "bg-green-500" : "bg-gray-400"}`}
                      ></span>
                      <span className="text-sm font-medium text-gray-700">
                        {staff.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 pr-8">
                    <div className="flex items-center justify-end gap-4">
                      <ToggleSwitch isActive={staff.status === "Active"} />
                      <button className="text-gray-400 hover:text-[#FF5A3C] transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <span className="text-xs text-gray-500 font-medium">
            Showing 1-4 of 32 staff members
          </span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#FF5A3C] text-white font-medium text-xs shadow-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs transition-colors">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs transition-colors">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffMaster;
