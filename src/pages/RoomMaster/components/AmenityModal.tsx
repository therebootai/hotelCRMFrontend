import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { IoSnowOutline } from 'react-icons/io5';
import { FiWifi, FiTv, FiCoffee, FiStar, FiTrendingUp, FiShield, FiDelete, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

// Map string identifiers to react-icons
export const ICON_MAP: Record<string, React.ElementType> = {
  snowflake: IoSnowOutline,
  wifi: FiWifi,
  tv: FiTv,
  coffee: FiCoffee,
  waves: FiStar,
  dumbbell: FiTrendingUp,
  utensils: FiCoffee,
  wine: FiCoffee,
  car: FiPhone,
  paw: FiDelete,
  ban: FiShield,
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface AmenityData {
  _id?: string;
  name: string;
  icon: string;
  isActive?: boolean;
}

interface AmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AmenityData | null;
}

export default function AmenityModal({ isOpen, onClose, onSuccess, initialData }: AmenityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'wifi',
  });
  const [errors, setErrors] = useState<{ name?: string; icon?: string }>({});
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);

  useEffect(() => {
    setErrors({});
    setIsIconSelectorOpen(false);
    
    if (initialData) {
      setFormData({ name: initialData.name, icon: initialData.icon });
    } else {
      setFormData({ name: '', icon: 'wifi' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; icon?: string } = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = "Amenity name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.icon) {
      newErrors.icon = "Icon identifier is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleIconSelect = (iconKey: string) => {
    setFormData(prev => ({ ...prev, icon: iconKey }));
    setIsIconSelectorOpen(false);
    if (errors.icon) {
      setErrors(prev => ({ ...prev, icon: undefined }));
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
        await api.put(`/amenities/${initialData._id}`, formData);
        toast.success("Amenity updated successfully!");
      } else {
        await api.post("/amenities", formData);
        toast.success("Amenity created successfully!");
      }
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMsg = "Failed to save amenity";
      
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

  const SelectedIcon = ICON_MAP[formData.icon] || FiWifi;

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
            {initialData ? 'Edit Amenity' : 'Add New Amenity'}
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
          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Amenity Name</label>
            <input 
              type="text" 
              placeholder="e.g. Infinity Pool" 
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

          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Select Icon</label>
            <div className="relative">
              {/* Dropdown Trigger */}
              <button 
                type="button"
                disabled={isLoading}
                onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)}
                className={`input-field w-full flex items-center justify-between bg-background disabled:opacity-70 disabled:cursor-not-allowed ${
                  errors.icon ? 'border-red-500' : ''
                }`}
              >
                <div className="flex items-center gap-3 text-primary">
                  <SelectedIcon size={18} />
                  <span className="text-text-primary text-sm font-medium capitalize">{formData.icon}</span>
                </div>
              </button>
              {errors.icon && (
                <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">{errors.icon}</p>
              )}

              {/* Expandable Icon Grid */}
              {isIconSelectorOpen && !isLoading && (
                <div className="absolute top-full left-0 w-full mt-2 p-3 bg-card border border-border rounded-xl shadow-card z-20 animate-fade-in grid grid-cols-4 gap-2 max-h-50 overflow-y-auto no-scrollbar">
                  {AVAILABLE_ICONS.map((iconKey) => {
                    const IconComp = ICON_MAP[iconKey];
                    const isSelected = formData.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => handleIconSelect(iconKey)}
                        className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'text-text-secondary hover:bg-background hover:text-text-primary border border-transparent'
                        }`}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            {isLoading ? "Saving..." : "Confirm Amenity"}
          </button>
        </div>
      </div>
    </div>
  );
}