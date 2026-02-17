import ProjectPage from "./pages/ProjectPage";

export const ProjectFeature = {
  name: "projects",
  basePath: "/projects",
  routes: [
    {
      path: "",
      element: ProjectPage,
    },
  ],
  // sidebar: [
  //   {
  //     label: "Projects",
  //   },
  // ],
};
