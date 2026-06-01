import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import type { StaffMember, StaffFormPayload } from "./types";

const extractSaveError = (error: unknown): string => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "An error occurred while saving."
    );
  }
  return "An unexpected error occurred.";
};

export function useStaffData() {
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

  const toggleStatus = async (staffId: string, currentStatus: boolean) => {
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

  const createStaff = async (payload: StaffFormPayload): Promise<boolean> => {
    try {
      await api.post("/users", payload);
      toast.success("New staff member added!");
      fetchStaff();
      return true;
    } catch (error) {
      toast.error(extractSaveError(error));
      return false;
    }
  };

  const updateStaff = async (
    id: string,
    payload: StaffFormPayload,
  ): Promise<boolean> => {
    try {
      await api.put(`/users/${id}`, {
        fullName: payload.fullName,
        mobile: payload.mobile,
        role: payload.role,
        isActive: payload.isActive,
      });
      toast.success("Staff updated successfully!");
      fetchStaff();
      return true;
    } catch (error) {
      toast.error(extractSaveError(error));
      return false;
    }
  };

  const deleteStaff = async (staff: StaffMember): Promise<boolean> => {
    try {
      await api.delete(`/users/${staff._id}`);
      setStaffList((prev) => prev.filter((s) => s._id !== staff._id));
      toast.success(`${staff.fullName} has been deleted.`);
      return true;
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete user.");
      } else {
        toast.error("An unexpected error occurred.");
      }
      return false;
    }
  };

  return {
    staffList,
    isLoading,
    fetchStaff,
    toggleStatus,
    createStaff,
    updateStaff,
    deleteStaff,
  };
}
