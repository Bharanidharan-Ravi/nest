/**
 * src/features/project/Index.js
 */

import { ROUTE_KEYS }    from "../../core/routing/paths";
import * as El           from "./elements";
import * as TicketEl     from "../tickets/elements";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const ProjectFeature = {
  name:     "project",
  basePath: "/projects",

  routes: [
    // ── /projects ──────────────────────────────────────────────────────
    {
      path:    "",
      element: El.ProjectPage,
      allowedRoles: ROUTE_ROLES.PROJ_LIST,
      nav: {
        key:       ROUTE_KEYS.PROJ_LIST,
        title:     "Projects",
        parent:    ROUTE_KEYS.DASHBOARD,
        create:    ROUTE_KEYS.PROJ_CREATE,
        inSidebar: true,
      },
    },

    // ── /projects/create ───────────────────────────────────────────────
    {
      path:    "/create",
      element: El.ProjectCreate,
      nav: {
        key:    ROUTE_KEYS.PROJ_CREATE,
        title:  "Create Project",
        parent: ROUTE_KEYS.PROJ_LIST,
      },
    },

    // ── /projects/edit ───────────────────────────────────────────────
    {
      path:    "/:projId/edit",
      element: El.ProjectCreate,
      nav: {
        key:    ROUTE_KEYS.PROJ_EDIT,
        title:  "Edit Project",
        parent: ROUTE_KEYS.PROJ_LIST,
      },
    },

    // ── /projects/:projId  (layout) ────────────────────────────────────
    {
      path:    "/:projId",
      element: El.ProjectLayout,
      nav: {
        key:    ROUTE_KEYS.PROJ_DETAIL,
        title:  "Project",
        parent: ROUTE_KEYS.PROJ_LIST,
      },
      children: [
        {
          path:    "overview",
          element: El.ProjectOverview,
          nav: {
            key:    ROUTE_KEYS.PROJ_OVERVIEW,
            title:  "Overview",
            parent: ROUTE_KEYS.PROJ_DETAIL,
          },
        },
        {
          path:    "t",
          element: TicketEl.TicketsPage,
          nav: {
            key:    ROUTE_KEYS.PROJ_TICKET_LIST,
            title:  "Tickets",
            parent: ROUTE_KEYS.PROJ_DETAIL,
          },
        },
        {
          path:    "t/create",
          element: TicketEl.TicketCreatePage,
          nav: {
            key:    ROUTE_KEYS.PROJ_TICKET_CREATE,
            title:  "Create Ticket",
            parent: ROUTE_KEYS.PROJ_DETAIL,
          },
        },{
          path:    "t/:ticketId/edit",
          element: TicketEl.TicketCreatePage,
          nav: {
            key:    ROUTE_KEYS.PROJ_TICKET_EDIT,
            title:  "Edit Ticket",
            parent: ROUTE_KEYS.PROJ_DETAIL,
          },
        },
      ],
    },
  ],
};



// import TicketsPage from "../tickets/pages/TicketsPage";
// import ProjectLayout from "./components/ProjectLayout";
// import ProjectCreate from "./pages/CreateProject";
// import ProjectOverview from "./pages/ProjectOverview";
// import ProjectPage from "./pages/ProjectPage";

// export const ProjectFeature = {
//   name: "project",
//   basePath: "/projects",
//   routes: [
//     {
//       path: "",
//       element: ProjectPage,
//     },
//     {
//       path: "/create",
//       element: ProjectCreate,
//     },
//     {
//       path: "/:projId",
//       element: ProjectLayout,

//       children: [
//         { path: "overview", element: ProjectOverview },
//         {
//           path: "t",
//           element: TicketsPage,
//         },
//       ],
//     },
//   ],
//   // sidebar: [
//   //   {
//   //     label: "Projects",
//   //   },
//   // ],
// };
