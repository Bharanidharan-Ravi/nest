import { executeApi } from "../../../core/api/executor";
import { useApiQuery } from "../../../core/query/useApiQuery";

export const fetchDashboardList = (fromDate, toDate) => {
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
  return useApiQuery({
    queryKey: ["dashboard", "list", fromDate ?? "none", toDate ?? "none"],
    queryFn: () => fetchDashboardList(fromDate, toDate),
    options: {
      staleTime: 10 * 60 * 1000,
      enabled: !!fromDate && !!toDate,
    },
  });
};
