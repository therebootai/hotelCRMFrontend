import { useState, useMemo } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import type { StaffMember } from "./types";

export function useStaffFilters(staffList: StaffMember[]) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "disabled"
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  const debouncedSearch = useDebounce(searchInput, 300);

  const filteredStaffList = useMemo(() => {
    return staffList
      .filter((staff) => {
        const matchesRole = roleFilter === "all" || staff.role === roleFilter;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && staff.isActive) ||
          (statusFilter === "disabled" && !staff.isActive);

        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          !debouncedSearch ||
          staff.fullName.toLowerCase().includes(searchLower) ||
          staff.mobile?.includes(searchLower) ||
          staff.loginId?.toLowerCase().includes(searchLower);

        return matchesRole && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [staffList, roleFilter, statusFilter, sortOrder, debouncedSearch]);

  return {
    roleFilter,
    setRoleFilter,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    filteredStaffList,
  };
}
