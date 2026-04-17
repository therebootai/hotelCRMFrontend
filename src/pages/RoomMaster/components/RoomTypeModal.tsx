import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

interface RoomTypeData {
  _id?: string;
  name: string;
  description: string;
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
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Type Name is required");
      return;
    }

    try {
      setIsLoading(true);
      
      if (initialData?._id) {
        await api.put(`/room-types/${initialData._id}`, formData);
        toast.success("Room Type updated successfully!");
      } else {
        await api.post("/room-types", formData);
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
            <X size={20} />
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
              className="input-field disabled:opacity-70 disabled:cursor-not-allowed" 
            />
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