

// import { Calendar, Clock, Users, Repeat } from "lucide-react";

// const STATUS_STYLES = {
//   Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
//   Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
//   Cancelled: "bg-red-50 text-red-700 border-red-200",
// };

// const MeetingListCard = ({ meeting, onClick }) => {
//   const statusStyle =
//     STATUS_STYLES[meeting.status] ||
//     "bg-gray-50 text-gray-600 border-gray-200";
//   const formatTime = (t) => (t ? t.slice(0, 5) : "—");

//   return (
//     <div
//       onClick={() => onClick?.(meeting.meeting_id)}
//       className="group border rounded-xl p-3 shadow-sm hover:shadow-md transition bg-white cursor-pointer"
//     >
//       {/* HEADER */}
//       <div className="flex justify-between items-start gap-2">
//         <h3
//           className="font-semibold text-sm text-gray-800 truncate max-w-[190px]"
//           title={meeting.title}
//         >
//           {meeting.title || "Untitled Meeting"}
//         </h3>

//         <span
//           className={`text-[10px] px-1.5 py-0.2 rounded-md border ${statusStyle}`}
//         >
//           {meeting.status}
//         </span>
//       </div>

//       {/* META ROW */}
//       <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">

//         <div className="flex items-center gap-1">
//           <Calendar size={12} />
//           <span>{(meeting.Date)}</span>
//         </div>

//         <div className="flex items-center gap-1">
//           <Clock size={12} />
//           <span>
//             {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
//           </span>
//         </div>

//         <div className="flex items-center gap-1">
//           <Users size={12} />
//           <span>{meeting.Organizer}</span>
//         </div>

//         {meeting.recurrence_type && meeting.recurrence_type !== "ONETIME" && (
//           <div className="flex items-center gap-1 text-amber-600">
//             <Repeat size={12} />
//             <span className="capitalize text-[10px]">
//               {meeting.recurrence_type}
//             </span>
//           </div>
//         )}

//         <span className="inline-block bg-amber-100 text-amber-700 px-2 py-[2px] rounded-md text-[10px] capitalize">
//           {meeting.booking_type}
//         </span>
//       </div>

//     </div>
//   );
// };

// export default MeetingListCard;
import { Calendar, Clock, Users, Repeat } from "lucide-react";
import { formatDate, formatDateRange } from "../Helpers/dateTime";

const STATUS_STYLES = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const MeetingListCard = ({ meeting, onClick }) => {
  const statusStyle =
    STATUS_STYLES[meeting.status] ||
    "bg-gray-50 text-gray-600 border-gray-200";

  const formatTime = (t) => (t ? t.slice(0, 5) : "--");

  return (
    <div
      onClick={() => onClick?.(meeting.meeting_id)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-2 hover:border-amber-300 hover:shadow-sm transition"
    >
      {/* Row 1 */}
      <div className="flex items-center gap-2">
        <h3
          className="flex-1 truncate text-[13px] font-semibold text-gray-800"
          title={meeting.title}
        >
          {meeting.title || "Untitled Meeting"}
        </h3>
        <span
          title={`Meeting Type`}
          className="shrink-0 rounded bg-amber-100 px-1.5 text-[9px] text-amber-700"
        >
          {meeting.booking_type}
        </span>

        <span
          title={`Meeting Status`}
          className={`shrink-0 rounded border px-1.5 text-[9px] ${statusStyle}`}
        >
          {meeting.status}
        </span>
        </div>

        {/* Row 2 */}
        <div className="mt-1 flex items-center justify-between ">
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-gray-500">
            <div className="flex items-center gap-1 shrink-0">
              <Calendar size={10} />
              <span>{formatDateRange(meeting.Date)}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Clock size={10} />
              <span>
                {formatTime(meeting.start_time)}-{formatTime(meeting.end_time)}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <Users size={10} />
              <span className="truncate max-w-[70px]"  title={`Host`}>
                {meeting.Organizer}
              </span>
            </div>

            {meeting.recurrence_type &&
              meeting.recurrence_type !== "ONETIME" && (
                <Repeat size={10} className="shrink-0 text-amber-600" />
              )}
          </div>

        </div>
      </div>
      );
};

      export default MeetingListCard;