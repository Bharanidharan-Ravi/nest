import { queryKeys } from "../../../core/query/queryKeys";

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
  // Safely parse JSON strings, fallback to empty arrays if null/invalid
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
  clientTime: ticket.Client,
  webTime: ticket.Web,
  technicalTime: ticket.Technical,
  functionalTime: ticket.Functional,
  commenttext: ticket.commenttext,
  threadCount: ticket.ThreadCount,
  ticketCreater: ticket.TicketCreater,
  createdBy: ticket.CreatedBy,
});

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

export const normalizeCheckedTickets = (item) => ({
  id: item.Id,
  ticketId: item.TicketId,
  ProjKey: item.ProjKey,
  RepoKey: item.RepoKey,
  Status: item.Status,
  navId: item.TicketId,
  UncheckComment: item.UncheckComment ?? "-",
  project: item.Project_ID,
  title: item.Title,
  label: item.Labels_JSON ? JSON.parse(item.Labels_JSON) : [],
  multiAssignees: item.All_Assignees ? JSON.parse(item.All_Assignees) : [],
  CompletionPct: item.CompletionPct,
  dueDate: item.Due_Date,
  createdAt: item.CreatedAt,
  ticketKey: item.Issue_Code,
  updatedBy: item.UpdatedBy,
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
    createdAt: Timedata.CreatedAt,
    updatedBy: Timedata.UpdatedBy,
    threadStatusName: Timedata.ThreadStatusName,
    threadStatusId: Timedata.ThreadStatusId,
    overallPercentage: Timedata.OverallPercentage,
    createdByName: Timedata.CreatedByName,
    total: Timedata.total,
    CurrentStatusSummary: Timedata.CurrentStatusSummary,
    label: Timedata.Labels_JSON ? JSON.parse(Timedata.Labels_JSON) : [],
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
    title: item.Summary || "No Action", // This will show as the main text
    actorName: item.ActorName || "System",
    createdAt: item.CreatedAt,
    oldValue: item.OldValue,
    newValue: item.NewValue,
    metaJson: item.MetaJson ? JSON.parse(item.MetaJson) : null,
  }));
};
