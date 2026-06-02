import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

interface RoomTypeData {
  _id?: string;
  name: string;
  description: string;
  basePrice: number | string;
}

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RoomTypeData | null;
}

export default function RoomTypeModal({ isOpen, onClose, onSuccess, initialData }: RoomTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '' as number | string,
  });
  const [errors, setErrors] = useState<{ name?: string; basePrice?: string }>({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        basePrice: initialData.basePrice ?? '',
      });
    } else {
      setFormData({ name: '', description: '', basePrice: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; basePrice?: string } = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = "Room Type name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors first");
      return;
    }

    if (formData.basePrice === "" || Number(formData.basePrice) < 0) {
      setErrors((prev) => ({ ...prev, basePrice: "Base price is required and must be 0 or more" }));
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice),
      };

      if (initialData?._id) {
        await api.put(`/room-types/${initialData._id}`, payload);
        toast.success("Room Type updated successfully!");
      } else {
        await api.post("/room-types", payload);
        toast.success("Room Type created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMsg = "Failed to save room type";

      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="bg-card rounded-2xl shadow-modal w-full max-w-[40%] relative z-10 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">
            {initialData ? 'Edit Room Type' : 'Add New Room Type'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!initialData && (
            <p className="text-sm text-text-secondary -mt-2 mb-4">Create a new category for your inventory system.</p>
          )}

          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Type Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Presidential Penthouse"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`input-field disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Description</label>
            <textarea
              name="description"
              placeholder="Describe the room features, view, and specific amenities..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              className="input-field min-h-25 resize-none py-3 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="basePrice"
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2500"
            />
            {errors.basePrice && (
              <p className="text-red-500 text-xs mt-1">{errors.basePrice}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-background p-6 flex items-center gap-3 border-t border-border rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Room Type"}
          </button>
        </div>
      </div>
    </div>
  );
}
