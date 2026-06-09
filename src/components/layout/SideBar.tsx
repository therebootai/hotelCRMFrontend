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
 FiChevronLeft,
 FiMenu,
 FiPhone
} from 'react-icons/fi';

// Helper component for standard, single-level links
const NavItem = ({ to, icon: Icon, label, isCollapsed }: { to: string; icon: any; label: string; isCollapsed: boolean; }) => (
 <NavLink
 to={to}
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
 isActive
 ? 'bg-primary/10 text-primary font-medium'
 : 'text-text-secondary hover:bg-background hover:text-text-primary'
 } ${isCollapsed ? 'justify-center px-0' : ''}`
 }
 title={isCollapsed ? label : undefined}
 >
 <Icon size={18} className=" shrink-0" />
 {!isCollapsed && <span className="text-base whitespace-nowrap">{label}</span>}
 </NavLink>
);

const SideBar = () => {
 const location = useLocation();
 const navigate = useNavigate();
 
 const isMasterActive = location.pathname.includes('/master');
 
 const [isMastersOpen, setIsMastersOpen] = useState(isMasterActive);
 const [showBookingModal, setShowBookingModal] = useState(false);
 const [bookingKey, setBookingKey] = useState(0);
 const [isCollapsed, setIsCollapsed] = useState(false);

 useEffect(() => {
 if (isMasterActive) {
 setIsMastersOpen(true);
 }
 }, [isMasterActive]);

 return (
 <aside className={`${isCollapsed ? 'w-20 ' : 'w-65 '} h-screen bg-card border-r border-border flex flex-col justify-between shrink-0 transition-all duration-300`}>
 <div className="flex-1 overflow-y-auto no-scrollbar overflow-x-hidden">
 {/* Logo Area */}
 <div className={`h-17.5 flex items-center justify-between px-6 border-b border-border sticky top-0 bg-card z-10 ${isCollapsed ? 'px-0 justify-center flex-col gap-2 py-4' : ''}`}>
 {!isCollapsed && (
 <div className="flex flex-col justify-center overflow-hidden">
 <h1 className="text-xl font-bold text-text-primary tracking-tight whitespace-nowrap">REBOOT ERP</h1>
 <span className="text-[10px] text-primary font-semibold tracking-widest uppercase mt-0.5 whitespace-nowrap">Premium Management</span>
 </div>
 )}
 {isCollapsed && (
 <h1 className="text-xl font-bold text-primary mb-2">R</h1>
 )}
 <button 
 onClick={() => setIsCollapsed(!isCollapsed)} 
 className={`p-1.5 hover:bg-background rounded-lg text-text-secondary transition-colors ${isCollapsed ? '' : ''}`}
 title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
 >
 {isCollapsed ? <FiMenu size={20} className=" " /> : <FiChevronLeft size={20} className=" " />}
 </button>
 </div>

 {/* Navigation Links */}
 <nav className={`flex flex-col gap-1 mt-6 ${isCollapsed ? 'px-2' : 'px-4 '}`}>
 <NavItem to="/dashboard" icon={FiLayout} label="Dashboard" isCollapsed={isCollapsed} />
 <NavItem to="/room-calendar" icon={FiCalendar} label="Room Calendar" isCollapsed={isCollapsed} />
 <NavItem to="/bookings" icon={FiBookOpen} label="Bookings" isCollapsed={isCollapsed} />
 <NavItem to="/checkin" icon={FiLogIn} label="Check-in" isCollapsed={isCollapsed} />
 <NavItem to="/active-guests" icon={FiUsers} label="Active Guests" isCollapsed={isCollapsed} />
 <NavItem to="/customers" icon={FiPhone} label="Customer Directory" isCollapsed={isCollapsed} />
 <NavItem to="/billing" icon={FiLogOut} label="Billing & Checkout" isCollapsed={isCollapsed} />

 {/* Admin Section */}
 <div className={`mt-6 mb-2 ${isCollapsed ? 'text-center' : 'px-4 '}`}>
 <span className={`text-[11px] font-semibold text-text-secondary opacity-70 uppercase tracking-wider ${isCollapsed ? 'text-[9px] ' : ''}`}>
 {isCollapsed ? 'Adm' : 'Admin'}
 </span>
 </div>
 
 <NavItem to="/reports" icon={FiBarChart2} label="Reports" isCollapsed={isCollapsed} />

 {/* Collapsible Masters Menu */}
 <div className="flex flex-col gap-1">
 <button
 onClick={() => {
 if(isCollapsed) {
 setIsCollapsed(false);
 setIsMastersOpen(true);
 } else {
 setIsMastersOpen(!isMastersOpen);
 }
 }}
 className={`w-full flex items-center justify-between py-2.5 rounded-lg transition-colors ${
 isMasterActive && !isMastersOpen
 ? 'bg-primary/5 text-primary font-medium'
 : 'text-text-secondary hover:bg-background hover:text-text-primary'
 } ${isCollapsed ? 'justify-center px-0' : 'px-4 '}`}
 title={isCollapsed ? "Masters" : undefined}
 >
 <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
 <FiDatabase size={18} className={`shrink-0 ${isMasterActive ? "text-primary" : ""}`} />
 {!isCollapsed && <span className={`text-base whitespace-nowrap ${isMasterActive ? "text-primary font-medium" : ""}`}>Masters</span>}
 </div>
 {!isCollapsed && (isMastersOpen ? (
 <FiChevronDown size={16} className={`shrink-0 ${isMasterActive ? "text-primary" : ""}`} />
 ) : (
 <FiChevronRight size={16} className={`shrink-0 ${isMasterActive ? "text-primary" : ""}`} />
 ))}
 </button>

 {/* Sub-menu Items */}
 {!isCollapsed && (
 <div 
 className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
 isMastersOpen ? "max-h-80 opacity-100 mt-1 " : "max-h-0 opacity-0"
 }`}
 >
 <div className="ml-6 pl-4 border-l border-border flex flex-col gap-1 ">
 <NavLink
 to="/master/rooms"
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-base whitespace-nowrap ${
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
 )}
 </div>

 <NavItem to="/settings" icon={FiSettings} label="Settings" isCollapsed={isCollapsed} />
 </nav>
 </div>

 {/* Bottom Floating Action */}
 <div className={`py-6 border-t border-border bg-card ${isCollapsed ? 'px-2' : 'px-6 '}`}>
 <button
 className={`btn-primary w-full flex items-center justify-center py-3 text-base ${isCollapsed ? 'px-0 gap-0' : 'gap-2 '}`}
 onClick={() => { setBookingKey(k => k + 1); setShowBookingModal(true); }}
 title={isCollapsed ? "New Booking" : undefined}
 >
 <FiPlusCircle size={18} className="shrink-0 " />
 {!isCollapsed && <span className="whitespace-nowrap">New Booking</span>}
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