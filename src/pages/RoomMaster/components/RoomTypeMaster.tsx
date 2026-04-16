import React, { useState } from 'react';
import { Search, Edit2, Trash2, BedDouble, Sparkles } from 'lucide-react';
import RoomTypeModal from './RoomTypeModal';
import DeleteModal from '../../StaffMaster/Components/DeleteModal'; 
import toast from 'react-hot-toast';

// Mock Data
const MOCK_ROOM_TYPES = [
  { _id: '1', name: 'Deluxe King', description: 'Spacious room with king-size bed and city view. Features high-speed Wi-Fi, smart TV, and premium bath products.' },
  { _id: '2', name: 'Executive Suite', description: 'Premium suite with separate living area and balcony. Includes butler service, minibar, and airport transfer.' },
  { _id: '3', name: 'Standard Twin', description: 'Classic comfort with two twin beds. Perfect for friends or business travelers. Includes essential amenities.' }
];

interface RoomTypeMasterProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function RoomTypeMaster({ isAddModalOpen, setIsAddModalOpen }: RoomTypeMasterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [editingData, setEditingData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<any>(null);

  // Handlers
  const handleEditClick = (roomType: any) => {
    setEditingData(roomType);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (roomType: any) => {
    setTypeToDelete(roomType);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    // Mock API Call
    toast.success(`${typeToDelete.name} deleted successfully!`);
    setIsDeleteModalOpen(false);
    setTypeToDelete(null);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setEditingData(null), 200); // Wait for modal exit animation before clearing data
  };

  // Filtering
  const filteredTypes = MOCK_ROOM_TYPES.filter(rt => 
    rt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-4 animate-fade-in space-y-6">
      
      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Header & Search */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-primary">
            <BedDouble size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Registered Room Types</h2>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search types..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-1/4">Type Name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-2/3">Description</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTypes.map((rt) => (
                <tr key={rt._id} className="hover:bg-background/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <BedDouble size={18} />
                      </div>
                      <span className="font-bold text-text-primary text-sm">{rt.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-text-secondary leading-relaxed max-w-[60%]">
                      {rt.description}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 ">
                      <button 
                        onClick={() => handleEditClick(rt)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(rt)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-text-secondary">
                    No room types found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple Footer/Pagination */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between text-sm text-text-secondary">
          <span>Showing {filteredTypes.length} of {MOCK_ROOM_TYPES.length} room types</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-border rounded hover:bg-card transition-colors disabled:opacity-50">Previous</button>
            <button className="px-3 py-1.5 border border-border rounded hover:bg-card transition-colors disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Pro Tip Card (Matching UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder div to push the tip to the right if you had a 2-col layout, or just make it take full width. Let's make it an elegant banner. */}
        <div className="col-span-full lg:col-span-1 lg:col-start-2">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                Pro Tip: Strategic Naming
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Using evocative names like "Panorama Suite" instead of "Large Room 402" increases guest engagement and allows for premium pricing tiers.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-primary/10">
                <Sparkles size={18} className="text-primary" />
                <div className="text-sm">
                  <span className="font-bold text-text-primary block">AI Description Generator</span>
                  <span className="text-text-secondary">Coming soon: Let our engine draft enticing room bios.</span>
                </div>
              </div>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoomTypeModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        onSuccess={() => { /* Refresh data here */ }}
        initialData={editingData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Room Type"
        message={`Are you sure you want to delete the "${typeToDelete?.name}" room type? This action cannot be undone.`}
        isLoading={false}
      />
    </div>
  );
}