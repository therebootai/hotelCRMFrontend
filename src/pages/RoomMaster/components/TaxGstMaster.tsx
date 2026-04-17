import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Landmark, Loader2 } from 'lucide-react';
import TaxGstModal from './TaxGstModal';
import DeleteModal from '../../StaffMaster/Components/DeleteModal';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

export interface TaxGst {
  _id: string;
  name: string;
  percentage: number;
  type: 'Room' | 'Food' | 'Service';
  isActive: boolean;
}

interface TaxGstMasterProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export default function TaxGstMaster({ isAddModalOpen, setIsAddModalOpen }: TaxGstMasterProps) {
  const [taxes, setTaxes] = useState<TaxGst[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Room' | 'Food' | 'Service'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  const [editingData, setEditingData] = useState<TaxGst | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TaxGst | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTaxes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tax-gst');
      const data = response.data?.data || [];
      setTaxes(data);
    } catch (error: unknown) {
      let errorMsg = "Failed to fetch tax configurations";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // Handlers
  const handleEditClick = (tax: TaxGst) => {
    setEditingData(tax);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (tax: TaxGst) => {
    setItemToDelete(tax);
    setIsDeleteModalOpen(false);
    setTimeout(() => setIsDeleteModalOpen(true), 0);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/tax-gst/${itemToDelete._id}`);
      toast.success(`${itemToDelete.name} deleted successfully!`);
      
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchTaxes(); // Refresh list
    } catch (error: unknown) {
      let errorMsg = "Failed to delete tax rule";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTaxes(prev => prev.map(t => t._id === id ? { ...t, isActive: !currentStatus } : t));
    
    try {
      const response = await api.patch(`/tax-gst/${id}/toggle-status`);
      
      const updatedTax = response.data?.data ;
      if (updatedTax && typeof updatedTax.isActive === 'boolean') {
        setTaxes(prev => prev.map(t => t._id === id ? { ...t, isActive: updatedTax.isActive } : t));
      }
      toast.success(`Tax rule ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } catch (error: unknown) {
      setTaxes(prev => prev.map(t => t._id === id ? { ...t, isActive: currentStatus } : t));
      
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

  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tax.percentage.toString().includes(searchQuery);
    
    const matchesType = typeFilter === 'All' || tax.type === typeFilter;
    
    const matchesStatus = statusFilter === 'All' ? true : 
                          statusFilter === 'Active' ? tax.isActive === true : 
                          tax.isActive === false;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="mt-4 animate-fade-in space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full xl:w-96 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search tax name or percentage..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            className="input-field pl-9 py-2 border-transparent bg-background focus:border-border disabled:opacity-70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider hidden sm:block">Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              disabled={isLoading}
              className="input-field py-1.5 px-3 min-w-30 bg-background border-border text-sm disabled:opacity-70 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider hidden sm:block">Type:</span>
            <div className="flex bg-background border border-border rounded-lg p-1">
              {['All', 'Room', 'Food', 'Service'].map((filter) => (
                <button 
                  key={filter}
                  disabled={isLoading}
                  onClick={() => setTypeFilter(filter as "Room" | "Food" | "Service" | "All")}
                  className={`px-4 py-1.5 rounded-md font-medium transition-colors text-xs sm:text-sm disabled:opacity-70 ${
                    typeFilter === filter ? 'bg-card text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-sm">Loading taxes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTaxes.length > 0 ? (
                filteredTaxes.map((tax) => (
                  <tr key={tax._id} className={`hover:bg-background/50 transition-colors group ${!tax.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Landmark size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary text-sm">{tax.name}</span>
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No tax configurations found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple Footer without Pagination */}
        {!isLoading && (
          <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between text-sm text-text-secondary">
            <span>Showing {filteredTaxes.length} of {taxes.length} tax configurations</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaxGstModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        onSuccess={fetchTaxes}
        initialData={editingData as any}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Tax/GST Rule"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? Make sure this tax is not currently linked to any active rooms or menu items.`}
        isLoading={isDeleting}
      />
    </div>
  );
}