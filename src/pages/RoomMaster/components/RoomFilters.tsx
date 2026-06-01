import { useState, useEffect } from 'react';
import { FiChevronDown, FiArrowDown } from 'react-icons/fi';
import api from '../../../lib/axios';

interface RoomType {
  _id: string;
  name: string;
}

interface RoomFiltersProps {
  filters: {
    roomType: string;
    status: string;
  };
  onFilterChange: (filterName: 'roomType' | 'status', value: string) => void;
}

export default function RoomFilters({ filters, onFilterChange }: RoomFiltersProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get('/room-types');
        setRoomTypes(res.data?.data || []);
      } catch (error) {
        console.error("Failed to load room types for filters", error);
      }
    };

    fetchRoomTypes();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between mt-6">
      <div className="flex items-center gap-3">
        
        <div className="relative">
          <select 
            value={filters.roomType}
            onChange={(e) => onFilterChange('roomType', e.target.value)}
            className="appearance-none bg-background border border-transparent rounded-lg pl-4 pr-10 py-2 text-sm text-text-primary font-medium hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer outline-none"
          >
            <option value="">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt._id} value={rt._id}>
                {rt.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select 
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="appearance-none bg-background border border-transparent rounded-lg pl-4 pr-10 py-2 text-sm text-text-primary font-medium hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer outline-none"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Blocked">Blocked</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>

      </div>

      <div className="flex items-center gap-2 text-sm pr-2">
        <span className="text-text-secondary font-bold tracking-wider uppercase text-[10px]">Sort By:</span>
        <button className="flex items-center gap-1 text-text-primary font-medium hover:text-primary transition-colors">
          Room No
          <FiArrowDown size={14} className="text-text-secondary transition-colors group-hover:text-primary" />
        </button>
      </div>
    </div>
  );
}