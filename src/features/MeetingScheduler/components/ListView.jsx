
import React, { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  ChevronDown,
  ChevronUp,
  Pencil,
  CalendarDays,
  CheckCircle,
  CircleDot,
  CircleCheck,
  CircleX,
  FilePlus
} from "lucide-react";
import { Pill, StatusBadge } from "./Badge";
import { IconText, InfoTile } from "./IconText";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { getAllParticipants } from "../hooks/participants";
import { binaryToDaysList, formatDate, formatDuration, formatTime24h } from "../Helpers/dateTime";

// BUG FIX: original switch only handled "Scheduled" and "Completed" and fell
// through to the green "open" icon for everything else — including
// "Cancelled", which silently looked like an active meeting.
function StatusIcon({ status }) {
  if (status === "Completed") return <CircleCheck size={15} className="mt-1.5 text-violet-500" title="Completed" />;
  if (status === "Cancelled") return <CircleX size={15} className="mt-1.5 text-red-500" title="Cancelled" />;
  return <CircleDot size={15} className="mt-1.5 text-green-500" title="Active" />;
}

function ParticipantChip({ name, role }) {
  return (
    <div
      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gray-50 border border-gray-200"
      title={role ? `${name} · ${role}` : name}
    >
      <Avatar name={name} size={24} />
      <span className="text-xs font-medium text-gray-700">{name}</span>
      {role && (
        <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2">{role}</span>
      )}
    </div>
  );
}

function ParticipantSection({ label, people }) {
  return (
    <div>
      <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
        <Users size={13} className="text-amber-500" />
        {label} ({people.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {people.length === 0 ? (
          <span className="text-gray-400 text-xs">No {label.toLowerCase()} participants</span>
        ) : (
          people.map((p, i) => (
            <ParticipantChip key={p.Participant_Id ?? i} name={p.Participant_Name} role={p.Participant_Role} />
          ))
        )}
      </div>
    </div>
  );
}

function MeetingRow({ meeting, isOpen, onToggle, onEdit, onComplete }) {
  const { internal, client, all } = getAllParticipants(meeting);
  const isRecurring = meeting.recurrence_type && meeting.recurrence_type !== "ONETIME";
  const isOneTime = meeting.recurrence_type?.toUpperCase() === "ONETIME";

  return (
    <div
      className={`bg-white border rounded-md shadow-sm transition-shadow duration-200 ${isOpen ? "border-amber-200 shadow-md" : "border-gray-200 hover:shadow-md"
        }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-3 p-2 text-left"
      >
        <StatusIcon status={meeting.status} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 truncate max-w-[220px]" title={meeting.title}>
              {meeting.title || "Untitled Meeting"}
            </p>
            {meeting.booking_type && <Pill tone="amber">{meeting.booking_type}</Pill>}
            <StatusBadge status={meeting.status} />
            {isRecurring && (
              <Pill icon={Repeat}>{meeting.recurrence_type.toLowerCase()}</Pill>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
            {(meeting.project_Name || meeting.Ticket_Title) && (
              <div className="flex flex-wrap items-center gap-2">
                {meeting.project_Name && (
                  <span className="px-1 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
                    {meeting.project_Code} - {meeting.project_Name}
                  </span>
                )}
                {meeting.Ticket_Title && (
                  <span className="px-1 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                    {meeting.issue_Code} - {meeting.Ticket_Title}
                  </span>
                )}
              </div>
            )}

            <IconText icon={Calendar}>
              {isOneTime
                ? formatDate(meeting.meeting_date)
                : `${formatDate(meeting.valid_from_date)} - ${formatDate(meeting.valid_to_date)}`}
            </IconText>
            <IconText icon={Clock}>
              {formatTime24h(meeting.start_time)} - {formatTime24h(meeting.end_time)}
            </IconText>
            <IconText icon={Users}>
              {all.length} attendee{all.length === 1 ? "" : "s"}
            </IconText>
            {/* {meeting.HostName && (
              <span className="flex items-center gap-1.5">
                <Avatar
                  name={meeting.HostName}
                  size={16}
                  className="border-8 border-black-300 bg-gray-100 text-black-700"
                />
              </span>
            )} */}
          </div>
        </div>

        {meeting.status !== "Completed" && (
          <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="primary" size="sm" icon={CheckCircle} onClick={() => onComplete?.(meeting)}>
              Complete
            </Button>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit?.(meeting)}>
              Edit
            </Button>
          </div>
        )}

        <span className="mt-1 text-gray-400 shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4 text-xs text-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

            <InfoTile icon={FilePlus} value={formatDate(meeting.created_at)} hint="Created date" />
            <InfoTile icon={Users} value={meeting.host_type} hint="Host type" />
            <InfoTile icon={Repeat} value={meeting.recurrence_type} hint="Recurrence" />
            <InfoTile icon={Clock} value={formatDuration(meeting.slot_duration)} hint="Slot duration" />
            {meeting.days_of_week &&
              <InfoTile
                icon={CalendarDays}
                value={binaryToDaysList(meeting.days_of_week).join(" | ")}
                hint="Days of week"
              />
            }

          </div>

          <p className="text-gray-600 leading-relaxed bg-gray-50/70 border border-gray-100 rounded-lg p-3">
            {meeting.meeting_summary || "No summary added yet."}
          </p>

          <ParticipantSection label="Internal" people={internal} />
          <ParticipantSection label="Client" people={client} />
        </div>
      )}
    </div>
  );
}

export default function ListView({ data = [], onEdit, onComplete }) {
  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));
  const validMeetings = useMemo(
    () =>
      (data || []).filter(
        (meeting) => meeting && meeting.meeting_id != null && meeting.title
      ),
    [data]
  )
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No meetings to show"
        description="Meetings you schedule will show up here."
      />
    );
  }

  return (
    // <div className="max-h-[76vh] overflow-y-auto bg-gray-50 p-4 space-y-3">
    <div className="bg-gray-50 p-2 space-y-2">
      {validMeetings.map((meeting) => (
        <MeetingRow
          key={meeting.meeting_id}
          meeting={meeting}
          isOpen={expandedId === meeting.meeting_id}
          onToggle={() => toggle(meeting.meeting_id)}
          onEdit={onEdit}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
