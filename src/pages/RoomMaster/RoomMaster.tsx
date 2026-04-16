import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import RoomTable from './components/RoomTable';
import RoomTabs from './components/RoomTabs';
import RoomFilters from './components/RoomFilters';
import ComingSoon from './components/ComingSoon';
import BulkUpdatePanel from './components/BulkUpdatePanel';
import AddRoomForm from './components/AddRoomForm';
import RoomTypeMaster from './components/RoomTypeMaster';
import AmenitiesMaster from './components/AmenitiesMaster';
import TaxGstMaster from './components/TaxGstMaster'; // NEW IMPORT
import { mockRooms } from './data/mockData';

export default function RoomMaster() {
  const [activeTab, setActiveTab] = useState('Room Master');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [view, setView] = useState<'list' | 'add'>('list');

  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  

  const handleCloseBulkUpdate = () => {
    setIsBulkUpdateOpen(false);
    setSelectedRoomIds([]);
  };

  return (
    <div className="p-8 bg-background min-h-full">
      
      {/* Top Header Row */}
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
        
        {/* Dynamic Action Buttons based on Active Tab */}
        {view === 'list' && (
          <div className="flex items-center gap-3 animate-fade-in">
            
            {/* Show Room Master specific buttons */}
            {activeTab === 'Room Master' && (
              <>
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
              </>
            )}

            {/* Show Room Type Master specific buttons */}
            {activeTab === 'Room Type Master' && (
              <button 
                onClick={() => setIsRoomTypeModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <Plus size={18} />
                Add Room Type
              </button>
            )}

            {activeTab === 'Amenities Master' && (
              <button onClick={() => setIsAmenityModalOpen(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5">
                <Plus size={18} /> Add Amenities
              </button>
            )}

            {activeTab === 'Tax / GST Master' && (
              <button onClick={() => setIsTaxModalOpen(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5">
                <Plus size={18} /> Add Tax/GST
              </button>
            )}

          </div>
        )}
      </div>

      {/* Main Content Area Routing */}
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
      ) : activeTab === 'Room Type Master' ? (
        <RoomTypeMaster 
          isAddModalOpen={isRoomTypeModalOpen}
          setIsAddModalOpen={setIsRoomTypeModalOpen}
        />
      ) : activeTab === 'Amenities Master' ? (
        <AmenitiesMaster isAddModalOpen={isAmenityModalOpen} setIsAddModalOpen={setIsAmenityModalOpen} />
      ) : activeTab === 'Tax / GST Master' ? (
        <TaxGstMaster isAddModalOpen={isTaxModalOpen} setIsAddModalOpen={setIsTaxModalOpen} />
      ) : (
        <ComingSoon moduleName={activeTab} />
      )}

    </div>
  );
}