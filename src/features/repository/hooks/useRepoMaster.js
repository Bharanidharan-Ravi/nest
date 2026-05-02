import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { executeApi} from "../../../core/api/executor";
 import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
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


export const fetchclientData = (config = {}, UserId = null) => {
  const payload = buildSyncPayload({
    configKey: "ClientData",
    ...(UserId && { idKey: "Repo_Id", idValue: UserId }),
  });
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: payload,
    config,
  }).then((response) => {
    return response;
  }).catch((error) => {
    throw error; // Re-throw the error for further handling
  });
};

// Logging added to useClientData hook
export const useClientData = (UserId = null) => {

  const query = UserId
    ? queryKeys.client.list(UserId)
    : queryKeys.client.all;
  const defaultKeys = ["ClientData"];

  return useApiQuery({
    queryKey: query,
    queryFn: (config) => {
      return fetchclientData(config, UserId);
    },
    source: "ClientData",
    options: {
      staleTime: 0,
      enabled: true,
    },
  });
};

