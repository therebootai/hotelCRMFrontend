import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import AmenityModal, { ICON_MAP } from './AmenityModal';
import DeleteModal from '../../StaffMaster/Components/DeleteModal';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

// Matching your Mongoose Schema
export interface Amenity {
 _id: string;
 name: string;
 icon: string;
 isActive: boolean;
}

interface AmenitiesMasterProps {
 isAddModalOpen: boolean;
 setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function AmenitiesMaster({ isAddModalOpen, setIsAddModalOpen }: AmenitiesMasterProps) {
 // Data States
 const [amenities, setAmenities] = useState<Amenity[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 
 // Modal States
 const [editingData, setEditingData] = useState<Amenity | null>(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<Amenity | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);

 // Fetch Data
 const fetchAmenities = async () => {
 try {
 setIsLoading(true);
 const response = await api.get('/amenities');
 const data = response.data?.data || [];
 setAmenities(data);
 } catch (error: unknown) {
 let errorMsg = "Failed to fetch amenities";
 if (error instanceof AxiosError) {
 errorMsg = error.response?.data?.message;
 }
 toast.error(errorMsg);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchAmenities();
 }, []);

 // Handlers
 const handleEditClick = (amenity: Amenity) => {
 setEditingData(amenity);
 setIsAddModalOpen(true);
 };

 const handleDeleteClick = (amenity: Amenity) => {
 setItemToDelete(amenity);
 setIsDeleteModalOpen(false); // Close any existing first
 setTimeout(() => setIsDeleteModalOpen(true), 0);
 };

 const confirmDelete = async () => {
 if (!itemToDelete) return;
 
 try {
 setIsDeleting(true);
 await api.delete(`/amenities/${itemToDelete._id}`);
 toast.success(`${itemToDelete.name} deleted successfully!`);
 
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 fetchAmenities();
 } catch (error: unknown) {
 let errorMsg = "Failed to delete amenity";
 if (error instanceof AxiosError) {
 errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
 }
 toast.error(errorMsg);
 } finally {
 setIsDeleting(false);
 }
 };

 const handleToggleStatus = async (id: string, currentStatus: boolean) => {
 setAmenities(prev => prev.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a));
 
 try {
 const response = await api.patch(`/amenities/${id}/toggle-status`);
 
 const updatedAmenity = response.data?.data;
 if (updatedAmenity && typeof updatedAmenity.isActive === 'boolean') {
 setAmenities(prev => prev.map(a => a._id === id ? { ...a, isActive: updatedAmenity.isActive } : a));
 }
 
 toast.success(`Amenity ${!currentStatus ? 'activated' : 'deactivated'}.`);
 } catch (error: unknown) {
 setAmenities(prev => prev.map(a => a._id === id ? { ...a, isActive: currentStatus } : a));
 
 let errorMsg = "Failed to update status";
 if (error instanceof AxiosError) {
 errorMsg = error.response?.data?.message;
 }
 toast.error(errorMsg);
 }
 };

 const handleModalClose = () => {
 setIsAddModalOpen(false);
 setTimeout(() => setEditingData(null), 200);
 };

 return (
 <div className="mt-4 animate-fade-in space-y-6">
 
 {/* Main Table */}
 <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
 <div className="overflow-x-auto no-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead className="bg-background/50 border-b border-border">
 <tr>
 <th className="px-10 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-24 text-center">Icon Preview</th>
 <th className="px-10 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-[30%]">Amenity Name</th>
 <th className="px-10 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
 <th className="px-10 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right w-32">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {isLoading ? (
 <tr>
 <td colSpan={4} className="px-10 py-12 text-center text-text-secondary">
 <div className="flex flex-col items-center justify-center gap-2">
 <FiLoader className="w-6 h-6 animate-spin text-primary" />
 <span className="text-base">Loading amenities...</span>
 </div>
 </td>
 </tr>
 ) : amenities.length > 0 ? (
 amenities.map((amenity) => {
 const IconComponent = ICON_MAP[amenity.icon] || ICON_MAP['wifi'];
 
 return (
 <tr key={amenity._id} className={`hover:bg-background/50 transition-colors group ${!amenity.isActive ? 'opacity-60' : ''}`}>
 <td className="px-10 py-4 text-center">
 <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary mx-auto flex items-center justify-center shrink-0">
 <IconComponent size={18} />
 </div>
 </td>
 <td className="px-10 py-4">
 <span className="font-bold text-text-primary text-base">{amenity.name}</span>
 </td>
 <td className="px-10 py-4 text-left">
 <button 
 onClick={() => handleToggleStatus(amenity._id, amenity.isActive)}
 className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${amenity.isActive ? 'bg-primary' : 'bg-border'}`}
 >
 <span className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ${amenity.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
 </button>
 </td>
 <td className="px-10 py-4">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleEditClick(amenity)}
 className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
 >
 <FiEdit2 size={16} />
 </button>
 <button 
 onClick={() => handleDeleteClick(amenity)}
 className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
 >
 <FiTrash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={4} className="px-10 py-12 text-center text-text-secondary">
 No amenities registered yet.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modals */}
 <AmenityModal 
 isOpen={isAddModalOpen} 
 onClose={handleModalClose}
 onSuccess={fetchAmenities} 
 initialData={editingData as any}
 />

 <DeleteModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={confirmDelete}
 title="Delete Amenity"
 message={`Are you sure you want to delete "${itemToDelete?.name}"? This will remove it from all associated rooms.`}
 isLoading={isDeleting}
 />
 </div>
 );
}