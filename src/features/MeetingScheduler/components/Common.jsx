// Small shared pieces of the meeting scheduler UI: avatar, pills, button,
// icon + text, empty state, join details, calendar legend and the sidebar card.
import React, { useState } from "react";
import { Calendar, Check, Clock, Copy, Repeat, Users, Video } from "lucide-react";
import { avatarColorFor, initialsOf, meetingToneClass } from "../Helpers/common";
import { formatDateRange, formatTime24h } from "../Helpers/dateTime";
import { isRecurring } from "../Helpers/recurrence";

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/**
 * Single circular initials avatar. Color is deterministic per `name`,
 * so the same person always gets the same color across every view
 * (calendar, list, card) without any lookup table.
 */
export function Avatar({ name, size = 24, title, className = "" }) {
  const dimension = `${size}px`;
  return (
    <span
      title={title ?? name}
      className={`inline-flex items-center justify-center rounded-full border-2 border-white font-semibold shrink-0 ${avatarColorFor(
        name
      )} ${className}`}
      style={{ width: dimension, height: dimension, fontSize: Math.max(9, size * 0.4) }}
    >
      {initialsOf(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pills
// ---------------------------------------------------------------------------

/** Generic small pill, used for booking type, recurrence label, tags, etc. */
export function Pill({ children, tone = "neutral", icon: Icon, className = "" }) {
  const tones = {
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1  text-[10px] font-small capitalize ${tones[tone]} ${className}`}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200 ring-red-200",
};
const DEFAULT_STATUS_TONE = "bg-gray-50 text-gray-600 border-gray-200 ring-gray-200";

/** Status pill (Scheduled / Completed / Cancelled / fallback) with consistent styling everywhere. */
export function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1 text-[10px] font-small ring-1 ${
        STATUS_TONES[status] ?? DEFAULT_STATUS_TONE
      } ${className}`}
    >
      {status ?? "Unknown"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const VARIANTS = {
  primary:
    "bg-amber-400 hover:bg-amber-500 text-gray-900 focus-visible:ring-amber-300",
  secondary:
    "bg-gray-200 hover:bg-gray-300 text-gray-700 focus-visible:ring-gray-300",
  subtle:
    "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 focus-visible:ring-gray-200",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-500 focus-visible:ring-gray-200",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/**
 * Single button primitive for the whole scheduler feature (New Meeting,
 * Complete, Edit, Set Availability, calendar prev/next/today). Standardizes
 * focus rings, disabled state, and transition so every button behaves and
 * looks the same instead of each screen re-declaring its own className.
 */
export const Button = React.forwardRef(function Button(
  { icon: Icon, iconPosition = "left", variant = "primary", size = "md", className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon size={13} aria-hidden="true" />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={13} aria-hidden="true" />}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Icon + text
// ---------------------------------------------------------------------------

/** Icon + text, the single most repeated pattern across the scheduler views. */
export function IconText({ icon: Icon, size = 12, className = "", children }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon size={size} />
      <span>{children}</span>
    </span>
  );
}

/** Icon + value "tile" used in the expanded meeting details row. */
export function InfoTile({ icon: Icon, value, hint }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
      title={hint}
    >
      <Icon size={14} className="text-amber-500 shrink-0" />
      <span className="text-xs font-medium text-gray-700 truncate">{value || "-"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Standard "nothing here" state. Accepts any lucide icon so it can be reused
 * outside the scheduler (e.g. empty ticket list, empty search results) —
 * previously this markup was hardcoded once in ListView with a fixed message.
 */
export function EmptyState({
  icon: Icon = Calendar,
  title = "Nothing to show",
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`h-full flex flex-col items-center justify-center gap-2 bg-gray-50 p-10 text-center `}
    >
      <Icon size={28} className="text-gray-300" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Join details
// ---------------------------------------------------------------------------

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-blue-700 transition hover:bg-blue-100"
    >
      <Icon size={12} aria-hidden="true" />
      {copied ? "Copied" : label}
    </button>
  );
}

/** Method, link and password with copy buttons (list details and the calendar popup). */
export function JoinDetails({ join }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-800">
        <Video size={14} aria-hidden="true" />
        {join.label}
      </span>
      {join.url && (
        <span className="flex min-w-0 items-center gap-1">
          <a
            href={join.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 max-w-[320px] truncate text-blue-600 hover:underline"
          >
            {join.url}
          </a>
          <CopyButton text={join.url} label="Copy link" />
        </span>
      )}
      {join.password && (
        <span className="flex items-center gap-1 text-gray-600">
          Password:
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-800">{join.password}</code>
          <CopyButton text={join.password} label="Copy" />
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar legend
// ---------------------------------------------------------------------------

const Swatch = ({ status, isHost }) => (
  <span className={`inline-block h-3 w-4 rounded-sm ${meetingToneClass(status, isHost)}`} aria-hidden="true" />
);

/** What the colours and outlines on the Day / Week / Month calendars mean. */
export function CalendarLegend() {
  return (
    <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-100 bg-white px-5 py-1.5 text-[11px] text-gray-500 sm:flex">
      <span className="inline-flex items-center gap-1.5"><Swatch status="Scheduled" isHost /> You host</span>
      <span className="inline-flex items-center gap-1.5"><Swatch status="Scheduled" isHost={false} /> You're invited</span>
      <span className="inline-flex items-center gap-1.5"><Swatch status="Completed" isHost /> Completed</span>
      <span className="inline-flex items-center gap-1.5"><Swatch status="Cancelled" isHost /> <span className="line-through">Cancelled</span></span>
      <span className="inline-flex items-center gap-1.5"><Repeat size={11} aria-hidden="true" /> Repeats</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar meeting card
// ---------------------------------------------------------------------------

/** One upcoming meeting in the scheduler sidebar; clicking it calls onClick(meeting). */
export const MeetingListCard = ({ meeting, selected = false, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    aria-current={selected || undefined}
    onClick={() => onClick?.(meeting)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(meeting);
      }
    }}
    className={`cursor-pointer rounded-lg border px-2.5 py-2 hover:border-amber-300 hover:shadow-sm transition
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        selected ? "border-amber-400 bg-amber-50 shadow-sm" : "border-gray-200 bg-white"
      }`}
  >
    <div className="flex items-center gap-2">
      <h3 className="flex-1 truncate text-[13px] font-semibold text-gray-800" title={meeting.title}>
        {meeting.title || "Untitled Meeting"}
      </h3>
      {meeting.booking_type && <Pill tone="amber" className="shrink-0">{meeting.booking_type}</Pill>}
      <StatusBadge status={meeting.status} className="shrink-0" />
    </div>

    <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-gray-500">
      <span className="flex shrink-0 items-center gap-1">
        <Calendar size={10} />
        {formatDateRange(meeting.Date)}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <Clock size={10} />
        {formatTime24h(meeting.start_time)}-{formatTime24h(meeting.end_time)}
      </span>
      <span className="flex min-w-0 items-center gap-1" title="Host">
        <Users size={10} />
        <span className="max-w-[70px] truncate">{meeting.Organizer}</span>
      </span>
      {isRecurring(meeting) && <Repeat size={10} className="shrink-0 text-amber-600" aria-label="Repeats" />}
    </div>
  </div>
);
