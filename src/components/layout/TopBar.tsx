import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { FiHelpCircle, FiLogOut, FiUser, FiKey } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import CheckinSearchBar from "../../components/checkinComp/CheckinSearchBar";

const TopBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isCheckinPage = location.pathname.startsWith('/checkin') || location.pathname.startsWith('/checkout');
  const currentCategory = searchParams.get("category") || "Room Stay";

  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      prev.set("category", category);
      return prev;
    });
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `uppercase tracking-wide text-sm pb-1 transition-colors ${
      isActive
        ? "text-primary border-b-2 border-primary"
        : "text-text-secondary hover:text-text-primary"
    }`;

  return (
    <header className="h-17.5 bg-white border-b border-border flex items-center justify-between px-8 shrink-0 relative">
      {/* Left: Property Name & Search */}
      <div className="flex items-center gap-4 sm:gap-8 flex-1">
        {!isCheckinPage && (
          <h2 className="text-lg font-semibold text-text-primary whitespace-nowrap">
            Siddharaj Hotel
          </h2>
        )}
        
        {isCheckinPage && (
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleCategoryChange("Room Stay")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wide ${
                currentCategory === "Room Stay"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Room Stay
            </button>
            <button
              onClick={() => handleCategoryChange("Day Access")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wide ${
                currentCategory === "Day Access"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Day Access
            </button>
          </div>
        )}

        { isCheckinPage && <CheckinSearchBar /> }
      </div>

      {/* Center/Right: Toggles & Profile */}
      <div className="flex items-center gap-6 ">
        {/* View Toggles */}
        <div className="hidden md:flex items-center gap-4 text-base font-medium ">
          <NavLink to="/dashboard" end className={navLinkClass}>
            Calendar
          </NavLink>
          <NavLink to="/dashboard/stay-overview" className={navLinkClass}>
            Stay Overview
          </NavLink>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border hidden md:block "></div>

        {/* Icons */}
        <div className="flex items-center gap-4 text-text-secondary ">
          <NotificationBell />
          <button className="hover:text-text-primary transition-colors">
            <FiHelpCircle size={20} className=" " />
          </button>
        </div>

        {/* User Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          {/* Profile Trigger */}
          <div
            className="flex items-center gap-3 pl-2 cursor-pointer select-none "
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              {/* Display dynamic user name, fallback to "Staff" */}
              <p className="text-base font-semibold text-text-primary leading-tight ">
                {user?.fullName}
              </p>
              {/* Display dynamic user role */}
              <p className="text-[10px] text-text-secondary uppercase tracking-wider ">
                {user?.role}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-border ">
                {/* Dynamically generate avatar based on user's name */}
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.fullName || "Staff"}&backgroundColor=e2e8f0`}
                  alt={user?.fullName || "Profile"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Dropdown Menu Modal */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-card rounded-xl shadow-modal border border-border overflow-hidden animate-fade-in origin-top-right z-30 ">
              <div className="p-2 flex flex-col gap-1 ">
                {/* Future Profile Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors ">
                  <FiUser size={16} className=" " />
                  <span>My Profile</span>
                </button>

                {/* Future Change Password Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors ">
                  <FiKey size={16} className=" " />
                  <span>Change Password</span>
                </button>

                <div className="h-px w-full bg-border my-1 "></div>

                {/* Actual Logout Button */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-base font-medium text-danger hover:bg-red-50 rounded-lg transition-colors "
                >
                  <FiLogOut size={16} className=" " />
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
