import React, { useState, useEffect } from "react";
import { FiLoader, FiInfo } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import { AxiosError } from "axios";
import type { Room } from "./RoomTable";

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
  initialData?: Room | null;
}

export default function AddRoomForm({ onCancel, onSuccess, initialData }: AddRoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDeps, setIsFetchingDeps] = useState(true);

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [taxes, setTaxes] = useState<TaxGst[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);

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
        setTaxes(taxRes.data?.data  || []);
        setAmenitiesList(amRes.data?.data || []);

        if (initialData) {
          setFormData({
            roomNumber: initialData.roomNumber || "",
            roomType: initialData.roomType?._id || "",
            building: initialData.building || "",
            floor: initialData.floor || "",
            maxAdults: initialData.maxAdults?.toString() || "1",
            maxChildren: initialData.maxChildren?.toString() || "0",
            extraBedAllowed: initialData.extraBedAllowed || false,
            extraBedCharge: initialData.extraBedCharge?.toString() || "0",
            basePrice: initialData.basePrice?.toString() || "",
            discountPercentage: initialData.discountPercentage?.toString() || "0",
            gstId: initialData.gstId?._id || "",
            roomSize: initialData.roomSize?.toString() || "",
            viewType: initialData.viewType || "",
            status: initialData.status || "Active",
            description: initialData.description || "",
            amenities: initialData.amenities?.map((a) => a._id) || [],
          });
        }
      } catch (error) {
        toast.error("Failed to load form options");
      } finally {
        setIsFetchingDeps(false);
      }
    };

    fetchDependencies();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.roomNumber.trim()) newErrors.roomNumber = "Room Number is required";
    if (!formData.roomType) newErrors.roomType = "Room Type is required";

    const basePriceNum = Number(formData.basePrice);
    if (formData.basePrice === "" || isNaN(basePriceNum)) {
      newErrors.basePrice = "Base Price is required";
    } else if (basePriceNum < 0) {
      newErrors.basePrice = "Cannot be negative";
    }

    const discountNum = Number(formData.discountPercentage);
    if (discountNum < 0 || discountNum > 100) {
      newErrors.discountPercentage = "Must be between 0 and 100";
    }

    const adultsNum = Number(formData.maxAdults);
    if (isNaN(adultsNum) || adultsNum < 1) {
      newErrors.maxAdults = "At least 1 adult required";
    }

    const childrenNum = Number(formData.maxChildren);
    if (isNaN(childrenNum) || childrenNum < 0) {
      newErrors.maxChildren = "Cannot be negative";
    }

    if (formData.roomSize !== "") {
      const sizeNum = Number(formData.roomSize);
      if (isNaN(sizeNum) || sizeNum < 1) {
        newErrors.roomSize = "Must be at least 1 sq ft";
      }
    }

    if (formData.extraBedAllowed) {
      const extraBedNum = Number(formData.extraBedCharge);
      if (formData.extraBedCharge === "" || isNaN(extraBedNum) || extraBedNum < 0) {
        newErrors.extraBedCharge = "Valid charge >= 0 required";
      }
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

      if (!payload.building) delete payload.building;
      if (!payload.floor) delete payload.floor;
      if (!payload.gstId) delete payload.gstId;
      if (!payload.viewType) delete payload.viewType;
      if (!payload.description) delete payload.description;

      if (initialData?._id) {
        await api.put(`/rooms/${initialData._id}`, payload);
        toast.success("Room updated successfully!");
      } else {
        await api.post("/rooms", payload);
        toast.success("Room created successfully!");
      }
      
      onSuccess();
    } catch (error: unknown) {
      let errorMsg = initialData ? "Failed to update room" : "Failed to create room";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingDeps) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <FiLoader className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading room data...</p>
      </div>
    );
  }

  const numericBasePrice = Number(formData.basePrice) || 0;
  const numericDiscount = Number(formData.discountPercentage) || 0;
  const discountAmount = (numericBasePrice * numericDiscount) / 100;
  const discountedPrice = numericBasePrice - discountAmount;

  const selectedTax = taxes.find((t) => t._id === formData.gstId);
  const taxPercentage = selectedTax?.percentage || 0;
  const taxAmount = (discountedPrice * taxPercentage) / 100;

  const finalPrice = discountedPrice + taxAmount;

  const selectedRoomType = roomTypes.find((rt) => rt._id === formData.roomType);
  const roomTypeName = selectedRoomType ? selectedRoomType.name : "Select Type";
  const displayBuilding = formData.building ? ` • ${formData.building}` : "";

  return (
    <div className="animate-fade-in mt-6 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card p-6 lg:p-8">
          <div className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Room Number *</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101"
                    className={`input-field ${errors.roomNumber ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.roomNumber && (
                    <p className="text-xs text-danger mt-1 font-medium">
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
                    className={`input-field cursor-pointer ${errors.roomType ? "border-danger focus:ring-danger/20" : ""}`}
                  >
                    <option value="">Select Type</option>
                    {roomTypes.map((rt) => (
                      <option key={rt._id} value={rt._id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                  {errors.roomType && (
                    <p className="text-xs text-danger mt-1 font-medium">
                      {errors.roomType}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Room Size (sq ft)</label>
                  <input
                    type="number"
                    name="roomSize"
                    value={formData.roomSize}
                    onChange={handleChange}
                    placeholder="e.g. 450"
                    className={`input-field ${errors.roomSize ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.roomSize && (
                    <p className="text-xs text-danger mt-1 font-medium">
                      {errors.roomSize}
                    </p>
                  )}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Base Price *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`input-field ${errors.basePrice ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.basePrice && (
                    <p className="text-xs text-danger mt-1 font-medium">
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
                    className={`input-field ${errors.discountPercentage ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.discountPercentage && (
                    <p className="text-xs text-danger mt-1 font-medium">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Max Adults</label>
                  <input
                    type="number"
                    name="maxAdults"
                    value={formData.maxAdults}
                    onChange={handleChange}
                    min="1"
                    className={`input-field ${errors.maxAdults ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.maxAdults && (
                    <p className="text-xs text-danger mt-1 font-medium">
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
                    className={`input-field ${errors.maxChildren ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.maxChildren && (
                    <p className="text-xs text-danger mt-1 font-medium">
                      {errors.maxChildren}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-start gap-6 bg-background p-4 rounded-xl border ${errors.extraBedCharge ? "border-danger bg-danger/5" : "border-border"}`}
              >
                <label className="flex items-center gap-3 cursor-pointer mt-2.5">
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
                    className={`input-field disabled:opacity-50 ${errors.extraBedCharge ? "border-danger focus:ring-danger/20" : ""}`}
                  />
                  {errors.extraBedCharge && (
                    <p className="text-xs text-danger mt-1 font-medium">
                      {errors.extraBedCharge}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Amenities */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2">
                Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
            <div className="space-y-4">
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
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: PREVIEW CARD (Sticky & Fit Content) */}
        {/* ========================================== */}
        <div className="xl:col-span-1 sticky top-6 h-fit">
          <div className="bg-card border border-border rounded-3xl shadow-card p-6 xl:p-8">
            {/* Header */}
            <div className="mb-8 border-b border-border pb-4">
              <h2 className="text-[24px] font-bold text-text-primary leading-tight">
                Room #{formData.roomNumber || "---"}
              </h2>
              <p className="text-sm text-text-secondary mt-1 font-medium">
                {roomTypeName}
                {displayBuilding}
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between items-center text-text-secondary">
                <span>Base Rate</span>
                <span className="font-medium text-text-primary">
                  ₹
                  {numericBasePrice.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Discount ({numericDiscount}%)</span>
                <span className="font-medium text-success">
                  - ₹
                  {discountAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>GST ({taxPercentage}%)</span>
                <span className="font-medium text-text-primary">
                  ₹
                  {taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Final Price Block */}
            <div className="bg-primary/5 rounded-2xl p-4 flex items-center justify-between mb-6 border border-primary/20">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Final Price
              </span>
              <span className="text-2xl font-bold text-primary tracking-tight">
                ₹
                {finalPrice.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            {/* Capacity & View Block */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-background border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Capacity
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {formData.maxAdults || 0} Adult + {formData.maxChildren || 0}{" "}
                  Child
                </span>
              </div>
              <div className="bg-background border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center overflow-hidden">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                  View
                </span>
                <span className="text-sm font-semibold text-text-primary truncate w-full px-1">
                  {formData.viewType || "Standard"}
                </span>
              </div>
            </div>

            {/* Action Buttons utilizing native class definitions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="btn-secondary w-full py-3 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary w-full py-3 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : initialData ? (
                  "Update Room"
                ) : (
                  "Save Room"
                )}
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3 text-text-secondary text-xs leading-relaxed">
              <FiInfo size={16} className="shrink-0 mt-0.5 text-warning" />
              <p>
                Prices are automatically calculated including selected tax.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}