import { useState, useEffect } from 'react';
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
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-text-secondary hover:bg-background hover:text-text-primary'
      }`
    }
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </NavLink>
);

const SideBar = () => {
  const location = useLocation();
  
  const isMasterActive = location.pathname.includes('/master');
  
  const [isMastersOpen, setIsMastersOpen] = useState(isMasterActive);

  useEffect(() => {
    if (isMasterActive) {
      setIsMastersOpen(true);
    }
  }, [isMasterActive]);

  return (
    <aside className="w-65 h-screen bg-card border-r border-border flex flex-col justify-between md:flex shrink-0">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Logo Area */}
        <div className="h-17.5 flex flex-col justify-center px-6 border-b border-border sticky top-0 bg-card z-10">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">REBOOT ERP</h1>
          <span className="text-[10px] text-primary font-semibold tracking-widest uppercase">Premium Management</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-4 mt-6">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/room-calendar" icon={CalendarDays} label="Room Calendar" />
          <NavItem to="/bookings" icon={BookOpen} label="Bookings" />
          <NavItem to="/checkin" icon={ArrowRightToLine} label="Check-in" />
          <NavItem to="/active-guests" icon={Users} label="Active Guests" />
          <NavItem to="/billing" icon={ArrowLeftFromLine} label="Billing & Checkout" />

          {/* Admin Section */}
          <div className="mt-6 mb-2 px-4">
            <span className="text-[11px] font-semibold text-text-secondary opacity-70 uppercase tracking-wider">Admin</span>
          </div>
          
          <NavItem to="/reports" icon={BarChart3} label="Reports" />

          {/* Collapsible Masters Menu */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsMastersOpen(!isMastersOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                isMasterActive && !isMastersOpen
                  ? 'bg-primary/5 text-primary font-medium' // subtle highlight if active but closed
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database size={18} className={isMasterActive ? "text-primary" : ""} />
                <span className={`text-sm ${isMasterActive ? "text-primary font-medium" : ""}`}>Masters</span>
              </div>
              {isMastersOpen ? (
                <ChevronDown size={16} className={isMasterActive ? "text-primary" : ""} />
              ) : (
                <ChevronRight size={16} className={isMasterActive ? "text-primary" : ""} />
              )}
            </button>

            {/* Sub-menu Items */}
            <div 
              className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
                isMastersOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 pl-4 border-l border-border flex flex-col gap-1">
                <NavLink
                  to="/master/rooms"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Room Master
                </NavLink>

                <NavLink
                  to="/master/staffs"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Staff Directory
                </NavLink>

                <NavLink
                  to="/master/facilities"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Facility Master
                </NavLink>
                <NavLink
                  to="/master/extra-services"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Extra Services
                </NavLink>
                <NavLink
                  to="/master/access-packages"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Access Packages
                </NavLink>
              </div>
            </div>
          </div>

          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      {/* Bottom Floating Action */}
      <div className="p-6 border-t border-border bg-card">
        {/* Replaced manual styling with your global .btn-primary class */}
        <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
          <PlusCircle size={18} />
          <span>New Booking</span>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;