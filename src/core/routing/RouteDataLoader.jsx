import { Outlet, useLocation, matchRoutes } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllFeatures } from "../registry/featureRegistry";

export default function RouteDataLoader() {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const features = getAllFeatures();

    // 1. FIX: Combine feature.basePath with the route.path
    const routeConfigs = features.flatMap((feature) =>
      feature.routes.map((route) => ({
        ...route,
        path: feature.basePath
          ? `${feature.basePath}/${route.path}`.replace(/\/+/g, "/") // e.g., "/repository" + "/:repoId"
          : route.path,
      }))
    );

    // 2. Now matchRoutes has the full absolute path (e.g. "/repository/:repoId")
    // and can correctly match against the URL
    const matches = matchRoutes(routeConfigs, location.pathname);

    const runPrefetch = async () => {
      if (!matches) {
        return;
      }

      const prefetchCalls = [];

      for (const match of matches) {
        const route = match.route;
        const params = match.params;

        // 3. Handle both Function and Array styles for prefetch
        if (route.prefetch) {
            // If it's a function (like in your RepositoryFeature), execute it with params
          const tasks = typeof route.prefetch === "function" 
            ? route.prefetch({ params }) 
            : route.prefetch || [];

          for (const task of tasks) {
            prefetchCalls.push(
              queryClient.ensureQueryData({
                queryKey: task.queryKey,
                queryFn: task.queryFn,
              })
            );
          }
        }
      }

      if (prefetchCalls.length > 0) {
        await Promise.all(prefetchCalls);
      }
    };

    runPrefetch();
  }, [location.pathname, queryClient]);

  return <Outlet />;
}
