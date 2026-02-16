import { Routes, Route } from "react-router-dom"
import { buildRoutes } from "./buildRoutes"
import MainLayout from "../../app/layout/MainLayout"

export default function RouteRenderer() {
  const routes = buildRoutes()
console.log("routes: ", routes);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {routes.map((route, index) => {
          const Component = route.Component
          return (
            <Route
              key={index}
              path={route.path}
              element={<Component />}
            />
          )
        })}
      </Route>
    </Routes>
  )
}
