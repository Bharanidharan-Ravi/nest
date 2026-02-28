/**
 * src/features/tickets/elements.js
 *
 * Lazy-loaded page components owned by the Tickets feature.
 * Safe to import from RepositoryFeature index — just lazy wrappers, no routing logic.
 */
import { lazy } from "react";

export const TicketsPage      = lazy(() => import("./pages/TicketsPage"));
export const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
export const TicketCreatePage = lazy(() => import("./pages/TicketCreatePage"));