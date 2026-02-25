import apiClient from "../../../core/api/apiClient"
import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchDashboardList = (fromDate, toDate) => {
  console.log("🚀 API Call Triggered for:", { fromDate, toDate });
  return executeApi({
    url: "/DashBoardData/GetDashBoardData",
    method: "POST",
    payload: {
        FromDate: fromDate,
        ToDate: toDate
      }
  });
};

export const useDashboardData = (fromDate = null, toDate = null) => {
  console.log("api tigger success");
  
  return useApiQuery({
    // IMPORTANT: Ensure your queryKey includes both params
    queryKey: ["dashboard:new"], 
    
    // Pass both params into the fetcher
    queryFn: fetchDashboardList( fromDate, toDate),
    
    source: "DaShboard",
    options: {
      staleTime: 10 * 60 * 1000,
      enabled: !!fromDate && !!toDate,
    },
  });
};