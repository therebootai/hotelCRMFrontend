import { useMemo } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { useQueryParams } from "../../hooks/useQueryParams";
import type { StaffMember } from "./types";

export function useStaffFilters(staffList: StaffMember[]) {
  const { getParam, updateFilters } = useQueryParams();

  const searchInput = getParam("search") ?? "";
  const roleFilter = getParam("role") ?? "all";
  const statusFilter = getParam("staffStatus") ?? "all";
  const sortOrder = getParam("sort") ?? "newest";

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

  const setSearchInput = (v: string) => updateFilters("search", v, { replace: true });
  const setRoleFilter = (v: string) => updateFilters("role", v === "all" ? "" : v);
  const setStatusFilter = (v: string) => updateFilters("staffStatus", v === "all" ? "" : v);
  const setSortOrder = (v: string) => updateFilters("sort", v === "newest" ? "" : v);

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
