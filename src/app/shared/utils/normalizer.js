import { queryKeys } from "../../../core/query/queryKeys";

export const MAIN_ASSIGNEE_TYPE = "Main Assignee";
// Old list SP: ISNULL(repo title, 'WorkGlow Solutions') for a handler with no
// repo; TicketListV2 sends that case as the empty guid.
const DEFAULT_HANDLER_NAME = "WorkGlow Solutions";
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const parseJsonList = (json) => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

const splitIds = (csv) =>
  csv
    ? String(csv)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

// 125 → "2:05" (same format as the old TotalConsumeTime)
export const formatMinutes = (minutes) =>
  minutes === null || minutes === undefined
    ? null
    : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;

export const normalizeTicket = (ticket) => ({
  id: ticket.Issue_Id,
  issueId: ticket.Issue_Id,
  title: ticket.Title,
  ticketKey: ticket.Issue_Code,
  status: ticket.Status,
  navId: ticket.Issue_Id,
  statusId: ticket.StatusId,
  description: ticket.HtmlDesc || ticket.Description,
  assignedTo: ticket.Assignee_Id,
  assginedName: ticket.Assignee_Name,
  EntireWorkingTime:ticket.TotalConsumeTime,
  estimateHours: ticket.hours || ticket.Hours,
  createdAt: ticket.CreatedAt,
  updatedAt: ticket.UpdatedAt,
  updatedBy: ticket.UpdatedBy,
  repoId: ticket.RepoId,
  RepoKey: ticket.RepoKey,
  dueDate: ticket.Due_Date,
  project: ticket.Project_Id,
  ProjKey: ticket.ProjKey,
  reopenedBy: ticket.ReopenedBy,
  priority: ticket.Priority,
  move_toJson :ticket.Move_toJson,
  handlers: parseJsonList(ticket.Move_toJson).map((h) => ({
    id: h.Move_to,
    name: h.Title,
  })),
  multiAssignees: ticket.All_Assignees ? JSON.parse(ticket.All_Assignees) : [],
  label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
  completionPct: ticket.CompletionPct,
  teamId: ticket.Assignee_TeamId,
  teamName: ticket.Assignee_TeamName,
  overallPercentage: ticket.OverallPercentage,
  currentStatusSummary: ticket.CurrentStatusSummary,
  isCloseRequested: ticket.IsCloseRequested,
  priorityRequest: ticket.PriorityRequest,
  funcResponse: ticket.FuncResponse,
  webResponse: ticket.WebResponse,
  technicalResponse: ticket.TechnicalResponse,
  adminResponse: ticket.AdminResponse,
  raiseToClient: ticket.RaiseToClient,
  privateTicket :ticket.IsPrivate ?? false,
  clientTime: ticket.Client,
  webTime: ticket.Web,
  technicalTime: ticket.Technical,
  functionalTime: ticket.Functional,
  commenttext: ticket.commenttext,
  threadCount: ticket.ThreadCount,
  ticketCreater: ticket.TicketCreater,
  createdBy: ticket.CreatedBy,
});

// The owner has no work stream (same as the old All_Assignees row)
const NO_STREAM = {
  StreamId: null,
  StreamStatus: null,
  CompletionPct: null,
  TargetDate: null,
  ThreadId: null,
  ParentThreadId: null,
  HandOffData: null,
};

// TicketListV2 row → the same shape as normalizeTicket. The row carries ids
// only; names / colours come from the masters (lookup = useMasterLookup()).
// A "detail" row (ticket screen) also has Streams_JSON: the work streams with
// their hand-offs, used in place of Assignee_Ids.
export const normalizeTicketListRow = (row, lookup) => {
  // Employee, or a client (repo user), who isn't in the employee master
  const person = (id) => lookup.get("employee", id) ?? lookup.get("repoUser", id);
  const toAssignee = (id, type) => {
    const employee = lookup.get("employee", id);
    return {
      Assignee_Id: id,
      Assignee_Name: person(id)?.name ?? null,
      Assignee_Type: type,
      Assignee_TeamId: employee?.Team ?? null,
      Assignee_TeamName: lookup.get("team", employee?.Team)?.name ?? null,
    };
  };
  const owner = row.Assignee_Id
    ? { ...toAssignee(row.Assignee_Id, MAIN_ASSIGNEE_TYPE), ...NO_STREAM }
    : null;

  const streams = row.Streams_JSON
    ? parseJsonList(row.Streams_JSON).map((stream) => ({
        ...toAssignee(stream.Assignee_Id, stream.Assignee_Type),
        ...stream,
        StatusName: lookup.get("status", stream.StreamStatus)?.name ?? null,
      }))
    : splitIds(row.Assignee_Ids).map((id) => toAssignee(id, "Assignee"));

  const handlers = splitIds(row.Handler_Ids).map((id) => ({
    id,
    name: lookup.get("repo", id)?.name ?? DEFAULT_HANDLER_NAME,
  }));

  return {
    ...normalizeTicket(row),
    status: lookup.get("status", row.StatusId)?.name,
    assginedName: owner?.Assignee_Name,
    teamId: owner?.Assignee_TeamId,
    teamName: owner?.Assignee_TeamName,
    ticketCreater: person(row.CreatedBy)?.name,
    EntireWorkingTime: formatMinutes(row.TotalConsumeMinutes),
    // Staff-logged hours only (client hours excluded); null when nothing logged.
    // An API without TeamConsumeMinutes yet → fall back to all logged hours.
    teamWorkingTime: formatMinutes(
      (row.TeamConsumeMinutes === undefined ? row.TotalConsumeMinutes : row.TeamConsumeMinutes) || null,
    ),
    multiAssignees: [...(owner ? [owner] : []), ...streams],
    label: splitIds(row.Label_Ids).map((id) => {
      const label = lookup.get("label", id);
      return {
        LABEL_ID: Number(id),
        LABEL_TITLE: label?.name,
        LABEL_COLOR: label?.color,
      };
    }),
    handlers,
    // Old Move_toJson shape for the handler pickers (empty guid = no repo)
    move_toJson: handlers.length
      ? JSON.stringify(
          handlers.map((h) => ({
            Move_to: h.id === EMPTY_GUID ? null : h.id,
            Title: h.name,
          })),
        )
      : null,
  };
};

// TimesheetV2 entry (GetTimesheet_V2) + its ticket (normalizeTicketListRow
// output) → the timesheet item the graph / tree / summary views read (same
// field names as createTimesheetNormalizer).
//   entryType : "WORK" | "MEETING" | "STATUS" (closed / reopened, no thread)
//   action    : "C" closed / "R" reopened on that day, null = plain entry
//   marker    : graph marker — the action, else "M" for a meeting
const TIMESHEET_ACTION_STATUS = { C: "Closed", R: "Reopened" };

export const normalizeTimesheetRow = (row, ticket, lookup) => {
  const employeeName = lookup.get("employee", row.EmployeeId)?.name ?? null;
  return {
    ...ticket,
    id: row.Id,
    rawId: row.Id,
    threadId: row.ThreadId,
    ticketId: row.Issue_Id,
    issueId: row.Issue_Id,
    navId: row.Issue_Id,
    TicketName: ticket.title,
    entryType: row.EntryType,
    action: row.Action ?? null,
    isMeeting: row.EntryType === "MEETING",
    isDirectUpdate: row.EntryType === "STATUS",
    isCoContributor: !!row.IsCoContributor,
    marker: row.Action ?? (row.EntryType === "MEETING" ? "M" : null),
    employeeId: row.EmployeeId,
    employeeName,
    createdByName: employeeName,
    Comment: row.Comment,
    startTime: row.From_Time,
    EndTime: row.To_Time,
    // "H:MM"; null for a close / reopen without a thread
    ConsumeTime: formatMinutes(row.Minutes),
    workDate: row.WorkDate,
    // The graph's date axis and the summary's ordering read updatedAt
    updatedAt: row.EventAt,
    createdAt: row.EventAt,
    threadStatusName: TIMESHEET_ACTION_STATUS[row.Action] ?? null,
    threadStatusId: row.Action ? row.NewStatusId : null,
    projectName: lookup.get("project", ticket.project)?.name ?? null,
    repoName: lookup.get("repo", ticket.repoId)?.name ?? null,
    repoKey: ticket.RepoKey,
    CurrentStatusSummary: row.CurrentStatusSummary,
    currentStatusSummary: row.CurrentStatusSummary,
    IsPrivate: ticket.privateTicket,
  };
};

export const normalizeProject = (proj) => ({
  id: proj.Id,
  title: proj.Project_Name,
  key: proj.ProjectKey,
  status: proj.Status,
  owner: proj.EmployeeName,
  createdAt: proj.CreatedAt,
  CreatedBy: proj.CreatedBy,
  repoId: proj.Repo_Id,
  repoName: proj.Repo_Name,
  repoKey: proj.RepoKey,
  UpdatedAt: proj.UpdatedAt,
  UpdatedBy: proj.UpdatedBy,
});

// 🔥 Pass the queryClient into the factory function instead of the raw data
export const createTimesheetNormalizer = (Timedata) => {
  return {
    id: Timedata.ThreadId,
    rawId: Timedata.RowNum,
    ticketId: Timedata.Issue_Id,
    issueId: Timedata.Issue_Id,
    navId: Timedata.Issue_Id,
    TicketName: Timedata.TicketName,
    title: Timedata.TicketName,
    startTime: Timedata.StartTime,
    employeeName: Timedata.EmployeeName,
    employeeId: Timedata.EmployeeId,
    Comment: Timedata.Comment,
    EndTime: Timedata.EndTime,
    statusId: Timedata.Status,
    ConsumeTime: Timedata.ConsumeTime,
    dueDate: Timedata.Due_Date,
    ticketKey: Timedata.TicketNo,
    repoId: Timedata.RepoId,
    repoKey: Timedata.RepoKey,
    project: Timedata.Project_Id,
    projectName: Timedata.Project_Name,
    repoName: Timedata.Repository_Name,
    updatedAt: Timedata.UpdatedAt,
    CompletionPct: Timedata.CompletionPct,
    privateTicket :Timedata.IsPrivate ?? false,
    createdAt: Timedata.CreatedAt,
    updatedBy: Timedata.UpdatedBy,
    threadStatusName: Timedata.ThreadStatusName,
    threadStatusId: Timedata.ThreadStatusId,
    overallPercentage: Timedata.OverallPercentage,
    createdByName: Timedata.CreatedByName,
    total: Timedata.total,
    CurrentStatusSummary: Timedata.CurrentStatusSummary,
    label: Timedata.Labels_JSON ? JSON.parse(Timedata.Labels_JSON) : [],
    IsPrivate:Timedata.IsPrivate,
    estimateHours:Timedata.EstimatedHours,
    EntireWorkingTime:Timedata.EntireConsumeTime
  };
};

export const normalizeNotification = (notif) => ({
  id: notif.NotificationId || notif.notificationId,
  notificationId: notif.NotificationId || notif.notificationId,
  title: notif.Title || notif.title || "No Title",
  message: notif.Message || notif.message || "",
  entityType: notif.EntityType || notif.entityType || "UNKNOWN",
  entityId: notif.EntityId || notif.entityId,
  createdAt: notif.CreatedAt || notif.createdAt,
  actorId: notif.ActorId || notif.actorId,
  actorName: notif.ActorName || notif.actorName,
  // Add a safe fallback in case you ever add an unread boolean from the API
  isUnread: notif.IsUnread ?? notif.isUnread ?? false,
});

// Maps usp_GetLeaveRequests output (GetLeaveRequest DTO, ALL_CAPS columns) to the
// camelCase shape LeaveRequestPage / LeaveRequestFormPage work with.
const parseLeaveDays = (json) => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const normalizeLeaveRequest = (raw) => ({
  id: raw.ID,
  employeeId: raw.EMPLOYEE_ID,
  requestedBy: raw.EmployeeName,
  fromDate: raw.LEAVE_FROM,
  toDate: raw.LEAVE_TO,
  leaveTypeId: raw.LEAVE_TYPE_ID,
  noOfDays: raw.NO_OF_LEAVE_DAYS,
  comments: raw.COMMENTS,
  status: raw.STATUS,
  requestedDate: raw.REQUESTED_DATE,
  approvedBy: raw.APPROVED_BY,
  approvedDate: raw.APPROVED_DATE,
  rejectReason: raw.REJECT_REASON,
  rejectedBy: raw.REJECTED_BY,
  rejectedDate: raw.REJECTED_DATE,
  notTaken: raw.NOT_TAKEN ?? false,
  notTakenBy: raw.NOT_TAKEN_BY,
  notTakenDate: raw.NOT_TAKEN_DATE,
  // [{ date: "2026-09-30", session: "FULL" | "FIRST_HALF" | "SECOND_HALF" }]
  days: parseLeaveDays(raw.DAYS_JSON),
});

export const normalizeLeaveRequestList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeLeaveRequest);
};

// Maps usp_GetPermissionRequests output (GetPermissionRequest DTO, ALL_CAPS
// columns) to the camelCase shape LeaveRequestPage / LeaveRequestFormPage work with.
export const normalizePermissionRequest = (raw) => ({
  id: raw.ID,
  employeeId: raw.EMPLOYEE_ID,
  requestedBy: raw.EmployeeName,
  permissionDate: raw.PERMISSION_DATE,
  durationMinutes: raw.DURATION_MINUTES,
  remarks: raw.REMARKS,
  status: raw.STATUS,
  requestedDate: raw.REQUESTED_DATE,
  approvedBy: raw.APPROVED_BY,
  approvedDate: raw.APPROVED_DATE,
  rejectReason: raw.REJECT_REASON,
  rejectedBy: raw.REJECTED_BY,
  rejectedDate: raw.REJECTED_DATE,
  actualDurationMinutes: raw.ACTUAL_DURATION_MINUTES,
  actualDurationBy: raw.ACTUAL_DURATION_BY,
  actualDurationDate: raw.ACTUAL_DURATION_DATE,
});

export const normalizePermissionRequestList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizePermissionRequest);
};

// Helper to normalize an entire array
export const normalizeNotificationList = (notifications) => {
  if (!Array.isArray(notifications)) return [];
  return notifications.map(normalizeNotification);
};

export const normalizeTimelineList = (historyList) => {
  if (!Array.isArray(historyList)) return [];

  return historyList.map((item) => ({
    id: item.Id,
    ticketId: item.IssueId,
    eventType: item.EventType,
    entityType: item.EntityType,
    title: item.Summary || "No Action", // This will show as the main text
    actorName: item.ActorName || "System",
    createdAt: item.CreatedAt,
    oldValue: item.OldValue,
    newValue: item.NewValue,
    metaJson: item.MetaJson ? JSON.parse(item.MetaJson) : null,
  }));
};
