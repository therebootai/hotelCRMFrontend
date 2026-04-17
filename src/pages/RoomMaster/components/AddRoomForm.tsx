import React, { useState, useEffect } from "react";
import { Save, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import { AxiosError, isAxiosError } from "axios";

export interface Amenity {
  _id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface RoomType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TaxGst {
  _id: string;
  name: string;
  percentage: number;
  type: "Room" | "Food" | "Service";
  isActive: boolean;
}

interface AddRoomFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddRoomForm({ onCancel, onSuccess }: AddRoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDeps, setIsFetchingDeps] = useState(true);

  // Dependency Data States
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [taxes, setTaxes] = useState<TaxGst[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "",
    building: "",
    floor: "",
    maxAdults: "1",
    maxChildren: "0",
    extraBedAllowed: false,
    extraBedCharge: "0",
    basePrice: "",
    discountPercentage: "0",
    gstId: "",
    roomSize: "",
    viewType: "",
    status: "Active",
    description: "",
    amenities: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setIsFetchingDeps(true);
        const [rtRes, taxRes, amRes] = await Promise.all([
          api.get("/room-types"),
          api.get("/tax-gst?type=Room"),
          api.get("/amenities"),
        ]);

        setRoomTypes(rtRes.data?.data || []);
        setTaxes(taxRes.data?.data || []);
        setAmenitiesList(amRes.data?.data || []);
      } catch (error: unknown) {
        let errMsg = "Failed to load form options (Room Types, Taxes, etc.)";
        if (isAxiosError(error)) {
          errMsg = error.message;
        }
        toast.error(errMsg);
      } finally {
        setIsFetchingDeps(false);
      }
    };

    fetchDependencies();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roomNumber.trim())
      newErrors.roomNumber = "Room Number is required";
    if (!formData.roomType) newErrors.roomType = "Room Type is required";
    if (!formData.basePrice) newErrors.basePrice = "Base Price is required";
    if (Number(formData.basePrice) < 0)
      newErrors.basePrice = "Cannot be negative";
    if (Number(formData.maxAdults) < 1)
      newErrors.maxAdults = "At least 1 adult required";
    if (
      Number(formData.discountPercentage) > 100 ||
      Number(formData.discountPercentage) < 0
    ) {
      newErrors.discountPercentage = "Must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    try {
      setIsLoading(true);

      const payload: Record<string, any> = {
        ...formData,
        maxAdults: Number(formData.maxAdults),
        maxChildren: Number(formData.maxChildren),
        extraBedCharge: Number(formData.extraBedCharge) || 0,
        basePrice: Number(formData.basePrice),
        discountPercentage: Number(formData.discountPercentage) || 0,
        roomSize: formData.roomSize ? Number(formData.roomSize) : undefined,
      };

      // Clean up empty optional fields so backend defaults apply cleanly
      if (!payload.building) delete payload.building;
      if (!payload.floor) delete payload.floor;
      if (!payload.gstId) delete payload.gstId;
      if (!payload.viewType) delete payload.viewType;
      if (!payload.description) delete payload.description;

      await api.post("/rooms", payload);

      toast.success("Room created successfully!");
      onSuccess();
    } catch (error: unknown) {
      let errorMsg = "Failed to create room";
      if (error instanceof AxiosError) {
        errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingDeps) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 mt-6">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* Section 1: Basic Information */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Room Number *</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101"
                  className={`input-field ${errors.roomNumber ? "border-red-500" : ""}`}
                />
                {errors.roomNumber && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.roomNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Room Type *</label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className={`input-field cursor-pointer ${errors.roomType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {roomTypes.map((rt) => (
                    <option key={rt._id} value={rt._id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
                {errors.roomType && (
                  <p className="text-xs text-red-500 mt-1">{errors.roomType}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Building Name</label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  placeholder="e.g. North Wing"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Floor</label>
                <input
                  type="text"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="e.g. 1st Floor"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="input-label">Room Size (sq ft)</label>
                <input
                  type="number"
                  name="roomSize"
                  value={formData.roomSize}
                  onChange={handleChange}
                  placeholder="e.g. 450"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">View Type</label>
                <input
                  type="text"
                  name="viewType"
                  value={formData.viewType}
                  onChange={handleChange}
                  placeholder="e.g. Ocean View"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Rules */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
              Pricing & Rules
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="input-label">Base Price *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`input-field ${errors.basePrice ? "border-red-500" : ""}`}
                />
                {errors.basePrice && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.basePrice}
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Discount (%)</label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  placeholder="0"
                  className={`input-field ${errors.discountPercentage ? "border-red-500" : ""}`}
                />
                {errors.discountPercentage && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.discountPercentage}
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Tax / GST</label>
                <select
                  name="gstId"
                  value={formData.gstId}
                  onChange={handleChange}
                  className="input-field cursor-pointer"
                >
                  <option value="">No Tax Applied</option>
                  {taxes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.percentage}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Max Adults</label>
                <input
                  type="number"
                  name="maxAdults"
                  value={formData.maxAdults}
                  onChange={handleChange}
                  min="1"
                  className={`input-field ${errors.maxAdults ? "border-red-500" : ""}`}
                />
                {errors.maxAdults && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.maxAdults}
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Max Children</label>
                <input
                  type="number"
                  name="maxChildren"
                  value={formData.maxChildren}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 bg-background p-4 rounded-xl border border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="extraBedAllowed"
                  checked={formData.extraBedAllowed}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-sm font-medium text-text-primary">
                  Allow Extra Bed
                </span>
              </label>

              <div className="flex-1">
                <input
                  type="number"
                  name="extraBedCharge"
                  value={formData.extraBedCharge}
                  onChange={handleChange}
                  disabled={!formData.extraBedAllowed}
                  placeholder="Extra bed charge..."
                  className="input-field disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Amenities */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
              Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
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
                  No amenities configured yet.
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
              Description
            </h3>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the room layout, special features, etc..."
              className="input-field min-h-25 resize-y py-3"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary px-6 py-2.5"
          >
            <X size={18} className="mr-2 inline-block" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary px-8 py-2.5 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isLoading ? "Saving..." : "Save Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
