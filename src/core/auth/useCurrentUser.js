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

export function readUserFromSession() {
  try {
    const token = sessionStorage.getItem("user");
    if (!token) return null;


    const decoded = jwtDecode(token);
      const role =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    const name =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

    const userId =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

    return {
      token,
      role: Number(role) || 0,
      name: name || "",
      userId: userId || null,
      dbName: decoded.DbName || "",
      team: decoded.Team || "",
      exp: decoded.exp || null,
      PreviewUrl:decoded.PreviewUrl || null
//anbu
    };
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
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
    if (!allowedRoles?.length) return true;           // no restriction = open
    if (!user || isNaN(user.role)) return false;      // no session = no access
    return allowedRoles.includes(user.role);
  };

  return {
    role:      user?.role ?? null,
    name:      user?.name ?? "",
    email:     user?.email ?? "",
    can,
    isAdmin:   user?.role === 1,
    isManager: user?.role === 2,
    isViewer:  user?.role === 3,
  };
}