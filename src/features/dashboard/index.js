import { executeApi } from "../../core/api/executor";
import { queryKeys } from "../../core/query/queryKeys";
import { buildSyncPayload } from "../../core/sync/buildSyncPayload";
import Dashboard from "./pages/Dashboard";

export const DashboardFeature = {
  name: "dashboard",
  basePath: "/dashboard",
  routes: [
    {
      path: "",
      element: Dashboard,
      // prefetch: () => [
      //   {
      //     queryKey: queryKeys.repo.list(),
      //     queryFn: () =>
      //       executeApi({
      //         url: "/sync/v2",
      //         method: "POST",
      //         payload: buildSyncPayload({
      //           configKey: "RepoList",
      //           // idKey: "repoId",
      //           // idValue: params.repoId
      //         }),
      //       }),
      //   },
      // ],
    },
  ],
  sidebar: [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
  ],
};
