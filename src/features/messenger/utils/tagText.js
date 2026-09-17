import { ChatTagEntityType } from "../e2ee/chatCryptoSession";

export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Route for a clickable tag chip, or null if the entity type has no detail page to link to. */
export function tagPath(entityType, entityId) {
  switch (entityType) {
    case ChatTagEntityType.Ticket:
      return `/tickets/${entityId}`;
    case ChatTagEntityType.Project:
      return `/projects/${entityId}`;
    case ChatTagEntityType.Repo:
      return `/repository/${entityId}`;
    // No per-meeting detail route exists yet — send to the meeting list (known gap).
    case ChatTagEntityType.Meeting:
      return `/meeting`;
    default:
      return null;
  }
}

/**
 * Splits `text` on every occurrence of a Tags[].DisplayText token, longest token first so a
 * shorter token (e.g. "#TCK-104") can't shadow one that contains it (e.g. "#TCK-1042").
 * Returns [{ text, tag }], where `tag` is undefined for plain-text segments.
 */
export function splitTaggedText(text, tags) {
  const byDisplay = new Map();
  for (const t of tags ?? []) if (t?.DisplayText) byDisplay.set(t.DisplayText, t);
  if (byDisplay.size === 0) return [{ text }];

  const alternatives = [...byDisplay.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const parts = text.split(new RegExp(`(${alternatives.join("|")})`, "g"));
  return parts.filter((part) => part !== "").map((part) => ({ text: part, tag: byDisplay.get(part) }));
}
