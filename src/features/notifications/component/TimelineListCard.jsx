import React from "react";
import dayjs from "dayjs";
import { FiClock, FiUser } from "react-icons/fi";

export default function TimelineListCard({ item }) {
  return (
    <div className="bg-white border-l-4 border-brand-yellow rounded-lg p-4 shadow-sm mb-3 flex justify-between items-center">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-gray-800">
          {item.title}
        </h4>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiUser size={12} /> {item.actorName}
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={12} /> {dayjs(item.createdAt).format("DD MMM, HH:mm")}
          </span>
        </div>
      </div>
      
      {/* Optional: Show Old vs New values if they exist */}
      {(item.oldValue || item.newValue) && (
        <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
          <span className="text-gray-400">{item.oldValue}</span>
          <span className="mx-1">→</span>
          <span className="text-gray-800 font-medium">{item.newValue}</span>
        </div>
      )}
    </div>
  );
}