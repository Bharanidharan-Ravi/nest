
import Badge from "./Badge";
import { AVAILABILITY_BLOCK_COLOR } from "./constants";


import { fmtTime } from "./helpers";

/**
 * A single coloured block rendered inside the hour-by-hour timeline.
 * Clicking it opens the DetailDrawer.
 *
 * @param {{ event: object, onClick: (event: object) => void }} props
 */


export default function TimelineBlock({ event, onClick }) {
  const isAvailability = event.type === "availability";

  const blockColor = isAvailability
    ? AVAILABILITY_BLOCK_COLOR[event.availabilityType] ?? AVAILABILITY_BLOCK_COLOR.Available
    : event.status === "Disbanded"
      ? "bg-red-50 border-l-4 border-red-400 text-red-800"
      : event.meetingType === "Client"
        ? "bg-violet-50 border-l-4 border-violet-500 text-violet-800"
        : "bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800";

  return (
    <div
      onClick={() => onClick(event)}
      className={`rounded-lg px-3 py-2 cursor-pointer hover:brightness-95 transition-all mb-1 ${blockColor}`}
    >
      <div className="flex items-start justify-between gap-2">

        {/* Left: title + time */}
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">
            {isAvailability ? event.availabilityType : event.title}
          </p>
          <p className="text-[11px] opacity-70 mt-0.5">
            {fmtTime(event.fromTime)} – {fmtTime(event.endTime)}
            {event.attendees?.length > 0 &&
              ` · ${event.attendees.length} attendee${event.attendees.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Right: badges */}
        <div className="flex items-center gap-1 shrink-0">
          {event.meetingType && <Badge status={event.meetingType} />}
          {event.status      && <Badge status={event.status}      />}
        </div>
      </div>
    </div>
  );
}
