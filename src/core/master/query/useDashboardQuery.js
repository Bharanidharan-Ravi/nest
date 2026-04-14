// src/core/master/query/useDashboardQuery.js
//
// ⚠️  DEPRECATED — kept only for backwards compatibility during migration.
//     Use dashboardSelectors.js in all new components.
//
// This was replaced by useRegistryQuery, which handles both master and
// dashboard registries through a single unified pipeline.

export { useRegistryQuery as useDashboardQuery } from "./useRegistryQuery";