import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  ArrowRightToLine, 
  Users, 
  ArrowLeftFromLine,
  BarChart3,
  Database,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Helper component for standard, single-level links
const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-orange-50 text-[#FF5A3C] font-medium'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`
    }
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </NavLink>
);

const SideBar = () => {
  const location = useLocation();
  
  // Check if current URL is inside the master route to keep menu open on reload
  const isMasterActive = location.pathname.includes('/master');
  
  // State to handle the dropdown toggle
  const [isMastersOpen, setIsMastersOpen] = useState(isMasterActive);

  // Auto-expand if navigating to a master route from somewhere else
  useEffect(() => {
    if (isMasterActive) {
      setIsMastersOpen(true);
    }
  }, [isMasterActive]);

  return (
    <aside className="w-[260px] h-screen bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Logo Area */}
        <div className="h-[70px] flex flex-col justify-center px-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">REBOO ERP</h1>
          <span className="text-[10px] text-[#FF5A3C] font-semibold tracking-widest uppercase">Premium Management</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-4 mt-6">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/room-calendar" icon={CalendarDays} label="Room Calendar" />
          <NavItem to="/bookings" icon={BookOpen} label="Bookings" />
          <NavItem to="/check-in" icon={ArrowRightToLine} label="Check-in" />
          <NavItem to="/active-guests" icon={Users} label="Active Guests" />
          <NavItem to="/checkout" icon={ArrowLeftFromLine} label="Checkout" />

          {/* Admin Section */}
          <div className="mt-6 mb-2 px-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
          
          <NavItem to="/reports" icon={BarChart3} label="Reports" />

          {/* Collapsible Masters Menu */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsMastersOpen(!isMastersOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                isMasterActive && !isMastersOpen
                  ? 'bg-orange-50/50 text-[#FF5A3C] font-medium' // subtle highlight if active but closed
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database size={18} className={isMasterActive ? "text-[#FF5A3C]" : ""} />
                <span className={`text-sm ${isMasterActive ? "text-[#FF5A3C] font-medium" : ""}`}>Masters</span>
              </div>
              {isMastersOpen ? (
                <ChevronDown size={16} className={isMasterActive ? "text-[#FF5A3C]" : ""} />
              ) : (
                <ChevronRight size={16} className={isMasterActive ? "text-[#FF5A3C]" : ""} />
              )}
            </button>

            {/* Sub-menu Items */}
            <div 
              className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
                isMastersOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 pl-4 border-l border-gray-100 flex flex-col gap-1">
                <NavLink
                  to="/master/staff"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-[#FF5A3C] font-medium bg-orange-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  Staff Directory
                </NavLink>
                
                {/* Future Sub-routes can be added exactly like this: */}
                {/* <NavLink
                  to="/master/rooms"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive ? 'text-[#FF5A3C] font-medium bg-orange-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  Room Types
                </NavLink> 
                */}
              </div>
            </div>
          </div>

          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      {/* Bottom Floating Action */}
      <div className="p-6 border-t border-gray-100 bg-white">
        <button className="bg-[#FF5A3C] hover:bg-[#E5492E] text-white font-medium rounded-lg w-full flex items-center justify-center gap-2 py-3 shadow-sm transition-colors">
          <PlusCircle size={18} />
          <span>New Booking</span>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;