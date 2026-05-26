import React, { useState, useEffect } from "react";
import { FiHome, FiDollarSign, FiSettings, FiChevronDown, FiCheckCircle, FiList } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import { isAxiosError } from "axios";
import type { Facility } from "../FacilityMaster";

interface Amenity {
  _id: string;
  name: string;
}

interface AddFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: Facility | null;
}

const AddFacilityModal = ({ isOpen, onClose, onSuccess, editData }: AddFacilityModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    capacity: "",
    pricingType: "Full Day",
    basePrice: "",
    description: "",
    status: "Active",
    amenities: [] as string[],
  });

  const [errors, setErrors] = useState({
    name: "",
    type: "",
    capacity: "",
    basePrice: "",
  });

  const isEditMode = !!editData;

  useEffect(() => {
    if (isOpen) {
      setErrors({ name: "", type: "", capacity: "", basePrice: "" });

      api.get("/amenities?activeOnly=true")
        .then((res) => {
          setAmenitiesList(res.data?.data || []);
        })
        .catch(() => {
          toast.error("Failed to load amenities list");
        });

      if (editData) {
        setFormData({
          name: editData.name,
          type: editData.type,
          capacity: editData.capacity.toString(),
          pricingType: editData.pricingType,
          basePrice: editData.basePrice.toString(),
          description: editData.description || "",
          status: editData.status,
          amenities: editData.amenities?.map((a: any) => a._id || a) || [],
        });
      } else {
        setFormData({
          name: "",
          type: "",
          capacity: "",
          pricingType: "Full Day",
          basePrice: "",
          description: "",
          status: "Active",
          amenities: [],
        });
      }
    }
  }, [isOpen, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setErrors({ ...errors, [e.target.name]: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => {
      const current = prev.amenities;
      const updated = current.includes(amenityId)
        ? current.filter((id) => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenities: updated };
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", type: "", capacity: "", basePrice: "" };

    if (!formData.name.trim() || formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
      isValid = false;
    }
    
    if (!formData.type) {
      newErrors.type = "Please select a facility type";
      isValid = false;
    }

    if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
      newErrors.capacity = "Enter a valid capacity number";
      isValid = false;
    }

    if (!formData.basePrice || isNaN(Number(formData.basePrice)) || Number(formData.basePrice) < 0) {
      newErrors.basePrice = "Enter a valid base price";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        basePrice: Number(formData.basePrice),
      };

      if (isEditMode) {
        await api.put(`/facilities/${editData._id}`, payload);
        toast.success("Facility updated successfully!");
      } else {
        await api.post("/facilities", payload);
        toast.success("New facility added!");
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || "An error occurred while saving.";
        toast.error(errorMsg);
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
        <div className="relative w-full max-w-212.5 flex flex-col md:flex-row gap-4 sm:gap-6 md:max-h-[85vh] animate-fade-in">
          
          {/* Main Form Section */}
          <div className="bg-card rounded-2xl shadow-modal flex-1 flex flex-col shrink-0 md:shrink md:overflow-hidden">
            <div className="p-5 sm:p-8 flex-1 md:overflow-y-auto">
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text-primary">
                  {isEditMode ? "Edit Facility" : "Add New Facility"}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {isEditMode ? "Update details and pricing." : "Register a new event space or facility."}
                </p>
              </div>

              {/* Basic Info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <FiHome size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Basic Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Facility Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Grand Banquet"
                      className={`input-field py-3 ${errors.name ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                    />
                    {errors.name && <p className="text-xs text-danger mt-1.5 font-medium">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Facility Type</label>
                    <div className="relative">
                      <select 
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={`input-field py-3 appearance-none cursor-pointer ${errors.type ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                      >
                        <option value="" disabled>Select Type</option>
                        <option value="Marriage Hall">Marriage Hall</option>
                        <option value="Banquet Hall">Banquet Hall</option>
                        <option value="Conference Hall">Conference Hall</option>
                        <option value="Pool">Pool</option>
                        <option value="Lawn">Lawn</option>
                        <option value="Rooftop">Rooftop</option>
                        <option value="Other">Other</option>
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
                    </div>
                    {errors.type && <p className="text-xs text-danger mt-1.5 font-medium">{errors.type}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Capacity (Pax)</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      className={`input-field py-3 ${errors.capacity ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                    />
                    {errors.capacity && <p className="text-xs text-danger mt-1.5 font-medium">{errors.capacity}</p>}
                  </div>
                </div>
              </div>

              <hr className="border-border mb-8" />

              {/* Pricing details */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <FiDollarSign size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Pricing Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Base Price (₹)</label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`input-field py-3 ${errors.basePrice ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                    />
                    {errors.basePrice && <p className="text-xs text-danger mt-1.5 font-medium">{errors.basePrice}</p>}
                  </div>
                  <div>
                    <label className="input-label font-bold uppercase tracking-wider mb-2">Pricing Structure</label>
                    <div className="relative">
                      <select 
                        name="pricingType"
                        value={formData.pricingType}
                        onChange={handleChange}
                        className="input-field py-3 appearance-none cursor-pointer"
                      >
                        <option value="Hourly">Hourly</option>
                        <option value="Slot">Slot Based</option>
                        <option value="Full Day">Full Day</option>
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="input-label font-bold uppercase tracking-wider mb-2">Description / Notes (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add specific details, dimensions, or included items here..."
                    className="input-field py-3 min-h-20 resize-y"
                  />
                </div>
              </div>

              <hr className="border-border mb-8" />

              {/* Amenities Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <FiList size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Amenities Included</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity._id);
                    return (
                      <div
                        key={amenity._id}
                        onClick={() => handleAmenityToggle(amenity._id)}
                        className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-text-secondary hover:border-primary/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-center">
                          {amenity.name}
                        </span>
                      </div>
                    );
                  })}
                  {amenitiesList.length === 0 && (
                    <p className="col-span-full text-sm text-text-secondary">
                      No active amenities found.
                    </p>
                  )}
                </div>
              </div>

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
                   isEditMode ? "Update Facility" : "Save Facility"
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

          {/* Sidebar Section */}
          <div className="w-full md:w-70 flex flex-col gap-4 sm:gap-6 shrink-0 md:shrink md:overflow-y-auto no-scrollbar">
            {/* Status Card */}
            <div className="bg-card rounded-2xl shadow-modal p-6 shrink-0 border border-border">
              <div className="flex items-center gap-2 mb-4">
                 <FiSettings size={18} className="text-text-primary" />
                 <h3 className="text-lg font-bold text-text-primary">Operational Status</h3>
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Determine if this facility is currently available for bookings or blocked for upkeep.
              </p>
              
              <div className="space-y-3">
                {["Active", "Maintenance", "Blocked"].map((status) => (
                  <label 
                    key={status}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${formData.status === status ? 'border-primary bg-orange-50' : 'border-border hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span className={`text-sm font-semibold ${formData.status === status ? 'text-primary' : 'text-text-primary'}`}>
                        {status}
                      </span>
                    </div>
                    {formData.status === status && <FiCheckCircle size={18} className="text-primary" />}
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddFacilityModal;