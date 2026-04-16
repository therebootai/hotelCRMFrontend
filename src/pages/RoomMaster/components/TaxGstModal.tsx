import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaxGstData {
  _id?: string;
  name: string;
  percentage: number;
  type: 'Room' | 'Food' | 'Service';
  isActive?: boolean;
}

interface TaxGstModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TaxGstData | null;
}

export default function TaxGstModal({ isOpen, onClose, onSuccess, initialData }: TaxGstModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    percentage: string; // Using string for controlled input before parsing to number
    type: 'Room' | 'Food' | 'Service';
  }>({
    name: '',
    percentage: '',
    type: 'Room',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        percentage: initialData.percentage.toString(),
        type: initialData.type,
      });
    } else {
      setFormData({ name: '', percentage: '', type: 'Room' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.percentage) {
      toast.error("Name and Percentage are required");
      return;
    }

    try {
      setIsLoading(true);
      // const payload = { ...formData, percentage: Number(formData.percentage) };
      
      if (initialData?._id) {
        // await api.put(`/api/v1/tax-gst/${initialData._id}`, payload);
        toast.success("Tax/GST updated successfully!");
      } else {
        // await api.post("/api/v1/tax-gst", payload);
        toast.success("Tax/GST created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save Tax/GST");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={!isLoading ? onClose : undefined} />

      {/* Modal Content */}
      <div className="bg-card rounded-2xl shadow-modal w-full max-w-[40%] relative z-10 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {initialData ? 'Edit Tax' : 'Add New Tax'}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">Configure tax rules for your property departments.</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors self-start">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="input-label uppercase tracking-wider text-[10px]">Tax Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="e.g. Service Charge, GST" 
              value={formData.name} 
              onChange={handleChange} 
              className="input-field" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">Percentage</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="percentage"
                  placeholder="0.00" 
                  value={formData.percentage} 
                  onChange={handleChange} 
                  className="input-field pr-8" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">%</span>
              </div>
            </div>
            <div>
              <label className="input-label uppercase tracking-wider text-[10px]">Type</label>
              <select 
                name="type"
                value={formData.type} 
                onChange={handleChange} 
                className="input-field cursor-pointer"
              >
                <option value="Room">Room</option>
                <option value="Food">Food</option>
                <option value="Service">Service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-background p-6 flex items-center gap-3 border-t border-border rounded-b-2xl">
          <button onClick={onClose} disabled={isLoading} className="btn-secondary flex-1 py-2.5">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 py-2.5">
            {isLoading ? "Saving..." : "Save Tax"}
          </button>
        </div>
      </div>
    </div>
  );
}