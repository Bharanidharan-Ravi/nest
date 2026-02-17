import { registerFeature } from "../core/registry/featureRegistry"

import { DashboardFeature } from "../features/dashboard"
import { ProjectFeature } from "../features/project/Index"
import { RepositoryFeature } from "../features/repository"
import { TicketsFeature } from "../features/tickets"

export const bootstrapApp = () => {
  registerFeature(DashboardFeature)
  registerFeature(RepositoryFeature)
  registerFeature(TicketsFeature)
  registerFeature(ProjectFeature)
}
