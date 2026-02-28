/**
 * src/features/dashboard/index.jsx
 *
 * Add nav: metadata to your existing DashboardFeature.
 * Keep all your existing page imports and logic — only add the nav objects.
 */
import { lazy } from "react";
import { ROUTE_KEYS } from "../../core/routing/paths";

const DashboardPage = lazy(() => import("./pages/Dashboard")); // your existing page

export const DashboardFeature = {
  name:     "dashboard",
  basePath: "/dashboard",

  routes: [
    {
      path:    "",
      element: DashboardPage,
      nav: {
        key:       ROUTE_KEYS.DASHBOARD,
        title:     "Dashboard",
        parent:    null,          // root — no parent
        inSidebar: true,
      },
    },
  ],
};





// import Dashboard from "./pages/Dashboard";

// export const DashboardFeature = {
//   name: "dashboard",
//   basePath: "/dashboard",
//   routes: [
//     {
//       path: "",
//       element: Dashboard,
//       allowedRoles: [1,2,3],
//       // prefetch: () => [
//       //   {
//       //     queryKey: queryKeys.repo.list(),
//       //     queryFn: () =>
//       //       executeApi({
//       //         url: "/sync/v",
//       //         method: "POST",
              
//       //       }),
//       //   },
//       // ],
//     },
//   ],
//   sidebar: [
//     {
//       label: "Dashboard",
//       path: "/dashboard",
//     },
//   ],
// };
