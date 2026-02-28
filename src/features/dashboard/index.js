import Dashboard from "./pages/Dashboard";

export const DashboardFeature = {
  name: "dashboard",
  basePath: "/dashboard",
  routes: [
    {
      path: "",
      element: Dashboard,
      allowedRoles: [1,2,3],
      // prefetch: () => [
      //   {
      //     queryKey: queryKeys.repo.list(),
      //     queryFn: () =>
      //       executeApi({
      //         url: "/sync/v",
      //         method: "POST",
              
      //       }),
      //   },
      // ],
    },
  ],
  sidebar: [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
  ],
};
