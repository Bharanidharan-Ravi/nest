import { Route, Navigate } from "react-router-dom"
import { getAllFeatures } from "../registry/featureRegistry"

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

    // 📦 Route With Children
    if (route.children) {
      return (
        <Route
          key={index}
          path={fullPath}
          element={Component ? <Component /> : undefined}
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
          element={<Component />}
        />
      )
    }

    // ⚠️ If no element and no children, skip
    return null
  })
}

export const buildRoutes = () => {
  const features = getAllFeatures()

  return features.flatMap(feature =>
    renderRoutes(feature.routes, feature.basePath)
  )
}




// // import { getAllFeatures } from "../registry/featureRegistry"

// // export const buildRoutes = () => {
// //   const features = getAllFeatures()

// //   return features.flatMap(feature =>
// //     feature.routes.map(route => ({
// //       path: feature.basePath + route.path,
// //       Component: route.element
// //     }))
// //   )
// // }
