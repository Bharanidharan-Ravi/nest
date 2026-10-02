import { queryKeys } from "../../../core/query/queryKeys";

export const MAIN_ASSIGNEE_TYPE = "Main Assignee";
// Old list SP: ISNULL(repo title, 'WorkGlow Solutions') for a handler with no
// repo; TicketListV2 sends that case as the empty guid.
const DEFAULT_HANDLER_NAME = "WorkGlow Solutions";

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
const formatMinutes = (minutes) =>
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

// TicketListV2 row → the same shape as normalizeTicket. The row carries ids
// only; names / colours come from the masters (lookup = useMasterLookup()).
export const normalizeTicketListRow = (row, lookup) => {
  const toAssignee = (id, type) => {
    const employee = lookup.get("employee", id);
    return {
      Assignee_Id: id,
      Assignee_Name: employee?.name ?? null,
      Assignee_Type: type,
      Assignee_TeamId: employee?.Team ?? null,
      Assignee_TeamName: lookup.get("team", employee?.Team)?.name ?? null,
    };
  };
  const owner = row.Assignee_Id
    ? toAssignee(row.Assignee_Id, MAIN_ASSIGNEE_TYPE)
    : null;

  return {
    ...normalizeTicket(row),
    status: lookup.get("status", row.StatusId)?.name,
    assginedName: owner?.Assignee_Name,
    teamId: owner?.Assignee_TeamId,
    teamName: owner?.Assignee_TeamName,
    ticketCreater: lookup.get("employee", row.CreatedBy)?.name,
    EntireWorkingTime: formatMinutes(row.TotalConsumeMinutes),
    // Staff-logged hours only (client hours excluded); null when nothing logged.
    // An API without TeamConsumeMinutes yet → fall back to all logged hours.
    teamWorkingTime: formatMinutes(
      (row.TeamConsumeMinutes === undefined ? row.TotalConsumeMinutes : row.TeamConsumeMinutes) || null,
    ),
    multiAssignees: [
      ...(owner ? [owner] : []),
      ...splitIds(row.Assignee_Ids).map((id) => toAssignee(id, "Assignee")),
    ],
    label: splitIds(row.Label_Ids).map((id) => {
      const label = lookup.get("label", id);
      return {
        LABEL_ID: Number(id),
        LABEL_TITLE: label?.name,
        LABEL_COLOR: label?.color,
      };
    }),
    handlers: splitIds(row.Handler_Ids).map((id) => ({
      id,
      name: lookup.get("repo", id)?.name ?? DEFAULT_HANDLER_NAME,
    })),
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
