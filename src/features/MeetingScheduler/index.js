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
          nav: {
            key:       ROUTE_KEYS.MEETING_LIST,
            title:     "MeetingScheduler",
            parent:    ROUTE_KEYS.DASHBOARD,
            create:    ROUTE_KEYS.MEETING_CREATE,
            inSidebar: true,
          },
        },

        {
          path:    "/create",
          element: El.MeetingCreate,
          nav: {
            key:    ROUTE_KEYS.MEETING_CREATE,
            title:  "Create Meeting",
            parent: ROUTE_KEYS.MEETING_LIST,
          },
        },

       {
          path:    "/:meeting_id/edit",
          element: El.MeetingCreate,
          nav: {
            key:    ROUTE_KEYS.MEETING_EDIT,
            title:  "Edit Meeting",
            parent: ROUTE_KEYS.MEETING_LIST,
          },
        },
    ]
}  


// MEETING_LIST:"/meeting",
// MEETING_CREATE:"/meeting/create",
// MEETING_EDIT:"/meeting/:meetingid/edit",