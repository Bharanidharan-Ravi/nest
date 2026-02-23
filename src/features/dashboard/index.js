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
      prefetch: () => [
        {
          queryKey: queryKeys.repo.list(),
          queryFn: () =>
            executeApi({
              url: "/sync/v",
              method: "POST",
              
            }),
        },
      ],
    },
  ],
  sidebar: [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
  ],
};
