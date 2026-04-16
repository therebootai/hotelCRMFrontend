import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import AmenityModal, { ICON_MAP } from './AmenityModal';
import DeleteModal from '../../StaffMaster/Components/DeleteModal';
import toast from 'react-hot-toast';

// Mock Data
const MOCK_AMENITIES = [
  { _id: '1', name: 'Air Conditioning', icon: 'snowflake', isActive: true },
  { _id: '2', name: 'High-Speed WiFi', icon: 'wifi', isActive: true },
  { _id: '3', name: 'Private Balcony', icon: 'waves', isActive: true },
  { _id: '4', name: 'Smart TV', icon: 'tv', isActive: true },
  { _id: '5', name: 'Coffee Machine', icon: 'coffee', isActive: false },
];

interface AmenitiesMasterProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function AmenitiesMaster({ isAddModalOpen, setIsAddModalOpen }: AmenitiesMasterProps) {
  const [amenities, setAmenities] = useState(MOCK_AMENITIES);
  
  // Modal States
  const [editingData, setEditingData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Handlers
  const handleEditClick = (amenity: any) => {
    setEditingData(amenity);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (amenity: any) => {
    setItemToDelete(amenity);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    toast.success(`${itemToDelete.name} deleted successfully!`);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setAmenities(prev => prev.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a));
    toast.success(`Amenity ${!currentStatus ? 'activated' : 'deactivated'}.`);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setEditingData(null), 200);
  };

  return (
    <div className="mt-4 animate-fade-in space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Total Amenities</p>
          <h3 className="text-2xl font-bold text-text-primary">24</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Most Requested</p>
          <h3 className="text-2xl font-bold text-text-primary">WiFi</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Active Icons</p>
          <h3 className="text-2xl font-bold text-text-primary">18</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">System Health</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-room-available"></span>
            <span className="text-sm font-bold text-room-available">Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                {/* CHANGED widths here: Icon is fixed, Name takes 30%, Actions is fixed, Status takes remaining space */}
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-24 text-center">Icon Preview</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-[30%]">Amenity Name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {amenities.map((amenity) => {
                const IconComponent = ICON_MAP[amenity.icon] || ICON_MAP['wifi'];
                
                return (
                  <tr key={amenity._id} className={`hover:bg-background/50 transition-colors group ${!amenity.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary mx-auto flex items-center justify-center shrink-0">
                        <IconComponent size={18} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-text-primary text-sm">{amenity.name}</span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {/* CHANGED: Removed mx-auto so the toggle sits nicely on the left next to the name */}
                      <button 
                        onClick={() => handleToggleStatus(amenity._id, amenity.isActive)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${amenity.isActive ? 'bg-primary' : 'bg-border'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ${amenity.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(amenity)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(amenity)}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AmenityModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        onSuccess={() => { /* Refresh data here */ }}
        initialData={editingData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Amenity"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This will remove it from all associated rooms.`}
        isLoading={false}
      />
    </div>
  );
}