/**
 * src/core/routing/RouteDataLoader.jsx
 *
 * Prefetches data for the current URL before the page renders.
 * No changes to how this reads features — it still uses getAllFeatures().
 * The only improvement: it now also handles deeply nested children routes properly.
 */

/**
 * src/core/routing/RouteDataLoader.jsx
 *
 * Prefetches data declared in route.prefetch before the page renders.
 *
 * Fix vs old version: flattenRoutes() now recurses into children,
 * so /repository/:repoId/t/:ticketId prefetch actually fires.
 * The old version only went one level deep and missed all nested routes.
 */

import { Outlet, useLocation, matchRoutes } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllFeatures } from "../registry/featureRegistry";

/**
 * Flatten nested route trees into a single list with absolute paths.
 * matchRoutes() needs flat absolute paths to work correctly.
 */
function flattenRoutes(routes, basePath = "") {
  const result = [];
  for (const route of routes) {
    const fullPath = route.path
      ? `${basePath}/${route.path}`.replace(/\/+/g, "/")
      : basePath || "/";

    result.push({ ...route, path: fullPath });

    if (Array.isArray(route.children)) {
      result.push(...flattenRoutes(route.children, fullPath));
    }
  }
  return result;
}

export default function RouteDataLoader() {
  const location    = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const features   = getAllFeatures();
    const flatRoutes = features.flatMap((feature) =>
      flattenRoutes(feature.routes, feature.basePath ?? "")
    );

    const matches = matchRoutes(flatRoutes, location.pathname);
    if (!matches) return;

    const runPrefetch = async () => {
      const calls = [];

      for (const { route, params } of matches) {
        if (!route.prefetch) continue;

        const tasks =
          typeof route.prefetch === "function"
            ? route.prefetch({ params })
            : route.prefetch ?? [];

        for (const task of tasks) {
          calls.push(
            queryClient.ensureQueryData({
              queryKey: task.queryKey,
              queryFn:  task.queryFn,
            })
          );
        }
      }

      if (calls.length > 0) {
        await Promise.all(calls).catch((err) => {
          // Prefetch errors are non-fatal — page handles its own loading state
          console.warn("[RouteDataLoader] Prefetch error:", err);
        });
      }
    };

    runPrefetch();
  }, [location.pathname, queryClient]);

  return <Outlet />;
}





// import { Outlet, useLocation, matchRoutes } from "react-router-dom";
// import { useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { getAllFeatures } from "../registry/featureRegistry";

// export default function RouteDataLoader() {
//   const location = useLocation();
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     const features = getAllFeatures();

//     // 1. FIX: Combine feature.basePath with the route.path
//     const routeConfigs = features.flatMap((feature) =>
//       feature.routes.map((route) => ({
//         ...route,
//         path: feature.basePath
//           ? `${feature.basePath}/${route.path}`.replace(/\/+/g, "/") // e.g., "/repository" + "/:repoId"
//           : route.path,
//       }))
//     );

//     // 2. Now matchRoutes has the full absolute path (e.g. "/repository/:repoId")
//     // and can correctly match against the URL
//     const matches = matchRoutes(routeConfigs, location.pathname);

//     const runPrefetch = async () => {
//       if (!matches) {
//         return;
//       }

//       const prefetchCalls = [];

//       for (const match of matches) {
//         const route = match.route;
//         const params = match.params;

//         // 3. Handle both Function and Array styles for prefetch
//         if (route.prefetch) {
//             // If it's a function (like in your RepositoryFeature), execute it with params
//           const tasks = typeof route.prefetch === "function" 
//             ? route.prefetch({ params }) 
//             : route.prefetch || [];

//           for (const task of tasks) {
//             prefetchCalls.push(
//               queryClient.ensureQueryData({
//                 queryKey: task.queryKey,
//                 queryFn: task.queryFn,
//               })
//             );
//           }
//         }
//       }

//       if (prefetchCalls.length > 0) {
//         await Promise.all(prefetchCalls);
//       }
//     };

//     runPrefetch();
//   }, [location.pathname, queryClient]);

//   return <Outlet />;
// }
