/**
 * src/core/auth/useCurrentUser.js
 *
 * Single source of truth for the current user's session data.
 *
 * IMPORTANT — call this first, check the console log, then update
 * permissions.js ROLES to match the actual field name and value
 * your API returns for the role.
 */

import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";
// ─── Raw session reader (runs outside React — used by RoleGuard too) ──────────

// Decoded once per token: every ticket card and avatar calls useCurrentUser,
// so a list mount decoded the same JWT hundreds of times.
let cachedToken = null;
let cachedUser = null;

export function readUserFromSession() {
  const token = sessionStorage.getItem("user");
  if (!token) return null;
  if (token !== cachedToken) {
    cachedUser = decodeUser(token);
    cachedToken = cachedUser ? token : null;
  }
  return cachedUser;
}

function decodeUser(token) {
  try {
    const decoded = jwtDecode(token);
    const role =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    const name =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];
    const sessionId = decoded["SessionId"];
    const jwtId = decoded["JwtId"];
    const primaryRole = Number(role) || 0;
    // "Roles" = own role + ROLESMASTER parents, e.g. "2,4" for a Ticket Admin.
    // Older tokens without the claim fall back to the single role.
    const roles = String(decoded.Roles ?? "")
      .split(",")
      .map(Number)
      .filter((r) => r > 0);
    if (primaryRole && !roles.includes(primaryRole)) roles.push(primaryRole);
    return {
      token,
      role: primaryRole,
      roles,
      name: name || "",
      userId: userId || null,
      dbName: decoded.DbName || "",
      team: decoded.Team || "",
      exp: decoded.exp || null,
      PreviewUrl: decoded.PreviewUrl || null,
      sessionId,
      jwtId,
    };
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
}

/**
 * True when the user holds any of `allowedRoles`, directly or through a child
 * role (a Ticket Admin, role 4, also passes checks for its parent role 2).
 */
export function hasAnyRole(user, allowedRoles) {
  if (!user) return false;
  const roles = user.roles?.length ? user.roles : [user.role];
  return roles.some((r) => allowedRoles.includes(r));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns current user data. Re-reads sessionStorage on every component mount.
 *
 * Use this in any component that needs to know who is logged in.
 *
 * @returns {{ role: number, name: string, email: string, isAdmin: boolean,
 *             isManager: boolean, isViewer: boolean, can: (roles: number[]) => boolean }}
 */
export function useCurrentUser() {
  // useMemo with [] — runs once per component mount.
  // sessionStorage doesn't change during a session so this is correct.
  // On navigation React mounts a new component instance → fresh read.
  const user = useMemo(() => readUserFromSession(), []);
  const can = (allowedRoles) => {
    if (!allowedRoles?.length) return true; // no restriction = open
    if (!user || isNaN(user.role)) return false; // no session = no access
    return hasAnyRole(user, allowedRoles);
  };
  const hasRole = (r) => hasAnyRole(user, [r]);

  return {
    role: user?.role ?? null,
    roles: user?.roles ?? [],
    hasRole,
    isTicketAdmin: hasRole(4),
    name: user?.name ?? "",
    email: user?.email ?? "",
    can,
    isAdmin: user?.role === 1,
    isManager: user?.role === 2,
    isViewer: user?.role === 3,
  };
}
