import { useApiQuery } from "../../../../core/query/useApiQuery";

export const useGetStaleTicketData = (Assignee_Id = null) => {
  return useApiQuery({
    queryKey: ["GetStaleTicketsForAssignee", "list", Assignee_Id ?? "none"],
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: ["GetStaleTicketsForAssignee"],
      Params: {
        GetStaleTicketsForAssignee: {
            Assignee_Id:Assignee_Id
        }
      }
    },
    source: "GetStaleTicketsForAssignee",
    options: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled:!!Assignee_Id ,
    },
  });
};