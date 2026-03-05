import { ROUTE_KEYS }    from "../../core/routing/paths";
import * as El           from "./elements";
import * as TicketEl     from "../tickets/elements";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const LabelFeature = {
  name:     "label",
  basePath: "/labels",

  routes: [
    // ── /labels ──────────────────────────────────────────────────────
    {
      path:    "",
      element: El.label,
      allowedRoles: ROUTE_ROLES.LABEL_LIST,
      nav: {
        key:       ROUTE_KEYS.LABEL_LIST,
        title:     "Labels",
        parent:    ROUTE_KEYS.DASHBOARD,
        create:    ROUTE_KEYS.LABEL_CREATE,
        inSidebar: true,
      },
    },

    // ── /labels/create ───────────────────────────────────────────────
    {
      path:    "/create",
      element: El.LabelCreate,
      nav: {
        key:    ROUTE_KEYS.LABEL_CREATE,
        title:  "Create Label",
        parent: ROUTE_KEYS.LABEL_LIST,
      },
    },
    // ── /labels/edit/:id ───────────────────────────────────────────────
    {
      path:    "/:labelId/edit",
      element: El.LabelCreate,
      nav: {
        key:    ROUTE_KEYS.LABEL_EDIT,
        title:  "Edit Label",
        parent: ROUTE_KEYS.LABEL_LIST,
      },
    },
  ],
};