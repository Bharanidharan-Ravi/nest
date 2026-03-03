import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchDashboard = (fromdate, todate) => {
  return executeApi({
    url: "/DashBoardData/GetDashBoardData",
    method: "POST",


    payload: {
      FromDate: fromdate,
      Todate: todate,
      //   fromDate : fromDate,
      //   toDate: toDate,
    },
  });
};




export const useDashboardData = (employeeId = null) => {
  return useApiQuery({
    queryKey: ["dashboard", "list", employeeId ?? "none"],
    // Pass the same query function used in prefetch
    url: "/DashBoardData/GetDashBoardData",
    method: "POST",
    payload: {
      employeeId: employeeId,

    },
    options: {
      staleTime: 10 * 60 * 1000,
      // enabled: !!employeeId
    },
  });
};

export const useDashboardTimesheetData = (employeeId = null, fromdate = null, todate = null) => {
  return useApiQuery({
    queryKey: ["DashBoardTimeSheetData", "list", employeeId ?? "none", fromdate ?? "none", todate ?? "none"],
    // Pass the same query function used in prefetch
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: ["TimeSheet"],
      "Params": {
        "TimeSheet": {
          EmployeeID: employeeId,
          FromDate: fromdate,
          Todate: todate,
        }
      }
    },
    source: "TimeSheet",
    options: {
      staleTime: 10 * 60 * 1000,
      enabled: !!fromdate && !!todate
    },
  });
};
