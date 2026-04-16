import React, { useState, useEffect } from 'react';
import { X, Snowflake, Wifi, Tv, Coffee, Waves, Dumbbell, Utensils, Wine, Car, PawPrint, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
// import api from '../../../lib/axios';

// Map string identifiers to actual Lucide icons
export const ICON_MAP: Record<string, React.ElementType> = {
  snowflake: Snowflake,
  wifi: Wifi,
  tv: Tv,
  coffee: Coffee,
  waves: Waves,
  dumbbell: Dumbbell,
  utensils: Utensils,
  wine: Wine,
  car: Car,
  paw: PawPrint,
  ban: Ban,
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
    icon: 'wifi', // default icon
  });
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, icon: initialData.icon });
    } else {
      setFormData({ name: '', icon: 'wifi' });
    }
    setIsIconSelectorOpen(false); // Reset dropdown state on open
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Amenity name is required");
      return;
    }

    try {
      setIsLoading(true);
      if (initialData?._id) {
        // Edit Mode (Mocked)
        // await api.put(`/api/v1/amenities/${initialData._id}`, formData);
        toast.success("Amenity updated successfully!");
      } else {
        // Add Mode (Mocked)
        // await api.post("/api/v1/amenities", formData);
        toast.success("Amenity created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save amenity");
    } finally {
      setIsLoading(false);
    }
  };

  const SelectedIcon = ICON_MAP[formData.icon] || Wifi;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={!isLoading ? onClose : undefined} />

      {/* Modal Content */}
      <div className="bg-card rounded-2xl shadow-modal w-full max-w-[40%] relative z-10 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">
            {initialData ? 'Edit Amenity' : 'Add New Amenity'}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors">
            <X size={20} />
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              className="input-field" 
            />
          </div>

          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Select Icon</label>
            <div className="relative">
              {/* Dropdown Trigger */}
              <button 
                onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)}
                className="input-field w-full flex items-center justify-between cursor-pointer bg-background"
              >
                <div className="flex items-center gap-3 text-primary">
                  <SelectedIcon size={18} />
                  <span className="text-text-primary text-sm font-medium capitalize">{formData.icon}</span>
                </div>
              </button>

              {/* Expandable Icon Grid */}
              {isIconSelectorOpen && (
                <div className="absolute top-full left-0 w-full mt-2 p-3 bg-card border border-border rounded-xl shadow-card z-20 animate-fade-in grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((iconKey) => {
                    const IconComp = ICON_MAP[iconKey];
                    const isSelected = formData.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, icon: iconKey }));
                          setIsIconSelectorOpen(false);
                        }}
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
          <button onClick={onClose} disabled={isLoading} className="btn-secondary flex-1 py-2.5">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 py-2.5">
            {isLoading ? "Saving..." : "Confirm Amenity"}
          </button>
        </div>
      </div>
    </div>
  );
}