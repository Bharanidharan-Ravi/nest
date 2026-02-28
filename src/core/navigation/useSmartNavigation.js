/**
 * src/core/routing/useSmartNavigation.js
 *
 * Key change: getSidebarRoutes() now filters by the current user's role.
 * Role 3 will only see sidebar items whose allowedRoles includes 3.
 */

import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  matchNavRoute,
  getNavRoute,
  buildPath,
  tryBuildPath,
  getAllNavRoutes,
} from "../routing/routeRegistry";
import { readUserFromSession } from "../auth/useCurrentUser";

export const useSmartNavigation = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const routeParams = useParams();

  // ─── Current route ────────────────────────────────────────────────────

  const getCurrentRoute = () => matchNavRoute(location.pathname);

  // ─── Path building ────────────────────────────────────────────────────

  const getPath = (key, extraParams = {}) =>
    buildPath(key, { ...routeParams, ...extraParams });

  // ─── Navigation ───────────────────────────────────────────────────────

  const goTo = (key, extraParams = {}, options = {}) => {
    navigate(getPath(key, extraParams), options);
  };

  const goBack = () => {
    const current = getCurrentRoute();
    if (current?.parent) goTo(current.parent);
  };

  const goForward = (childKey) => {
    const current = getCurrentRoute();
    if (!current?.children?.length) return;
    goTo(childKey ?? current.children[0]);
  };

  const goToCreate = () => {
    const current = getCurrentRoute();
    if (current?.create) goTo(current.create);
  };

  // ─── Availability checks ──────────────────────────────────────────────

  const canGoBack    = () => !!getCurrentRoute()?.parent;
  const canGoForward = () => (getCurrentRoute()?.children?.length ?? 0) > 0;
  const canCreate    = () => !!getCurrentRoute()?.create;

  // ─── Breadcrumbs ──────────────────────────────────────────────────────

  const getBreadcrumbs = (titleResolver) => {
    const crumbs = [];
    let current  = getCurrentRoute();

    while (current) {
      const resolvedTitle = titleResolver?.(current.key) ?? current.title;
      const path = tryBuildPath(current.key, routeParams) ?? current.fullPath;
      crumbs.unshift({ key: current.key, title: resolvedTitle, path });
      current = current.parent ? getNavRoute(current.parent) : null;
    }

    return crumbs;
  };

  // ─── Sidebar — filtered by current user's role ────────────────────────

  /**
   * Returns only the sidebar routes the current user is allowed to see.
   *
   * How it works on every render / navigation:
   *   1. Reads the user role from sessionStorage (fresh every render)
   *   2. Filters to inSidebar: true routes
   *   3. Filters to routes where allowedRoles includes the user's role
   *      (or allowedRoles is empty = open to everyone)
   *
   * Result for Role 3:
   *   Dashboard  → allowedRoles [1,2,3] ✅ shown
   *   Repository → allowedRoles [1,2]   ❌ hidden
   *   Projects   → allowedRoles [1,2,3] ✅ shown
   */
  const getSidebarRoutes = () => {
    const user        = readUserFromSession();
    const userRole    = user?.role ?? null;
    const allRoutes   = getAllNavRoutes();

    return allRoutes.filter((route) => {
      if (!route.inSidebar) return false;

      // No restriction = show to everyone
      if (!route.allowedRoles || route.allowedRoles.length === 0) return true;

      // No session = hide everything
      if (userRole == null) return false;

      return route.allowedRoles.includes(userRole);
    });
  };

  // ─── Public API ───────────────────────────────────────────────────────

  return {
    goTo,
    goBack,
    goForward,
    goToCreate,
    getPath,
    getCurrentRoute,
    canGoBack,
    canGoForward,
    canCreate,
    getBreadcrumbs,
    getSidebarRoutes,
  };
};