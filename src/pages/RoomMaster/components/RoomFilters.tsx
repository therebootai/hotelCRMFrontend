import React from 'react';
import { ChevronDown, ArrowDown } from 'lucide-react';

export default function RoomFilters() {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between mt-6">
      <div className="flex items-center gap-3">
        
        <div className="relative">
          <select className="appearance-none bg-background border border-transparent rounded-lg pl-4 pr-10 py-2 text-sm text-text-primary font-medium hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer outline-none">
            <option>All Room Types</option>
            <option>Deluxe Suite</option>
            <option>Executive Room</option>
            <option>Standard Single</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select className="appearance-none bg-background border border-transparent rounded-lg pl-4 pr-10 py-2 text-sm text-text-primary font-medium hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Maintenance</option>
            <option>Blocked</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>

      </div>

      {/* Sort By Indicator */}
      <div className="flex items-center gap-2 text-sm pr-2">
        <span className="text-text-secondary font-bold tracking-wider uppercase text-[10px]">Sort By:</span>
        <button className="flex items-center gap-1 text-text-primary font-medium hover:text-primary transition-colors">
          Room No
          <ArrowDown size={14} className="text-text-secondary transition-colors group-hover:text-primary" />
        </button>
      </div>
    </div>
  );
}