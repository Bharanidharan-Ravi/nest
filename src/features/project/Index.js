import TicketsPage from "../tickets/pages/TicketsPage";
import ProjectLayout from "./components/ProjectLayout";
import ProjectCreate from "./pages/CreateProject";
import ProjectOverview from "./pages/ProjectOverview";
import ProjectPage from "./pages/ProjectPage";

export const ProjectFeature = {
  name: "projec",
  basePath: "/projects",
  routes: [
    {
      path: "",
      element: ProjectPage,
    },
    {
      path: "/create",
      element: ProjectCreate,
    },
    {
      path: "/:projId",
      element: ProjectLayout,

      children: [
        { path: "overview", element: ProjectOverview },
        {
          path: "t",
          element: TicketsPage,
        },
      ],
    },
  ],
  // sidebar: [
  //   {
  //     label: "Projects",
  //   },
  // ],
};
