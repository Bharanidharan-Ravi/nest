// src/shared/ui/Avatar.jsx
import React from "react";
import { avatarColorFor, initialsOf } from "../hooks/participants";

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

/**
 * Overlapping stack of avatars with a "+N" overflow chip.
 * Replaces the hand-rolled slice(0,3)/+N markup duplicated in
 * MonthView and MeetingListCard.
 */
export function AvatarGroup({ people, max = 3, size = 24 }) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex -space-x-2">
      {visible.map((person, index) => (
        <Avatar
          key={person.Participant_Id ?? `${person.Participant_Name}-${index}`}
          name={person.Participant_Name}
          size={size}
        />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full border-2 border-white bg-gray-300 text-gray-700 font-semibold shrink-0"
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
