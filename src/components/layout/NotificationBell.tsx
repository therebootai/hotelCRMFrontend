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
 className="hover:text-text-primary transition-colors duration-200 relative p-1.5 rounded-full hover:bg-gray-100 focus:outline-none flex items-center justify-center cursor-pointer"
 >
 <FiBell size={20} className={` ${isOpen ? "text-text-primary" : ""}`} />
 {unreadCount > 0 && (
 <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 rounded-full border border-white text-[10px] font-bold text-white flex items-center justify-center animate-pulse ">
 {unreadCount}
 </span>
 )}
 </button>

 {/* Dropdown Menu */}
 {isOpen && (
 <div className="absolute right-0 mt-3.5 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in origin-top-right z-70 ">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between ">
 <h3 className="font-semibold text-text-primary text-base flex items-center gap-2 ">
 Notifications
 {unreadCount > 0 && (
 <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium ">
 {unreadCount} New
 </span>
 )}
 </h3>
 {unreadCount > 0 && (
 <button
 onClick={handleMarkAllRead}
 className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors duration-150 flex items-center gap-1 cursor-pointer "
 >
 <FiCheckCircle size={13} className=" " />
 Mark all read
 </button>
 )}
 </div>

 <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 ">
 {notifications.length > 0 ? (
 notifications.map((notif) => (
 <div
 key={notif._id}
 onClick={() => handleNotificationClick(notif)}
 className={`p-4 flex gap-3 hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer ${
 !notif.isRead ? "bg-primary/[0.02]" : ""
 }`}
 >
 {/* Status Indicator */}
 <div className="mt-1 flex-shrink-0">
 <span
 className={`block w-2.5 h-2.5 rounded-full ${
 !notif.isRead
 ? "bg-primary animate-pulse"
 : "bg-gray-300"
 }`}
 ></span>
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start gap-1">
 <p
 className={`text-sm font-semibold text-text-primary truncate ${!notif.isRead ? "font-bold" : ""}`}
 >
 {notif.title}
 </p>
 <span className="text-[10px] text-gray-400 whitespace-nowrap ">
 {new Date(notif.createdAt).toLocaleTimeString([], {
 hour: "2-digit",
 minute: "2-digit",
 })}
 </span>
 </div>
 <p className="text-[11px] text-text-secondary leading-normal mt-0.5 line-clamp-2 ">
 {notif.message}
 </p>

 <div className="flex gap-4 mt-2 ">
 {!notif.isRead && (
 <button
 onClick={(e) => handleMarkSingleRead(notif._id, e)}
 className="text-[10px] font-semibold text-primary hover:underline cursor-pointer "
 >
 Mark as read
 </button>
 )}
 <button
 onClick={(e) => handleDeleteNotification(notif._id, e)}
 className="text-[10px] font-semibold text-danger hover:underline flex items-center gap-0.5 cursor-pointer ml-auto "
 >
 <FiTrash2 size={10} className=" " />
 Delete
 </button>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-8 flex flex-col items-center justify-center text-center text-gray-400 ">
 <FiInbox size={32} className="mb-2 text-gray-300 " />
 <p className="text-sm ">All caught up!</p>
 <p className="text-[10px] mt-0.5 ">
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
