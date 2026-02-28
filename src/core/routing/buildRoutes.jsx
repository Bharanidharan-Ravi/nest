import { Route, Navigate } from "react-router-dom"
import { getAllFeatures } from "../registry/featureRegistry"
import RoleGuard from "../auth/RoleGuard";

const renderRoutes = (routes, basePath = "") => {
  return routes.map((route, index) => {
    const fullPath = basePath 
      ? `${basePath}/${route.path}`.replace(/\/+/g, "/") 
      : route.path

    const Component = route.element

    // 🔁 Redirect Route
    if (route.redirectTo) {
      return (
        <Route
          key={index}
          index
          element={<Navigate to={route.redirectTo} replace />}
        />
      )
    }

    // Wrap the component in the RoleGuard
    const ProtectedComponent = Component ? (
      <RoleGuard allowedRoles={route.allowedRoles}>
        <Component />
      </RoleGuard>
    ) : undefined;

    // 📦 Route With Children
    if (route.children) {
      return (
        <Route
          key={index}
          path={fullPath}
          element={ProtectedComponent}
        >
          {renderRoutes(route.children)}
        </Route>
      )
    }

    // 🧱 Normal Route
    if (Component) {
      return (
        <Route
          key={index}
          path={fullPath}
          element={ProtectedComponent}
        />
      )
    }

    return null
  })
}

export const buildRoutes = () => {
  const features = getAllFeatures()

  return features.flatMap(feature =>
    renderRoutes(feature.routes, feature.basePath)
  )
}