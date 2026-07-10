// import { Calendar, Clock } from "lucide-react";

// const statusColor = {
//   Completed: "bg-green-100 text-green-700",
//   Pending: "bg-yellow-100 text-yellow-700",
//   Cancelled: "bg-red-100 text-red-700",
// };

// const MeetingListCard = ({ meeting }) => {
//   return (
//     <div className="group border rounded-lg p-2.5 shadow-sm hover:shadow-md transition bg-white">

//       {/* Top Row */}
//       <div className="flex justify-between items-start gap-2">

//         {/* Title with hover tooltip */}
//         <h3
//           className="font-semibold text-sm text-gray-800 truncate max-w-[160px]"
//           title={meeting.title}
//         >
//           {meeting.title}
//         </h3>

//         {/* Status */}
//         <span
//           className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap ${
//             statusColor[meeting.status] || "bg-gray-100 text-gray-600"
//           }`}
//         >
//           {meeting.status}
//         </span>
//       </div>

//       {/* Date + Time */}
//       <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">

//         <div className="flex items-center gap-1">
//           <Calendar size={12} />
//           <span>{meeting.Date}</span>
//         </div>

//         <div className="flex items-center gap-1">
//           <Clock size={12} />
//           <span>
//             {meeting.start_time} - {meeting.end_time}
//           </span>
//         </div>
//       </div>

//       {/* Type */}
//       <div className="mt-1.5">
//         <span className="inline-block bg-amber-100 text-amber-700 px-2 py-[2px] rounded-md text-[10px] capitalize">
//           {meeting.booking_type}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MeetingListCard;


import { Calendar, Clock, Users, Repeat } from "lucide-react";

const STATUS_STYLES = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const MeetingListCard = ({ meeting, onClick }) => {
  const statusStyle =
    STATUS_STYLES[meeting.status] ||
    "bg-gray-50 text-gray-600 border-gray-200";
  const formatTime = (t) => (t ? t.slice(0, 5) : "—");
//   const internalCount = meeting.InternalParticipants
//     ? JSON.parse(meeting.InternalParticipants || "[]").length
//     : 0;
// console.log("meeting",meeting);

//   const clientCount = meeting.ClientParticipants
//     ? JSON.parse(meeting.ClientParticipants || "[]").length
//     : 0;
//     console.log("clientCount",clientCount);
//   const total = internalCount + clientCount;
//      console.log("total",total);

  return (
    <div
      onClick={() => onClick?.(meeting.meeting_id)}
      className="group border rounded-xl p-3 shadow-sm hover:shadow-md transition bg-white cursor-pointer"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start gap-2">
        <h3
          className="font-semibold text-sm text-gray-800 truncate max-w-[190px]"
          title={meeting.title}
        >
          {meeting.title || "Untitled Meeting"}
        </h3>

        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-md border ${statusStyle}`}
        >
          {meeting.status}
        </span>
      </div>

      {/* META ROW */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">

        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{(meeting.Date)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>
            {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{meeting.Organizer}</span>
        </div>

        {meeting.recurrence_type && meeting.recurrence_type !== "ONETIME" && (
          <div className="flex items-center gap-1 text-amber-600">
            <Repeat size={12} />
            <span className="capitalize text-[10px]">
              {meeting.recurrence_type}
            </span>
          </div>
        )}

        <span className="inline-block bg-amber-100 text-amber-700 px-2 py-[2px] rounded-md text-[10px] capitalize">
          {meeting.booking_type}
        </span>
      </div>

    </div>
  );
};

export default MeetingListCard;