// import React from 'react'
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";



// const ThreadListCard = ({ item }) => {
//     dayjs.extend(relativeTime);
//     return (
// <div className="thread-list-card">
//       {/* Project Info */}
//       <div className="project-details">
//         <span className="thread-id">Thread ID: {item.ThreadId}</span>
//       </div>
//       <span className="thread-id"> {item.Comment}</span>
//       {/* Info Section */}
//       <div className="info-section">
//         <div className="created-by">
//           <strong>Created By:</strong> {item.CreatedBy || 'Unknown User'}
//         </div>
//         <div className="hours">
//           <strong>Hours:</strong> {item.Hours || 'N/A'}
//         </div>
//         <div className="created-at">
//           <strong>Created At:</strong> {dayjs(item.createdAt).fromNow()}
//         </div>
//         <div className="updated-at">
//           <strong>Last Updated:</strong> {dayjs(item.UpdatedAt).fromNow()}
//         </div>
//       </div>
//     </div>

// );
// };

// export default ThreadListCard



// import React from 'react';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import { FaUserAlt, FaCircle } from 'react-icons/fa';

// const extractText = (html) => {
//     const div = document.createElement('div');
//     div.innerHTML = html;
//     return div.innerText || div.textContent || ''; // Get the plain text content
//   };
// const ThreadListCard = ({ item }) => {
//   dayjs.extend(relativeTime);
//   const plainTextComment = extractText(item.Comment);
//   return (
//     <div className="p-4 border-b border-gray-200">
//       {/* Thread Header */}
//       <div className="flex items-center justify-between mb-2">
//         <h3 className="text-ghBlue text-lg font-semibold">{plainTextComment}</h3>
//         <span className="text-xs text-ghMuted">Thread ID: {item.ThreadId}</span>
//       </div>
//       {/* Created By & Hours */}
//       <div className="flex justify-between text-xs text-ghMuted mb-2">
//         <div className="flex items-center gap-1">
//           <FaUserAlt className="text-gray-600" />
//           <span>{item.CreatedBy || 'Unknown User'}</span>
//         </div>
//         <div className="flex items-center gap-1">
//           <strong>Hours:</strong> <span>{item.Hours || 'N/A'}</span>
//         </div>
//       </div>

//       {/* Created At and Last Updated */}
//       <div className="flex justify-between text-xs text-ghMuted mt-1">
//         <span>Created: {dayjs(item.createdAt).fromNow()}</span>
//         <span>Updated: {dayjs(item.UpdatedAt).fromNow()}</span>
//       </div>

     
//     </div>
//   );
// };

// export default ThreadListCard;







// import React from 'react';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// const extractText = (html) => {
//   const div = document.createElement('div');
//   div.innerHTML = html;
//   return div.innerText || div.textContent || ''; // Get the plain text content
// };

// const getInitials = (name) => {
//   if (!name) return '';
//   const nameParts = name.split(' ');
//   const initials = nameParts.map(part => part[0].toUpperCase()).join('');
//   return initials;
// };

// const ThreadListCard = ({ item }) => {
//   dayjs.extend(relativeTime);
//   const plainTextComment = extractText(item.Comment);

//   return (
//     <div className="p-4 border border-gray-200 bg-white rounded-md">

//       <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
   
//         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold">
//           {getInitials(item.CreatedBy)}
//         </div>

//         <div>
         
//           <div className="font-medium">{item.CreatedBy || 'Unknown User'}</div>

         
//           <div className="text-xs text-gray-500">
//             <span>Created: {dayjs(item.createdAt).fromNow()}</span>
//           </div>
//         </div>
//       </div>

      
//       <div className="mb-3 pl-12">
//         <p className="text-gray-900 text-sm">{plainTextComment}</p>
//       </div>

      
//       <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-xs text-gray-500">
    
//         <div className="flex items-center gap-1">
//           <strong>Hours:</strong> <span>{item.Hours || 'N/A'}</span>
//         </div>

      
//         <div className="flex items-center gap-1">
//           <strong>Updated:</strong> <span>{dayjs(item.UpdatedAt).fromNow()}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ThreadListCard;





import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import DOMPurify from 'dompurify';
import './ThreadListCard.css';
import { HtmlRenderer } from '../../../../app/shared/utilities/utilities';

const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  const initials = nameParts.map(part => part[0].toUpperCase()).join('');
  return initials;
};

const ThreadListCard = ({ item }) => {
  dayjs.extend(relativeTime);
  return (
    <div className="p-2 bg-white rounded-md">
      <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold">
          {getInitials(item.CreatedBy)}
        </div>

        <div>
          <div className="font-medium">{item.CreatedBy || 'Unknown User'}</div>
          <div className="text-xs text-gray-500">
            <span>Created: {dayjs(item.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>

      {/* Modern Box for Comment */}
      <div className=" p-4 rounded-lg border border-gray-200 mb-4">
        {/* Render the sanitized HTML content */}
        <div
        
        />
        <HtmlRenderer html ={item.description}/>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <strong>Total Working Hours:</strong> <span>{item.Hours || 'N/A'}</span>
        </div>

        <div className="flex items-center gap-1">
          <strong>Updated:</strong> <span>{dayjs(item.UpdatedAt).fromNow()}</span>
        </div>
      </div>
    </div>
  );
};

export default ThreadListCard;