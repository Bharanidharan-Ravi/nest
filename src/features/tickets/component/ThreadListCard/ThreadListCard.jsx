import React, { useState, useRef, useEffect } from "react";
import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FaEdit, FaRegHandshake, FaReply, FaRegSmile,
  FaCalendarCheck, FaClock, FaUsers, FaTimes,
  FaCalendarAlt, FaHourglassHalf, FaCalendar
} from "react-icons/fa";
import { readUserFromSession } from "../../../../core/auth/useCurrentUser";
import MuiSwitch from "../../../../packages/react-input-engine/adapters/mui/MuiSwitch";

import apiClient from "../../../../core/api/apiClient";
import { queryClient } from "../../../../core/api/queryClient";
import { queryKeys } from "../../../../core/query/queryKeys";
import { useApiMutation } from "../../../../core/query/useApiMutation";

// --- PROFESSIONAL EMOJI LIST ---
const PROFESSIONAL_EMOJIS = ["👍", "👎", "😄", "🎉", "😕", "❤️", "🚀", "👀", "✅", "🙌"];

const getInitials = (name) => {
  if (!name) return "";
  return name.split(" ").map((part) => part[0]?.toUpperCase()).join("");
};

function formatDateRange(fromTime, toTime) {
  const currentYear = dayjs().year();
  const from = dayjs(fromTime);
  const to = dayjs(toTime);
  const formatStr = currentYear === from.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A";
  return `${from.format(formatStr)} - ${to.format(formatStr)}`;
}

const formatTimeStr = (timeStr) => {
  if (!timeStr) return "";
  if (/\d+:\d+\s*(AM|PM)/i.test(timeStr)) return timeStr;

  let t = dayjs(timeStr);
  if (!t.isValid() || timeStr.length <= 5) {
    t = dayjs(`2026-01-01T${timeStr}`);
  }
  return t.isValid() ? t.format("h:mm A") : timeStr;
};

const formatTimeRange = (startTimeStr, endTimeStr) => {
  if (!startTimeStr) return "";
  if (typeof startTimeStr === "string" && (startTimeStr.includes(" - ") || startTimeStr.toLowerCase().includes(" to "))) {
    return startTimeStr;
  }
  const formattedStart = formatTimeStr(startTimeStr);
  if (!endTimeStr) return formattedStart;
  const formattedEnd = formatTimeStr(endTimeStr);
  return `${formattedStart} - ${formattedEnd}`;
};

const formatDateStr = (dateStr) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("ddd, D MMM YYYY") : dateStr;
};

// 🔥 HELPER: Parses the raw backend string into structured meeting data (regex fallback)
const parseMeetingDetails = (htmlString) => {
  if (!htmlString) return null;

  // Strip HTML tags and normalize spaces for clean parsing
  const cleanText = htmlString.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');

  const extract = (label) => {
    const regex = new RegExp(`${label}\\s*:\\s*([^\\n]*)`, 'i');
    const match = cleanText.match(regex);
    return match ? match[1].trim() : null;
  };

  const startVal = extract('Start');
  const endVal = extract('End');

  let date = extract('Date');
  let time = extract('Time');

  if (!date && startVal) {
    date = startVal.split(' ')[0];
  }

  if (!time && startVal) {
    const startTime = startVal.split(' ')[1];
    const endTime = endVal ? endVal.split(' ')[1] : null;
    time = startTime && endTime ? `${startTime} - ${endTime}` : startTime;
  }

  return {
    title: extract('Meeting'),
    date,
    time,
    duration: extract('Duration'),
    summary: extract('Summary')
  };
};

// 🔥 HELPER: Parses JSON data or falls back to regex parser
const parseDetails = (item) => {
  let details = {
    scheduled: null,
    completed: null,
    isCompleted: false
  };

  if (item.MeetingDetails_JSON) {
    try {
      const parsed = typeof item.MeetingDetails_JSON === 'string'
        ? JSON.parse(item.MeetingDetails_JSON)
        : item.MeetingDetails_JSON;

      if (parsed) {
        if (parsed.Scheduled) {
          details.scheduled = {
            title: parsed.Scheduled.Title || parsed.Scheduled.title,
            date: parsed.Scheduled.Date || parsed.Scheduled.meeting_Date || parsed.Scheduled.date,
            startTime: parsed.Scheduled.StartTime || parsed.Scheduled.start_time,
            endTime: parsed.Scheduled.EndTime || parsed.Scheduled.end_time,
            duration: parsed.Scheduled.Duration || parsed.Scheduled.slot_duration,
            summary: parsed.Scheduled.Summary || parsed.Scheduled.meeting_summary
          };
        }
        if (parsed.Completed) {
          details.completed = {
            actualStartTime: parsed.Completed.ActualStartTime,
            actualEndTime: parsed.Completed.ActualEndTime,
            durationMinutes: parsed.Completed.DurationMinutes,
            summary: parsed.Completed.Summary
          };
          details.isCompleted = true;
        }
      }
    } catch (e) {
      console.error("Failed to parse MeetingDetails_JSON", e);
    }
  }

  if (!details.scheduled) {
    const descDetails = parseMeetingDetails(item.description);
    if (descDetails) {
      details.scheduled = {
        title: descDetails.title,
        date: descDetails.date,
        startTime: descDetails.time,
        endTime: null,
        duration: descDetails.duration,
        summary: descDetails.summary
      };
    }
  }

  const isCompletedText = item.description?.includes("Meeting Completed");
  if ((isCompletedText || item.fromTime) && !details.isCompleted) {
    details.isCompleted = true;
    const descDetails = parseMeetingDetails(item.description);
    details.completed = {
      actualStartTime: item.fromTime || item.From_Time,
      actualEndTime: item.toTime || item.To_Time,
      durationMinutes: null,
      summary: descDetails?.summary || ""
    };
  }

  return details;
};

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

  // --- STATE ---
  const [pickerState, setPickerState] = useState({ isOpen: false, position: "top" });
  const [showAllReactions, setShowAllReactions] = useState(false);

  // --- MEETING MODAL STATE ---
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    summary: "",
    startTime: "",
    endTime: "",
    attendance: {}
  });

  const pickerRef = useRef(null);

  useEffect(() => {
    if (isMeetingModalOpen && item.CoContributors) {
      const initialAttendance = {};
      item.CoContributors.forEach(c => {
        initialAttendance[c.id] = true;
      });
      setMeetingForm(prev => ({ ...prev, attendance: initialAttendance }));
    }
  }, [isMeetingModalOpen, item.CoContributors]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerState((prev) => ({ ...prev, isOpen: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const reactions = item.reactionsJSON || [];
  const currentUserId = user?.userId;

  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.Emoji;
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, userReactionId: null, users: new Set(), userIds: new Set() };
    }
    acc[emoji].count++;
    acc[emoji].users.add(reaction.name);
    acc[emoji].userIds.add(reaction.CreatedBy);
    if (reaction?.CreatedBy?.toLowerCase() === currentUserId?.toLowerCase() || reaction.CreatedBy === currentUser) {
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

  const { mutateAsync: toggleReaction } = useApiMutation({
    url: "EmojiReaction/Emoji",
    method: "POST",
    invalidateKeys: [queryKeys.ticket.thread(ticketId)],
  });

  const { mutateAsync: completeMeeting, isPending: isCompleting } = useApiMutation({
    url: "MeetingSchedulerControler/CompleteMeeting",
    method: "POST",
    invalidateKeys: [queryKeys.ticket.thread(ticketId)],
  });

  const handleReactionToggle = async (emojiStr) => {
    try {
      const existingReaction = groupedReactions[emojiStr];
      if (existingReaction?.userReactionId) {
        await apiClient.delete(`EmojiReaction/${existingReaction.userReactionId}`);
        queryClient.invalidateQueries({ queryKey: queryKeys.ticket.thread(ticketId) });
      } else {
        await toggleReaction({ ThreadId: item.id, Emoji: emojiStr, IssueId: item.Issue_Id });
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  const onEmojiClick = (emojiStr) => {
    setPickerState((prev) => ({ ...prev, isOpen: false }));
    handleReactionToggle(emojiStr);
  };

  const handlePickerToggle = (e) => {
    if (pickerState.isOpen) {
      setPickerState((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const position = spaceBelow < 60 ? "top" : "bottom";
    setPickerState({ isOpen: true, position });
  };

  const handleCompleteMeeting = async () => {
    if (!meetingForm.startTime || !meetingForm.endTime) {
      alert("Please provide Actual Start and End times.");
      return;
    }

    const attendancePayload = item.CoContributors.map(c => ({
      ParticipantId: c.id,
      AttendanceStatus: meetingForm.attendance[c.id] ? "Present" : "Absent",
      InviteStatus: "Accepted",
      Remark: ""
    }));

    const payload = {
      MeetingId: item.MeetingId,
      ActualStartTime: dayjs(meetingForm.startTime).format("YYYY-MM-DDTHH:mm:ss"),
      ActualEndTime: dayjs(meetingForm.endTime).format("YYYY-MM-DDTHH:mm:ss"),
      MeetingSummary: meetingForm.summary,
      Attendance: attendancePayload
    };

    try {
      await completeMeeting(payload);
      setIsMeetingModalOpen(false);
    } catch (error) {
      console.error("Failed to complete meeting", error);
    }
  };

  const isWithin24Hours = dayjs().diff(dayjs(item.createdAt), "hour") <= 24;
  const canEdit = isMe && isWithin24Hours;

  const renderCoContributors = (coContributors) => {
    if (formContext?.isViewer) return null;
    if (!coContributors || coContributors.length === 0) return null;

    const isSelfSupport = coContributors.some((c) => c.id === currentUser || c.name === item.CreatedBy);
    const othersOnly = coContributors.filter((c) => c.id !== currentUser && c.name !== item.CreatedBy);
    const MAX_VISIBLE = 2;
    const visibleNames = coContributors.slice(0, MAX_VISIBLE).map((c) => c.name).join(", ");
    const remainingCount = othersOnly.length - MAX_VISIBLE;
    const allNamesList = othersOnly.map((c) => c.name).join("\n");

    return (
      <span className="text-gray-600 text-[13px] font-medium flex items-center cursor-help" title={`Co-Contributors:\n${allNamesList}`}>
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

  // 🔥 Identify if this is a Meeting and extract the parsed structured data
  const isMeeting = item.ThreadType === "Meeting" && item.MeetingId;
  const meetingInfo = isMeeting ? parseDetails(item) : null;
  const isMeetingCompleted = meetingInfo ? meetingInfo.isCompleted : false;

  const renderReplyTag = () => {
    if (!referencedThread) return null;

    const isRefMeeting = referencedThread.ThreadType === "Meeting";
    const refMeetingDetails = isRefMeeting ? parseMeetingDetails(referencedThread.description) : null;

    // Clean text by stripping HTML tags and normalizing spacing
    const cleanText = referencedThread.description
      ? referencedThread.description.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim()
      : "";

    return (
      <div
        onClick={() => {
          const el = document.getElementById(`thread-${referencedThread.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-[#ffb301]/30", "ring-offset-2", "scale-[1.01]");
            setTimeout(() => {
              el.classList.remove("ring-4", "ring-[#ffb301]/30", "ring-offset-2", "scale-[1.01]");
            }, 2000);
          }
        }}
        className="mb-3 px-2.5 py-1.5 bg-[#fffbeb]/45 border border-[#fde68a]/50 border-l-4 border-l-[#ffb301] rounded-r-lg rounded-l-xs text-xs flex flex-col gap-0.5 cursor-pointer hover:bg-[#fffbeb]/70 transition-all duration-200 shadow-2xs max-w-full"
      >
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span className="text-[11px] font-bold text-[#b45309]">{referencedThread.CreatedBy === currentUser ? "You" : referencedThread.CreatedBy}</span>
          <span className="text-[9.5px] text-gray-400 font-normal">
            {dayjs(referencedThread.createdAt).fromNow()}
          </span>
        </div>
        <div className="text-gray-600 truncate max-w-full text-[11px] leading-normal font-medium mt-0.5">
          {isRefMeeting && refMeetingDetails ? (
            <span className="italic flex items-center gap-1.5 text-gray-900">
              <FaCalendar className="text-[#ffb301] flex-shrink-0" size={11} />
              {refMeetingDetails.title || "Meeting Scheduled"}
            </span>
          ) : (
            cleanText || "No content"
          )}
        </div>
      </div>
    );
  };

  return (
    <div id={`thread-${item.id}`} className={`relative flex gap-3 w-full mb-6 group transition-all duration-300 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

      {/* 1. THE AVATAR */}
      <div className="flex-shrink-0 relative z-10 mt-0.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-xs transition-all duration-300 ${isMeeting
          ? isMeetingCompleted
            ? "bg-green-600 text-white border border-green-700"
            : "bg-[#ffb300] text-white border border-[#ffb300]"
          : isMe
            ? "bg-gradient-to-r from-brand-yellow/30 to-transparent border-brand-yellow/20 text-gray-800 rounded-2xl rounded-tr-sm"
            : "bg-white/70 border-2 border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm"
          }`}
        >
          {isMe ? getInitials(currentUser || "You") : user?.role === 3 && item.team !== null ? "WG" : getInitials(item.CreatedBy)}
        </div>
      </div>

      {isMeeting && meetingInfo ? (
        <div className={`flex-1 max-w-[100%] border rounded-2xl overflow-hidden bg-white transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${isMeetingCompleted
          ? "border-green-150"
          : "border-gray-200"
          }`}>
          {/* Top banner / header */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">

            <div className="flex items-center gap-3">
              {/* Calendar Widget */}
              {(() => {
                const dateVal = isMeetingCompleted
                  ? meetingInfo.completed?.actualStartTime
                  : meetingInfo.scheduled?.date;
                const parsedDate = dateVal ? dayjs(dateVal) : null;
                const isValidDate = parsedDate && parsedDate.isValid();
                const monthStr = isValidDate ? parsedDate.format("MMM").toUpperCase() : "MEET";
                const dayStr = isValidDate ? parsedDate.format("DD") : "M";

                return (
                  <div className="flex-shrink-0 relative group">
                    <div className={`w-11 h-10 rounded-lg border overflow-hidden flex flex-col items-center bg-white shadow-xs ${isMeetingCompleted ? "border-green-200" : "border-[#fdd067]/30"
                      }`}>
                      {/* Top Banner */}
                      <div className={`w-full h-3 flex items-center justify-center text-[9px] font-bold tracking-wider uppercase text-white leading-none ${isMeetingCompleted ? "bg-green-600" : "bg-[#ffb301]"
                        }`}>
                        {monthStr}
                      </div>

                      {/* Day number */}
                      <div className="flex-1 w-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50/30">
                        <span className={`text-sm font-extrabold tracking-tight leading-none ${isMeetingCompleted ? "text-green-700" : "text-[#4181eb]"
                          }`}>
                          {dayStr}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm font-bold tracking-tight leading-tight ${isMeetingCompleted ? "text-green-950" : "text-gray-900"
                    }`}>
                    {meetingInfo.scheduled?.title || "Meeting"}
                  </h4>
                  {isMeetingCompleted ? (
                    <span className="inline-flex items-center bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium px-2.5 h-5 rounded-full capitalize">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-[#f0f4ff] border border-[#c3d4ff] text-[#4c7ed6] text-[11px] font-medium px-2.5 h-5 rounded-full capitalize">
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Metadata Row: Date, Time range, Hours / Duration, Organized by, and Created on (Planned Time always shown at the top) */}
                {(() => {
                  const dateVal = meetingInfo.scheduled?.date;
                  const timeStart = meetingInfo.scheduled?.startTime;
                  const timeEnd = meetingInfo.scheduled?.endTime;
                  const durationVal = meetingInfo.scheduled?.duration;

                  return (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                      {dateVal && (
                        <span className="inline-flex items-center gap-1">
                          <FaCalendarCheck size={11} className="text-[#ffb301]" />
                          <span>{formatDateStr(dateVal)}</span>
                        </span>
                      )}
                      
                      {timeStart && (
                        <>
                          <span className="text-gray-300 mx-0.5">•</span>
                          <span className="inline-flex items-center gap-1">
                            <FaClock size={11} className="text-[#ffb301]" />
                            <span className="font-semibold">{formatTimeRange(timeStart, timeEnd)}</span>
                          </span>
                        </>
                      )}
                      
                      {durationVal && (
                        <>
                          <span className="text-gray-300 mx-0.5">•</span>
                          <span className="inline-flex items-center gap-1">
                            <FaHourglassHalf size={11} className="text-[#ffb301]" />
                            <span>{durationVal.toLowerCase().includes("min") || durationVal.toLowerCase().includes("hour") || durationVal.includes(":") ? durationVal : `${durationVal} min`}</span>
                          </span>
                        </>
                      )}

                      <span className="text-gray-300 mx-0.5">•</span>
                      <span>
                        Organized by <span className="font-semibold">{item.CreatedBy}</span>
                      </span>

                      <span className="text-gray-300 mx-0.5">•</span>
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Actions (Edit / Reply) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canEdit && (
                <button onClick={onEdit}
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-colors text-gray-400 hover:text-amber-500 hover:bg-black/5"
                  title="Edit Meeting"
                >
                  <FaEdit size={12} />
                </button>
              )}
              {!formContext?.isViewer && (
                <button onClick={() => onReply(item)}
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-colors text-gray-400 hover:text-amber-500 hover:bg-black/5"
                  title="Reply to Thread"
                >
                  <FaReply size={12} />
                </button>
              )}
            </div>

          </div>

          {/* Card Body */}
          <div className="px-5 py-4 bg-white flex flex-col gap-4">
            {renderReplyTag()}

            {/* Agenda & Notes only */}
            {isMeetingCompleted ? (
              <div className="flex flex-col gap-3">
                {meetingInfo.scheduled?.summary && (
                  <div className="pl-3 border-l-4 border-gray-300 bg-gray-50/30 py-1.5 pr-2 rounded-r-lg">
                    <strong className="text-[9px] text-gray-400 uppercase tracking-widest block mb-1 font-bold">Agenda</strong>
                    <p className="text-xs text-slate-600 italic leading-relaxed m-0">"{meetingInfo.scheduled.summary}"</p>
                  </div>
                )}
                {meetingInfo.completed?.summary && (
                  <div className="pl-3 border-l-4 border-green-500 bg-green-50/10 py-1.5 pr-2 rounded-r-lg">
                    <strong className="text-[9px] text-green-700 uppercase tracking-widest block mb-1 font-bold">Meeting Notes</strong>
                    <p className="text-slate-800 leading-relaxed m-0 text-xs italic font-medium">"{meetingInfo.completed.summary}"</p>
                  </div>
                )}
              </div>
            ) : (
              meetingInfo.scheduled?.summary && (
                <div className="pl-3 border-l-4 border-[#ffb301] bg-[#fffbeb]/20 py-1.5 pr-2 rounded-r-lg">
                  <strong className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1 font-bold">Agenda</strong>
                  <p className="text-xs text-slate-700 italic leading-relaxed m-0 font-medium">"{meetingInfo.scheduled.summary}"</p>
                </div>
              )
            )}

            {/* Emoji Reactions Bar */}
            <div className="flex items-center gap-1.5 flex-wrap select-none pt-2 border-t border-gray-100">
              <div className="flex items-center flex-wrap min-w-0">
                {reactionEntries.map(([emoji, data]) => {
                  const isVisible = showAllReactions || reactionEntries.indexOf(reactionEntries.find(e => e[0] === emoji)) < MAX_VISIBLE_REACTIONS;
                  return (
                    <div key={emoji} className={`transition-all duration-300 ease-in-out flex items-center origin-left min-w-0 ${isVisible ? "max-w-[80px] opacity-100 mr-1.5" : "max-w-0 opacity-0 mr-0 pointer-events-none"}`}>
                      <div className={`relative group/reaction flex-shrink-0 transition-transform duration-300 ${isVisible ? "scale-100" : "scale-50"}`}>
                        <button onClick={() => handleReactionToggle(emoji)} className={`flex items-center gap-0.5 transition-all ${data.userReactionId ? "text-blue-600" : "text-gray-600 hover:scale-110"}`}>
                          <span className={reactionEntries.length > 4 ? "text-lg leading-none" : "text-xl leading-none"}>{emoji}</span>
                          {data.count > 1 && <span className="text-[10px] font-semibold">{data.count}</span>}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-1 bg-gray-900 text-white text-[10px] px-3 py-2 rounded shadow-xl z-[99999] opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-150 pointer-events-none">
                          {data.users.map((name) => (<div key={name} className="whitespace-nowrap text-center">{name}</div>))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-1.5">
                  {!showAllReactions && hiddenCount > 0 && (
                    <button onClick={() => setShowAllReactions(true)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1">+{hiddenCount}</button>
                  )}
                  {showAllReactions && reactionEntries.length > MAX_VISIBLE_REACTIONS && (
                    <button onClick={() => setShowAllReactions(false)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1">Show Less</button>
                  )}
                  <div className="relative" ref={pickerRef}>
                    <button onClick={handlePickerToggle} className="text-xl leading-none hover:scale-110 transition-transform text-gray-600">
                      <FaRegSmile />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees & Actions/Actual Details Footer */}
            {((item.CoContributors && item.CoContributors.length > 0) || isMeetingCompleted || (!isMeetingCompleted && !formContext.isViewer)) && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-50 mt-1">
                {/* Left side: Attendees */}
                {item.CoContributors && item.CoContributors.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center gap-1"><FaUsers /> Attendees:</span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {item.CoContributors.map((c) => (
                        <div
                          key={c.id}
                          className="inline-flex h-6 w-6 rounded-full ring-2 ring-white text-[9px] font-bold items-center justify-center text-white shadow-xs transition-transform hover:-translate-y-0.5 hover:z-20 cursor-pointer bg-[#ffb301]"
                          title={c.name}
                        >
                          {getInitials(c.name)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Right side: Actual Details or Action Button */}
                {isMeetingCompleted ? (
                  meetingInfo.completed && (
                    <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50/50 px-2 py-0.5 rounded-md border border-green-150/40">
                      <span className="font-semibold text-[10px] text-green-600 uppercase tracking-wider">Actual:</span>
                      <span className="flex items-center gap-1 border-l border-green-250/60 pl-2">
                        <FaClock size={11} className="text-green-600" />
                        <span className="font-semibold">{formatTimeRange(meetingInfo.completed.actualStartTime, meetingInfo.completed.actualEndTime)}</span>
                      </span>
                      {meetingInfo.completed.durationMinutes && (
                        <>
                          <span className="text-green-300">•</span>
                          <span className="flex items-center gap-1">
                            <FaHourglassHalf size={11} className="text-green-600" />
                            <span>{meetingInfo.completed.durationMinutes} min</span>
                          </span>
                        </>
                      )}
                    </div>
                  )
                ) : (
                  !formContext.isViewer && (
                    <button
                      onClick={() => setIsMeetingModalOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#0f172a] active:scale-[0.98] text-white text-[11px] font-bold px-3.5 py-1 rounded-lg border border-slate-900 shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <FaCalendarCheck size={12} className="text-gray-300" />
                      <span>Mark Completed</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex-1 max-w-[100%] shadow-[0_8px_25px_rgba(0,0,0,0.02)] backdrop-blur-xl border transition-all duration-300 ${isMeeting
          ? isMeetingCompleted
            ? "bg-gradient-to-b from-green-50/20 to-white border-green-200 rounded-xl shadow-green-50/40"
            : "bg-gradient-to-b from-[#4b7ed6]/10 to-white border-[#4b7ed6]/20 rounded-xl shadow-[#4b7ed6]/10"
          : !formContext.isViewer && item.toClient ? "bg-green-100/80 border-green-500/60 rounded-xl rounded-tl-sm"
            : isMe ? "bg-yellow-50/80 border-yellow-200/60 rounded-xl rounded-tr-sm"
              : "bg-white/70 border-gray-200 rounded-xl rounded-tl-sm"
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-2 border-b flex justify-between items-center text-xs ${isMeeting
            ? isMeetingCompleted
              ? "border-green-100 bg-green-50/40 rounded-t-xl"
              : "border-[#4b7ed6]/15 bg-[#4b7ed6]/5 rounded-t-xl"
            : isMe ? "border-blue-200/40" : "border-gray-200/40"
            }`}
          >
            <div className="text-gray-500 tracking-wide flex items-center gap-1.5">
              {isMeeting && (
                isMeetingCompleted
                  ? <FaCalendarCheck className="text-green-600" />
                  : <FaCalendarCheck className="text-[#4b7ed6]" />
              )}
              <strong className={`font-semibold mr-0.5 ${isMeeting
                ? isMeetingCompleted
                  ? "text-green-950"
                  : "text-[#2a55a3]"
                : "text-gray-900"
                }`}>
                {isMe ? "You" : user?.role === 3 && item.team !== null ? "WorkGlow Support" : item.CreatedBy}
              </strong>
              {renderCoContributors(item.CoContributors)}
              <span className="text-[11px] opacity-75 ml-0.5" title={dayjs(item.createdAt).format("MMMM D, YYYY h:mm A")}>
                {isMeeting
                  ? isMeetingCompleted
                    ? "completed a meeting"
                    : "scheduled a meeting"
                  : "commented"} {dayjs(item.createdAt).fromNow()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isMeeting && toggles.filter((toggle) => toggle.VisibleWhen(item, isMe)).map((toggle) => (
                <div key={toggle.name} className="flex items-center">
                  <MuiSwitch name={toggle.name} label={toggle.label} value={item.toClient}
                    onChange={(name, checked) => toggle.onCommit(item, checked, name)}
                  />
                </div>
              ))}

              {!isMeeting && (
                <button onClick={onEdit} disabled={!canEdit}
                  className={`flex items-center justify-center p-0.5 rounded-full transition-colors ${canEdit ? "text-gray-400 hover:text-blue-600 hover:bg-black/5" : "invisible"}`}
                >
                  <FaEdit size={12} />
                </button>
              )}

              {!formContext?.isViewer && (
                <button onClick={() => onReply(item)} className="flex items-center justify-center p-0.5 rounded-full transition-colors text-gray-400 hover:text-blue-600 hover:bg-black/5">
                  <FaReply size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className={`p-4 text-[13px] break-words leading-relaxed ${isMeeting ? "bg-transparent rounded-b-xl" : "text-gray-800"}`}>
            {renderReplyTag()}

            <HtmlRenderer html={item.description} />

          </div>

          {/* Footer & Reactions (Not shown for Meeting threads to keep UI clean, but can be added back if desired) */}
          {!formContext.isViewer && !isMeeting && (
            <div className="px-4 py-2 rounded-b-xl flex justify-between items-center text-[11px] text-gray-500 bg-black/[0.03] relative z-20">
              <div className="flex flex-wrap items-center gap-2">
                {/* Reactions Block */}
                <div className="flex flex-wrap items-center min-h-[28px]">
                  {reactionEntries.map(([emoji, data], index) => {
                    const isVisible = !(index >= MAX_VISIBLE_REACTIONS) || showAllReactions;
                    return (
                      <div key={emoji} className={`transition-all duration-300 ease-in-out flex items-center origin-left min-w-0 ${isVisible ? "max-w-[80px] opacity-100 mr-1.5" : "max-w-0 opacity-0 mr-0 pointer-events-none"}`}>
                        <div className={`relative group/reaction flex-shrink-0 transition-transform duration-300 ${isVisible ? "scale-100" : "scale-50"}`}>
                          <button onClick={() => handleReactionToggle(emoji)} className={`flex items-center gap-0.5 transition-all ${data.userReactionId ? "text-blue-600" : "text-gray-600 hover:scale-110"}`}>
                            <span className={reactionEntries.length > 4 ? "text-lg leading-none" : "text-xl leading-none"}>{emoji}</span>
                            {data.count > 1 && <span className="text-[10px] font-semibold">{data.count}</span>}
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-1 bg-gray-900 text-white text-[10px] px-3 py-2 rounded shadow-xl z-[99999] opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-150 pointer-events-none">
                            {data.users.map((name) => (<div key={name} className="whitespace-nowrap text-center">{name}</div>))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-1.5">
                    {!showAllReactions && hiddenCount > 0 && (
                      <button onClick={() => setShowAllReactions(true)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1">+{hiddenCount}</button>
                    )}
                    {showAllReactions && reactionEntries.length > MAX_VISIBLE_REACTIONS && (
                      <button onClick={() => setShowAllReactions(false)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1">Show Less</button>
                    )}
                    <div className="relative" ref={pickerRef}>
                      <button onClick={handlePickerToggle} className="text-xl leading-none hover:scale-110 transition-transform text-gray-600">
                        <FaRegSmile />
                      </button>
                    </div>
                  </div>
                </div>

                {item.fromTime && item.toTime && (
                  <div className="flex items-center text-gray-400 border-l border-gray-300 pl-2">
                    {formatDateRange(item.fromTime, item.toTime)}
                  </div>
                )}
              </div>

              <div className="font-medium text-gray-600 flex-shrink-0 text-right ml-2">
                {item.Hours ? `Total Hours: ${item.Hours}` : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meeting Completion Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-amber-500/10">
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <FaCalendarCheck /> Complete Meeting
              </h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTimes />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5"><FaClock /> Actual Start</label>
                  <input type="datetime-local" className="border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all outline-none"
                    value={meetingForm.startTime} onChange={(e) => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5"><FaClock /> Actual End</label>
                  <input type="datetime-local" className="border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all outline-none"
                    value={meetingForm.endTime} onChange={(e) => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Meeting Summary</label>
                <textarea rows="3" className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all outline-none resize-none"
                  placeholder="What was discussed? Action items?"
                  value={meetingForm.summary} onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })}
                ></textarea>
              </div>

              {item.CoContributors && item.CoContributors.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5"><FaUsers /> Attendance Roll Call</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-1 max-h-40 overflow-y-auto shadow-sm">
                    {item.CoContributors.map(c => (
                      <label key={c.id} className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          checked={meetingForm.attendance[c.id] || false}
                          onChange={(e) => setMeetingForm({
                            ...meetingForm,
                            attendance: { ...meetingForm.attendance, [c.id]: e.target.checked }
                          })}
                        />
                        <span className="text-sm font-medium text-gray-700 select-none">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                Cancel
              </button>
              <button onClick={handleCompleteMeeting} disabled={isCompleting} className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isCompleting ? "Saving..." : "Submit Completion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Emoji Picker Portal */}
      {pickerState.isOpen && (
        <div className={`absolute z-[99999] ${pickerState.position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-0`}>
          <div className="flex items-center gap-1 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-full px-2 py-1.5 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
            {PROFESSIONAL_EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => onEmojiClick(emoji)} className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-gray-100 transition-transform hover:scale-110">
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