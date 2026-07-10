// src/shared/lib/participants.js
// Previously this exact logic (JSON.parse + fallback, initials, color hashing)
// was copy-pasted in MeetingListCard, MonthView, and ListView. One bug fixed
// in two of the three copies here for good; now there's only one copy to fix.

export const AVATAR_PALETTE = [
    "bg-amber-100 text-amber-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
  ];
  
  /** Safely parse a JSON array string; never throws, never returns non-array. */
  export function safeParseList(value) {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  /** Merge internal + client participant arrays from a normalized meeting row. */
  export function getAllParticipants(meeting) {
    const internal = safeParseList(meeting?.InternalParticipants ?? meeting?.internalParticipants);
    const client = safeParseList(meeting?.ClientParticipants ?? meeting?.clientParticipants);
    return { internal, client, all: [...internal, ...client] };
  }
  
  /** "Jordan Reeves" -> "JR" */
  export function initialsOf(name = "") {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?"
    );
  }
  
  /** Deterministic string -> integer hash, used to pick a stable avatar color per name. */
  function hashString(str = "") {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
  
  /** Stable Tailwind color classes for a given participant name. */
  export function avatarColorFor(name = "") {
    return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
  }
  