import { getAllFeatures, registerFeature } from "../core/registry/featureRegistry"
import { buildRouteRegistry } from "../core/routing/routeRegistry"

import { DashboardFeature } from "../features/dashboard"
import { LabelFeature } from "../features/label"
import { ProjectFeature } from "../features/project/Index"
import { RepositoryFeature } from "../features/repository"
import { TicketsFeature } from "../features/tickets"
import { EmployeeFeature } from "../features/employee"
import { BannerFeature } from "../features/BannerMessage"
import { NotificationsFeature } from "../features/notifications"
import { MeetingsFeature } from "../features/MeetingScheduler"

export const bootstrapApp = () => {
  registerFeature(DashboardFeature)
  registerFeature(RepositoryFeature)
  registerFeature(TicketsFeature)
  registerFeature(ProjectFeature)
  registerFeature(LabelFeature)
  registerFeature(EmployeeFeature)
  registerFeature(BannerFeature)
  registerFeature(NotificationsFeature)
  registerFeature(MeetingsFeature)
    // 2. Build the nav registry from everything registered above
  //    Pass getAllFeatures() directly — avoids circular import inside routeRegistry
  buildRouteRegistry(getAllFeatures());
}
