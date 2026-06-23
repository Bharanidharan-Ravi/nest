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




// export const useMeetingData = ({
//   employeeId,
//   FromDate,
//   ToDate,
//   configKey: configKeyProp,   // optional explicit override
// } = {}) => {
//   const isUserScoped = !!employeeId
//   // Explicit configKey wins; otherwise auto-derive from presence of HostId
//   const configKey = configKeyProp
//     ? configKeyProp
//     : isUserScoped
//     ? "MeetingData"
//     : "AllMeetingsData";
 
//   // User-scoped params include EmployeeId; org-wide omits it
//   const params = isUserScoped
//     ? { EmployeeId: employeeId, FromDate, ToDate }
//     : { FromDate, ToDate };
 
//   // User-scoped: block until we have a real user ID
//   // Org-wide:    block until we have a date range
//   const enabled = isUserScoped
//     ? !!employeeId
//     : !!(FromDate && ToDate);
 
//   return useApiQuery({
//     queryKey: [
//       "MeetingData",
//       "MeetingData",
//       employeeId ?? "all",
//       FromDate ?? "none",
//       ToDate ?? "none",
//     ],
//     url: "/sync/v2",
//     method: "POST",
//     payload: {
//       ConfigKeys: ["MeetingData"],
//       Params: {
//         ["MeetingData"]: params,
//       },
//     },
//     source: "MeetingData",
//     options: {
//       staleTime: 10 * 60 * 1000,
//       enabled,
//     },
//   });
// };
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

