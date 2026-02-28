/**
 * src/core/auth/usePermissions.js
 *
 * Thin wrapper around useCurrentUser for UI permission checks.
 * Use this in components to show/hide buttons and forms.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   {can(PERMISSIONS.LABEL_CREATE) && <button>+ Add Label</button>}
 */

import { useCurrentUser } from "./useCurrentUser";

export const usePermissions = () => useCurrentUser();