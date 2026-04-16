// src/pages/RoomMaster/components/BulkUpdatePanel.tsx
import React, { useState } from 'react';
import { X, Info, Calendar } from 'lucide-react';

interface BulkUpdatePanelProps {
  onClose: () => void;
  selectedRoomCount: number;
}

export default function BulkUpdatePanel({ onClose, selectedRoomCount }: BulkUpdatePanelProps) {
  const [activeTab, setActiveTab] = useState<'bulk' | 'seasonal'>('bulk');
  
  // Base Room Form State
  const [newPrice, setNewPrice] = useState('');
  const [gstPercentage, setGstPercentage] = useState('12% Standard');
  
  // Seasonal Pricing Form State
  const [fromDate, setFromDate] = useState('2024-04-10');
  const [toDate, setToDate] = useState('2024-04-15');
  const [festivalLabel, setFestivalLabel] = useState('Pujo Special');
  const [isWeekendPricing, setIsWeekendPricing] = useState(true);

  return (
    <div className="w-full lg:w-100 shrink-0 bg-card border border-border rounded-xl shadow-card flex flex-col sticky top-6 max-h-[calc(100vh-100px)] transition-all">
      
      {/* Header */}
      <div className="pt-5 px-6 pb-2 bg-card rounded-t-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Bulk Update</h2>
            <p className="text-sm text-text-secondary mt-0.5">{selectedRoomCount} rooms selected</p>
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
            <div>
              <label className="input-label text-[11px] uppercase tracking-wider">New Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₹</span>
                {/* Utilizing .input-field from index.css */}
                <input 
                  type="number" 
                  placeholder="e.g. 3000" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(e.target.value)} 
                  className="input-field pl-8 font-medium" 
                />
              </div>
            </div>

            <div>
              <label className="input-label text-[11px] uppercase tracking-wider">GST Percentage</label>
              <select 
                value={gstPercentage} 
                onChange={(e) => setGstPercentage(e.target.value)} 
                className="input-field appearance-none cursor-pointer font-medium"
              >
                <option>5% Standard</option>
                <option>12% Standard</option>
                <option>18% Premium</option>
              </select>
            </div>

            <div>
              <label className="input-label text-[11px] uppercase tracking-wider">Update Amenities</label>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  WIFI Included
                </span>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card text-text-secondary border border-border border-dashed rounded-lg text-xs font-medium hover:text-text-primary hover:border-text-secondary transition-colors">
                  + Breakfast
                </button>
              </div>
            </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">From</label>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                  className="input-field py-2" 
                />
              </div>
              <div>
                <label className="input-label text-[10px] uppercase tracking-wider">To</label>
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                  className="input-field py-2" 
                />
              </div>
            </div>

            <div>
              <label className="input-label text-[10px] uppercase tracking-wider">Festival / Event Label</label>
              <input 
                type="text" 
                value={festivalLabel} 
                onChange={(e) => setFestivalLabel(e.target.value)} 
                placeholder="e.g. Pujo Special" 
                className="input-field" 
              />
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
            Changes will be applied to <strong className="font-bold text-text-primary">{selectedRoomCount} selected rooms</strong>.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Utilizing .btn-secondary and .btn-primary from index.css */}
          <button 
            onClick={onClose} 
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button 
            className="btn-primary flex-"
          >
            {activeTab === 'bulk' ? 'Update Base Data' : 'Create Rule'}
          </button>
        </div>
      </div>

    </div>
  );
}