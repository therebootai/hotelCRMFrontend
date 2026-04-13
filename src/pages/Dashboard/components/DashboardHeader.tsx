import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      
      {/* Date Filter Control */}
      <button className="flex items-center justify-between bg-[#ff8a73] hover:bg-[#ff765c] text-white px-4 py-2 rounded-lg transition-colors min-w-[200px]">
        <ChevronLeft size={20} className="opacity-80" />
        <span className="text-sm font-medium">Select Date Filter</span>
        <ChevronRight size={20} className="opacity-80" />
      </button>

      {/* Primary Action */}
      <button className="btn-primary flex items-center gap-2 shadow-md shadow-primary/20">
        <Plus size={18} />
        <span>New Booking</span>
      </button>

    </div>
  );
};

export default DashboardHeader;