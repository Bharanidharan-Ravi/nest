// import React from 'react'
// import { useTicketMaster } from '../../hooks/useTicketMaster';
// import { HtmlRenderer } from '../../../../app/shared/utilities/utilities';

// const ThreadParent = ({ item }) => {
//   // Retrieve the ticket data using the custom hook
//   // const { data } = useTicketMaster();
//   console.log("data", item);

//   // Find the matching ThreadParent using the Issue_Id from `item`
//   // const ThreadParent = data?.find((thr) => thr.id === item.Id);
// //   const labels = ThreadParent.Labels_JSON ? JSON.parse(ThreadParent.Labels_JSON ) : [];
// //   // Log ThreadParent to inspect data
// //   console.log("ThreadParent", ThreadParent);


//   return (
//     <div className="p-2 bg-white rounded-md">
//       <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
//         <div
//           className="html-renderer" >
//         <HtmlRenderer html ={item.Comment}/>
//       </div>
//       <p>{item.Title}</p>
//         <p>{item.DueDate}</p>
//         <p>{item.Label}</p>
//         {labels.length > 0 && (
//           <div className="flex gap-2 ml-2">
//             {labels.map((label) => (
//               <span
//                 key={label.LABEL_ID}
//                 className="label-tickets"
//                 style={{ backgroundColor: label.LABEL_COLOR }}
//               >
//                 {label.LABEL_TITLE}
//               </span>
//             ))}
//           </div>
//         )}
//         <p>{item.Status}</p>
//       </div>
//     </div>
//   );
// }

// export default ThreadParent;



import React from 'react';
import { HtmlRenderer, formatDate } from '../../../../app/shared/utilities/utilities';
import { FaCalendarAlt } from 'react-icons/fa';  // Using a calendar icon for the Due Date

const ThreadParent = ({ item }) => {

  const labels = item.label ? JSON.parse(item.label) : [];
  const formattedDueDate = formatDate(item.DueDate);

  return (
    <div className="p-6 bg-white rounded-lg mx-auto mt-0 relative">
      <div className="flex flex-col gap-4">

        {/* Ticket Header */}
        <div className="flex justify-between items-center">

          {/* Title and Labels */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center">

            {/* Title */}
            <h3 className="text-2xl text-gray-800 font-semibold hover:text-ghBlue transition-all duration-300">{item.title}</h3>

            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {labels.map((label) => (
                  <span
                    key={label.LABEL_ID}
                    className="text-xs font-medium text-white px-3 py-1 rounded-full cursor-pointer transition-colors duration-300"
                    style={{ backgroundColor: label.LABEL_COLOR }}
                  >
                    {label.LABEL_TITLE}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <FaCalendarAlt className="text-ghBlue" />
            <span className="font-semibold text-gray-800">Due Date: {formattedDueDate}</span>
          </div>

        </div>

        {/* Ticket Comment */}
        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
          <HtmlRenderer html={item.description} />
        </div>

      </div>
    </div>
  );
}

export default ThreadParent;