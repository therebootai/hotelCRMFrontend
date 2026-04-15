import React, { useState, useEffect } from "react";
import { User, Briefcase, Key, Eye, Camera, ChevronDown, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import { isAxiosError } from "axios";
import type { User as StaffMembar  }  from "../../../context/AuthContext";
// import { StaffMember } from "../../../lib/axios"

const ModalToggleSwitch = ({ isActive, onToggle }: { isActive: boolean; onToggle: () => void; }) => (
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

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: StaffMembar | null;
}

const AddStaffModal = ({ isOpen, onClose, onSuccess, editData }: AddStaffModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Unified Form State
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    role: "",
    loginId: "",
    password: "",
    isActive: true,
  });

  const isEditMode = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          fullName: editData.fullName || "",
          mobile: editData.mobile || "",
          role: editData.role || "",
          loginId: editData.loginId || "",
          password: "",
          isActive: editData.isActive ?? true,
        });
      } else {
        // Reset for ADD
        setFormData({
          fullName: "",
          mobile: "",
          role: "",
          loginId: "",
          password: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Basic Frontend Validation (Matches your Zod schema)
    if (!formData.fullName || formData.fullName.length < 3) return toast.error("Full name must be at least 3 characters");
    if (!formData.mobile || formData.mobile.length < 10) return toast.error("Invalid mobile number");
    if (!formData.role) return toast.error("Please select a role");
    
    // Login ID and Password are required ONLY in Add Mode
    if (!isEditMode) {
      if (!formData.loginId || formData.loginId.length < 4) return toast.error("Login ID must be at least 4 characters");
      if (!formData.password || formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        // PUT REQUEST (Update)
        // Based on your schema, PUT doesn't take loginId or password
        const payload = {
          fullName: formData.fullName,
          mobile: formData.mobile,
          role: formData.role,
          isActive: formData.isActive
        };
        await api.put(`/users/${editData._id}`, payload);
        toast.success("Staff updated successfully!");
      } else {
        // POST REQUEST (Create)
        await api.post("/users", formData);
        toast.success("New staff member added!");
      }

      onSuccess(); // Refresh the table data
      onClose();   // Close the modal
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error;
        toast.error(errorMsg || "An error occurred while saving.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full h-full overflow-y-auto md:overflow-hidden flex justify-center items-start md:items-center p-4 py-8 sm:p-6 md:py-12 z-10">
        <div className="relative w-full max-w-[850px] flex flex-col md:flex-row gap-4 sm:gap-6 md:max-h-[85vh] animate-fade-in">
          
          {/* --- LEFT COLUMN: Form --- */}
          <div className="bg-card rounded-2xl shadow-modal flex-1 flex flex-col shrink-0 md:shrink md:overflow-hidden">
            <div className="p-5 sm:p-8 flex-1 md:overflow-y-auto">
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text-primary">
                  {isEditMode ? "Edit Staff Member" : "Add New Staff"}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {isEditMode ? "Update details and permissions." : "Create a new profile for property access."}
                </p>
              </div>

              {/* Basic Info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <User size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Basic Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Masud Rahaman"
                      className="input-field py-3"
                    />
                  </div>
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Mobile Number</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 86956 02588"
                      className="input-field py-3"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border mb-8" />

              {/* Role & Access */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <Briefcase size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Role & Access</h3>
                </div>
                <div>
                  <label className="input-label font-bold uppercase tracking-wider mb-2">Staff Role</label>
                  <div className="relative">
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="input-field py-3 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a role</option>
                      <option value="admin">Admin</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Hide Login details block completely if editing (based on your schema) */}
              {!isEditMode && (
                <>
                  <hr className="border-border mb-8" />
                  <div className="mb-2 md:mb-4">
                    <div className="flex items-center gap-3 mb-5">
                      <Key size={20} className="text-primary" />
                      <h3 className="text-lg font-bold text-text-primary">Login Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label font-bold uppercase tracking-wider mb-2">Login ID</label>
                        <input
                          type="text"
                          name="loginId"
                          value={formData.loginId}
                          onChange={handleChange}
                          placeholder="staff_username"
                          className="input-field py-3"
                        />
                      </div>
                      <div>
                        <label className="input-label font-bold uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="input-field pr-10 py-3"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-5 sm:p-8 pt-4 md:pt-0 flex items-center gap-3 bg-white mt-auto border-t border-gray-50 md:border-none shrink-0">
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 flex items-center justify-center min-w-30"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                   isEditMode ? "Update Staff" : "Save Staff"
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="btn-secondary w-full sm:w-auto px-6 py-2.5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Status & Photo Cards --- */}
          <div className="w-full md:w-70 flex flex-col gap-4 sm:gap-6 shrink-0 md:shrink md:overflow-y-auto no-scrollbar">
            
            <div className="bg-card rounded-2xl shadow-modal p-6 shrink-0">
              <h3 className="text-lg font-bold text-text-primary mb-4">Staff Status</h3>
              <div className="bg-background rounded-xl p-4 flex items-center justify-between mb-4 border border-border">
                <div>
                  <p className="text-sm font-bold text-text-primary">Account Active</p>
                  <p className="text-xs text-text-secondary mt-0.5">Staff can login</p>
                </div>
                <ModalToggleSwitch
                  isActive={formData.isActive}
                  onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })}
                />
              </div>
              <div className="border-l-2 border-red-200 pl-3">
                <p className="text-xs text-danger/80 leading-relaxed">
                  Tip: Disabling an account prevents the user from accessing the ERP immediately.
                </p>
              </div>
            </div>

            <div className="bg-primary rounded-2xl shadow-modal p-6 text-white flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute right-[-20px] top-[20px] opacity-10 pointer-events-none">
                 <User size={120} />
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                <Camera size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Upload Photo</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-6 relative z-10">
                Avatar generation is currently active based on name.
              </p>
              <button className="bg-white text-primary hover:bg-gray-50 font-bold rounded-lg px-6 py-2.5 w-full transition-colors relative z-10 opacity-50 cursor-not-allowed">
                Coming Soon
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaffModal;