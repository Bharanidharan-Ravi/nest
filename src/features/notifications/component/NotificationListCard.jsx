import React from "react";
import dayjs from "dayjs";
import { FiClock, FiUser, FiBell, FiMessageSquare, FiAlertCircle } from "react-icons/fi";
import { LuTicket } from "react-icons/lu";

export default function NotificationListCard({ item }) {
  
  // Icon helper (Optional: keep or remove based on your preference)
  const getIcon = () => {
    switch (item?.entityType?.toUpperCase()) {
      case "TICKET": return <LuTicket className="text-blue-500" size={14} />;
      case "COMMENT": return <FiMessageSquare className="text-green-500" size={14} />;
      default: return <FiBell className="text-brand-yellow" size={14} />;
    }
  };

  if (!item) return null;

  return (
    // 🔥 USES EXACT CLASSES FROM TIMELINE: border-l-4, rounded-lg, shadow-sm
    <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 shadow-sm mb-3 flex justify-between items-center hover:shadow-md transition-all">
      
      {/* 1. Main Content Container */}
      <div className="flex flex-col gap-1">
        
        {/* Title: Same bold font size */}
        <h4 className="text-sm font-semibold text-gray-800">
          {getIcon()} {item.title}
        </h4>

        {/* Meta Row: Same gap, same text size, same gray color */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
          <span className="flex items-center gap-1">
            <FiUser size={12} /> {item.actorName || "System"}
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={12} /> {dayjs(item.createdAt).format("DD MMM, HH:mm")}
          </span>
        </div>
      </div>

      {/* 2. Right Side: Optional Message content */}
      <div className="text-sm text-gray-600 max-w-[40%] text-right truncate">
        {item.message}
      </div>
    </div>
  );
}