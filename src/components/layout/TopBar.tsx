import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiHelpCircle, FiLogOut, FiUser, FiKey } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

const TopBar = () => {
  const { user, logout } = useAuth();

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
    `uppercase tracking-wide text-xs pb-1 transition-colors 3xl:text-base 3xl:pb-2 4xl:text-2xl 4xl:pb-4.5 5xl:text-4xl 5xl:pb-8 ${
      isActive
        ? "text-primary border-b-2 3xl:border-b-3 4xl:border-b-[5px] 5xl:border-b-[8px] border-primary"
        : "text-text-secondary hover:text-text-primary"
    }`;

  return (
    <header className="h-17.5 3xl:h-24 4xl:h-38 5xl:h-60 bg-white border-b border-border flex items-center justify-between px-[32px] 3xl:px-10 4xl:px-16 5xl:px-24 shrink-0 relative">
      {/* Left: Property Name & Search */}
      <div className="flex items-center gap-8 flex-1">
        <h2 className="text-lg 3xl:text-3xl 4xl:text-5xl 5xl:text-7xl font-semibold text-text-primary whitespace-nowrap">
          Siddharaj Hotel
        </h2>
      </div>

      {/* Center/Right: Toggles & Profile */}
      <div className="flex items-center gap-6 3xl:gap-7 4xl:gap-12 5xl:gap-20">
        {/* View Toggles */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium 3xl:gap-10 3xl:text-2xl 4xl:gap-14 4xl:text-3xl 5xl:gap-18 5xl:text-4xl">
          <NavLink to="/dashboard" end className={navLinkClass}>
            Calendar
          </NavLink>
          <NavLink to="/dashboard/stay-overview" className={navLinkClass}>
            Stay Overview
          </NavLink>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border hidden md:block 3xl:h-11 4xl:h-16 5xl:h-24"></div>

        {/* Icons */}
        <div className="flex items-center gap-4 text-text-secondary 3xl:gap-6.5 4xl:gap-10 5xl:gap-18">
          <NotificationBell />
          <button className="hover:text-text-primary transition-colors">
            <FiHelpCircle size={20} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
          </button>
        </div>

        {/* User Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          {/* Profile Trigger */}
          <div
            className="flex items-center gap-3 pl-2 cursor-pointer select-none 3xl:gap-4 3xl:pl-3 4xl:gap-6 4xl:pl-5 5xl:gap-10 5xl:pl-8"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              {/* Display dynamic user name, fallback to "Staff" */}
              <p className="text-sm font-semibold text-text-primary leading-tight 3xl:text-base 4xl:text-xl 5xl:text-4xl">
                {user?.fullName}
              </p>
              {/* Display dynamic user role */}
              <p className="text-[10px] text-text-secondary uppercase tracking-wider 3xl:text-xs 4xl:text-base 5xl:text-2xl">
                {user?.role}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-border 3xl:w-14 3xl:h-14 4xl:w-22 4xl:h-22 5xl:w-36 5xl:h-36">
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
            <div className="absolute right-0 mt-3 w-56 bg-card rounded-xl shadow-modal border border-border overflow-hidden animate-fade-in origin-top-right z-30 3xl:w-72 3xl:mt-4 3xl:rounded-2xl 4xl:w-[360px] 4xl:mt-6 4xl:rounded-[24px] 5xl:w-[550px] 5xl:mt-10 5xl:rounded-[36px]">
              <div className="p-2 flex flex-col gap-1 3xl:p-3.5 3xl:gap-2 4xl:p-5 4xl:gap-3.5 5xl:p-8 5xl:gap-6">
                {/* Future Profile Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors 3xl:gap-4 3xl:px-4 3xl:py-3.5 3xl:text-base 3xl:rounded-xl 4xl:gap-6 4xl:px-6 4xl:py-5.5 4xl:text-xl 4xl:rounded-2xl 5xl:gap-10 5xl:px-10 5xl:py-9 5xl:text-4xl 5xl:rounded-[20px]">
                  <FiUser size={16} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
                  <span>My Profile</span>
                </button>

                {/* Future Change Password Link */}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded-lg transition-colors 3xl:gap-4 3xl:px-4 3xl:py-3.5 3xl:text-base 3xl:rounded-xl 4xl:gap-6 4xl:px-6 4xl:py-5.5 4xl:text-xl 4xl:rounded-2xl 5xl:gap-10 5xl:px-10 5xl:py-9 5xl:text-4xl 5xl:rounded-[20px]">
                  <FiKey size={16} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
                  <span>Change Password</span>
                </button>

                <div className="h-px w-full bg-border my-1 3xl:my-2 4xl:my-3.5 5xl:my-5"></div>

                {/* Actual Logout Button */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-danger hover:bg-red-50 rounded-lg transition-colors 3xl:gap-4 3xl:px-4 3xl:py-3.5 3xl:text-base 3xl:rounded-xl 4xl:gap-6 4xl:px-6 4xl:py-5.5 4xl:text-xl 4xl:rounded-2xl 5xl:gap-10 5xl:px-10 5xl:py-9 5xl:text-4xl 5xl:rounded-[20px]"
                >
                  <FiLogOut size={16} className="3xl:scale-125 4xl:scale-[1.8] 5xl:scale-[3]" />
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
