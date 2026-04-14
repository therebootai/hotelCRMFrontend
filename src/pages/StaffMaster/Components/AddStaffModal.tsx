import React, { useState } from "react";
import { User, Briefcase, Key, Eye, Camera, ChevronDown } from "lucide-react";

// Local toggle switch for the modal's active status
const ModalToggleSwitch = ({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
      isActive ? "bg-[#FF5A3C]" : "bg-gray-300"
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
}

const AddStaffModal = ({ isOpen, onClose }: AddStaffModalProps) => {
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  return (
    // 1. OUTermost wrapper: Handles the fixed position and backdrop
    <div className="fixed inset-0 z-50 flex">
      
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 2. SCROLLING VIEWPORT: 
          On mobile, this entire container scrolls smoothly. 
          On desktop (md), it stops scrolling and centers the modal. */}
      <div className="relative w-full h-full overflow-y-auto md:overflow-hidden flex justify-center items-start md:items-center p-4 py-8 sm:p-6 md:py-12 z-10">
        
        {/* 3. MODAL CONTAINER: 
            Stacks vertically on mobile, side-by-side on desktop.
            Height is ONLY restricted on desktop (md:max-h-[85vh]). */}
        <div className="relative w-full max-w-[850px] flex flex-col md:flex-row gap-4 sm:gap-6 md:max-h-[85vh] animate-fade-in">
          
          {/* --- LEFT COLUMN: Form --- */}
          {/* overflow-hidden applies ONLY on desktop to allow internal scrolling */}
          <div className="bg-white rounded-2xl shadow-xl flex-1 flex flex-col shrink-0 md:shrink md:overflow-hidden">
            
            {/* Form Fields - Internal scroll enabled ONLY on desktop */}
            <div className="p-5 sm:p-8 flex-1 md:overflow-y-auto">
              
              {/* Basic Info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <User size={20} className="text-[#FF5A3C]" />
                  <h3 className="text-lg font-bold text-gray-900">Basic Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Masud Rahaman"
                      className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#FF5A3C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 86956 02588"
                      className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#FF5A3C] outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 mb-8" />

              {/* Role & Access */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <Briefcase size={20} className="text-[#FF5A3C]" />
                  <h3 className="text-lg font-bold text-gray-900">Role & Access</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Staff Role
                  </label>
                  <div className="relative">
                    <select defaultValue="" className="w-full appearance-none bg-gray-50 border-none rounded-lg px-4 py-3 text-sm text-gray-900 focus:ring-1 focus:ring-[#FF5A3C] outline-none cursor-pointer">
                      <option value="" disabled>
                        Select a role
                      </option>
                      <option>Admin</option>
                      <option>Receptionist</option>
                      <option>Waiter</option>
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 mb-8" />

              {/* Login Details */}
              <div className="mb-2 md:mb-4">
                <div className="flex items-center gap-3 mb-5">
                  <Key size={20} className="text-[#FF5A3C]" />
                  <h3 className="text-lg font-bold text-gray-900">Login Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Login ID
                    </label>
                    <input
                      type="text"
                      placeholder="staff_username"
                      className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#FF5A3C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border-none rounded-lg pl-4 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#FF5A3C] outline-none"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer - Fixed at bottom on desktop, flows naturally on mobile */}
            <div className="p-5 sm:p-8 pt-4 md:pt-0 flex items-center gap-3 bg-white mt-auto border-t border-gray-50 md:border-none shrink-0">
              <button className="bg-[#FF5A3C] hover:bg-[#E5492E] text-white font-medium rounded-lg px-6 py-2.5 transition-colors w-full sm:w-auto">
                Save Staff
              </button>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-6 py-2.5 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Cards --- */}
          <div className="w-full md:w-[280px] flex flex-col gap-4 sm:gap-6 shrink-0 md:shrink md:overflow-y-auto no-scrollbar">
            
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Status</h3>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between mb-4 border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Account Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">Staff can login immediately</p>
                </div>
                <ModalToggleSwitch
                  isActive={isActive}
                  onToggle={() => setIsActive(!isActive)}
                />
              </div>
              <div className="border-l-2 border-red-200 pl-3">
                <p className="text-xs text-red-400/80 leading-relaxed">
                  Tip: New staff accounts are set to active by default. You can
                  disable access at any time from the staff directory.
                </p>
              </div>
            </div>

            {/* Upload Photo Card */}
            <div className="bg-[#FF5A3C] rounded-2xl shadow-xl p-6 text-white flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute right-[-20px] top-[20px] opacity-10 pointer-events-none">
                 <User size={120} />
              </div>

              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                <Camera size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Upload Photo</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-6 relative z-10">
                Add a profile image for identification in the staff portal.
              </p>
              <button className="bg-white text-[#FF5A3C] hover:bg-gray-50 font-bold rounded-lg px-6 py-2.5 w-full transition-colors relative z-10">
                Choose Image
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaffModal;