/**
 * src/features/dashboard/index.jsx
 *
 * Add nav: metadata to your existing DashboardFeature.
 * Keep all your existing page imports and logic — only add the nav objects.
 */
import { lazy } from "react";
import { ROUTE_KEYS } from "../../core/routing/paths";
import { ROUTE_ROLES } from "../../core/auth/permissions";

const NotificationsPage = lazy(() => import("./pages/MainPage")); // your existing page

export const NotificationsFeature = {
  name:     "notifications",
  basePath: "/notifications",

  routes: [
    {
      path:    "",
      element: NotificationsPage,
      allowedRoles: ROUTE_ROLES.NOTIFICATIONS,
      nav: {
        key:       ROUTE_KEYS.NOTIFICATIONS,
        title:     "Notifications",
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
