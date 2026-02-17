import { useApiQuery } from "../../../core/query/useApiQuery"
import { queryKeys } from "../../../core/query/queryKeys"

export const useThreadMaster = (ticketId) => {

  // Build payload dynamically
  const payload = ticketId
    ? {
        ConfigKeys: ["ThreadList"],
        Params: {
          ThreadList: {
            ticketId: ticketId
          }
        }
      }
    : {
        ConfigKeys: ["ThreadList"]
      }

  return useApiQuery({
    queryKey: queryKeys.ticket.thread(ticketId),

    url: "/sync/v2",
    method: "POST",
    payload,
    source: "ThreadList",
    options: {
      staleTime: 5 * 60 * 1000,
      enabled: true
    }
  })
}
