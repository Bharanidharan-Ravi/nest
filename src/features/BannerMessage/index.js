import { ROUTE_KEYS }    from "../../core/routing/paths";
import * as El           from "./elements";
import * as TicketEl     from "../tickets/elements";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const BannerFeature = {
  name:     "banner",
  basePath: "/banner",

  routes: [
    // ── /labels ──────────────────────────────────────────────────────
    {
      path:    "",
      element: El.banner,
      allowedRoles: ROUTE_ROLES.BANNER_LIST,
      nav: {
        key:       ROUTE_KEYS.BANNER_LIST,
        title:     "Banner",
        parent:    ROUTE_KEYS.DASHBOARD,
        create:    ROUTE_KEYS.BANNER_CREATE,
        inSidebar: true,
      },
    },

    // ── /labels/create ───────────────────────────────────────────────
    {
      path:    "/create",
      element: El.bannercreate,
      nav: {
        key:    ROUTE_KEYS.BANNER_CREATE,
        title:  "Create Banner",
        parent: ROUTE_KEYS.BANNER_LIST,
      },
    },
    // ── /labels/edit/:id ───────────────────────────────────────────────
    {
      path:    "/:BannerMessageId/edit",
      element: El.bannercreate,
      nav: {
        key:    ROUTE_KEYS.BANNER_EDIT,
        title:  "Edit Banner",
        parent: ROUTE_KEYS.BANNER_LIST,
      },
    },
  ],
};