import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RoomTable from './components/RoomTable';
import RoomTabs from './components/RoomTabs';
import RoomFilters from './components/RoomFilters';
import ComingSoon from './components/ComingSoon';
import BulkUpdatePanel from './components/BulkUpdatePanel';
import { mockRooms } from './data/mockData';

export default function RoomMaster() {
  const [activeTab, setActiveTab] = useState('Room Master');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  const handleCloseBulkUpdate = () => {
    setIsBulkUpdateOpen(false);
    setSelectedRoomIds([]);
  };

  return (
    <div className="p-8 bg-background min-h-full">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <RoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex items-center gap-3">
          {activeTab === 'Room Master' && (
            <button 
              onClick={() => setIsBulkUpdateOpen(!isBulkUpdateOpen)}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors border ${
                isBulkUpdateOpen 
                  ? 'bg-primary/5 border-primary text-primary' 
                  : 'bg-card border-border text-text-primary hover:bg-background'
              }`}
            >
              {isBulkUpdateOpen ? 'Cancel Selection' : 'Enter Bulk Mode'}
            </button>
          )}

          {/* Utilizing .btn-primary from index.css */}
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5">
            <Plus size={18} />
            Add Room
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'Room Master' ? (
        <>
          <RoomFilters />
          
          <div className="mt-4 flex flex-col lg:flex-row items-start gap-6">
            
            <div className="flex-1 min-w-0 transition-all duration-300">
              <RoomTable 
                rooms={mockRooms} 
                selectedRoomIds={selectedRoomIds}
                onSelectionChange={setSelectedRoomIds}
                isSelectionMode={isBulkUpdateOpen} 
              />
            </div>

            {isBulkUpdateOpen && (
              <BulkUpdatePanel 
                onClose={handleCloseBulkUpdate}
                selectedRoomCount={selectedRoomIds.length}
              />
            )}
            
          </div>
        </>
      ) : (
        <ComingSoon moduleName={activeTab} />
      )}

    </div>
  );
}