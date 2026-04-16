import React, { useState } from 'react';
import { Search, Edit2, Trash2, Landmark, SlidersHorizontal } from 'lucide-react';
import TaxGstModal from './TaxGstModal';
import DeleteModal from '../../StaffMaster/Components/DeleteModal';
import toast from 'react-hot-toast';

// Mock Data matching your schema
const MOCK_TAXES = [
  { _id: '1', name: 'Luxury GST', percentage: 18.00, type: 'Room', isActive: true },
  { _id: '2', name: 'Restaurant VAT', percentage: 5.00, type: 'Food', isActive: true },
  { _id: '3', name: 'Eco Surcharge', percentage: 2.50, type: 'Room', isActive: false },
  { _id: '4', name: 'Service Charge', percentage: 10.00, type: 'Service', isActive: true },
];

interface TaxGstMasterProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function TaxGstMaster({ isAddModalOpen, setIsAddModalOpen }: TaxGstMasterProps) {
  const [taxes, setTaxes] = useState(MOCK_TAXES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Room' | 'Food' | 'Service'>('All');
  
  // Modal States
  const [editingData, setEditingData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Handlers
  const handleEditClick = (tax: any) => {
    setEditingData(tax);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (tax: any) => {
    setItemToDelete(tax);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    toast.success(`${itemToDelete.name} deleted successfully!`);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setTaxes(prev => prev.map(t => t._id === id ? { ...t, isActive: !currentStatus } : t));
    toast.success(`Tax rule ${!currentStatus ? 'activated' : 'deactivated'}.`);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setEditingData(null), 200);
  };

  // Filter Logic
  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tax.percentage.toString().includes(searchQuery);
    const matchesFilter = activeFilter === 'All' || tax.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mt-4 animate-fade-in space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search tax name or percentage..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 border-transparent bg-background focus:border-border"
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Filter By Type:</span>
          <div className="flex bg-background border border-border rounded-lg p-1">
            {['All', 'Room', 'Food', 'Service'].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                  activeFilter === filter ? 'bg-card text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button className="p-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-[35%]">Tax Name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTaxes.map((tax) => (
                <tr key={tax._id} className={`hover:bg-background/50 transition-colors group ${!tax.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Landmark size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary text-sm">{tax.name}</span>
                        {/* Mock description based on type for UI flair */}
                        <span className="text-xs text-text-secondary mt-0.5">
                          {tax.type === 'Room' ? 'Applied to stay tariffs' : tax.type === 'Food' ? 'Applied to F&B bills' : 'General service levy'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-lg font-bold text-text-primary">{tax.percentage.toFixed(2)}<span className="text-sm text-text-secondary ml-0.5">%</span></span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      tax.type === 'Room' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      tax.type === 'Food' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-purple-50 text-purple-600 border-purple-100'
                    }`}>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      {tax.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleToggleStatus(tax._id, tax.isActive)}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${tax.isActive ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ${tax.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(tax)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(tax)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTaxes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No tax configurations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between text-sm text-text-secondary">
          <span>Showing {filteredTaxes.length} of {taxes.length} tax configurations</span>
          <div className="flex items-center gap-1">
             <button className="px-3 py-1 border border-border rounded hover:bg-card transition-colors disabled:opacity-50 text-xs">Previous</button>
             <button className="w-7 h-7 flex items-center justify-center rounded bg-primary text-white font-medium text-xs">1</button>
             <button className="px-3 py-1 border border-border rounded hover:bg-card transition-colors disabled:opacity-50 text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaxGstModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        onSuccess={() => { /* Refresh data */ }}
        initialData={editingData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Tax/GST Rule"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? Make sure this tax is not currently linked to any active rooms or menu items.`}
        isLoading={false}
      />
    </div>
  );
}