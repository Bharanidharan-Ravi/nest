import { ROUTE_ROLES } from "../../core/auth/permissions";
import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El from "./elements";

export const MessengerFeature = {
  name: "messenger",
  basePath: "/messages",
  routes: [
    {
      path: "",
      element: El.MessengerPage,
      allowedRoles: ROUTE_ROLES.MESSENGER,
      nav: {
        key: ROUTE_KEYS.MESSENGER,
        title: "Messages",
        parent: ROUTE_KEYS.DASHBOARD,
        inSidebar: true,
      },
    },
  ],
};
