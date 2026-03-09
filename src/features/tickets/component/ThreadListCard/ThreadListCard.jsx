import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaEdit } from "react-icons/fa";

const getInitials = (name) => {
  if (!name) return "";
  return name.split(" ").map((part) => part[0].toUpperCase()).join("");
};

function formatDateRange(fromTime, toTime) {
  const currentYear = dayjs().year();
  const from = dayjs(fromTime);
  const to = dayjs(toTime);
  const formatStr = currentYear === from.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A";
  return `${from.format(formatStr)} - ${to.format(formatStr)}`;
}

// 👉 Accept the new onEdit and currentUser props!
const ThreadListCard = ({ item, onEdit, currentUser }) => {
  dayjs.extend(relativeTime);

  // Check if this comment was made by the logged-in user
  const isMe = item.CreatedBy === currentUser;
console.log("isMe :", isMe, currentUser, item);

  return (
    // 👉 flex-row-reverse pushes the whole block to the right if isMe is true
    <div className={`relative flex gap-4 w-full mb-6 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      
      {/* 1. THE AVATAR */}
      <div className="flex-shrink-0 relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ring-4 ring-white ${
          isMe ? "bg-brand-yellow text-white" : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}>
          {getInitials(item.CreatedBy)}
        </div>
      </div>

      {/* 2. THE CHAT CARD */}
      {/* max-w-[85%] ensures the chat bubbles don't stretch all the way across the screen */}
      <div className="flex-1 max-w-[100%] border border-gray-200 rounded-md bg-white shadow-sm relative">
        
        {/* The pointer arrow (Flips left or right depending on the user) */}
        <div className={`absolute top-3 w-3 h-3 bg-[#f6f8fa] transform rotate-45 rounded-sm ${
          isMe 
            ? "-right-[6px] border-t border-r border-gray-200" // Point right
            : "-left-[6px] border-l border-b border-gray-200"  // Point left
        }`}></div>

        {/* Card Header (Gray background) */}
        <div className="bg-[#f6f8fa] border-b border-gray-200 px-4 py-2.5 rounded-t-md flex justify-between items-center text-sm">
          <div className="text-gray-500">
            <strong className="text-gray-900 font-semibold mr-1">
              {isMe ? "You" : item.CreatedBy || "Unknown User"}
            </strong>
            commented {dayjs(item.createdAt).fromNow()}
          </div>
          
          {/* 👉 THE FIX: Dedicated Edit Button placed perfectly in the header */}
          <button 
            onClick={onEdit} 
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-200"
            title="Edit Comment"
          >
            <FaEdit size={14} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 text-sm text-gray-800 break-words leading-relaxed">
          <HtmlRenderer html={item.description} />
        </div>

        {/* Card Footer */}
        {(item.fromTime || item.Hours) && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-md flex justify-between text-xs text-gray-500">
            <span>{formatDateRange(item.fromTime, item.toTime)}</span>
            <span className="font-medium">Total Working Hours: {item.Hours || "N/A"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadListCard;







// import "./ThreadListCard.css";
// import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";

// const getInitials = (name) => {
//   if (!name) return "";
//   const nameParts = name.split(" ");
//   const initials = nameParts.map((part) => part[0].toUpperCase()).join("");
//   return initials;
// };

// function formatDateRange(fromTime, toTime) {
//   const currentYear = dayjs().year(); // Get current year

//   // Parse fromTime and toTime using dayjs
//   const from = dayjs(fromTime);
//   const to = dayjs(toTime);

//   // Format the dates
//   const formattedFrom = from.format(
//     currentYear === from.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A",
//   );
//   const formattedTo = to.format(
//     currentYear === to.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A",
//   );

//   return `${formattedFrom} - ${formattedTo}`;
// }

// const ThreadListCard = ({ item }) => {
//   dayjs.extend(relativeTime);

//   return (
//     <div className="relative flex gap-4 w-full mb-6 group">
      
//       {/* 1. THE AVATAR */}
//       <div className="flex-shrink-0 relative z-10">
//         <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center justify-center text-sm font-bold shadow-sm ring-4 ring-white">
//           {getInitials(item.CreatedBy)}
//         </div>
//       </div>

//       {/* 2. THE GITHUB-STYLE CARD */}
//       <div className="flex-1 min-w-0 border border-gray-200 rounded-md bg-white shadow-sm relative">
        
//         {/* The pointer arrow */}
//         <div className="absolute top-3 -left-[6px] w-3 h-3 bg-[#f6f8fa] border-l border-b border-gray-200 transform rotate-45 rounded-sm"></div>

//         {/* Card Header (Gray background) - Removed the hardcoded edit button! */}
//         <div className="bg-[#f6f8fa] border-b border-gray-200 px-4 py-2.5 rounded-t-md flex justify-between items-center text-sm">
//           <div className="text-gray-500 pr-6"> {/* Added pr-6 so text doesn't overlap the ListCardView edit button */}
//             <strong className="text-gray-900 font-semibold mr-1">{item.CreatedBy || "Unknown User"}</strong>
//             commented {dayjs(item.createdAt).fromNow()}
//           </div>
//         </div>

//         {/* Card Body */}
//         <div className="p-4 text-sm text-gray-800 break-words leading-relaxed">
//           <HtmlRenderer html={item.description} />
//         </div>

//         {/* Card Footer */}
//         {(item.fromTime || item.Hours) && (
//           <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-md flex justify-between text-xs text-gray-500">
//             <span>{formatDateRange(item.fromTime, item.toTime)}</span>
//             <span className="font-medium">Total Working Hours: {item.Hours || "N/A"}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
//   // return (
//   //   <div className="p-2 bg-white rounded-md ">
//   //     <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
//   //       <div
//   //         className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center
//   //        justify-center text-[12px] font-bold"
//   //       >
//   //         {getInitials(item.CreatedBy)}
//   //       </div>

//   //       <div>
//   //         <div className="font-medium">{item.CreatedBy || "Unknown User"}</div>
//   //         <div className="text-xs text-gray-500">
//   //           <span>Created: {dayjs(item.createdAt).fromNow()}</span>
//   //         </div>
//   //       </div>
//   //     </div>

//   //     {/* Modern Box for Comment */}
//   //     <div className=" p-4 rounded-lg border border-gray-200 mb-4">
//   //       <HtmlRenderer html={item.description} />
//   //     </div>

//   //     <div className="flex justify-between text-xs text-gray-500">
//   //       <div className="flex items-center gap-1">
//   //         <div>{formatDateRange(item.fromTime, item.toTime)}</div>
//   //         <strong>Total Working Hours:</strong>{" "}
//   //         <span>{item.Hours || "N/A"}</span>
//   //       </div>

//   //       <div className="flex items-center gap-1">
//   //         <strong>Updated:</strong>{" "}
//   //         <span>{dayjs(item.UpdatedAt).fromNow()}</span>
//   //       </div>
//   //     </div>
//   //   </div>
//   // );
// };

// export default ThreadListCard;
