/**
 * src/features/tickets/index.jsx
 *
 * TicketsFeature is registered in bootstrap so the feature system knows it exists.
 * The actual ticket ROUTES inside a repo are declared in RepositoryFeature (index.jsx)
 * because React Router requires them nested under RepositoryLayout's <Outlet />.
 *
 * If you ever add a standalone /tickets page (global view across all repos),
 * add it here. For now this is a valid registered feature with an empty route list.
 */

import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El           from "./elements";

export const TicketsFeature = {
  name:   "tickets",
  basePath: "/tickets",
   routes: [
      // ── /projects ──────────────────────────────────────────────────────
      {
        path:    "",
        element: El.TicketsPage,
        nav: {
          key:       ROUTE_KEYS.TICKET_LIST,
          title:     "Tickets",
          parent:    ROUTE_KEYS.DASHBOARD,
          create:    ROUTE_KEYS.TICKET_CREATE,
          inSidebar: true,
        },
      },
  
      // ── /projects/create ───────────────────────────────────────────────
      {
        path:    "/create",
        element: El.TicketCreatePage,
        nav: {
          key:    ROUTE_KEYS.TICKET_CREATE,
          title:  "Create Ticket",
          parent: ROUTE_KEYS.TICKET_LIST,
        },
      },
  
      // ── /projects/:projId  (layout) ────────────────────────────────────
      {
        path:    "/:ticketId",
        element: El.TicketDetailPage,
        nav: {
          key:    ROUTE_KEYS.TICKET_DETAIL,
          title:  "Ticket",
          parent: ROUTE_KEYS.TICKET_LIST,
        },
      },
    ],
  };














// import TicketsPage from "./pages/TicketsPage";
// import TicketDetailPage from "./pages/TicketDetailPage";
// import TicketCreatePage from "./pages/TicketCreatePage";

// export const TicketsFeature = {
//   name: "tickets",
//   basePath: "/tickets",

//   routes: [
//     {
//       path: "",
//       element: TicketsPage
//     },
//     {
//       path: "/create",
//       element: TicketCreatePage
//     },
//     {
//       path: "/:ticketId",
//       element: TicketDetailPage
//     }
//   ]
// }
