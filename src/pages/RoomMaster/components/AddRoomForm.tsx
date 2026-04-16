import React, { useState } from "react";
import { Info, Image as ImageIcon } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

interface AddRoomFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddRoomForm({ onCancel, onSuccess }: AddRoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "Deluxe Suite",
    building: "Villa",
    floor: "0",
    maxAdults: 2,
    maxChildren: 1,
    extraBedAllowed: false,
    extraBedCharge: 1500,
    basePrice: 8500,
    discountPercentage: 10,
    gstId: "18% Premium",
    roomSize: 350,
    viewType: "Ocean View",
    amenities: ["Free WIFI", "Air Conditioning"],
    description: "",
    status: "Active" as "Active" | "Maintenance" | "Blocked",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const toggleExtraBed = () => {
    setFormData((prev) => ({
      ...prev,
      extraBedAllowed: !prev.extraBedAllowed,
    }));
  };

  // Calculated Preview Values
  const discountAmount =
    (formData.basePrice * formData.discountPercentage) / 100;
  const priceAfterDiscount = formData.basePrice - discountAmount;
  const gstAmount = (priceAfterDiscount * 18) / 100;
  const finalPrice = priceAfterDiscount + gstAmount;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        roomType: "60d5ecb8b392d700153ee000",
        gstId: "60d5ecb8b392d700153ee001",
      };

      await api.post("/rooms", payload);
      toast.success("Room created successfully!");
      onSuccess();
    } catch (error: unknown) {
      let errorMsg = "Failed to create room";
      if (error instanceof Error) errorMsg = error.message;
      if (error instanceof AxiosError) errorMsg = error.response?.data.message;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start mt-4 animate-fade-in">
      {/* LEFT COLUMN: FORM SECTIONS */}
      <div className="flex-1 space-y-6 w-full min-w-0">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Basic Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Room Number
              </label>
              <input
                type="text"
                name="roomNumber"
                placeholder="e.g. 101"
                value={formData.roomNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Room Type
              </label>
              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className="input-field cursor-pointer"
              >
                <option>Deluxe Suite</option>
                <option>Executive Room</option>
              </select>
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Building
              </label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                className="input-field cursor-pointer"
              >
                <option>Villa</option>
                <option>Main Tower</option>
              </select>
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Floor
              </label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Capacity Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Capacity Details
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Max Adults
              </label>
              <input
                type="number"
                name="maxAdults"
                value={formData.maxAdults}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Max Children
              </label>
              <input
                type="number"
                name="maxChildren"
                value={formData.maxChildren}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border mb-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Extra Bed Allowed
              </p>
              <p className="text-xs text-text-secondary">
                Check if the room can accommodate an additional bed
              </p>
            </div>
            <button
              onClick={toggleExtraBed}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${formData.extraBedAllowed ? "bg-primary" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ${formData.extraBedAllowed ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {formData.extraBedAllowed && (
            <div className="animate-fade-in">
              <label className="input-label uppercase tracking-wider text-[10px]">
                Extra Bed Charge (₹)
              </label>
              <input
                type="number"
                name="extraBedCharge"
                value={formData.extraBedCharge}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          )}
        </div>

        {/* Pricing Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
            Pricing Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Base Price (₹)
              </label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                Discount (%)
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">
                GST (%)
              </label>
              <select
                name="gstId"
                value={formData.gstId}
                onChange={handleChange}
                className="input-field cursor-pointer"
              >
                <option>18% Premium</option>
                <option>12% Standard</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW CARD (Sticky) */}
      <div className="w-full lg:w-95 shrink-0 sticky top-6 space-y-4">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {/* Mock Image Area */}
          <div className="w-full h-40 bg-background rounded-lg border border-border mb-4 flex items-center justify-center relative overflow-hidden">
            <ImageIcon size={32} className="text-text-secondary opacity-50" />
            <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-text-primary text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm shadow-sm">
              Preview
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              Room #{formData.roomNumber || "---"}
            </h2>
            <p className="text-sm text-text-secondary">
              {formData.roomType} • {formData.building}
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Base Rate</span>
              <span className="font-medium text-text-primary">
                ₹{formData.basePrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                Discount ({formData.discountPercentage}%)
              </span>
              <span className="font-medium text-success">
                - ₹{discountAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">GST (18%)</span>
              <span className="font-medium text-text-primary">
                ₹{gstAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg mb-6">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Final Price
            </span>
            <span className="text-xl font-bold text-primary">
              ₹{finalPrice.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                Capacity
              </span>
              <span className="text-xs font-medium text-text-primary">
                {formData.maxAdults} Adult + {formData.maxChildren} Child
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                View
              </span>
              <span className="text-xs font-medium text-text-primary">
                {formData.viewType}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? "Saving..." : "Save Room"}
            </button>
          </div>
        </div>

        {/* Info Notification */}
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
          <Info size={18} className="text-orange-500 shrink-0" />
          <p className="text-xs text-orange-800 leading-relaxed">
            Prices are automatically calculated including selected taxes and
            seasonal multipliers.
          </p>
        </div>
      </div>
    </div>
  );
}
