import React, { useState, useRef, useEffect } from "react";
import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaEdit, FaRegHandshake, FaReply, FaRegSmile } from "react-icons/fa";
import { readUserFromSession } from "../../../../core/auth/useCurrentUser";
import MuiSwitch from "../../../../packages/react-input-engine/adapters/mui/MuiSwitch";

import apiClient from "../../../../core/api/apiClient";
import { queryClient } from "../../../../core/api/queryClient";
import { queryKeys } from "../../../../core/query/queryKeys";
import { useApiMutation } from "../../../../core/query/useApiMutation";

// --- PROFESSIONAL EMOJI LIST ---
const PROFESSIONAL_EMOJIS = [
  "👍",
  "👎",
  "😄",
  "🎉",
  "😕",
  "❤️",
  "🚀",
  "👀",
  "✅",
  "🙌",
];

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

const ThreadListCard = ({
  item,
  onEdit,
  currentUser,
  formContext,
  toggles = [],
  onReply,
  referencedThread,
  ticketId,
}) => {
  dayjs.extend(relativeTime);
  const isMe = item.CreatedBy === currentUser;
  const user = readUserFromSession();
  // --- EMOJI REACTION STATE & LOGIC ---
  const [pickerState, setPickerState] = useState({
    isOpen: false,
    position: "top",
  });
  const [showAllReactions, setShowAllReactions] = useState(false);
  const pickerRef = useRef(null);

  // Close picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerState((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Group reactions by Emoji string to show counts (e.g., 👍 3)
  const reactions = item.reactionsJSON || [];
  const currentUserId = user?.userId;
  console.log("item :", item);
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.Emoji;

    if (!acc[emoji]) {
      acc[emoji] = {
        count: 0,
        userReactionId: null,
        users: new Set(),
        userIds: new Set(),
      };
    }

    acc[emoji].count++;

    acc[emoji].users.add(reaction.name);

    acc[emoji].userIds.add(reaction.CreatedBy);

    if (
      reaction?.CreatedBy?.toLowerCase() === currentUserId?.toLowerCase() ||
      reaction.CreatedBy === currentUser
    ) {
      acc[emoji].userReactionId = reaction.Id;
    }

    return acc;
  }, {});

  Object.values(groupedReactions).forEach((item) => {
    item.users = [...item.users];
    item.userIds = [...item.userIds];
  });

  const reactionEntries = Object.entries(groupedReactions);

  const MAX_VISIBLE_REACTIONS = 4;

  const hiddenCount = reactionEntries.length - MAX_VISIBLE_REACTIONS;

  const { mutateAsync, isPending } = useApiMutation({
    url: "EmojiReaction/Emoji",
    method: "POST",
    invalidateKeys: [queryKeys.ticket.thread(ticketId)],
  });

  const handleReactionToggle = async (emojiStr) => {
    try {
      const existingReaction = groupedReactions[emojiStr];
      console.log("existingReaction ,", existingReaction);
      if (existingReaction?.userReactionId) {
        await apiClient.delete(
          `EmojiReaction/${existingReaction.userReactionId}`
        );

        queryClient.invalidateQueries({
          queryKey: queryKeys.ticket.thread(ticketId),
        });
      } else {
        await mutateAsync({
          ThreadId: item.id,
          Emoji: emojiStr,
          IssueId: item.Issue_Id,
        });
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };
  const onEmojiClick = (emojiStr) => {
    setPickerState((prev) => ({ ...prev, isOpen: false }));
    handleReactionToggle(emojiStr);
  };

  // Dynamic Positioning Logic for the Pickercon
  const handlePickerToggle = (e) => {
    if (pickerState.isOpen) {
      setPickerState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    // If less than 60px space below, open UPWARDS ('top'). Else open DOWNWARDS ('bottom')
    const position = spaceBelow < 60 ? "top" : "bottom";
    setPickerState({ isOpen: true, position });
  };
  // ------------------------------------

  const isWithin24Hours = dayjs().diff(dayjs(item.createdAt), "hour") <= 24;
  const canEdit = isMe && isWithin24Hours;

  const renderCoContributors = (coContributors) => {
    if (formContext?.isViewer) return null;
    if (!coContributors || coContributors.length === 0) return null;

    const isSelfSupport = coContributors.some(
      (c) => c.id === currentUser || c.name === item.CreatedBy
    );

    const othersOnly = coContributors.filter(
      (c) => c.id !== currentUser && c.name !== item.CreatedBy
    );

    const MAX_VISIBLE = 2;
    const total = coContributors.length;
    const visibleNames = coContributors
      .slice(0, MAX_VISIBLE)
      .map((c) => c.name)
      .join(", ");
    const remainingCount = othersOnly.length - MAX_VISIBLE;
    const allNamesList = othersOnly.map((c) => c.name).join("\n");

    return (
      <span
        className="text-gray-600 text-[13px] font-medium flex items-center cursor-help"
        title={`Co-Contributors:\n${allNamesList}`}
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
      className={`relative flex gap-4 w-full mb-6 group ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* 1. THE AVATAR */}
      <div className="flex-shrink-0 relative z-10 mt-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${
            isMe
              ? "bg-gradient-to-r from-brand-yellow/30 to-transparent border-brand-yellow/20 rounded-2xl rounded-tr-sm"
              : "bg-white/70 border-2 border-gray-100 rounded-2xl rounded-tl-sm"
          }`}
        >
          {isMe
            ? getInitials(currentUser || "You")
            : user?.role === 3 && item.team !== null
            ? "WG"
            : getInitials(item.CreatedBy)}
        </div>
      </div>

      <div
        className={`flex-1 max-w-[100%] shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl border ${
          !formContext.isViewer && item.toClient
            ? "bg-green-100/80 border-green-500/60 rounded-2xl rounded-tl-sm"
            : isMe
            ? "bg-yellow-50/80 border-yellow-200/60 rounded-2xl rounded-tr-sm"
            : "bg-white/70 border-gray rounded-2xl rounded-tl-sm"
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 border-b flex justify-between items-center text-sm ${
            isMe ? "border-blue-200/40" : "border-gray-200/40"
          }`}
        >
          <div className="text-gray-500 tracking-wide">
            <strong className="text-gray-900 font-medium mr-1">
              {isMe
                ? "You"
                : user?.role === 3 && item.team !== null
                ? "WorkGlow Support"
                : item.CreatedBy}
            </strong>
            {renderCoContributors(item.CoContributors)}
            <span
              className="text-xs opacity-75"
              title={dayjs(item.createdAt).format("MMMM D, YYYY h:mm A")}
            >
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
              className={`flex items-center justify-center p-1 rounded-full transition-colors ${
                canEdit
                  ? "text-gray-400 hover:text-blue-600 hover:bg-black/5"
                  : "invisible"
              }`}
              title="Edit Comment"
            >
              <FaEdit size={14} />
            </button>

            {!formContext?.isViewer && (
              <button
                onClick={() => onReply(item)}
                className="flex items-center justify-center p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600 hover:bg-black/5"
                title="Reply to this comment"
              >
                <FaReply size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Referenced Thread Block */}
        {referencedThread &&
          (() => {
            const stripHtml = (html) => {
              const doc = new DOMParser().parseFromString(
                html || "",
                "text/html"
              );
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
        <div className="p-5 text-sm text-gray-800 break-words leading-relaxed">
          <HtmlRenderer html={item.description} />
        </div>

        {/* Footer & Reactions */}
        {!formContext.isViewer && (
          <div className="px-5 py-2.5 rounded-b-2xl flex justify-between items-center text-xs text-gray-500 bg-black/[0.03] relative z-20">
            {/* Left side: Emoji Reactions + Date Range */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Reactions Block */}
              <div className="flex flex-wrap items-center min-h-[32px]">
                {reactionEntries.map(([emoji, data], index) => {
                  const isExtra = index >= MAX_VISIBLE_REACTIONS;
                  const isVisible = !isExtra || showAllReactions;

                  return (
                    <div
                      key={emoji}
                      className={`transition-all duration-300 ease-in-out flex items-center origin-left min-w-0 ${
                        isVisible
                          ? "max-w-[100px] opacity-100 mr-2"
                          : "max-w-0 opacity-0 mr-0 pointer-events-none"
                      }`}
                    >
                      <div
                        className={`relative group/reaction flex-shrink-0 transition-transform duration-300 ${
                          isVisible ? "scale-100" : "scale-50"
                        }`}
                      >
                        <button
                          onClick={() => handleReactionToggle(emoji)}
                          className={`flex items-center gap-0.5 transition-all ${
                            data.userReactionId
                              ? "text-blue-600"
                              : "text-gray-600 hover:scale-110"
                          }`}
                        >
                          <span
                            className={
                              reactionEntries.length > 4
                                ? "text-xl leading-none"
                                : "text-2xl leading-none"
                            }
                          >
                            {emoji}
                          </span>

                          {data.count > 1 && (
                            <span className="text-[11px] font-semibold">
                              {data.count}
                            </span>
                          )}
                        </button>

                        <div
                          className="
                            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            flex flex-col gap-1
                            bg-gray-900 text-white
                            text-xs
                            px-4 py-3
                            rounded-lg
                            shadow-xl
                            z-[99999]
                            min-w-max

                            opacity-0
                            invisible

                            group-hover/reaction:opacity-100
                            group-hover/reaction:visible

                            transition-all duration-150
                            pointer-events-none
                          "
                        >
                          {data.users.map((name) => (
                            <div key={name} className="whitespace-nowrap text-center">
                              {name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2">
                  {!showAllReactions && hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllReactions(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-1 py-1"
                    >
                      +{hiddenCount}
                    </button>
                  )}
                  {showAllReactions &&
                    reactionEntries.length > MAX_VISIBLE_REACTIONS && (
                      <button
                        onClick={() => setShowAllReactions(false)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-1 py-1"
                      >
                        Show Less
                      </button>
                    )}

                  {/* Emoji Picker Button */}
                  <div className="relative" ref={pickerRef}>
                    <button
                      onClick={handlePickerToggle}
                      className="text-2xl leading-none hover:scale-110 transition-transform text-gray-600"
                    >
                      <FaRegSmile />
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Range (if exists) separated by a border line */}
              {item.fromTime && item.toTime && (
                <div className="flex items-center text-gray-400 border-l border-gray-300 pl-3">
                  {formatDateRange(item.fromTime, item.toTime)}
                </div>
              )}
            </div>

            {/* Right side: Total Hours */}
            <div className="font-medium text-gray-600 flex-shrink-0 text-right ml-3">
              {item.Hours ? `Total Hours: ${item.Hours}` : ""}
            </div>
          </div>
        )}
      </div>
      {pickerState.isOpen && (
        <div
          className={`absolute z-[99999] ${
            pickerState.position === "top"
              ? "bottom-full mb-2" // Open upwards
              : "top-full mt-2" // Open downwards
          } left-0`}
        >
          <div className="flex items-center gap-1 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-full px-2 py-1.5 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
            {PROFESSIONAL_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-gray-100 transition-transform hover:scale-110"
                title="React"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadListCard;
