import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      
      {/* Date Filter Control - Using the 'primary' CSS variable */}
      <div className="w-45 h-11.5 flex items-center justify-between px-3 border-t-4 border-primary bg-primary/10 shrink-0">
        <button className="text-primary hover:text-primary-hover transition-colors flex items-center justify-center">
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <h4 className="text-[13px] font-bold text-primary">
          Date Filter
        </h4>
        
        <button className="text-primary hover:text-primary-hover transition-colors flex items-center justify-center">
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Primary Action */}
      <button className="btn-primary flex items-center gap-2 shadow-md shadow-primary/20">
        <Plus size={18} />
        <span>New Booking</span>
      </button>

    </div>
  );
};

export default DashboardHeader;