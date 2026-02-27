// features/repository/index.jsx
import RepositoryLayout from "./pages/RepositoryLayout"
import RepoOverview from "./pages/RepoOverview"
import TicketsPage from "../tickets/pages/TicketsPage"
import TicketDetailPage from "../tickets/pages/TicketDetailPage"
import TicketCreatePage from "../tickets/pages/TicketCreatePage"

import { buildSyncPayload } from "../../core/sync/buildSyncPayload"
import { queryKeys } from "../../core/query/queryKeys"
import { executeApi } from "../../core/api/executor"
import RepositoryPage from "./pages/RepositoryPage"
import ProjectPage from "../project/pages/ProjectPage"
import RepoCreate from "./pages/RepoCreate"
import ProjectCreate from "../project/pages/CreateProject"
import { fetchProjectList } from "../project/hooks/useProjectData"

export const RepositoryFeature = {
  name: "repository",
  basePath: "/repository",

  routes: [
    {
      path: "",
      element: RepositoryPage
    },
     {
      path: "/create",
      element: RepoCreate
    },
    {
      path: "/:repoId",
      element: RepositoryLayout,
      // prefetch: () => [
      //   {
      //     queryKey: queryKeys.repo.list(),
      //     queryFn: () =>
      //       executeApi({
      //         url: "/sync/v2",
      //         method: "POST",
      //         payload: buildSyncPayload({
      //           configKey: "RepoList",
      //           // idKey: "repoId",
      //           // idValue: params.repoId
      //         })
      //       })
      //   }
      // ],
      children: [
        { path: "overview", element: RepoOverview },
        {
          path: "t",
          element: TicketsPage,
        },
        {
          path: "t/:ticketId",
          element: TicketDetailPage,
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.ticket.detail(params.ticketId),
              queryFn: () =>
                executeApi({
                  url: "/sync/v2",
                  method: "POST",
                  payload: buildSyncPayload({
                    configKey: "TicketDetail",
                    repoId: params.repoId,
                    idKey: "ticketId",
                    idValue: params.ticketId
                  })
                })
            }
          ]
        },
        {
          path: "p",
          element: ProjectPage,
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.project.list(params.repoId),
              queryFn: () => fetchProjectList(params.repoId)
            }
          ]
        },
        {
          path: "p/create",
          element: ProjectCreate,
          prefetch: ({ params }) => [
            {
              queryKey: queryKeys.project.list(params.repoId),
              queryFn: () =>
                executeApi({
                  url: "/sync/v2",
                  method: "POST",
                  payload: buildSyncPayload({
                    configKey: "ProjectList",
                    repoId: params.repoId,
                  })
                })
            }
          ]
        }
      ]
    }
  ]
}



// import TicketCreatePage from "../tickets/pages/TicketCreatePage";
// import TicketDetailPage from "../tickets/pages/TicketDetailPage";
// import TicketsPage from "../tickets/pages/TicketsPage";
// import RepoOverview from "./pages/RepoOverview";
// import RepositoryLayout from "./pages/RepositoryLayout";
// import RepositoryPage from "./pages/RepositoryPage";

// export const RepositoryFeature = {
//   name: "repository",
//   basePath: "/repository",

//   routes: [
//     // 🔥 Base /repository
//     {
//       path: "",
//       element: RepositoryPage,
//     },

//     // 🔥 /repository/:repoId
//     {
//       path: "/:repoId",
//       element: RepositoryLayout,
//       children: [
//         {
//           path: "overview",
//           element: RepoOverview,
//         },
//         {
//           path: "t",
//           element: TicketsPage,
//         },
//         {
//           path: "t/create",
//           element: TicketCreatePage,
//         },
//         {
//           path: "t/:ticketId",
//           element: TicketDetailPage,
//         },
//       ],
//     },
//   ],
//   sidebar: [], // sidebar handled dynamically via repo master hook
// };
