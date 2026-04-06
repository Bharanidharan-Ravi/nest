import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
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

export const fetchThreadList = (issueId, config) => {
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: config,
      idKey: "IssuesId",
      idValue: issueId,
    }),
  });
};
export const useThreadMaster = (ticketId) => {
  const config = ["ThreadsList", "TicketHistory"];
  return useApiQuery({
    queryKey: queryKeys.ticket.thread(ticketId),
    queryFn: () => fetchThreadList(ticketId,config),
    source: ["ThreadsList", "TicketHistory"],
    options: {
      staleTime: 5 * 60 * 1000,
      enabled: true,
    },
  });
};

export const useTicketHistory = (ticketId) => {
  const config = "TicketHistory";
  return useApiQuery({
    queryKey: queryKeys.ticket.history(ticketId),
    queryFn: () => fetchThreadList(ticketId, config),
    source: "TicketHistory",
    options: {
      staleTime: 5 * 60 * 1000,
      enabled: true,
    },
  });
};
