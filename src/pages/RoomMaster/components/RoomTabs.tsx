import React from 'react';

const TABS = ['Room Master', 'Room Type Master', 'Amenities Master', 'Tax / GST Master'];

interface RoomTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RoomTabs({ activeTab, setActiveTab }: RoomTabsProps) {
  return (
    <div className="flex gap-1.5 bg-gray-100/80 p-1.5 rounded-xl w-fit border border-gray-200/50">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}