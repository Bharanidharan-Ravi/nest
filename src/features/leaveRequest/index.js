/**
 * src/features/leaveRequest/index.js
 */

import { Plane } from "lucide-react";
import { ROUTE_KEYS }  from "../../core/routing/paths";
import * as El          from "./elements";
import { ROUTE_ROLES }  from "../../core/auth/permissions";

export const LeaveRequestFeature = {
  name:     "leaveRequest",
  basePath: "/leave",

  routes: [
    // ── /leave ──────────────────────────────────────────────────────
    {
      path:    "",
      element: El.LeaveRequestPage,
      allowedRoles: ROUTE_ROLES.LEAVE_LIST,
      nav: {
        key:       ROUTE_KEYS.LEAVE_LIST,
        title:     "Leave Requests",
        parent:    ROUTE_KEYS.DASHBOARD,
        create:    ROUTE_KEYS.LEAVE_CREATE,
        inSidebar: true,
        icon:      Plane,
      },
    },

    // ── /leave/create ───────────────────────────────────────────────
    {
      path:    "/create",
      element: El.LeaveRequestFormPage,
      nav: {
        key:    ROUTE_KEYS.LEAVE_CREATE,
        title:  "Create Leave Request",
        parent: ROUTE_KEYS.LEAVE_LIST,
      },
    },

    // ── /leave/:leaveId/edit ───────────────────────────────────────
    {
      path:    "/:leaveId/edit",
      element: El.LeaveRequestFormPage,
      nav: {
        key:    ROUTE_KEYS.LEAVE_EDIT,
        title:  "Edit Leave Request",
        parent: ROUTE_KEYS.LEAVE_LIST,
      },
    },
  ],
};
