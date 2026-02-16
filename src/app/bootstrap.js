import { registerFeature } from "../core/registry/featureRegistry"

import { DashboardFeature } from "../features/dashboard"
// import { TicketsFeature } from "../features/tickets"

export const bootstrapApp = () => {
  registerFeature(DashboardFeature)
//   registerFeature(TicketsFeature)
}
