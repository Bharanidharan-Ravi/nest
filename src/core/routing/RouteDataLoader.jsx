import { Outlet, useLocation, matchRoutes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllFeatures } from "../registry/featureRegistry";

export default function RouteDataLoader() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);

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
    const matches = matchRoutes(routeConfigs, location);

    const runPrefetch = async () => {
      if (!matches) {
        setLoading(false);
        return;
      }

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
            await queryClient.ensureQueryData({
              queryKey: task.queryKey,
              queryFn: task.queryFn,
            });
          }
        }
      }

      setLoading(false);
    };

    runPrefetch();
  }, [location.pathname]);

  // if (loading) return <div>Loading...</div>;

  return <Outlet />;
}

// import { useEffect } from "react";
// import { useLocation, useParams } from "react-router-dom";
// import { useQueryClient } from "@tanstack/react-query";

// export default function RouteDataLoader({ routeConfig, children }) {
//   const location = useLocation();
//   const params = useParams();
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     if (!routeConfig?.prefetch) return;

//     const tasks = routeConfig.prefetch({ params }) || [];
// console.log("RouteDataLoader:", routeConfig, params, tasks);

//        // Case 1: tasks is a function → execute directly
//     if (typeof tasks === "function") {
//       tasks();
//       return;
//     }

//     // Case 2: tasks is an array → run query prefetch
//     if (Array.isArray(tasks)) {
//       tasks.forEach((task) => {
//         queryClient.ensureQueryData({
//           queryKey: task.queryKey,
//           queryFn: task.queryFn,
//         });
//       });
//     }
//   }, [location.pathname]);

//   return children;
// }
