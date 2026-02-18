import ProjectCreate from "./pages/CreateProject";
import ProjectPage from "./pages/ProjectPage";

export const ProjectFeature = {
  name: "projects",
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
  ],
  // sidebar: [
  //   {
  //     label: "Projects",
  //   },
  // ],
};
