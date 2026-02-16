import TicketCreatePage from "../tickets/pages/TicketCreatePage";
import TicketDetailPage from "../tickets/pages/TicketDetailPage";
import TicketsPage from "../tickets/pages/TicketsPage";
import RepoOverview from "./pages/RepoOverview";
import RepositoryLayout from "./pages/RepositoryLayout";
import RepositoryPage from "./pages/RepositoryPage";

export const RepositoryFeature = {
  name: "repository",
  basePath: "/repository",

  routes: [
    // 🔥 Base /repository
    {
      path: "",
      element: RepositoryPage,
    },

    // 🔥 /repository/:repoId
    {
      path: "/:repoId",
      element: RepositoryLayout,
      children: [
        {
          path: "overview",
          element: RepoOverview,
        },
        {
          path: "t",
          element: TicketsPage,
        },
        {
          path: "t/create",
          element: TicketCreatePage,
        },
        {
          path: "t/:ticketId",
          element: TicketDetailPage,
        },
      ],
    },
  ],
  sidebar: [], // sidebar handled dynamically via repo master hook
};
