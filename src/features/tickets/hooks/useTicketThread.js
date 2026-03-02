import { useApiQuery } from "../../../core/query/useApiQuery"
import { queryKeys } from "../../../core/query/queryKeys"
import { executeApi } from "../../../core/api/executor";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

// export const useThreadMaster = (ticketId) => {

//   // // Build payload dynamically
//   // const payload = ticketId
//   //   ? {
//   //       ConfigKeys: ["ThreadList"],
//   //       Params: {
//   //         ThreadList: {
//   //           ticketId: ticketId
//   //         }
//   //       }
//   //     }
//   //   : {
//   //       ConfigKeys: ["ThreadList"]
//   //     }

//   return useApiQuery({
//     queryKey: queryKeys.ticket.thread(ticketId),

//     url: "/sync/v2",
//     method: "POST",
//     payload,
//     source: "ThreadList",
//     options: {
//       staleTime: 5 * 60 * 1000,
//       enabled: true
//     }
//   })
// }

export const fetchThreadList = (issueId) => {
  console.log("issueId",issueId);
  
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "ThreadsList",
      idKey: "IssuesId",
      idValue:issueId
    }),
  });
};
export const useThreadMaster = (ticketId) => {
  return useApiQuery({
    queryKey: queryKeys.ticket.thread(ticketId),
    queryFn: () => fetchThreadList(ticketId),
    source: "ThreadList",
    options: {
      staleTime: 5 * 60 * 1000,
      enabled: true
    }
  })
}
