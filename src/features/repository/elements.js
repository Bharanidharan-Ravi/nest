/**
 * src/features/repository/elements.js
 *
 * Lazy-loaded page components owned by the Repository feature.
 * Only this feature's own pages — no cross-feature imports here.
 */
import { lazy } from "react";

export const RepositoryPage   = lazy(() => import("./pages/RepositoryPage"));
export const RepoCreate       = lazy(() => import("./pages/RepoCreate"));
export const RepositoryLayout = lazy(() => import("./pages/RepositoryLayout"));
export const RepoOverview     = lazy(() => import("./pages/RepoOverview"));