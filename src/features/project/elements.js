/**
 * src/features/project/elements.js
 *
 * Lazy-loaded page components owned by the Project feature.
 * Safe to import from RepositoryFeature index — just lazy wrappers, no routing logic.
 */
import { lazy } from "react";

export const ProjectPage     = lazy(() => import("./pages/ProjectPage"));
export const ProjectCreate   = lazy(() => import("./pages/CreateProject"));
export const ProjectLayout   = lazy(() => import("./components/ProjectLayout"));
export const ProjectOverview = lazy(() => import("./pages/ProjectOverview"));