import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

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
 percentage: string; 
 type: 'Room' | 'Food' | 'Service';
 }>({
 name: '',
 percentage: '',
 type: 'Room',
 });
 
 const [errors, setErrors] = useState<{ name?: string; percentage?: string; type?: string }>({});

 useEffect(() => {
 setErrors({});
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

 const validate = () => {
 const newErrors: { name?: string; percentage?: string; type?: string } = {};
 const trimmedName = formData.name.trim();

 if (!trimmedName) {
 newErrors.name = "Tax/GST name is required";
 } else if (trimmedName.length < 2) {
 newErrors.name = "Name must be at least 2 characters";
 }

 const pct = Number(formData.percentage);
 if (formData.percentage === '') {
 newErrors.percentage = "Percentage is required";
 } else if (isNaN(pct)) {
 newErrors.percentage = "Must be a valid number";
 } else if (pct < 0) {
 newErrors.percentage = "Cannot be negative";
 } else if (pct > 100) {
 newErrors.percentage = "Cannot exceed 100%";
 }

 if (!['Room', 'Food', 'Service'].includes(formData.type)) {
 newErrors.type = "Invalid type selected";
 }

 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

 try {
 setIsLoading(true);
 const payload = { 
 ...formData, 
 percentage: Number(formData.percentage) 
 };
 
 if (initialData?._id) {
 await api.put(`/tax-gst/${initialData._id}`, payload);
 toast.success("Tax/GST updated successfully!");
 } else {
 await api.post("/tax-gst", payload);
 toast.success("Tax/GST created successfully!");
 }
 onSuccess();
 onClose();
 } catch (error: unknown) {
 let errorMsg = "Failed to save Tax/GST";
 
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
 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={!isLoading ? onClose : undefined} />

 {/* Modal Content */}
 <div className="bg-card rounded-2xl shadow-modal w-full max-w-[40%] relative z-10 animate-fade-in flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border">
 <div>
 <h2 className="text-xl font-bold text-text-primary">
 {initialData ? 'Edit Tax' : 'Add New Tax'}
 </h2>
 <p className="text-base text-text-secondary mt-0.5">Configure tax rules for your property departments.</p>
 </div>
 <button 
 onClick={onClose} 
 disabled={isLoading}
 className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors self-start disabled:opacity-50"
 >
 <FiX size={20} />
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
 disabled={isLoading}
 className={`input-field disabled:opacity-70 disabled:cursor-not-allowed ${
 errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
 }`} 
 />
 {errors.name && (
 <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">{errors.name}</p>
 )}
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
 disabled={isLoading}
 className={`input-field pr-8 disabled:opacity-70 disabled:cursor-not-allowed ${
 errors.percentage ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
 }`} 
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">%</span>
 </div>
 {errors.percentage && (
 <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">{errors.percentage}</p>
 )}
 </div>
 
 <div>
 <label className="input-label uppercase tracking-wider text-[10px]">Type</label>
 <select 
 name="type"
 value={formData.type} 
 onChange={handleChange} 
 disabled={isLoading}
 className={`input-field cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
 errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
 }`}
 >
 <option value="Room">Room</option>
 <option value="Food">Food</option>
 <option value="Service">Service</option>
 </select>
 {errors.type && (
 <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">{errors.type}</p>
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
 {isLoading ? "Saving..." : "Save Tax"}
 </button>
 </div>
 </div>
 </div>
 );
}