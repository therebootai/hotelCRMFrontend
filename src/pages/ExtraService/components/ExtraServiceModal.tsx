import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

interface ExtraServiceData {
  _id?: string;
  name: string;
  isActive?: boolean;
}

interface ExtraServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ExtraServiceData | null;
}

export default function ExtraServiceModal({ isOpen, onClose, onSuccess, initialData }: ExtraServiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    setErrors({});
    
    if (initialData) {
      setFormData({ name: initialData.name });
    } else {
      setFormData({ name: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string } = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = "Service name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: e.target.value });
    if (errors.name) {
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors first");
      return;
    }

    try {
      setIsLoading(true);
      
      if (initialData?._id) {
        await api.put(`/extra-services/${initialData._id}`, formData);
        toast.success("Extra Service updated successfully!");
      } else {
        await api.post("/extra-services", formData);
        toast.success("Extra Service created successfully!");
      }
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMsg = "Failed to save extra service";
      
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            {initialData ? 'Edit Extra Service' : 'Add New Extra Service'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Service Name</label>
            <input 
              type="text" 
              placeholder="e.g. Laundry / Ironing" 
              value={formData.name} 
              onChange={handleNameChange}
              disabled={isLoading}
              className={`input-field disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
              }`} 
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">{errors.name}</p>
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
            {isLoading ? "Saving..." : "Confirm Service"}
          </button>
        </div>
      </div>
    </div>
  );
}