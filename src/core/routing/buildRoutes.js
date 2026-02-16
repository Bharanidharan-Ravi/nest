import { getAllFeatures } from "../registry/featureRegistry"

export const buildRoutes = () => {
  const features = getAllFeatures()
console.log(" features: ", features);

  return features.flatMap(feature =>
    feature.routes.map(route => ({
      path: feature.basePath + route.path,
      Component: route.element
    }))
  )
}
