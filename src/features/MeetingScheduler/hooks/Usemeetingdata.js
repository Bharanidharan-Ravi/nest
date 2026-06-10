import { executeApi }        from "../../../core/api/executor"
import { queryKeys }         from "../../../core/query/queryKeys"
import { useApiQuery }       from "../../../core/query/useApiQuery"
import { buildSyncPayload }  from "../../../core/sync/buildSyncPayload"

// export const useMeetingData = (HostId={},FromDate={},ToDate={}) => {
//     return useApiQuery({
//         queryKey: ["MeetingSchedulingData", "list", HostId ?? "none", FromDate ?? "none", ToDate ?? "none"],
//         url: "/sync/v2",
//         method: "POST",
//         payload: {
//           ConfigKeys: ["MeetingData"],
//           Params: {
//             MeetingData: {
//               EmployeeId: HostId,
//               FromDate: FromDate,
//               ToDate: ToDate,
//             }
//           }
//         },
//         source: "MeetingData",
//         options: {
//           staleTime: 10 * 60 * 1000, // 10 minutes
//           enabled:true,
//         },
//       });
//     };

export const useMeetingData = ({
  HostId,
  FromDate,
  ToDate,
} = {}) => {
  
  return useApiQuery({
    // queryKey: [
    //   "MeetingSchedulingData",
    //   "list",
    //   HostId ?? "none",
    //   FromDate ?? "none",
    //   ToDate ?? "none",
    // ],
    url: "/sync/v2",
    method: "POST",
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




export const useUpcomingMeeting = () => {
  return useApiQuery({
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: ["UpcomingMeeting"],
    },
    source: "UpcomingMeeting",
    options: {
      staleTime: 10 * 60 * 1000,
    },
  });
};