/**
 * src/features/leaveRequest/elements.js
 *
 * Lazy-loaded page components owned by the Leave Request feature.
 */
import { lazy } from "react";

export const LeaveRequestPage     = lazy(() => import("./pages/LeaveRequestPage"));
export const LeaveRequestFormPage = lazy(() => import("./pages/LeaveRequestFormPage"));
