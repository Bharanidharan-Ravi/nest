// src/core/mentions/mentionSources.js
//
// App-side builders for AdvancedEditor mention sources. The editor package is
// generic; everything entity-specific (data, filtering, labels) lives here.
//
//   @  → users   (userMention)
//   #  → tickets (ticketMention) — scoped to one repo
//   ~  → labels  (labelMention)
//
// Saved HTML for a ticket mention:
//   <span data-type="ticketMention" data-id="<ticket id>" data-label="T13 Login bug"
//         class="mention-ticket">#T13 Login bug</span>
// HtmlRenderer turns clicks on it into navigation to the ticket.

import {
  fetchRepoTickets,
  filterTickets,
  prefetchRepoTickets,
} from "../filters/ticketFilters";

export const TICKET_MENTION_TYPE = "ticketMention";

const matchActiveByName = (list = [], key) => (query) =>
  list.filter(
    (item) =>
      item.Status === "Active" &&
      item[key]?.toLowerCase().includes(query.toLowerCase()),
  );

export const buildUserMentionSource = (users = []) => ({
  char: "@",
  name: "userMention",
  className: "mention-user",
  items: matchActiveByName(users, "UserName"),
  getId: (u) => u.UserID,
  getLabel: (u) => u.UserName,
});

export const buildLabelMentionSource = (labels = []) => ({
  char: "~",
  name: "labelMention",
  className: "mention-label",
  items: matchActiveByName(labels, "LabelName"),
  getId: (l) => l.LabelID,
  getLabel: (l) => l.LabelName,
});

// All tickets of the given repo, searched by code + title.
// data-id keeps the ticket id (used for navigation); the label carries the
// human-readable code, e.g. "T13 Login bug".
export const buildTicketMentionSource = (repoId) => {
  prefetchRepoTickets(repoId); // first "#" opens instantly

  return {
    char: "#",
    name: TICKET_MENTION_TYPE,
    className: "mention-ticket",
    limit: 8,
    allowSpaces: true, // "#test the hold" keeps filtering
    items: async (query) => {
      const tickets = await fetchRepoTickets(repoId);
      return filterTickets(tickets, { text: query });
    },
    getId: (t) => t.id,
    getLabel: (t) => [t.ticketKey, t.title].filter(Boolean).join(" "),
    getBadge: (t) => t.ticketKey,
    renderItem: (t) => t.title ?? "",
    renderText: ({ label }) => `#${label ?? ""}`.trim(),
  };
};

// Standard set for a ticket-scoped editor (threads, progress updates, ...)
export const buildTicketEditorMentionSources = ({ masterData, repoId }) => [
  buildUserMentionSource(masterData?.EmployeeList),
  buildTicketMentionSource(repoId),
  buildLabelMentionSource(masterData?.LabelMaster),
];

// Field-config helper: mentionSourcesResolver: ticketMentionSourcesResolver
export const ticketMentionSourcesResolver = ({ masterData, context }) =>
  buildTicketEditorMentionSources({
    masterData,
    repoId: context?.parentTicket?.repoId ?? context?.repoId,
  });
