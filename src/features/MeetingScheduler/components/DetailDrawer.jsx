import Badge from "../components/Badge";
import Avatar from "../components/Avatar";
import { fmtTime, avatarColor, initials } from "../utils/helpers";

/**
 * Slide-in drawer (from right) showing full details of a
 * meeting or availability event.
 *
 * @param {{
 *   event       : object,
 *   onClose     : () => void,
 *   onDisband   : (id: number) => void,
 * }} props
 */
export default function DetailDrawer({ event, onClose, onDisband }) {
  if (!event) return null;

  const isMeeting = event.type !== "availability";
  const headerBg  = isMeeting ? "bg-indigo-600" : "bg-emerald-600";

  const typeBadgeCls = isMeeting
    ? event.meetingType === "Client"
      ? "bg-violet-400/30 text-violet-100"
      : "bg-indigo-400/30 text-indigo-100"
    : "bg-emerald-400/30 text-emerald-100";

  return (
    <div
      className="fixed inset-0 bg-black/30 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
        style={{ animation: "slideIn 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* ── Coloured header */}
        <div className={`px-5 pt-5 pb-4 ${headerBg}`}>
          <div className="flex items-start justify-between mb-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeBadgeCls}`}>
              {isMeeting ? event.meetingType : event.availabilityType}
            </span>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white w-7 h-7 flex items-center justify-center
                         rounded-full hover:bg-white/10 transition-colors"
            >✕</button>
          </div>

          <h3 className="text-white font-semibold text-base leading-snug">
            {event.title || event.availabilityType}
          </h3>
          <p className="text-white/70 text-xs mt-1">
            {fmtTime(event.fromTime)} – {fmtTime(event.endTime)}
            {event.bookingDate && (
              ` · ${new Date(event.bookingDate + "T00:00:00")
                .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
            )}
          </p>
        </div>

        {/* ── Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {isMeeting && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24">Status</span>
              <Badge status={event.status} />
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          )}

          {event.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{event.notes}</p>
            </div>
          )}

          {event.reason && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Reason</p>
              <p className="text-sm text-gray-700">{event.reason}</p>
            </div>
          )}

          {/* ── Attendees */}
          {isMeeting && event.attendees?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Attendees ({event.attendees.length})
              </p>
              <div className="space-y-2">
                {event.attendees.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50"
                  >
                    <Avatar name={a} size="md" />
                    <span className="text-sm text-gray-700">{a}</span>
                    <span
                      className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full
                        ${event.meetingType === "Internal"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-violet-50 text-violet-600"
                        }`}
                    >
                      {event.meetingType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions */}
        {isMeeting && (
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => onDisband(event.id)}
              className={`w-full py-2 rounded-lg text-sm font-medium border transition-all
                ${event.status === "Disbanded"
                  ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  : "border-red-300 text-red-600 hover:bg-red-50"
                }`}
            >
              {event.status === "Disbanded" ? "Restore Meeting" : "Disband Meeting"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
