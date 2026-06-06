import React, { useState, useEffect, useRef } from "react";
import { FiBell, FiTrash2, FiCheckCircle, FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

interface NotificationItem {
  _id: string;
  type: "system" | "booking" | "housekeeping" | "alert";
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      if (response.data?.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const response = await api.patch("/notifications/read");
      if (response.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/notifications/read/${id}`);
      if (response.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data?.success) {
        const target = notifications.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/read/${notif._id}`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)),
        );
      } catch (error) {
        console.error("Failed to mark click-through as read:", error);
      }
    }

    setIsOpen(false);

    // Context aware routing
    if (notif.relatedType === "Booking") {
      navigate(`/bookings`);
    } else if (notif.relatedType === "CheckIn") {
      navigate(`/checkin`);
    } else if (notif.relatedType === "Billing") {
      navigate(`/billing`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-text-primary transition-colors duration-200 relative p-1.5 3xl:p-4 4xl:p-5.5 5xl:p-7 rounded-full hover:bg-gray-100 focus:outline-none flex items-center justify-center cursor-pointer"
      >
        <FiBell size={20} className={`3xl:scale-[1.8] 4xl:scale-[2.4] 5xl:scale-[3] ${isOpen ? "text-text-primary" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 rounded-full border border-white text-[10px] font-bold text-white flex items-center justify-center animate-pulse 3xl:w-9 3xl:h-9 3xl:text-lg 3xl:top-1.5 3xl:right-1.5 4xl:w-12 4xl:h-12 4xl:text-2xl 4xl:top-2 4xl:right-2 5xl:w-16 5xl:h-16 5xl:text-3xl 5xl:top-3 5xl:right-3">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in origin-top-right z-70 3xl:w-[500px] 3xl:mt-7 3xl:rounded-3xl 4xl:w-[650px] 4xl:mt-10 4xl:rounded-[32px] 5xl:w-[800px] 5xl:mt-12 5xl:rounded-[40px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between 3xl:p-8 4xl:p-10 5xl:p-12">
            <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2 3xl:text-2xl 3xl:gap-4.5 4xl:text-3xl 4xl:gap-6 5xl:text-4xl 5xl:gap-8">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium 3xl:text-base 3xl:px-4 3xl:py-2 4xl:text-xl 4xl:px-5 4xl:py-2.5 5xl:text-2xl 5xl:px-6 5xl:py-3">
                  {unreadCount} New
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors duration-150 flex items-center gap-1 cursor-pointer 3xl:text-xl 3xl:gap-2 4xl:text-2xl 4xl:gap-3 5xl:text-3xl 5xl:gap-4"
              >
                <FiCheckCircle size={13} className="3xl:scale-[1.8] 4xl:scale-[2.4] 5xl:scale-[3]" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 3xl:max-h-[750px] 4xl:max-h-[1000px] 5xl:max-h-[1300px]">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex gap-3 hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer 3xl:p-8 3xl:gap-6 4xl:p-10 4xl:gap-8 5xl:p-12 5xl:gap-10 ${
                    !notif.isRead ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full 3xl:w-5 3xl:h-5 4xl:w-7 4xl:h-7 5xl:w-9 5xl:h-9 ${
                        !notif.isRead
                          ? "bg-primary animate-pulse"
                          : "bg-gray-300"
                      }`}
                    ></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p
                        className={`text-xs font-semibold text-text-primary truncate 3xl:text-xl 4xl:text-2xl 5xl:text-3xl ${!notif.isRead ? "font-bold" : ""}`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap 3xl:text-lg 4xl:text-xl 5xl:text-2xl">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal mt-0.5 line-clamp-2 3xl:text-lg 3xl:mt-2 4xl:text-xl 4xl:mt-3 5xl:text-2xl 5xl:mt-4">
                      {notif.message}
                    </p>

                    <div className="flex gap-4 mt-2 3xl:gap-10 3xl:mt-4.5 4xl:gap-14 4xl:mt-6 5xl:gap-18 5xl:mt-8">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkSingleRead(notif._id, e)}
                          className="text-[10px] font-semibold text-primary hover:underline cursor-pointer 3xl:text-lg 4xl:text-xl 5xl:text-2xl"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notif._id, e)}
                        className="text-[10px] font-semibold text-danger hover:underline flex items-center gap-0.5 cursor-pointer ml-auto 3xl:text-lg 3xl:gap-2 4xl:text-xl 4xl:gap-3 5xl:text-2xl 5xl:gap-4"
                      >
                        <FiTrash2 size={10} className="3xl:scale-[1.8] 4xl:scale-[2.4] 5xl:scale-[3]" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center text-gray-400 3xl:p-16 4xl:p-20 5xl:p-24">
                <FiInbox size={32} className="mb-2 text-gray-300 3xl:scale-[1.8] 4xl:scale-[2.4] 5xl:scale-[3] 3xl:mb-5 4xl:mb-6 5xl:mb-8" />
                <p className="text-xs 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl">All caught up!</p>
                <p className="text-[10px] mt-0.5 3xl:text-lg 3xl:mt-2 4xl:text-xl 4xl:mt-3 5xl:text-2xl 5xl:mt-4">
                  No notifications to display.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
