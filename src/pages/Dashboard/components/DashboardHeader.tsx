import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      
      {/* Date Filter Control - Styled exactly like a Status Column Header */}
      <div className=" btn-primary w-[180px] h-[46px] flex items-center justify-between px-3 shrink-0">
        <button className=" hover:text-[#E5492E] transition-colors flex items-center justify-center">
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <h4 className="text-[13px] font-bold">
          Date Filter
        </h4>
        
        <button className=" transition-colors flex items-center justify-center">
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