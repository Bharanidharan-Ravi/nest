import { lazy } from "react";
import { ROUTE_ROLES } from "../../core/auth/permissions";
import { ROUTE_KEYS } from "../../core/routing/paths";

const MeetingDashboard = lazy(() => import("./pages/MeetingDashboard"));
// const MeetingCreate = lazy(() => import("./pages/MeetingCreate"));

export const MeetingsFeature = {
    name:   "meeting",
    basePath: "/meeting",
     routes: [
        // ── /projects ──────────────────────────────────────────────────────
        {
          path:    "",
          element: MeetingDashboard,
          allowedRoles: ROUTE_ROLES.MEETING_LIST,
          nav: {
            key:       ROUTE_KEYS.MEETING_LIST,
            title:     "Meeting Scheduler",
            parent:    ROUTE_KEYS.DASHBOARD,
            create:    ROUTE_KEYS.MEETING_LIST,
            inSidebar: true,
          },
        },

        {
          path: "create/:ticketId",
          element: MeetingDashboard,
          nav: {
            key: ROUTE_KEYS.MEETING_CREATE_WITH_TICKET,
            title: "Create Meeting",
            parent: ROUTE_KEYS.DASHBOARD,
          },
      
        },

    //    {
    //       path:    "/:meeting_id/edit",
    //       element: MeetingCreate,
    //       nav: {
    //         key:    ROUTE_KEYS.MEETING_EDIT,
    //         title:  "Edit Meeting",
    //         parent: ROUTE_KEYS.MEETING_LIST,
    //       },
    //     },
    ]
}  
