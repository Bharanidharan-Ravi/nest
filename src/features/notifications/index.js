import { ROUTE_ROLES } from "../../core/auth/permissions";
import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El from "./elements";

export const NotificationsFeature = {
  name: "notifications",
  basePath: "/notifications",
  routes: [
    {
      path: "",
      element: El.NotificationsPage,
      allowedRoles: ROUTE_ROLES.NOTIFICATIONS,
      nav: {
        key: ROUTE_KEYS.NOTIFICATIONS, // Make sure to add this to your paths.js
        title: "Notifications",
        parent: ROUTE_KEYS.DASHBOARD,
        inSidebar: true, // Set to true if you want it on the left menu
      },
    },
  ],
};