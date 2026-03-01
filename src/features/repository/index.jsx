/**
 * src/features/repository/index.jsx
 *
 * Imports:
 *  - elements.js              → this feature's own lazy pages
 *  - ../tickets/elements.js   → ticket lazy pages (components only, no routing logic)
 *  - ../project/elements.js   → project lazy pages (components only, no routing logic)
 *  - paths.js                 → all keys + path strings from central dictionary
 *
 * Zero hardcoded path strings in this file.
 * Zero cross-feature index imports (only elements — safe lazy wrappers).
 */

import { ROUTE_KEYS } from "../../core/routing/paths";
import * as RepoEl from "./elements";
import * as TicketEl from "../tickets/elements";
import * as ProjectEl from "../project/elements";

import { buildSyncPayload } from "../../core/sync/buildSyncPayload";
import { queryKeys } from "../../core/query/queryKeys";
import { executeApi } from "../../core/api/executor";
import { fetchProjectList } from "../project/hooks/useProjectData";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const RepositoryFeature = {
  name: "repository",
  basePath: "/repository",

  routes: [
    // ── /repository ────────────────────────────────────────────────────
    {
      path: "",
      element: RepoEl.RepositoryPage,
      allowedRoles: ROUTE_ROLES.REPO_LIST,
      nav: {
        key: ROUTE_KEYS.REPO_LIST,
        title: "Repositories",
        parent: ROUTE_KEYS.DASHBOARD,
        create: ROUTE_KEYS.REPO_CREATE,
        inSidebar: true,
      },
    },

    // ── /repository/create ─────────────────────────────────────────────
    {
      path: "/create",
      element: RepoEl.RepoCreate,
      allowedRoles: ROUTE_ROLES.REPO_CREATE,
      nav: {
        key: ROUTE_KEYS.REPO_CREATE,
        title: "Create Repository",
        parent: ROUTE_KEYS.REPO_LIST,
      },
    },

    // ── /repository/:repoId  (layout — renders <Outlet />) ─────────────
    {
      path: "/:repoId",
      element: RepoEl.RepositoryLayout,
      allowedRoles: ROUTE_ROLES.REPO_DETAIL,
      nav: {
        key: ROUTE_KEYS.REPO_DETAIL,
        title: "Repository",          // resolved dynamically in Breadcrumbs
        parent: ROUTE_KEYS.REPO_LIST,
      },
      children: [

        // ── /repository/:repoId/overview ───────────────────────────────
        {
          path: "overview",
          element: RepoEl.RepoOverview,
          allowedRoles: ROUTE_ROLES.REPO_OVERVIEW,
          nav: {
            key: ROUTE_KEYS.REPO_OVERVIEW,
            title: "Overview",
            parent: ROUTE_KEYS.REPO_DETAIL,
          },
        },

        // ── /repository/:repoId/t ──────────────────────────────────────
        {
          path: "t",
          element: TicketEl.TicketsPage,
          allowedRoles: ROUTE_ROLES.TICKET_LIST,
          nav: {
            key: ROUTE_KEYS.REPO_TICKET_LIST,
            title: "Tickets",
            parent: ROUTE_KEYS.REPO_DETAIL,
            create: ROUTE_KEYS.REPO_TICKET_CREATE,
          },
        },

        // ── /repository/:repoId/t/create ───────────────────────────────
        {
          path: "t/create",
          element: TicketEl.TicketCreatePage,
          allowedRoles: ROUTE_ROLES.TICKET_CREATE,
          nav: {
            key: ROUTE_KEYS.REPO_TICKET_CREATE,
            title: "Create Ticket",
            parent: ROUTE_KEYS.REPO_TICKET_LIST,
          },
        },

        // ── /repository/:repoId/t/:ticketId ───────────────────────────
        {
          path: "t/:ticketId",
          element: TicketEl.TicketDetailPage,
          allowedRoles: ROUTE_ROLES.TICKET_DETAIL,
          nav: {
            key: ROUTE_KEYS.TICKET_DETAIL,
            title: "Ticket",
            parent: ROUTE_KEYS.REPO_TICKET_LIST,
          },
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.ticket.detail(params.ticketId),
              queryFn: () => executeApi({
                url: "/sync/v2",
                method: "POST",
                payload: buildSyncPayload({
                  configKey: "TicketDetail",
                  repoId: params.repoId,
                  idKey: "ticketId",
                  idValue: params.ticketId,
                }),
              }),
            },
          ],
        },

        // ── /repository/:repoId/p ──────────────────────────────────────
        {
          path: "p",
          element: ProjectEl.ProjectPage,
          allowedRoles: ROUTE_ROLES.REPO_PROJ_LIST,
          nav: {
            key: ROUTE_KEYS.REPO_PROJ_LIST,
            title: "Projects",
            parent: ROUTE_KEYS.REPO_DETAIL,
            create: ROUTE_KEYS.REPO_PROJ_CREATE,
          },
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.project.list(params.repoId),
              queryFn: () => fetchProjectList(params.repoId),
            },
          ],
        },

        // ── /repository/:repoId/p/create ──────────────────────────────
        {
          path: "p/create",
          element: ProjectEl.ProjectCreate,
          allowedRoles: ROUTE_ROLES.REPO_PROJ_CREATE,
          nav: {
            key: ROUTE_KEYS.REPO_PROJ_CREATE,
            title: "Create Project",
            parent: ROUTE_KEYS.REPO_PROJ_LIST,
          },
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.project.list(params.repoId),
              queryFn: () => executeApi({
                url: "/sync/v2",
                method: "POST",
                payload: buildSyncPayload({
                  configKey: "ProjectList",
                  repoId: params.repoId,
                }),
              }),
            },
          ],
        },
        // ── /repository/:repoId/p/edit ──────────────────────────────
        {
          path: "p/:projId/edit",
          element: ProjectEl.ProjectCreate,
          allowedRoles: ROUTE_ROLES.REPO_PROJ_CREATE,
          nav: {
            key: ROUTE_KEYS.REPO_PROJ_EDIT,
            title: "Edit Project",
            parent: ROUTE_KEYS.REPO_PROJ_LIST,
          },
        },
      ],
    },
  ],
};






// // features/repository/index.jsx
// import RepositoryLayout from "./pages/RepositoryLayout"
// import RepoOverview from "./pages/RepoOverview"
// import TicketsPage from "../tickets/pages/TicketsPage"
// import TicketDetailPage from "../tickets/pages/TicketDetailPage"
// import TicketCreatePage from "../tickets/pages/TicketCreatePage"

// import { buildSyncPayload } from "../../core/sync/buildSyncPayload"
// import { queryKeys } from "../../core/query/queryKeys"
// import { executeApi } from "../../core/api/executor"
// import RepositoryPage from "./pages/RepositoryPage"
// import ProjectPage from "../project/pages/ProjectPage"
// import RepoCreate from "./pages/RepoCreate"
// import ProjectCreate from "../project/pages/CreateProject"
// import { fetchProjectList } from "../project/hooks/useProjectData"

// export const RepositoryFeature = {
//   name: "repository",
//   basePath: "/repository",

//   routes: [
//     {
//       path: "",
//       element: RepositoryPage
//     },
//      {
//       path: "/create",
//       element: RepoCreate
//     },
//     {
//       path: "/:repoId",
//       element: RepositoryLayout,
//       children: [
//         { path: "overview", element: RepoOverview },
//         {
//           path: "t",
//           element: TicketsPage,
//         },
//         {
//           path: "t/:ticketId",
//           element: TicketDetailPage,
//           prefetch: ({ params }) => [
//             {
//               queryKey: queryKeys.ticket.detail(params.ticketId),
//               queryFn: () =>
//                 executeApi({
//                   url: "/sync/v2",
//                   method: "POST",
//                   payload: buildSyncPayload({
//                     configKey: "TicketDetail",
//                     repoId: params.repoId,
//                     idKey: "ticketId",
//                     idValue: params.ticketId
//                   })
//                 })
//             }
//           ]
//         },
//         {
//           path: "p",
//           element: ProjectPage,
//           prefetch: ({ params }) => [
//             {
//               queryKey: queryKeys.project.list(params.repoId),
//               queryFn: () => fetchProjectList(params.repoId)
//             }
//           ]
//         },
//         {
//           path: "p/create",
//           element: ProjectCreate,
//           prefetch: ({ params }) => [
//             {
//               queryKey: queryKeys.project.list(params.repoId),
//               queryFn: () =>
//                 executeApi({
//                   url: "/sync/v2",
//                   method: "POST",
//                   payload: buildSyncPayload({
//                     configKey: "ProjectList",
//                     repoId: params.repoId,
//                   })
//                 })
//             }
//           ]
//         }
//       ]
//     }
//   ]
// }
