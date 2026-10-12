import { executeApi }        from "../../../core/api/executor"
import { queryKeys }         from "../../../core/query/queryKeys"
import { useApiQuery }       from "../../../core/query/useApiQuery"
import { buildSyncPayload }  from "../../../core/sync/buildSyncPayload"


export const useMeetingData = ({
  HostId,
  FromDate,
  ToDate,
} = {}) => {
  
  return useApiQuery({
  
    url: "/sync/v2",
    method: "POST",
    queryKey: queryKeys.MeetingData.list(HostId),
    payload: {
      ConfigKeys: ["MeetingData"],
      Params: {
        MeetingData: {
          EmployeeId: HostId,
          FromDate,
          ToDate,
        },
      },
    },
    source: "MeetingData",
    options: {
      staleTime: 10 * 60 * 1000,
      enabled: !!HostId,
    },
  });
};



// One definition (staff-only guard included) — see ./index
export { useUpcomingMeeting } from "./index";

