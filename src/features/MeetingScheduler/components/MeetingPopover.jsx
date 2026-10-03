// Details of a meeting clicked on the Day / Week / Month calendar, with the
// same actions as the list: Join, Day comment / Complete and (host) Edit.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  FolderKanban,
  MessageSquarePlus,
  Pencil,
  Repeat,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";
import { Avatar, Button, JoinDetails, Pill, StatusBadge } from "./Common";
import { getAllParticipants, getJoinInfo, meetingTone } from "../Helpers/common";
import { binaryToDaysList, formatDate, formatDuration, formatTime24h, parseDay } from "../Helpers/dateTime";
import { canManageMeeting, isMeetingHost } from "../Helpers/meetingValidation";
import { cancelledAt, isRecurring } from "../Helpers/recurrence";

const POPOVER_WIDTH = 360;
const GAP = 8;

/** Next to the clicked meeting: to its right, else its left, kept inside the window. */
function placeBeside(anchorRect, height) {
  const maxLeft = window.innerWidth - POPOVER_WIDTH - GAP;
  let left = anchorRect.right + GAP;
  if (left > maxLeft) left = anchorRect.left - POPOVER_WIDTH - GAP;
  left = Math.min(Math.max(GAP, left), Math.max(GAP, maxLeft));
  const top = Math.min(Math.max(GAP, anchorRect.top), Math.max(GAP, window.innerHeight - height - GAP));
  return { left, top };
}

function recurrenceText(meeting) {
  const range = `${formatDate(meeting.valid_from_date)} – ${formatDate(meeting.valid_to_date)}`;
  if (meeting.recurrence_type?.toUpperCase() === "WEEKLY") {
    return `Every ${binaryToDaysList(meeting.days_of_week).join(", ")} · ${range}`;
  }
  return `Every day · ${range}`;
}

function DetailRow({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function MeetingPopover({
  meeting,
  anchorRect,
  currentUserId,
  asSheet = false,
  onClose,
  onEdit,
  onComplete,
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (asSheet || !ref.current || !anchorRect) return;
    setPosition(placeBeside(anchorRect, ref.current.offsetHeight));
  }, [anchorRect, asSheet, meeting]);

  // Close on Escape, a click outside, or when the calendar behind it scrolls.
  useEffect(() => {
    const isInside = (target) => ref.current?.contains(target);
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    const onPointerDown = (event) => !isInside(event.target) && onClose();
    const onScroll = (event) => !isInside(event.target) && onClose();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (!meeting) return null;

  // Calendar entries are one day of the meeting; `source` is the meeting row itself.
  const source = meeting.source ?? meeting;
  const day = parseDay(meeting.occurrence_date) ?? parseDay(source.meeting_date);
  const active = source.status !== "Completed" && source.status !== "Cancelled";
  // A calendar day can differ from the meeting: a series cancelled part way
  // through still shows its earlier days as scheduled.
  const status = meeting.status ?? source.status;
  const recurring = isRecurring(source);
  const seriesCancelledAt = recurring ? cancelledAt(source) : null;
  const logsDays = recurring && !!source.ticket_id;
  const join = getJoinInfo(source);
  const { all: participants } = getAllParticipants(source);
  const canEdit = canManageMeeting(source, currentUserId);

  const card = (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="meeting-popover-title"
      className={
        asSheet
          ? "wg-rise-in fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
          : "fixed z-[60] flex max-h-[80vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      }
      style={
        asSheet
          ? undefined
          : { width: POPOVER_WIDTH, left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }
      }
    >
      <header className="flex shrink-0 items-start gap-2.5 border-b border-gray-100 px-4 py-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meetingTone(status).dot}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3
            id="meeting-popover-title"
            className={`text-sm font-bold leading-snug text-gray-900 ${status === "Cancelled" ? "line-through" : ""}`}
          >
            {source.title || "Untitled Meeting"}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <StatusBadge status={status} />
            {recurring && <Pill icon={Repeat}>{source.recurrence_type.toLowerCase()}</Pill>}
            {source.booking_type && <Pill tone="amber">{source.booking_type}</Pill>}
            {isMeetingHost(source, currentUserId) && <Pill tone="blue">You host</Pill>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs text-gray-700">
        {day && (
          <DetailRow icon={CalendarDays}>
            <span className="font-medium text-gray-900">
              {day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </DetailRow>
        )}
        <DetailRow icon={Clock}>
          {formatTime24h(meeting.start_time)} – {formatTime24h(meeting.end_time)}
          {source.slot_duration && <span className="text-gray-400"> · {formatDuration(source.slot_duration)}</span>}
        </DetailRow>
        {recurring && (
          <DetailRow icon={Repeat}>
            {recurrenceText(source)}
            {seriesCancelledAt && (
              <p className="mt-0.5 font-medium text-red-700">Series cancelled on {formatDate(seriesCancelledAt)}</p>
            )}
          </DetailRow>
        )}
        {source.HostName && (
          <DetailRow icon={UserRound}>
            Hosted by <span className="font-medium text-gray-900">{source.HostName}</span>
          </DetailRow>
        )}
        {(source.project_Name || source.Ticket_Title) && (
          <DetailRow icon={FolderKanban}>
            {source.project_Name && (
              <p className="truncate">
                {source.project_Code} - {source.project_Name}
              </p>
            )}
            {source.Ticket_Title && (
              <p className="truncate text-gray-500">
                {source.issue_Code} - {source.Ticket_Title}
              </p>
            )}
          </DetailRow>
        )}

        {join && <JoinDetails join={join} />}

        {participants.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-gray-800">
              <Users size={13} className="text-amber-500" aria-hidden="true" />
              {participants.length} {participants.length === 1 ? "participant" : "participants"}
            </p>
            <ul className="max-h-36 space-y-1 overflow-y-auto">
              {participants.map((person, index) => (
                <li key={person.Participant_Id ?? index} className="flex items-center gap-2">
                  <Avatar name={person.Participant_Name} size={22} />
                  <span className="truncate">{person.Participant_Name}</span>
                  {person.Participant_Role && (
                    <span className="shrink-0 text-[10px] text-gray-400">{person.Participant_Role}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(active || canEdit) && (
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {active && join?.url && (
            <Button
              variant="subtle"
              size="sm"
              icon={Video}
              className="!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
              onClick={() => window.open(join.url, "_blank", "noopener,noreferrer")}
            >
              Join
            </Button>
          )}
          {canEdit && (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(source)}>
              Edit
            </Button>
          )}
          {active && (
            <Button
              variant="primary"
              size="sm"
              icon={logsDays ? MessageSquarePlus : CheckCircle}
              // The comment form opens on the day that was clicked.
              onClick={() => onComplete({ ...source, occurrence_date: meeting.occurrence_date })}
            >
              {logsDays ? "Day comment" : "Complete"}
            </Button>
          )}
        </footer>
      )}
    </div>
  );

  if (!asSheet) return card;
  return (
    <>
      <div className="wg-fade-in fixed inset-0 z-[59] bg-slate-900/40" aria-hidden="true" />
      {card}
    </>
  );
}
