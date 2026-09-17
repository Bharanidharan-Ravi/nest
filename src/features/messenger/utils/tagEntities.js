/**
 * Pure normalization from raw WGNest entities (as returned by /sync/v2 and master data) into
 * the common tag-picker/tag-metadata shape: { entityType, entityId, displayText, label, notifyUserId }.
 * Kept separate from the hooks in useTagSources.js so this mapping is unit-testable without React.
 */
import { ChatTagEntityType } from "../e2ee/chatCryptoSession";

export function normalizeTicket(t) {
  return {
    entityType: ChatTagEntityType.Ticket,
    entityId: String(t.Issue_Id),
    displayText: `#${t.Issue_Code}`,
    label: t.Title ? `${t.Issue_Code} — ${t.Title}` : t.Issue_Code,
    notifyUserId: t.Assignee_Id ?? null,
  };
}

export function normalizeProject(p) {
  return {
    entityType: ChatTagEntityType.Project,
    entityId: String(p.Id),
    displayText: `#${p.ProjectKey ?? p.Project_Name}`,
    label: p.Project_Name ?? p.ProjectKey,
    notifyUserId: p.Responsible ?? null,
  };
}

export function normalizeRepo(r) {
  return {
    entityType: ChatTagEntityType.Repo,
    entityId: String(r.Repo_Id),
    displayText: `#${r.RepoKey ?? r.Title}`,
    label: r.Title ?? r.RepoKey,
    // No reliable owner-user-id field on Repo — no realtime alert for #repo tags (known gap).
    notifyUserId: null,
  };
}

export function normalizeMeeting(m) {
  return {
    entityType: ChatTagEntityType.Meeting,
    entityId: String(m.Meeting_Id),
    displayText: `#${m.Title}`,
    label: m.Title,
    notifyUserId: m.Host_Id ?? null,
  };
}

export function normalizePerson(p) {
  return {
    entityType: ChatTagEntityType.User,
    entityId: String(p.UserID),
    displayText: `@${p.UserName}`,
    label: p.UserName,
    notifyUserId: null, // the tagged user is derived from EntityId server-side
  };
}
