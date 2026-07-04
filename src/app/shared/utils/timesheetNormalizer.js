import { queryKeys } from "../../../core/query/queryKeys";
import { normalizeTicket } from "./ticketNormalizer";

// 🔥 Pass the queryClient into the factory function instead of the raw data
export const createTimesheetNormalizer = (Timedata) => {
  return {
    id: Timedata.ThreadId,
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
    ConsumeTime: Timedata.ConsumeTime ?? (Timedata.ThreadId===null ? 0.1:0),
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
    total: Timedata.total,
    label: Timedata.Labels_JSON ? JSON.parse(Timedata.Labels_JSON) : [],
    isDirectUpdate:Timedata.ThreadId===null,
    sourceType:Timedata.sourceType,
    CurrentStatusSummary:Timedata.CurrentStatusSummary,
    displayComment:Timedata.ConsumeTime
    ?Timedata.Comment
    :`Status ${Timedata.ThreadStatusName||'Changed'}`,
    IsPrivate:Timedata.IsPrivate,
  };
};