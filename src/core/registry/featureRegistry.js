const featureMap = new Map()

export const registerFeature = (feature) => {
  if (!feature?.name) {
    throw new Error("Feature must have a name")
  }

  // idempotent – safe for HMR
  if (!featureMap.has(feature.name)) {
    featureMap.set(feature.name, feature)
  }
}

export const getAllFeatures = () => {
  return Array.from(featureMap.values())
}