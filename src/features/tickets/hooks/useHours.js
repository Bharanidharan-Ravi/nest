import { useApiQuery } from "../../../core/query/useApiQuery";

export const useHours = (MyUserId = null, IssueId = null) => {
    return useApiQuery({
      queryKey: ["AllHour", "list", MyUserId ?? "none", IssueId ?? "none"],
      url: "/sync/v2",
      method: "POST",
      silent:true,
      payload: {
        ConfigKeys: ["AllHour"],
        Params: {
            AllHour: {
                MyUserId: MyUserId,
                IssueId: IssueId
          }
        }
      },
      source: "AllHour",
      options: {
        staleTime: 10 * 60 * 1000, // 10 minutes
       
      },
    });
  };
  