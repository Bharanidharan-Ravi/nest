/**
 * src/core/auth/RoleGuard.jsx
 *
 * Checks the user's role on EVERY render (= every page navigation).
 * buildRoutes.jsx wraps every single route element with this component,
 * so it re-evaluates automatically on every URL change.
 *
 * allowedRoles = []  → open to any authenticated user (no check)
 * role IN list       → render the page
 * role NOT IN list   → redirect to /login
 * no session         → redirect to /login
 */

import { Navigate } from "react-router-dom";
import { readUserFromSession } from "./useCurrentUser";

export default function RoleGuard({ allowedRoles = [], children }) {
  // No restriction declared — pass through
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Read fresh from sessionStorage on every render
  // (not a hook — plain function call so it runs synchronously on every render)
  const user = readUserFromSession();

  if (!user || isNaN(user.role)) {
    console.warn("[RoleGuard] No valid session — redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    console.warn(
      `[RoleGuard] Role ${user.role} not in [${allowedRoles.join(", ")}] — redirecting to /login`
    );
    return <Navigate to="/login" replace />;
  }

  return children;
}