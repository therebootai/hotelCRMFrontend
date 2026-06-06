import { useState, useEffect } from 'react';
import CreateBooking from '../bookingComp/CreateBooking';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiLayout,
  FiCalendar,
  FiBookOpen,
  FiLogIn,
  FiUsers,
  FiLogOut,
  FiBarChart2,
  FiDatabase,
  FiSettings,
  FiPlusCircle,
  FiChevronDown,
  FiChevronRight,
  FiPhone
} from 'react-icons/fi';

// Helper component for standard, single-level links
const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string; }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors 3xl:gap-4.5 3xl:px-6 3xl:py-3.5 3xl:rounded-xl 4xl:gap-6 4xl:px-8 4xl:py-5 4xl:rounded-2xl 5xl:gap-10 5xl:px-12 5xl:py-8 5xl:rounded-[20px] ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-text-secondary hover:bg-background hover:text-text-primary'
      }`
    }
  >
    <Icon size={18} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
    <span className="text-sm 3xl:text-base 4xl:text-2xl 5xl:text-4xl">{label}</span>
  </NavLink>
);

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isMasterActive = location.pathname.includes('/master');
  
  const [isMastersOpen, setIsMastersOpen] = useState(isMasterActive);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingKey, setBookingKey] = useState(0);

  useEffect(() => {
    if (isMasterActive) {
      setIsMastersOpen(true);
    }
  }, [isMasterActive]);

  return (
    <aside className="w-65 3xl:w-[320px] 4xl:w-[440px] 5xl:w-[680px] h-screen bg-card border-r border-border flex flex-col justify-between md:flex shrink-0">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Logo Area */}
        <div className="h-17.5 3xl:h-24 4xl:h-38 5xl:h-60 flex flex-col justify-center px-6 3xl:px-8 4xl:px-12 5xl:px-20 border-b border-border sticky top-0 bg-card z-10">
          <h1 className="text-xl 3xl:text-2xl 4xl:text-4xl 5xl:text-6xl font-bold text-text-primary tracking-tight">REBOOT ERP</h1>
          <span className="text-[10px] 3xl:text-xs 4xl:text-lg 5xl:text-2xl text-primary font-semibold tracking-widest uppercase mt-0.5 3xl:mt-1 4xl:mt-1.5 5xl:mt-2">Premium Management</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-4 mt-6 3xl:gap-2 3xl:px-6 3xl:mt-8 4xl:gap-4 4xl:px-10 4xl:mt-16 5xl:gap-8 5xl:px-12 5xl:mt-20">
          <NavItem to="/dashboard" icon={FiLayout} label="Dashboard" />
          <NavItem to="/room-calendar" icon={FiCalendar} label="Room Calendar" />
          <NavItem to="/bookings" icon={FiBookOpen} label="Bookings" />
          <NavItem to="/checkin" icon={FiLogIn} label="Check-in" />
          <NavItem to="/active-guests" icon={FiUsers} label="Active Guests" />
          <NavItem to="/customers" icon={FiPhone} label="Customer Directory" />
          <NavItem to="/billing" icon={FiLogOut} label="Billing & Checkout" />

          {/* Admin Section */}
          <div className="mt-6 mb-2 px-4 3xl:mt-8 3xl:mb-3 3xl:px-6 4xl:mt-16 4xl:mb-6 4xl:px-10 5xl:mt-20 5xl:mb-8 5xl:px-12">
            <span className="text-[11px] font-semibold text-text-secondary opacity-70 uppercase tracking-wider 3xl:text-xs 4xl:text-xl 5xl:text-2xl">Admin</span>
          </div>
          
          <NavItem to="/reports" icon={FiBarChart2} label="Reports" />

          {/* Collapsible Masters Menu */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsMastersOpen(!isMastersOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors 3xl:px-6 3xl:py-3.5 3xl:rounded-xl 4xl:px-10 4xl:py-6.5 4xl:rounded-3xl 5xl:px-12 5xl:py-8 5xl:rounded-[20px] ${
                isMasterActive && !isMastersOpen
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3 3xl:gap-4.5 4xl:gap-8 5xl:gap-10">
                <FiDatabase size={18} className={`3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3] ${isMasterActive ? "text-primary" : ""}`} />
                <span className={`text-sm 3xl:text-base 4xl:text-2xl 5xl:text-4xl ${isMasterActive ? "text-primary font-medium" : ""}`}>Masters</span>
              </div>
              {isMastersOpen ? (
                <FiChevronDown size={16} className={`3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3] ${isMasterActive ? "text-primary" : ""}`} />
              ) : (
                <FiChevronRight size={16} className={`3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3] ${isMasterActive ? "text-primary" : ""}`} />
              )}
            </button>

            {/* Sub-menu Items */}
            <div 
              className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
                isMastersOpen ? "max-h-80 3xl:max-h-[500px] 4xl:max-h-[1000px] 5xl:max-h-[1500px] opacity-100 mt-1 3xl:mt-2 4xl:mt-4 5xl:mt-5" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 pl-4 border-l border-border flex flex-col gap-1 3xl:ml-8 3xl:pl-6 4xl:ml-16 4xl:pl-10 5xl:ml-20 5xl:pl-12">
                <NavLink
                  to="/master/rooms"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
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
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
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
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
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
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
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
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Access Packages
                </NavLink>
                <NavLink
                  to="/master/tax-gst"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm 3xl:gap-4.5 3xl:px-6 3xl:py-3 3xl:rounded-xl 3xl:text-base 4xl:gap-8 4xl:px-10 4xl:py-6 4xl:rounded-3xl 4xl:text-2xl 5xl:gap-10 5xl:px-12 5xl:py-7.5 5xl:rounded-[20px] 5xl:text-4xl ${
                      isActive
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`
                  }
                >
                  Tax / GST
                </NavLink>
              </div>
            </div>
          </div>

          <NavItem to="/settings" icon={FiSettings} label="Settings" />
        </nav>
      </div>

      {/* Bottom Floating Action */}
      <div className="p-6 3xl:p-8 4xl:p-16 5xl:p-20 border-t border-border bg-card">
        <button
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base 3xl:gap-3.5 3xl:py-4.5 3xl:text-lg 3xl:rounded-xl 4xl:gap-7 4xl:py-8.5 4xl:text-2xl 4xl:rounded-3xl 5xl:gap-9 5xl:py-11 5xl:text-4xl 5xl:rounded-[20px]"
          onClick={() => { setBookingKey(k => k + 1); setShowBookingModal(true); }}
        >
          <FiPlusCircle size={18} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
          <span>New Booking</span>
        </button>
      </div>
      {showBookingModal && (
        <CreateBooking
          key={bookingKey}
          onClose={() => setShowBookingModal(false)}
          refreshBookings={() => navigate('/bookings')}
        />
      )}
    </aside>
  );
};

export default SideBar;