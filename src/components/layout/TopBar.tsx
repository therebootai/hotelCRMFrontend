import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TopBar = () => {
  // Helper to apply the active bottom-border styling based on the current URL
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `uppercase tracking-wide text-xs pb-1 transition-colors ${
      isActive 
        ? 'text-primary border-b-2 border-primary' 
        : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <header className="h-17.5 bg-white border-b border-border flex items-center justify-between px-[32px] shrink-0">
      
      {/* Left: Property Name & Search */}
      <div className="flex items-center gap-8 flex-1">
        <h2 className="text-lg font-semibold text-text-primary whitespace-nowrap">Siddharaj Hotel</h2>
        
        <div className="relative w-full max-w-md hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search guests, rooms..." 
            className="w-full bg-gray-50 border-none rounded-full pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          />
        </div>
      </div>

      {/* Center/Right: Toggles & Profile */}
      <div className="flex items-center gap-6">
        
        {/* View Toggles - Now using Routing! */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          {/* Use 'end' so it only highlights on exactly /dashboard, not /dashboard/stay-overview */}
          <NavLink to="/dashboard" end className={navLinkClass}>
            Calendar
          </NavLink>
          
          <NavLink to="/dashboard/stay-overview" className={navLinkClass}>
            Stay Overview
          </NavLink>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border hidden md:block"></div>

        {/* Icons */}
        <div className="flex items-center gap-4 text-text-secondary">
          <button className="hover:text-text-primary transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="hover:text-text-primary transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-text-primary leading-tight">Masud Rahaman</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">Front Desk Manager</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-border">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Masud&backgroundColor=e2e8f0" alt="Masud Rahaman" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
    </header>
  );
};

export default TopBar;