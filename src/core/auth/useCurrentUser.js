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
import { decryptUserInfo } from "../../app/shared/decryption/Decryption";

// ─── Raw session reader (runs outside React — used by RoleGuard too) ──────────

export function readUserFromSession() {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;

    const parsed    = JSON.parse(raw);
    const decrypted = decryptUserInfo(parsed);

    // decryptUserInfo returns an array (confirmed by AuthGuard usage)
    const user = Array.isArray(decrypted) ? decrypted[0] : decrypted;

    if (!user) return null;

    // ── DEBUG: log the FULL user object so you can see every field name ──
    // Check the console after login and find your Role field name.
    // Common names: Role, RoleId, Role_Id, UserRole, role
    console.log("=== [useCurrentUser] Full decrypted user object ===", user);
    console.log("=== [useCurrentUser] All keys ===", Object.keys(user));

    // Try common role field names — whichever is non-null is yours
    const roleValue =
      user.Role      ??
      user.RoleId    ??
      user.Role_Id   ??
      user.UserRole  ??
      user.role      ??
      null;

    console.log("=== [useCurrentUser] Role value found ===", roleValue);

    return {
      raw:      user,
      role:     Number(roleValue),   // normalise to number
      token:    user.JwtToken,
      name:     user.UserName ?? user.Name ?? user.FullName ?? "",
      email:    user.Email ?? user.EmailId ?? "",
    };
  } catch (err) {
    console.error("[useCurrentUser] Failed to read session:", err);
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