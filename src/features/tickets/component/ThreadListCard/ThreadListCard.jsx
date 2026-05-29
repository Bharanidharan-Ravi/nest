import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaEdit, FaRegHandshake } from "react-icons/fa";
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

// 👉 Accept the new onEdit and currentUser props!
const ThreadListCard = ({ item, onEdit, currentUser, formContext, toggles = [] }) => {
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
      {/* <div className="flex-shrink-0 relative z-10 mt-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm transition-all duration-300 ${
            isMe
              ? "bg-gradient-to-br from-[#FFD700] via-brand-yellow to-[#EAB308] text-white shadow-[0_4px_12px_rgba(234,179,8,0.3)] border border-white/20"
              : "bg-white text-gray-700 border-2 border-transparent bg-clip-padding relative before:absolute before:inset-[-2px] before:rounded-full before:bg-gradient-to-br before:from-brand-yellow before:to-yellow-200 before:-z-10"
          }`}
        >
          <span className="relative z-10">{getInitials(item.CreatedBy)}</span>
        </div>
      </div> */}
      {/* 2. THE GLASS CHAT BUBBLE */}

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
          </div>
        </div>

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
