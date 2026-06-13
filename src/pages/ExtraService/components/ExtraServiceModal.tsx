import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

interface ExtraServiceData {
 _id?: string;
 name: string;
 description?: string;
 price?: number;
 taxPercentage?: number;
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
 const [taxes, setTaxes] = useState<any[]>([]);
 const [formData, setFormData] = useState({
 name: '',
 description: '',
 price: 0,
 taxPercentage: 0,
 });
 const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

 useEffect(() => {
   const fetchTaxes = async () => {
     try {
       const response = await api.get('/tax-gst?activeOnly=true');
       setTaxes(response.data?.data || []);
     } catch (err) {
       console.error("Failed to fetch taxes", err);
     }
   };
   if (isOpen) {
     fetchTaxes();
   }
 }, [isOpen]);

 useEffect(() => {
 setErrors({});

 if (initialData) {
 setFormData({ 
   name: initialData.name, 
   description: initialData.description || '',
   price: initialData.price ?? 0, 
   taxPercentage: initialData.taxPercentage ?? 0,
 });
 } else {
 setFormData({ name: '', description: '', price: 0, taxPercentage: 0 });
 }
 }, [initialData, isOpen]);

 if (!isOpen) return null;

 const validate = () => {
 const newErrors: { name?: string; price?: string } = {};
 const trimmedName = formData.name.trim();

 if (!trimmedName) {
 newErrors.name = "Service name is required";
 } else if (trimmedName.length < 2) {
 newErrors.name = "Name must be at least 2 characters";
 }

 if (formData.price < 0) {
 newErrors.price = "Price must be 0 or more";
 }

 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData(prev => ({ ...prev, name: e.target.value }));
 if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
 };

 const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 setFormData(prev => ({ ...prev, description: e.target.value }));
 };

 const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData(prev => ({ ...prev, price: Number(e.target.value) }));
 if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
 };

 const handleTaxChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 setFormData(prev => ({ ...prev, taxPercentage: Number(e.target.value) }));
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
 <FiX size={20} />
 </button>
 </div>

 {/* Body */}
 <div className="p-6 flex flex-col gap-4">
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
 <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">{errors.name}</p>
 )}
 </div>
 <div>
 <label className="input-label uppercase tracking-wider text-[10px]">Description (Optional)</label>
 <textarea
 placeholder="Brief description of the service"
 value={formData.description}
 onChange={handleDescriptionChange}
 disabled={isLoading}
 className="input-field disabled:opacity-70 disabled:cursor-not-allowed resize-none h-20"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="input-label uppercase tracking-wider text-[10px]">Price (₹)</label>
 <input
 type="number"
 min={0}
 placeholder="e.g. 150"
 value={formData.price}
 onChange={handlePriceChange}
 disabled={isLoading}
 className={`input-field disabled:opacity-70 disabled:cursor-not-allowed ${
 errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
 }`}
 />
 {errors.price && (
 <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">{errors.price}</p>
 )}
 </div>
 <div>
 <label className="input-label uppercase tracking-wider text-[10px]">Tax Slab</label>
 <select
 value={formData.taxPercentage}
 onChange={handleTaxChange}
 disabled={isLoading}
 className="input-field disabled:opacity-70 disabled:cursor-not-allowed"
 >
 <option value={0}>0% Tax</option>
 {taxes.map(tax => (
 <option key={tax._id} value={tax.percentage}>
 {tax.name} ({tax.percentage}%)
 </option>
 ))}
 </select>
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
 {isLoading ? "Saving..." : "Confirm Service"}
 </button>
 </div>
 </div>
 </div>
 );
}