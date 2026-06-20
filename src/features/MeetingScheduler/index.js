import { ROUTE_ROLES } from "../../core/auth/permissions";
import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El           from "./elements";

export const MeetingsFeature = {
    name:   "meeting",
    basePath: "/meeting",
     routes: [
        // ── /projects ──────────────────────────────────────────────────────
        {
          path:    "",
          element: El.MeetingDashboard,
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
          element: El.MeetingDashboard,
          nav: {
            key: ROUTE_KEYS.MEETING_CREATE_WITH_TICKET,
            title: "Create Meeting",
            parent: ROUTE_KEYS.DASHBOARD,
          },
      
        },

    //    {
    //       path:    "/:meeting_id/edit",
    //       element: El.MeetingCreate,
    //       nav: {
    //         key:    ROUTE_KEYS.MEETING_EDIT,
    //         title:  "Edit Meeting",
    //         parent: ROUTE_KEYS.MEETING_LIST,
    //       },
    //     },
    ]
}  
