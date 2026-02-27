import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";

export const useTicketMaster = (scope = {}, options = {}) => {
  const isScopeObject = scope && typeof scope === "object";

  const repoId = isScopeObject ? scope.repoId : scope;
  const projectId = isScopeObject ? scope.projectId ?? scope.projId : null;

  const hasRepoId = Boolean(repoId);
  const hasProjectId = Boolean(projectId);

  const payload = {
    ConfigKeys: ["TicketsList"],
    ...(hasRepoId || hasProjectId
      ? {
          Params: {
            TicketsList: {
              ...(hasRepoId ? { repoId } : {}),
              ...(hasProjectId ? { projectId } : {}),
            },
          },
        }
      : {}),
  };

  return useApiQuery({
    queryKey: queryKeys.ticket.list({
      repoId: hasRepoId ? repoId : "global",
      projectId: hasProjectId ? projectId : "all",
    }),

    url: "/sync/v2",
    method: "POST",
    payload,
    source: "TicketsList",
    options: {
      staleTime: 5 * 60 * 1000,
      // 2. Merge the passed options.
      // If 'enabled' is passed in options, use it; otherwise default to true.
      ...options,
      enabled: options.enabled !== undefined ? options.enabled : true,
    },
  });
};
