import { Route } from "react-router-dom"
import { getAllFeatures } from "../registry/featureRegistry"

const renderRoutes = (routes, basePath = "") => {
  return routes.map((route, index) => {
    const fullPath = basePath + route.path
    const Component = route.element

    if (route.children) {
      return (
        <Route key={index} path={fullPath} element={<Component />}>
          {renderRoutes(route.children)}
        </Route>
      )
    }

    return (
      <Route
        key={index}
        path={fullPath}
        element={<Component />}
      />
    )
  })
}

export const buildRoutes = () => {
  const features = getAllFeatures()

  return features.flatMap(feature =>
    renderRoutes(feature.routes, feature.basePath)
  )
}




// import { getAllFeatures } from "../registry/featureRegistry"

// export const buildRoutes = () => {
//   const features = getAllFeatures()

//   return features.flatMap(feature =>
//     feature.routes.map(route => ({
//       path: feature.basePath + route.path,
//       Component: route.element
//     }))
//   )
// }
