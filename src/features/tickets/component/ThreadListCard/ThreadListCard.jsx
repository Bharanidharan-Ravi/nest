import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaEdit, FaRegHandshake, FaReply } from "react-icons/fa";
import { readUserFromSession } from "../../../../core/auth/useCurrentUser";
import MuiSwitch from "../../../../packages/react-input-engine/adapters/mui/MuiSwitch";

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function formatDateRange(fromTime, toTime) {
  const currentYear = dayjs().year();
  const from = dayjs(fromTime);
  const to = dayjs(toTime);
  const formatStr =
    currentYear === from.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A";
  return `${from.format(formatStr)} - ${to.format(formatStr)}`;
}

const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<\/?(p|br|div|li)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, "")
    .trim()
}

// 👉 Accept the new onEdit and currentUser props!
const ThreadListCard = ({ item, onEdit, currentUser, formContext, toggles = [], onReply, referencedThread }) => {
  dayjs.extend(relativeTime);
  // Check if this comment was made by the logged-in user
  // const isMe = item.CreatedBy === currentUser;

  const isMe = item.CreatedBy === currentUser;
  const user = readUserFromSession();

  // const toggleMeta ={isMe,isViewer:!!formContext?.isViewer}
  // 🔥 2. Check if the thread is less than or equal to 24 hours old
  const isWithin24Hours = dayjs().diff(dayjs(item.createdAt), "hour") <= 24;

  // 🔥 3. Can Edit ONLY if they are the creator AND it's within 24 hours
  const canEdit = isMe && isWithin24Hours;
  const renderCoContributors = (coContributors) => {
    if (formContext?.isViewer) return null; // Don't show co-contributors in viewer mode
    if (!coContributors || coContributors.length === 0) return null;

    const isSelfSupport = coContributors.some(
      (c) => c.id === currentUser || c.name === item.CreatedBy
    );

    const othersOnly = coContributors.filter(
      (c) => c.id !== currentUser && c.name !== item.CreatedBy
    );

    const MAX_VISIBLE = 2; // Change this to 3 if you want to show more names
    const total = coContributors.length;

    // Grab the first 2 names
    const visibleNames = coContributors
      .slice(0, MAX_VISIBLE)
      .map((c) => c.name)
      .join(", ");
    const remainingCount = othersOnly.length - MAX_VISIBLE;

    // Create a newline-separated list for the hover tooltip
    const allNamesList = othersOnly.map((c) => c.name).join("\n");

    return (
      <span
        className="text-gray-600 text-[13px] font-medium flex items-center cursor-help"
        title={`Co-Contributors:\n${allNamesList}`} // Native HTML tooltip
      >
        {isSelfSupport && (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full text-[12px] font-bold tracking-wider uppercase">
            Support <FaRegHandshake size={20} />
          </span>
        )}

        {othersOnly.length > 0 && (
          <>
            <span className="mx-1.5 text-gray-400 italic">with</span>
            <span className="truncate max-w-[200px]">{visibleNames}</span>
          </>
        )}

        {/* If there are more than 2, show the +X badge! */}
        {remainingCount > 0 && (
          <span className="ml-1.5 bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm transition-colors hover:bg-gray-200">
            +{remainingCount} more
          </span>
        )}
      </span>
    );
  };
  return (
    <div
      className={`relative flex gap-4 w-full mb-6 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* 1. THE AVATAR (Smooth gradients with soft shadows) */}
      <div className="flex-shrink-0 relative z-10 mt-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${isMe
            ? "bg-gradient-to-r from-brand-yellow/30 to-transparent border-brand-yellow/20 rounded-2xl rounded-tr-sm"
            : "bg-white/70 border-2 border-gray-100 rounded-2xl rounded-tl-sm"
            }`}
        >

          {isMe
            ? getInitials(currentUser || "You")
            : (user?.role === 3 && item.team !== null)
              ? "WG"
              : getInitials(item.CreatedBy)}
        </div>
      </div>

      <div
        className={`flex-1 max-w-[100%] shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl border ${!formContext.isViewer && item.toClient
          ? "bg-green-100/80 border-green-500/60 rounded-2xl rounded-tl-sm" // Always green for ToClient
          : isMe
            ? "bg-yellow-50/80 border-yellow-200/60 rounded-2xl rounded-tr-sm" // Subtle Yellow Glass for "Me"
            : "bg-white/70 border-gray rounded-2xl rounded-tl-sm"
          }`}
      >
        {/* Header - Blends seamlessly into the card instead of a hard block */}
        <div
          className={`px-5 py-3 border-b flex justify-between items-center text-sm ${isMe ? "border-blue-200/40" : "border-gray-200/40"
            }`}
        >
          <div className="text-gray-500 tracking-wide">
            <strong className="text-gray-900 font-medium mr-1">
              {isMe ?
                "You"
                : (user?.role === 3 && item.team !== null)
                  ? "WorkGlow Support" : item.CreatedBy
              }
            </strong>
            {renderCoContributors(item.CoContributors)}
            <span className="text-xs opacity-75"
              title={dayjs(item.createdAt).format("MMMM D, YYYY h:mm A")} >
              commented {dayjs(item.createdAt).fromNow()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {toggles
              .filter((toggle) => toggle.VisibleWhen(item, isMe))
              .map((toggle) => (
                <div key={toggle.name} className="flex items-center">
                  <MuiSwitch
                    name={toggle.name}
                    label={toggle.label}
                    value={item.toClient}
                    onChange={(name, checked) =>
                      toggle.onCommit(item, checked, name)
                    }
                  />
                </div>
              ))}

            <button
              onClick={onEdit}
              disabled={!canEdit}
              className={`flex items-center justify-center p-1 rounded-full transition-colors ${canEdit
                ? "text-gray-400 hover:text-blue-600 hover:bg-black/5"
                : "invisible"
                }`}
              title="Edit Comment"
            >
              <FaEdit size={14} />
            </button>
            {/* {onReply&&( */}
            {!formContext?.isViewer && (
            <button
              onClick={() => onReply(item)}
              //  disabled={!canEdit}
              className="flex items-center justify-center p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600 hover:bg-black/5"
              title="Reply to this comment" >
              <FaReply size={14} />
            </button>
            )}
            {/* )} */}

          </div>
        </div>

        {referencedThread && (() => {
          const stripHtml = (html) => {
            const doc = new DOMParser().parseFromString(html || "", "text/html");
            return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
          };

          const cleanText = stripHtml(referencedThread.description);
          return (
            <div className="mx-4 mt-3 mb-1 rounded-xl border border-gray-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-100">
                <svg
                  width="13"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <polyline points="9 14 4 9 9 4" />
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                </svg>
                <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-700 flex-shrink-0">
                  {getInitials(referencedThread.CreatedBy)}
                </div>
                <span className="text-[12px] font-semibold text-gray-800">
                  {referencedThread.CreatedBy}
                </span>
                <span className="ml-auto text-[10px] text-gray-400 italic">
                  in reply to
                </span>
              </div>
              <div className="px-3 py-4 bg-white group">
                <p className="text-[12px] text-gray-600 leading-relaxed m-0 line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                  {cleanText}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Body */}
        < div className="p-5 text-sm text-gray-800 break-words leading-relaxed" >
          <HtmlRenderer html={item.description} />
        </div>

        {/* Footer (Slightly darker translucent bar at the bottom) */}
        {!formContext.isViewer &&
          <div className="px-5 py-2.5 rounded-b-2xl flex justify-between text-xs text-gray-500 bg-black/[0.03]">
            {item.fromTime && item.toTime ? (
              <>
                <span>{formatDateRange(item.fromTime, item.toTime)}</span>
                <span className="font-medium text-gray-600">
                  Total Hours: {item.Hours || "-"}
                </span>
              </>
            ) : (
              <>
                <span>&nbsp;</span> {/* Empty space for fromTime/toTime */}
                <span className="font-medium text-gray-600">
                  {item.Hours ? `Total Hours: ${item.Hours}` : ""}
                </span>
              </>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default ThreadListCard;
