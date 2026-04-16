import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import RoomTable from './components/RoomTable';
import RoomTabs from './components/RoomTabs';
import RoomFilters from './components/RoomFilters';
import ComingSoon from './components/ComingSoon';
import BulkUpdatePanel from './components/BulkUpdatePanel';
import AddRoomForm from './components/AddRoomForm';
import { mockRooms } from './data/mockData';

export default function RoomMaster() {
  const [activeTab, setActiveTab] = useState('Room Master');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  
  const [view, setView] = useState<'list' | 'add'>('list');

  const handleCloseBulkUpdate = () => {
    setIsBulkUpdateOpen(false);
    setSelectedRoomIds([]);
  };

  return (
    <div className="p-8 bg-background min-h-full">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {view === 'add' ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('list')}
              className="p-2 bg-card border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-text-primary">Add New Room</h1>
          </div>
        ) : (
          <RoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        
        {view === 'list' && activeTab === 'Room Master' && (
          <div className="flex items-center gap-3 animate-fade-in">
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

            <button 
              onClick={() => {
                setView('add');
                setIsBulkUpdateOpen(false);
              }} 
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {view === 'add' ? (
        <AddRoomForm 
          onCancel={() => setView('list')} 
          onSuccess={() => setView('list')}
        />
      ) : activeTab === 'Room Master' ? (
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