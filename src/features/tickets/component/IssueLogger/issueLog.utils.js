// Helpers for the Issue Logger rows (GETTICKETISSUELOG), shared with the
// Threads tab.

// GETTICKETISSUELOG returns Activities as a JSON string (FOR JSON), oldest first.
export const parseActivities = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ISSUEACTIVITY.Hours is text: the thread form's Total Hours as "HH:MM".
// Rows saved before that hold decimal hours (1.5 → "01:30") and 0 where none
// were entered; any zero or unreadable value means no hours (null).
export const toHoursText = (value) => {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  let minutes;
  if (text.includes(":")) {
    const [h, m] = text.split(":").map(Number);
    minutes = h * 60 + (m || 0);
  } else {
    minutes = Math.round(Number(text) * 60);
  }
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};

// Issue numbers with an ISSUEACTIVITY row on the given thread (the thread an
// Issue Logger submit or a reply created), lowest first. The backend adds a
// reply to that thread as a remark on each of these issues.
export const getThreadIssueIds = (issueLogs, threadId) => {
  if (threadId == null || !Array.isArray(issueLogs)) return [];
  return issueLogs
    .filter((row) => parseActivities(row.Activities).some((a) => String(a.ThreadId) === String(threadId)))
    .map((row) => row.IssueLogId ?? row.IssuelogId)
    .sort((a, b) => a - b);
};
