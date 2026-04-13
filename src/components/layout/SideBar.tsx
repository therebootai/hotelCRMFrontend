import React from 'react';
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
  PlusCircle
} from 'lucide-react';

const SideBar = () => {
  return (
    <aside className="w-[260px] h-screen bg-white border-r border-border flex flex-col justify-between hidden md:flex">
      <div>
        {/* Logo Area */}
        <div className="h-[70px] flex flex-col justify-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">REBOO ERP</h1>
          <span className="text-[10px] text-primary font-semibold tracking-widest uppercase">Premium Management</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-4 mt-6">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 text-primary font-medium">
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <CalendarDays size={18} />
            <span className="text-sm">Room Calendar</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <BookOpen size={18} />
            <span className="text-sm">Bookings</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <ArrowRightToLine size={18} />
            <span className="text-sm">Check-in</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <Users size={18} />
            <span className="text-sm">Active Guests</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <ArrowLeftFromLine size={18} />
            <span className="text-sm">Checkout</span>
          </a>

          {/* Admin Section */}
          <div className="mt-6 mb-2 px-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <BarChart3 size={18} />
            <span className="text-sm">Reports</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <Database size={18} />
            <span className="text-sm">Masters</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </a>
        </nav>
      </div>

      {/* Bottom Floating Action */}
      <div className="p-6">
        <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-md">
          <PlusCircle size={18} />
          <span>New Booking</span>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;