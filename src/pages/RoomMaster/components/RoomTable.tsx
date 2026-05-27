import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { AxiosError } from 'axios';

export interface Room {
  _id: string;
  roomNumber: string;
  roomType: { _id: string; name: string };
  building?: string;
  floor?: string;
  maxAdults: number;
  maxChildren: number;
  extraBedAllowed: boolean;
  extraBedCharge?: number;
  basePrice: number;
  discountPercentage: number;
  gstId?: { _id: string; percentage: number };
  roomSize?: number;
  viewType?: string;
  amenities: { _id: string; name: string }[];
  description?: string;
  status: "Active" | "Maintenance" | "Blocked";
}

interface RoomTableProps {
  rooms: Room[];
  selectedRoomIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  isSelectionMode: boolean;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  // Backend Pagination Props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function RoomTable({ 
  rooms, 
  selectedRoomIds, 
  onSelectionChange, 
  isSelectionMode, 
  onEdit, 
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: RoomTableProps) {
  
  // Local state for optimistic updates
  const [tableData, setTableData] = useState<Room[]>([]);

  useEffect(() => {
    setTableData(Array.isArray(rooms) ? rooms : []);
  }, [rooms]);

  const currentPageIds = tableData.map(r => r._id);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedRoomIds.includes(id));
  const isSomeCurrentPageSelected = currentPageIds.some(id => selectedRoomIds.includes(id));

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

  const handleStatusChange = async (id: string, newStatus: Room["status"], oldStatus: Room["status"]) => {
    setTableData(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    try {
      const res = await api.patch(`/rooms/${id}/status`, { status: newStatus });
      const updatedRoom = res.data?.data;
      if (updatedRoom && updatedRoom.status) {
         setTableData(prev => prev.map(r => r._id === id ? { ...r, status: updatedRoom.status } : r));
      }
      toast.success(`Room status updated to ${newStatus}`);
    } catch (error: unknown) {
      setTableData(prev => prev.map(r => r._id === id ? { ...r, status: oldStatus } : r));
      let errorMsg = "Failed to update status";
      if (error instanceof AxiosError) {
        errorMsg = error.response?.data?.message;
      }
      toast.error(errorMsg);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + tableData.length, totalItems);

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
              {!isSelectionMode && (
                <th className={`${headerPadding} font-semibold text-text-secondary uppercase tracking-wider text-right`}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={isSelectionMode ? 8 : 7} className="px-6 py-12 text-center text-text-secondary">
                  No rooms found.
                </td>
              </tr>
            ) : (
              tableData.map((room) => {
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
                    <td className={`${cellPadding} text-text-secondary ${textScale}`}>{room.roomType?.name || '---'}</td>
                    <td className={`${cellPadding} text-text-primary font-medium ${textScale}`}>
                      ₹{room.basePrice.toLocaleString('en-IN')}
                    </td>
                    <td className={`${cellPadding} text-text-secondary ${textScale}`}>{room.gstId?.percentage || 0}%</td>
                    <td className={cellPadding}>
                      <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                        {room.amenities?.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className={`px-2 py-0.5 font-medium bg-background border border-border/50 text-text-secondary rounded ${isSelectionMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            {amenity.name}
                          </span>
                        ))}
                        {(room.amenities?.length || 0) > 3 && (
                          <span className={`px-2 py-0.5 font-medium bg-background border border-border/50 text-text-secondary rounded ${isSelectionMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1 w-fit">
                        <div className={`w-2 h-2 rounded-full ${
                          room.status === 'Active' ? 'bg-success' : 
                          room.status === 'Maintenance' ? 'bg-warning' : 'bg-danger'
                        }`} />
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(room._id, e.target.value as any, room.status)}
                          className={`bg-transparent text-xs font-bold outline-none cursor-pointer appearance-none ${
                            room.status === 'Active' ? 'text-success' : 
                            room.status === 'Maintenance' ? 'text-warning' : 'text-danger'
                          }`}
                        >
                          <option value="Active" className="text-text-primary">Active</option>
                          <option value="Maintenance" className="text-text-primary">Maintenance</option>
                          <option value="Blocked" className="text-text-primary">Blocked</option>
                        </select>
                      </div>
                    </td>
                    {!isSelectionMode && (
                      <td className={cellPadding}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEdit(room)}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDelete(room)}
                            className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Backend Pagination Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-card rounded-b-xl">
        <div className={`text-text-secondary ${textScale}`}>
          Showing <span className="font-medium text-text-primary">{tableData.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-text-primary">{endIndex}</span> of <span className="font-medium text-text-primary">{totalItems}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage <= 1} 
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-50 transition-colors cursor-pointer"
          >
            <FiChevronLeft size={16} />
          </button>
          <span className={`px-2 font-medium text-text-primary ${textScale}`}>
            {currentPage} / {totalPages || 1}
          </span>
          <button 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage >= totalPages || totalPages === 0} 
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-50 transition-colors cursor-pointer"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}