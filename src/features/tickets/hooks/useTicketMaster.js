import { useApiQuery } from "../../../core/query/useApiQuery"
import { queryKeys } from "../../../core/query/queryKeys"

export const useTicketMaster = (repoId) => {

  // Build payload dynamically
  const payload = repoId
    ? {
        ConfigKeys: ["TicketsList"],
        Params: {
          TicketsList: {
            repoId: repoId
          }
        }
      }
    : {
        ConfigKeys: ["TicketsList"]
      }

  return useApiQuery({
    queryKey: repoId
      ? queryKeys.ticket.list(repoId)
      : queryKeys.ticket.list("global"),

    url: "/sync/v2",
    method: "POST",
    payload,
    source: "TicketsList",
    options: {
      staleTime: 5 * 60 * 1000,
      enabled: true
    }
  })
}
