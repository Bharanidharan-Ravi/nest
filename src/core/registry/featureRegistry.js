const featureMap = new Map()

export const registerFeature = (feature) => {
    console.log("Registering feature:", feature, featureMap);
    
  if (!feature?.name) {
    throw new Error("Feature must have a name")
  }

  if (featureMap.has(feature.name)) {
    throw new Error(`Feature ${feature.name} already registered`)
  }

  featureMap.set(feature.name, feature)
}

export const getAllFeatures = () => {
  return Array.from(featureMap.values())
}
