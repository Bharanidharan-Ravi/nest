import { executeApi } from "../../../core/api/executor";
import { useApiQuery } from "../../../core/query/useApiQuery";

/**
 * Hook to fetch Dashboard Timesheet data
 */
export const useDashboardTimesheetData = (employeeId = null, fromdate = null, todate = null) => {
  return useApiQuery({
    queryKey: ["DashBoardTimesheetData", "list", employeeId ?? "none", fromdate ?? "none", todate ?? "none"],
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: ["TimeSheet"],
      Params: {
        TimeSheet: {
          EmployeeID: employeeId,
          FromDate: fromdate,
          ToDate: todate,
        }
      }
    },
    source: "TimeSheet",
    options: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!fromdate && !!todate,
    },
  });
};

/**
 * Hook to fetch Checked Tickets data
 */
export const useCheckedTicketsData = (employeeId = null, planDate = null) => {
  return useApiQuery({
    queryKey: ["CheckedTickets", "list", employeeId ?? "none", planDate ?? "none"],
    url: "/sync/v2",
    method: "POST",
    source: "CheckedTickets",
    payload: {
      ConfigKeys: ["CheckedTickets"],
      Params: {
        CheckedTickets: {
          userId: employeeId,
          planDate: planDate,
        }
      }
    },
    options: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!employeeId && !!planDate,
    },
  });
};

/**
 * Function to commit/save checked tickets
 */
export const commitCheckedTicket = (tickets) => {  
  return executeApi({
    url: "/dailyplan",
    method: "POST",
    payload: tickets,
  });
};

/**
 * Function to uncheck/revert a checked ticket
 */
export const uncheckcheckedtickets = (planId, body) => {
  return executeApi({
    url: `/dailyplan/${planId}/uncheck`,
    method: "PATCH",
    payload: body,
  });
};