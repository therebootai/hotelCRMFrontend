import React, { useState } from 'react';
import { X, Info, Calendar } from 'lucide-react';

interface BulkUpdatePanelProps {
  onClose: () => void;
  selectedRoomIds: string[]; // Replaced count with actual IDs for the payload
  onSubmitRule: (payload: any) => Promise<void>; // Added to pass data to parent/API
}

export default function BulkUpdatePanel({ onClose, selectedRoomIds=[], onSubmitRule }: BulkUpdatePanelProps) {
  const [activeTab, setActiveTab] = useState<'bulk' | 'seasonal'>('bulk');
  const [isLoading, setIsLoading] = useState(false);
  
  // ==========================================
  // Base Room Form State (Bulk)
  // ==========================================
  const [newPrice, setNewPrice] = useState('');
  const [gstPercentage, setGstPercentage] = useState('12% Standard');
  
  // ==========================================
  // Seasonal Pricing Form State (PricingRule)
  // ==========================================
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [festivalLabel, setFestivalLabel] = useState('');
  const [isWeekendPricing, setIsWeekendPricing] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'fixed_price' | 'percentage_increase' | 'flat_increase'>('percentage_increase');
  const [adjustmentValue, setAdjustmentValue] = useState('');

  // ==========================================
  // Handlers
  // ==========================================
  const handleSeasonalSubmit = async () => {
    if (!festivalLabel || !fromDate || !toDate || !adjustmentValue) {
      alert("Please fill in all required seasonal pricing fields.");
      return;
    }

    setIsLoading(true);

    // Map UI states to match the backend Zod validation schema
    const payload = {
      name: festivalLabel,
      roomIds: selectedRoomIds, 
      roomTypes: [], // Assuming bulk update operates on specific rooms
      startDate: new Date(fromDate).toISOString(),
      endDate: new Date(toDate).toISOString(),
      applicableDays: isWeekendPricing 
        ? ["Sat", "Sun"] 
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      adjustmentType: adjustmentType,
      adjustmentValue: Number(adjustmentValue),
      isActive: true,
      priority: 1, // Optional: Set a higher priority for seasonal rules
    };

    try {
      await onSubmitRule(payload);
      onClose();
    } catch (error) {
      console.error("Failed to create rule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseSubmit = async () => {
    // Implement base room update logic here
    console.log("Updating base data for:", selectedRoomIds);
  };

  return (
    <div className="w-full lg:w-100 shrink-0 bg-card border border-border rounded-xl shadow-card flex flex-col sticky top-6 max-h-[calc(100vh-100px)] transition-all">
      
      {/* Header */}
      <div className="pt-5 px-6 pb-2 bg-card rounded-t-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Bulk Update</h2>
            <p className="text-sm text-text-secondary mt-0.5">{selectedRoomIds.length} rooms selected</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Base Room Data
          </button>
          <button 
            onClick={() => setActiveTab('seasonal')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'seasonal' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Seasonal Pricing
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        
        {/* --- TAB 1: BASE ROOM UPDATE --- */}
        {activeTab === 'bulk' && (
          <div className="space-y-6 animate-fade-in">
            {/* Base room inputs remain unchanged */}
            <div>
              <label className="input-label text-[11px] uppercase tracking-wider">New Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₹</span>
                <input 
                  type="number" 
                  placeholder="e.g. 3000" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(e.target.value)} 
                  className="input-field pl-8 font-medium w-full" 
                />
              </div>
            </div>
            {/* ... gst and amenities inputs ... */}
          </div>
        )}

        {/* --- TAB 2: SEASONAL PRICING RULE --- */}
        {activeTab === 'seasonal' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
               <p className="text-xs text-primary leading-relaxed">
                 Create a temporary pricing rule for the selected rooms. This will override the base price during the selected dates.
               </p>
            </div>

            <div>
              <label className="input-label text-[10px] uppercase tracking-wider">Rule Name / Label</label>
              <input 
                type="text" 
                value={festivalLabel} 
                onChange={(e) => setFestivalLabel(e.target.value)} 
                placeholder="e.g. Pujo Special" 
                className="input-field w-full" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">From</label>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                  className="input-field py-2 w-full" 
                />
              </div>
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">To</label>
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                  className="input-field py-2 w-full" 
                  min={fromDate} // Basic validation to prevent selecting an end date before start date
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">Adjustment Type</label>
                <select 
                  value={adjustmentType} 
                  onChange={(e) => setAdjustmentType(e.target.value as any)} 
                  className="input-field py-2 w-full appearance-none cursor-pointer text-sm"
                >
                  <option value="percentage_increase">Percentage (%)</option>
                  <option value="flat_increase">Flat Increase (₹)</option>
                  <option value="fixed_price">Fixed Override (₹)</option>
                </select>
              </div>
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">Value</label>
                <input 
                  type="number" 
                  value={adjustmentValue} 
                  onChange={(e) => setAdjustmentValue(e.target.value)} 
                  placeholder={adjustmentType === 'percentage_increase' ? "e.g. 15" : "e.g. 500"} 
                  className="input-field py-2 w-full" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-background rounded-lg border border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Calendar size={16} className="text-text-secondary" />
                Weekend Pricing Only
              </div>
              <button 
                onClick={() => setIsWeekendPricing(!isWeekendPricing)} 
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${isWeekendPricing ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 bg-card w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isWeekendPricing ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-card border-t border-border mt-auto rounded-b-xl">
        <div className="mb-4 p-3 bg-background border border-border rounded-lg flex items-start gap-2">
          <Info size={16} className="text-text-secondary mt-0.5 shrink-0" />
          <p className="text-xs text-text-secondary font-medium leading-relaxed">
            Changes will be applied to <strong className="font-bold text-text-primary">{selectedRoomIds.length} selected rooms</strong>.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button 
            onClick={activeTab === 'bulk' ? handleBaseSubmit : handleSeasonalSubmit}
            disabled={isLoading}
            className="btn-primary flex-1 flex justify-center items-center"
          >
            {isLoading ? "Saving..." : (activeTab === 'bulk' ? 'Update Base Data' : 'Create Rule')}
          </button>
        </div>
      </div>

    </div>
  );
}