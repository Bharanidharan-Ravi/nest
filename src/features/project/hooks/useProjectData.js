// import { executeApi } from "../../../core/api/executor";
import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchProjectList = (repoId, config = {}) => {
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "ProjectList",
      repoId: repoId,
    }),
    config
  });
};
export const useProjectData = (repoId = null) => {
  return useApiQuery({
    queryKey: queryKeys.project.list(repoId),
    // Pass the same query function used in prefetch
    queryFn: (config) => fetchProjectList(repoId, config),
    source: "ProjectList", // Extract the Data array automatically
    options: {
      staleTime: 0,
    },
  });
};

