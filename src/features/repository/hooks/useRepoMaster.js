import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";

export const useRepoMaster = () => {
  return useApiQuery({
    queryKey: queryKeys.repo.list(),
    url: "/sync/v2",
    method: "POST",
    options: {
      staleTime: 10 * 60 * 1000,
    },
    source: "RepoList",
    payload: {
      ConfigKeys: ["RepoList"],
    },
  });
};
