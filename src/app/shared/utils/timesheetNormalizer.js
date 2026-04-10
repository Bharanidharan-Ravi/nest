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
    Comment: Timedata.Comment,
    EndTime: Timedata.EndTime,
    ConsumeTime: Timedata.ConsumeTime,
    dueDate: Timedata.Due_Date,
    ticketKey: Timedata.TicketNo,
    project: Timedata.Project_Id,
    updatedAt: Timedata.UpdatedAt,
    createdAt: Timedata.CreatedAt,
    updatedBy: Timedata.UpdatedBy,
    total: Timedata.total,
    label: Timedata.Labels_JSON ? JSON.parse(Timedata.Labels_JSON) : [],
  };
};