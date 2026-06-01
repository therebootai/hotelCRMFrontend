

const TABS = [
  { id: "room-master",      label: "Room Master" },
  { id: "room-type-master", label: "Room Type Master" },
  { id: "amenities-master", label: "Amenities Master" },
] as const;
export type TabId = typeof TABS[number]["id"];

interface RoomTabsProps {
  activeTabId: TabId;
  onTabChange: (id: TabId) => void;
}

export default function RoomTabs({ activeTabId, onTabChange }: RoomTabsProps) {
  return (
    <div className="flex gap-1.5 bg-gray-100/80 p-1.5 rounded-xl w-fit border border-gray-200/50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTabId === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}