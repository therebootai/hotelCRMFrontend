import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, LogOut, User, Key } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
  const { user, logout } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `uppercase tracking-wide text-xs pb-1 transition-colors ${
      isActive 
        ? 'text-primary border-b-2 border-primary' 
        : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <header className="h-17.5 bg-white border-b border-border flex items-center justify-between px-[32px] shrink-0 relative z-20">
      
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
        
        {/* View Toggles */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
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

        {/* User Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          
          {/* Profile Trigger */}
          <div 
            className="flex items-center gap-3 pl-2 cursor-pointer select-none"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              {/* Display dynamic user name, fallback to "Staff" */}
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {user?.fullName}
              </p>
              {/* Display dynamic user role */}
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-border">
                {/* Dynamically generate avatar based on user's name */}
                <img 
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.fullName || 'Staff'}&backgroundColor=e2e8f0`} 
                  alt={user?.fullName || 'Profile'} 
                  className="w-full h-full object-cover" 
                />
              </div>
              {/* <ChevronDown size={14} className={`text-text-secondary transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} /> */}
            </div>
          </div>

          {/* Dropdown Menu Modal */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-card rounded-xl shadow-modal border border-border overflow-hidden animate-fade-in origin-top-right">
              <div className="p-2 flex flex-col gap-1">
                
                {/* Future Profile Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors">
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                {/* Future Change Password Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors">
                  <Key size={16} />
                  <span>Change Password</span>
                </button>

                <div className="h-px w-full bg-border my-1"></div>

                {/* Actual Logout Button */}
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-danger hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>

              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default TopBar;