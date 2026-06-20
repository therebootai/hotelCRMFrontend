import React, { useState, useEffect } from "react";
import { FiX, FiUpload, FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { AxiosError } from "axios";

interface ExtraService {
 _id: string;
 name: string;
 isActive: boolean;
}

export interface AccessPackageData {
 duration?: number;
 _id?: string;
 package_id?: string;
 packageName: string;
 description?: string;
 inclusions: string[];
 adult_price: number;
 child_price: number;
 packageType: "Premium Combo" | "Corporate";
 cover_img?: {
 public_id: string;
 secure_url: string;
 };
 entry_time: string;
 exit_time: string;
 add_ons: string[] | ExtraService[];
 isActive?: boolean;
}

interface AccessPackageModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
 initialData?: AccessPackageData | null;
}

export default function AccessPackageModal({
 isOpen,
 onClose,
 onSuccess,
 initialData,
}: AccessPackageModalProps) {
 const [isLoading, setIsLoading] = useState(false);
 const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
 const [isLoadingServices, setIsLoadingServices] = useState(false);

 // Form states
 const [packageName, setPackageName] = useState("");
 const [description, setDescription] = useState("");
 const [packageType, setPackageType] = useState<"Premium Combo" | "Corporate">(
 "Premium Combo",
 );
 const [adultPrice, setAdultPrice] = useState<number | "">("");
 const [childPrice, setChildPrice] = useState<number | "">("");
 const [entryTime, setEntryTime] = useState("");
 const [exitTime, setExitTime] = useState("");
 const [isActive, setIsActive] = useState(true);

 // Inclusions state
 const [inclusions, setInclusions] = useState<string[]>([]);
 const [inclusionInput, setInclusionInput] = useState("");

 // Add-ons (Extra Services) selection state
 const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

 // Cover Image upload state
 const [imageFile, setImageFile] = useState<File | null>(null);
 const [imagePreview, setImagePreview] = useState<string>("");

 const [errors, setErrors] = useState<Record<string, string>>({});

 // Fetch extra services for add-ons list
 useEffect(() => {
 if (!isOpen) return;

 const fetchExtraServices = async () => {
 try {
 setIsLoadingServices(true);
 const response = await api.get("/extra-services");
 const services = response.data?.data || [];
 // Only list active extra services
 setExtraServices(services.filter((s: ExtraService) => s.isActive));
 } catch (err) {
 console.error("Failed to fetch extra services", err);
 toast.error("Failed to load extra services list");
 } finally {
 setIsLoadingServices(false);
 }
 };

 fetchExtraServices();
 }, [isOpen]);

 // Load initial data for Edit Mode
 useEffect(() => {
 if (isOpen) {
 setErrors({});
 if (initialData) {
 setPackageName(initialData.packageName || "");
 setDescription(initialData.description || "");
 setPackageType(initialData.packageType || "Premium Combo");
 setAdultPrice(initialData.adult_price ?? "");
 setChildPrice(initialData.child_price ?? "");
 setEntryTime(initialData.entry_time || "");
 setExitTime(initialData.exit_time || "");
 setIsActive(initialData.isActive !== false);
 setInclusions(initialData.inclusions || []);

 // Map add-ons to string IDs
 const addonIds = (initialData.add_ons || []).map((addon) =>
 typeof addon === "object" && addon !== null
 ? (addon as ExtraService)._id
 : (addon as string),
 );
 setSelectedAddOns(addonIds);

 // Map cover image
 if (initialData.cover_img?.secure_url) {
 setImagePreview(initialData.cover_img.secure_url);
 } else {
 setImagePreview("");
 }
 setImageFile(null);
 } else {
 // Reset to default
 setPackageName("");
 setDescription("");
 setPackageType("Premium Combo");
 setAdultPrice("");
 setChildPrice("");
 setEntryTime("09:00");
 setExitTime("18:00");
 setIsActive(true);
 setInclusions([]);
 setSelectedAddOns([]);
 setImageFile(null);
 setImagePreview("");
 }
 }
 }, [initialData, isOpen]);

 if (!isOpen) return null;

 // Handle inclusions dynamic adding/removing
 const handleAddInclusion = () => {
 const trimmed = inclusionInput.trim();
 if (!trimmed) return;
 if (inclusions.includes(trimmed)) {
 toast.error("This inclusion already exists");
 return;
 }
 setInclusions([...inclusions, trimmed]);
 setInclusionInput("");
 };

 const handleRemoveInclusion = (index: number) => {
 setInclusions(inclusions.filter((_, i) => i !== index));
 };

 // Handle cover image change
 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (file.size > 5 * 1024 * 1024) {
 toast.error("Image file size must be less than 5MB");
 return;
 }

 setImageFile(file);
 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 };

 const handleRemoveImage = () => {
 setImageFile(null);
 setImagePreview("");
 };

 // Validate the inputs
 const validateForm = () => {
 const newErrors: Record<string, string> = {};

 if (!packageName.trim()) {
 newErrors.packageName = "Package Name is required";
 } else if (packageName.trim().length < 2) {
 newErrors.packageName = "Name must be at least 2 characters";
 }

 if (adultPrice === "" || Number(adultPrice) < 0) {
 newErrors.adultPrice = "Adult Price is required and must be non-negative";
 }

 if (childPrice === "" || Number(childPrice) < 0) {
 newErrors.childPrice = "Child Price is required and must be non-negative";
 }

 if (!entryTime) {
 newErrors.entryTime = "Entry time is required";
 }

 if (!exitTime) {
 newErrors.exitTime = "Exit time is required";
 }

 if (entryTime && exitTime) {
 const [entryHour, entryMinute] = entryTime.split(":").map(Number);
 const [exitHour, exitMinute] = exitTime.split(":").map(Number);
 const entryTotal = entryHour * 60 + entryMinute;
 const exitTotal = exitHour * 60 + exitMinute;

 if (exitTotal <= entryTotal) {
 newErrors.exitTime = "Exit time must be after entry time";
 }
 }

 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 // Helper to generate package ID programmatically
 const generatePackageId = (name: string) => {
 const slug = name
 .trim()
 .toUpperCase()
 .replace(/[^A-Z0-9]+/g, "_")
 .replace(/(^_+|_+$)/g, "");
 const random = Math.floor(1000 + Math.random() * 9000);
 return `PKG_${slug}_${random}`;
 };

 // Submit Handler
 const handleSubmit = async () => {
 if (!validateForm()) {
 toast.error("Please resolve validation errors first");
 return;
 }

 try {
 setIsLoading(true);

 const generatedId =
 initialData?.package_id || generatePackageId(packageName);

 const payload = {
 package_id: generatedId,
 packageName: packageName.trim(),
 description: description.trim(),
 packageType,
 adult_price: Number(adultPrice),
 child_price: Number(childPrice),
 entry_time: entryTime,
 exit_time: exitTime,
 inclusions,
 add_ons: selectedAddOns,
 isActive,
 };

 const formData = new FormData();
 formData.append("payload", JSON.stringify(payload));

 if (imageFile) {
 formData.append("cover_img", imageFile);
 }

 if (initialData?._id) {
 await api.put(`/day-packages/${initialData._id}`, formData);
 toast.success("Day Package updated successfully!");
 } else {
 await api.post("/day-packages", formData);
 toast.success("Day Package created successfully!");
 }

 onSuccess();
 onClose();
 } catch (err) {
 console.error(err);
 let errMsg = "An error occurred while saving the package";
 if (err instanceof AxiosError) {
 errMsg =
 err.response?.data?.message ||
 err.response?.data?.error ||
 err.message;
 }
 toast.error(errMsg);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity h-full"
 onClick={!isLoading ? onClose : undefined}
 />

 {/* Modal Card */}
 <div className="bg-card border border-border rounded-2xl shadow-modal w-full max-w-4xl max-h-[90vh] relative z-10 animate-fade-in flex flex-col overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border bg-card shrink-0">
 <div>
 <h2 className="text-xl font-bold text-text-primary">
 {initialData
 ? "Edit Day Access Package"
 : "Create New Day Access Package"}
 </h2>
 <p className="text-sm text-text-secondary mt-1">
 Configure day pass pricing, timings, inclusions, and addons.
 </p>
 </div>
 <button
 onClick={onClose}
 disabled={isLoading}
 className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors"
 >
 <FiX size={20} />
 </button>
 </div>

 {/* Content Body - Scrollable */}
 <div className="p-6 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Left Column: Basic Details */}
 <div className="space-y-4">
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Package Name *
 </label>
 <input
 type="text"
 placeholder="e.g. Luxury Day Combo"
 value={packageName}
 onChange={(e) => {
 setPackageName(e.target.value);
 if (errors.packageName) {
 setErrors((prev) => ({ ...prev, packageName: "" }));
 }
 }}
 disabled={isLoading}
 className={`input-field ${
 errors.packageName
 ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
 : ""
 }`}
 />
 {errors.packageName && (
 <p className="text-red-500 text-sm mt-1.5 font-medium">
 {errors.packageName}
 </p>
 )}
 </div>

 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Description
 </label>
 <textarea
 placeholder="Describe what's included in this package..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 disabled={isLoading}
 className="input-field min-h-20 resize-none py-2"
 />
 </div>

 <div>
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Package Type *
 </label>
 <select
 value={packageType}
 onChange={(e) => setPackageType(e.target.value as any)}
 disabled={isLoading}
 className="input-field py-2.5"
 >
 <option value="Premium Combo">Premium Combo</option>
 <option value="Corporate">Corporate</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Adult Price (₹) *
 </label>
 <input
 type="number"
 placeholder="0.00"
 value={adultPrice}
 onChange={(e) => {
 const val = e.target.value;
 setAdultPrice(val === "" ? "" : Number(val));
 if (errors.adultPrice) {
 setErrors((prev) => ({ ...prev, adultPrice: "" }));
 }
 }}
 disabled={isLoading}
 className={`input-field ${
 errors.adultPrice
 ? "border-red-500 focus:border-red-500"
 : ""
 }`}
 />
 {errors.adultPrice && (
 <p className="text-red-500 text-sm mt-1.5 font-medium">
 {errors.adultPrice}
 </p>
 )}
 </div>

 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Child Price (₹) *
 </label>
 <input
 type="number"
 placeholder="0.00"
 value={childPrice}
 onChange={(e) => {
 const val = e.target.value;
 setChildPrice(val === "" ? "" : Number(val));
 if (errors.childPrice) {
 setErrors((prev) => ({ ...prev, childPrice: "" }));
 }
 }}
 disabled={isLoading}
 className={`input-field ${
 errors.childPrice
 ? "border-red-500 focus:border-red-500"
 : ""
 }`}
 />
 {errors.childPrice && (
 <p className="text-red-500 text-sm mt-1.5 font-medium">
 {errors.childPrice}
 </p>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Entry Time *
 </label>
 <input
 type="time"
 value={entryTime}
 onChange={(e) => {
 setEntryTime(e.target.value);
 if (errors.entryTime) {
 setErrors((prev) => ({ ...prev, entryTime: "" }));
 }
 }}
 disabled={isLoading}
 className={`input-field py-2 ${errors.entryTime ? "border-red-500" : ""}`}
 />
 {errors.entryTime && (
 <p className="text-red-500 text-sm mt-1.5 font-medium">
 {errors.entryTime}
 </p>
 )}
 </div>

 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Exit Time *
 </label>
 <input
 type="time"
 value={exitTime}
 onChange={(e) => {
 setExitTime(e.target.value);
 if (errors.exitTime) {
 setErrors((prev) => ({ ...prev, exitTime: "" }));
 }
 }}
 disabled={isLoading}
 className={`input-field py-2 ${errors.exitTime ? "border-red-500" : ""}`}
 />
 {errors.exitTime && (
 <p className="text-red-500 text-sm mt-1.5 font-medium">
 {errors.exitTime}
 </p>
 )}
 </div>
 </div>
 </div>

 {/* Right Column: Image, Inclusions, Add-ons */}
 <div className="space-y-5">
 {/* Cover Image Upload */}
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Cover Image
 </label>
 {imagePreview ? (
 <div className="relative group rounded-xl border border-border overflow-hidden h-36 bg-background flex items-center justify-center">
 <img
 src={imagePreview}
 alt="Cover preview"
 className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <button
 type="button"
 onClick={handleRemoveImage}
 disabled={isLoading}
 className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
 >
 <FiTrash2 size={14} />
 Remove
 </button>
 </div>
 </div>
 ) : (
 <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl p-6 cursor-pointer transition-all duration-200 group h-36">
 <div className="p-3 bg-gray-100 rounded-lg text-text-secondary group-hover:text-primary transition-colors">
 <FiUpload size={20} />
 </div>
 <span className="text-sm font-bold text-text-secondary group-hover:text-primary">
 Upload Cover Image
 </span>
 <span className="text-[10px] text-text-secondary opacity-70">
 JPG, PNG - Max 5MB
 </span>
 <input
 type="file"
 className="hidden"
 accept="image/jpeg,image/png,image/jpg"
 onChange={handleImageChange}
 disabled={isLoading}
 />
 </label>
 )}
 </div>

 {/* Inclusions (Tags input) */}
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Package Inclusions (e.g. Welcome Drink)
 </label>
 <div className="flex gap-2 mb-2">
 <input
 type="text"
 placeholder="Press Enter or click + to add"
 value={inclusionInput}
 onChange={(e) => setInclusionInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 handleAddInclusion();
 }
 }}
 disabled={isLoading}
 className="input-field"
 />
 <button
 type="button"
 onClick={handleAddInclusion}
 disabled={isLoading}
 className="btn-secondary px-4 h-10.5 flex items-center justify-center"
 >
 <FiPlus size={18} />
 </button>
 </div>

 {/* Chips List */}
 <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar p-1 border border-border bg-background rounded-lg min-h-12">
 {inclusions.length > 0 ? (
 inclusions.map((inc, index) => (
 <span
 key={index}
 className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm font-semibold"
 >
 {inc}
 <button
 type="button"
 onClick={() => handleRemoveInclusion(index)}
 className="text-primary hover:text-red-500 transition-colors"
 >
 <FiX size={12} />
 </button>
 </span>
 ))
 ) : (
 <span className="text-[11px] text-text-secondary italic m-auto opacity-75">
 No inclusions added yet
 </span>
 )}
 </div>
 </div>

 {/* Add-ons (Checkbox checklist) */}
 <div>
 <label className="input-label uppercase tracking-wider text-[10px] mb-2 block">
 Available Add-ons (Extra Services)
 </label>
 <div className="border border-border bg-background rounded-xl p-3 max-h-36 overflow-y-auto no-scrollbar space-y-2">
 {isLoadingServices ? (
 <div className="flex items-center justify-center gap-2 py-4 text-text-secondary text-sm">
 <FiLoader className="w-4 h-4 animate-spin text-primary" />
 Loading services...
 </div>
 ) : extraServices.length > 0 ? (
 extraServices.map((service) => {
 const isChecked = selectedAddOns.includes(service._id);
 return (
 <label
 key={service._id}
 className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/50 cursor-pointer transition-colors"
 >
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => {
 if (isChecked) {
 setSelectedAddOns(
 selectedAddOns.filter(
 (id) => id !== service._id,
 ),
 );
 } else {
 setSelectedAddOns([
 ...selectedAddOns,
 service._id,
 ]);
 }
 }}
 disabled={isLoading}
 className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
 />
 <span className="text-sm font-semibold text-text-primary">
 {service.name}
 </span>
 </label>
 );
 })
 ) : (
 <div className="text-center py-4 text-sm text-text-secondary italic">
 No active extra services available
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="bg-background p-6 flex items-center gap-3 border-t border-border rounded-b-2xl shrink-0">
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
 className="btn-primary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {isLoading ? (
 <>
 <FiLoader className="w-4 h-4 animate-spin text-white" />
 Saving...
 </>
 ) : (
 "Confirm Package"
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
