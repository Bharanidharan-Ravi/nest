import Dashboard from "./pages/Dashboard"

export const DashboardFeature = {
  name: "dashboard",
  basePath: "/dashboard",
  routes: [
    {
      path: "",
      element: Dashboard
    }
  ],
  sidebar: [
    {
      label: "Dashboard",
      path: "/dashboard"
    }
  ]
}
