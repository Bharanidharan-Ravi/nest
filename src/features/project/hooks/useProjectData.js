// import { executeApi } from "../../../core/api/executor";
import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchProjectList = (repoId) => {
  console.log("🚀 API Call Triggered for Repo:", repoId);
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "ProjectList",
      repoId: repoId,
    }),
  });
};
export const useProjectData = (repoId = null) => {
  return useApiQuery({
    queryKey: queryKeys.project.list(repoId),
    // Pass the same query function used in prefetch
    queryFn: () => fetchProjectList(repoId),
    source: "ProjectList", // Extract the Data array automatically
    options: {
      staleTime: 10 * 60 * 1000,
    },
  });
};
