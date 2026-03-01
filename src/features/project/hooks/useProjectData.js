// import { executeApi } from "../../../core/api/executor";
import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchProjectList = (repoId, config = {}, projId = null) => {
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "ProjectList",
      repoId: repoId,
      // Pass the ID field name your backend expects (e.g., "Id" or "ProjectId")
      idKey: projId ? "projId" : undefined, 
      idValue: projId
    }),
    config
  });
};

export const useProjectData = (repoId = null, projId = null) => {
  return useApiQuery({
    // Make sure the query key is unique when fetching a specific project
    queryKey: projId 
      ? [...queryKeys.project.list(repoId), "detail", projId] 
      : queryKeys.project.list(repoId),
    // Pass the projId to the fetch function
    queryFn: (config) => fetchProjectList(repoId, config, projId), 
    source: "ProjectList", 
    options: {
      staleTime: 0,
      // Only run the query if we have a repoId OR we are explicitly fetching a projId
      enabled: !!repoId || !!projId, 
    },
  });
};