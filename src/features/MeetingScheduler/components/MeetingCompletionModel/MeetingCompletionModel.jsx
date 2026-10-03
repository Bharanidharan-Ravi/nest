import { useEffect, useMemo } from "react";
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    UserRound,
    Users,
    X,
} from "lucide-react";

import EntityFormPage from "../../../../packages/crud/pages/EntityFormPage";
import { queryKeys } from "../../../../core/query/queryKeys";
import {
    datePart,
    formatDate,
    formatDuration,
    formatTime24h,
    minutesToTime,
    nowTime,
    parseDay,
    todayKey,
    toMinutes,
} from "../../Helpers/dateTime";
import { validateEndTime } from "../../Helpers/meetingValidation";
import { isRecurring, occurrenceDatesUpTo } from "../../Helpers/recurrence";
import { safeParseList } from "../../Helpers/common";
import { useBodyScrollLock } from "../../hooks";

// Styles EntityFormPage / FormEngine pick up from config.theme, so the form
// sits flush in this modal (no card-in-card) with a sticky footer.
const COMPLETE_FORM_THEME = {
    formContainer: "border-0 shadow-none rounded-none max-h-none min-h-0 flex-1",
    body: "px-4 py-3.5 sm:px-5 sm:py-4",
    grid: "grid grid-cols-12 gap-x-3 gap-y-3",
    footer:
        "gap-2 rounded-none border-slate-100 bg-slate-50/80 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex-col-reverse sm:flex-row sm:items-center",
    submitBtn: "w-full sm:w-auto rounded-lg px-4 py-2",
    // mt-1.5 / -mb-1 keep a heading closer to its own fields than to the section above.
    groupHeader:
        "col-span-12 mt-1.5 -mb-1 first:mt-0 flex items-center gap-3 after:h-px after:flex-1 after:bg-slate-100 after:content-['']",
    groupTitle: "shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400",
    editorContainer:
        "overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10",
    editorToolbar:
        "flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/70 px-2 py-1.5",
    editorPlaceholder: "What was discussed, what was decided, and who owns the next steps…",
};

const CANCEL_BTN_CLASS =
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100";
const COMPLETE_BTN_CLASS =
    "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2";

function buildAttendeeOptions(meeting) {
    const withGroup = (group) => (participant) => ({ ...participant, group });

    return [
        ...safeParseList(meeting?.InternalParticipants).map(withGroup("Internal")),
        ...safeParseList(meeting?.ClientParticipants).map(withGroup("Client")),
    ]
        .filter(
            (participant) =>
                participant?.Participant_Id != null &&
                participant?.Participant_Name
        )
        .map((participant) => ({
            label: participant.Participant_Name,
            group: participant.group,
            value: {
                id: participant.Participant_Id,
                name: participant.Participant_Name,
            },
        }));
}

// Everyone ticked in the Attendees list is recorded as present.
function toAttendance(attendees) {
    return (Array.isArray(attendees) ? attendees : [])
        .filter((participant) => participant?.id != null)
        .map((participant) => ({
            ParticipantId: participant.id,
            AttendanceStatus: "Present",
            InviteStatus: "Accepted",
            Remark: "",
        }));
}

/** "10:00:00", "11:30:00" -> "1h 30m" (null when the range is missing or backwards) */
function durationBetween(start, end) {
    const from = toMinutes(start);
    const to = toMinutes(end);
    if (from == null || to == null || to <= from) return null;
    return formatDuration(minutesToTime(to - from));
}

/** "2026-09-28" -> "Mon, 28 Sep 2026" */
function formatOccurrenceLabel(dayKey) {
    return parseDay(dayKey).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// Default the actual end to "now" when completing today's meeting after it
// started; otherwise (a past meeting) fall back to the scheduled end.
// `dayKey` is the day being written up for a recurring meeting.
function defaultEndTime(meeting, dayKey = meeting?.meeting_date) {
    const nowText = nowTime();
    const isToday = datePart(dayKey) === todayKey();
    const startMinutes = toMinutes(meeting?.start_time);
    const hasStarted = startMinutes == null || startMinutes < toMinutes(nowText);

    if (isToday && hasStarted) return nowText;
    return meeting?.end_time?.slice(0, 5) || nowText;
}

function MetaChip({ icon: Icon, children }) {
    return (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200/70">
            <Icon size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{children}</span>
        </span>
    );
}

export default function MeetingCompleteModal({
    meeting,
    onClose,
    handleSuccess,
}) {
    const attendeeOptions = useMemo(
        () => buildAttendeeOptions(meeting),
        [meeting?.InternalParticipants, meeting?.ClientParticipants]
    );

    // A daily / weekly meeting linked to a ticket gets day comments, each posted
    // as a new thread on the ticket (a day can have several, as the meeting can
    // be held more than once); the meeting stays Scheduled.
    // Without a ticket there's nowhere to keep them, so it completes as a whole.
    const recurring = isRecurring(meeting);
    const canLogDay = recurring && !!meeting?.ticket_id;

    const occurrenceOptions = useMemo(
        () =>
            canLogDay
                ? occurrenceDatesUpTo(meeting).map((dayKey) => ({
                    label: formatOccurrenceLabel(dayKey),
                    value: { id: dayKey },
                }))
                : [],
        [meeting, canLogDay]
    );

    // Close with Escape
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useBodyScrollLock();

    const completeFields = useMemo(() => {
        const initialDay =
            occurrenceOptions.find(({ value }) => value.id === meeting?.occurrence_date) ??
            occurrenceOptions[0] ??
            null;
        const endTime = defaultEndTime(meeting, initialDay?.value.id);

        const dayFields = canLogDay
            ? [
                {
                    label: "Meeting day",
                    name: "occurrence_date",
                    type: "select",
                    ui: "mui",
                    required: true,
                    dataType: "string",
                    apiKey: "OccurrenceDate",
                    colSpan: 6,
                    groupName: "Meeting day",
                    options: occurrenceOptions,
                    initValueResolver: () => initialDay,
                },
                {
                    label: "Also end this series (mark meeting as completed)",
                    name: "end_series",
                    type: "checkbox",
                    ui: "mui",
                    dataType: "boolean",
                    apiKey: "EndSeries",
                    colSpan: 6,
                    groupName: "Meeting day",
                    initValueResolver: () => false,
                },
            ]
            : [];

        return [
            {
                key: "meetingId",
                name: "meetingId",
                apiKey: "MeetingId",
                hidden: true,
                defaultValue: meeting?.meeting_id,
                dataType: "string",
            },

            ...dayFields,

            {
                label: "Start Time",
                name: "start_time",
                type: "time",
                ui: "mui",
                required: true,
                dataType: "dateTime",
                apiKey: "ActualStartTime",
                colSpan: 6,
                groupName: "Actual time",
                initValueResolver: ({ context }) =>
                    context?.start_time?.slice(0, 5) ?? "",
            },

            {
                label: "End Time",
                name: "end_time",
                type: "time",
                ui: "mui",
                required: true,
                dataType: "dateTime",
                apiKey: "ActualEndTime",
                colSpan: 6,
                groupName: "Actual time",
                initValueResolver: () => endTime,
                customValidator: validateEndTime(
                    "start_time",
                    "End Time must be after Start Time"
                ),
            },

            {
                label: "Meeting Summary",
                name: "meeting_summary",
                type: "adEditor",
                ui: "editor",
                required: true,
                dataType: "string",
                apiKey: "MeetingSummary",
                groupName: "Summary",
            },

            {
                name: "Attendee",
                label: "Attendees",
                type: "ListCheckBox",
                ui: "mui",
                colSpan: 12,
                groupName: "Attendance",
                apiKey: "Attendance",
                options: attendeeOptions,
                transform: toAttendance,
                initValueResolver: () =>
                    attendeeOptions.map(({ value }) => value),
            },
        ];
    }, [meeting, attendeeOptions, canLogDay, occurrenceOptions]);

    const config = useMemo(
        () => ({
            api: "MeetingSchedulerControler/CompleteMeeting",
            // The meetings lists (status) and, when there is one, the ticket's threads.
            invalidateKeys: [
                queryKeys.MeetingData.all,
                ["UpcomingMeeting"],
                ...(meeting?.ticket_id ? [queryKeys.ticket.thread(meeting.ticket_id)] : []),
            ],
            fields: completeFields,
            theme: COMPLETE_FORM_THEME,

            actions: ({ isPending }) => [
                {
                    label: "Cancel",
                    className: CANCEL_BTN_CLASS,
                    onClick: () => onClose?.(),
                },
                {
                    type: "submit",
                    label: canLogDay ? "Save" : "Complete meeting",
                    className: COMPLETE_BTN_CLASS,
                    icon: isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <CheckCircle2 size={16} />
                    ),
                },
            ],
        }),
        [completeFields, onClose, canLogDay, meeting?.ticket_id]
    );

    if (!meeting) {
        return null;
    }

    const duration = durationBetween(meeting.start_time, meeting.end_time);
    const participantCount = attendeeOptions.length;

    return (
        <div className="wg-fade-in fixed inset-0 z-[99999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="complete-meeting-title"
                className="wg-rise-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
            >
                {/* Drag-handle look for the phone bottom sheet */}
                <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

                <header className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-2 sm:px-5 sm:pb-3.5 sm:pt-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                            <CheckCircle2 size={18} />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                                {canLogDay ? "Add day comment" : "Complete meeting"}
                            </p>
                            <h2
                                id="complete-meeting-title"
                                className="truncate text-base font-bold leading-snug text-slate-900 sm:text-lg sm:leading-snug"
                                title={meeting.title}
                            >
                                {meeting.title || "Untitled Meeting"}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* What was scheduled, for reference while filling in what actually happened */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:pl-12">
                        <span className="mr-0.5 text-[11px] font-medium text-slate-400">
                            Scheduled
                        </span>
                        <MetaChip icon={CalendarDays}>
                            {recurring
                                ? `${formatDate(meeting.valid_from_date)} – ${formatDate(meeting.valid_to_date)}`
                                : formatDate(meeting.meeting_date)}
                        </MetaChip>
                        <MetaChip icon={Clock3}>
                            {formatTime24h(meeting.start_time)} – {formatTime24h(meeting.end_time)}
                            {duration && <span className="text-slate-400"> · {duration}</span>}
                        </MetaChip>
                        {meeting.HostName && (
                            <MetaChip icon={UserRound}>{meeting.HostName}</MetaChip>
                        )}
                        <MetaChip icon={Users}>
                            {participantCount} {participantCount === 1 ? "participant" : "participants"}
                        </MetaChip>
                    </div>

                    {recurring && !canLogDay && (
                        <p className="mt-2 text-xs text-amber-700 sm:pl-12">
                            Link a ticket to record comments for each day.
                        </p>
                    )}
                    {canLogDay && occurrenceOptions.length === 0 && (
                        <p className="mt-2 text-xs text-amber-700 sm:pl-12">
                            This meeting hasn't run on any day yet.
                        </p>
                    )}
                </header>

                {/* The editor pads both its content box and .ProseMirror; drop the inner
                    padding so the summary box isn't double-padded and oversized. */}
                <div className="flex min-h-0 flex-1 flex-col [&_.ProseMirror]:min-h-[126px] [&_.ProseMirror]:p-0">
                    <EntityFormPage
                        mode="Complete"
                        module="Meeting"
                        config={config}
                        context={meeting}
                        onSuccessCallback={handleSuccess}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
