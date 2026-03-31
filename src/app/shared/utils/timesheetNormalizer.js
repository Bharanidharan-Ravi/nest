import { queryKeys } from "../../../core/query/queryKeys";
import { normalizeTicket } from "./ticketNormalizer";

// 🔥 Pass the queryClient into the factory function instead of the raw data
export const createTimesheetNormalizer = (queryClient) => {
    
    return (Timedata) => {
        // 1. Read the current URL parameters
       const urlParams = new URLSearchParams(window.location.search);
        
        // 2. Get the full query string for the timesheets module
        // (Make sure "timesheets_q" matches whatever prefix your URL actually shows)
        const timesheetsQuery = urlParams.get("timesheets_q") || urlParams.get("tickets_q") || ""; 
        
        // 3. Extract the employeeId trapped inside the string
        // This looks for "assignedTo:VALUE" and grabs the VALUE part
        let employeeId = null;
        const match = timesheetsQuery.match(/assignedTo:([^\s]+)/);
        
        if (match) {
            // match[1] contains the ID. We also replace any accidental quotes
            employeeId = match[1].replace(/"/g, "");
        }

        // 3. Look inside React Query's global cache for that exact master data!
        const cacheKey = queryKeys.ticket.byEmployee(employeeId);
        
        const ticketMasterDataRaw = queryClient.getQueryData(cacheKey) || [];

         console.log("timesheetsQuery :", cacheKey,ticketMasterDataRaw);

        // 4. Find the matching ticket
        const matchedTicket = ticketMasterDataRaw.find(
            (ticket) => ticket.Issue_Id === Timedata.Issue_Id
        );

        return {
            id: Timedata.ThreadId,
            ticketId: Timedata.Issue_Id,
            issueId: Timedata.Issue_Id,
            ticketNo: Timedata.TicketNo,
            TicketName: Timedata.TicketName,
            StartTime: Timedata.StartTime,
            Comment: Timedata.Comment,
            EndTime: Timedata.EndTime,
            ConsumeTime: Timedata.ConsumeTime,
            total: Timedata.total,
        };
    };
};