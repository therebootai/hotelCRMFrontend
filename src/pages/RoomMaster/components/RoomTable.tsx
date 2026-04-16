import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MockRoom } from '../data/mockData';

interface RoomTableProps {
  rooms: MockRoom[];
  selectedRoomIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  isSelectionMode: boolean;
}

export default function RoomTable({ rooms, selectedRoomIds, onSelectionChange, isSelectionMode }: RoomTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = rooms.slice(startIndex, startIndex + itemsPerPage);

  const currentPageIds = paginatedRooms.map(r => r._id);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedRoomIds.includes(id));
  const isSomeCurrentPageSelected = currentPageIds.some(id => selectedRoomIds.includes(id));

  // Dynamic padding classes for compact mode
  const cellPadding = isSelectionMode ? 'px-3 py-2' : 'px-6 py-4';
  const headerPadding = isSelectionMode ? 'px-3 py-3 text-[10px]' : 'px-6 py-4 text-[11px]';
  const textScale = isSelectionMode ? 'text-xs' : 'text-sm';

  const handleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      onSelectionChange(selectedRoomIds.filter(id => !currentPageIds.includes(id)));
    } else {
      const newSelection = new Set([...selectedRoomIds, ...currentPageIds]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRoomIds.includes(id)) {
      onSelectionChange(selectedRoomIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedRoomIds, id]);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card transition-all duration-300">
      
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-background/80 sticky top-0 z-10 border-b border-border backdrop-blur-sm">
            <tr>
              {isSelectionMode && (
                <th className={`${headerPadding} w-10`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    checked={isAllCurrentPageSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeCurrentPageSelected && !isAllCurrentPageSelected;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>Room No</th>
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>Room Type</th>
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>Base Price</th>
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>GST %</th>
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>Amenities</th>
              <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRooms.map((room) => {
              const isSelected = selectedRoomIds.includes(room._id);
              return (
                <tr 
                  key={room._id} 
                  className={`hover:bg-background transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  {isSelectionMode && (
                    <td className={cellPadding}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={() => handleSelectRow(room._id)}
                      />
                    </td>
                  )}
                  <td className={`${cellPadding} font-medium text-text-primary ${textScale}`}>{room.roomNumber}</td>
                  <td className={`${cellPadding} text-text-secondary ${textScale}`}>{room.roomType.name}</td>
                  <td className={`${cellPadding} text-text-primary font-medium ${textScale}`}>
                    ₹{room.basePrice.toLocaleString('en-IN')}
                  </td>
                  <td className={`${cellPadding} text-text-secondary ${textScale}`}>{room.gstId.percentage}%</td>
                  <td className={cellPadding}>
                    <div className="flex gap-1.5 flex-wrap">
                      {room.amenities.map((amenity, idx) => (
                        <span key={idx} className={`px-2 py-0.5 font-medium bg-background border border-border/50 text-text-secondary rounded ${isSelectionMode ? 'text-[9px]' : 'text-[10px]'}`}>
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={cellPadding}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${room.status === 'Active' ? 'bg-room-available' : 'bg-danger'}`} />
                      <span className={`${textScale} ${room.status === 'Active' ? 'text-room-available' : 'text-danger'}`}>
                        {room.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-card rounded-b-xl">
        <div className={`text-text-secondary ${textScale}`}>
          Showing <span className="font-medium text-text-primary">{startIndex + 1}</span> to <span className="font-medium text-text-primary">{Math.min(startIndex + itemsPerPage, rooms.length)}</span> of <span className="font-medium text-text-primary">{rooms.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1} 
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={`px-2 font-medium text-text-primary ${textScale}`}>
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages} 
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}