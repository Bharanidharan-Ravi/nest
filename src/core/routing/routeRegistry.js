/**
 * src/core/routing/routeRegistry.js
 *
 * Key change: NavNode now stores `allowedRoles` from the route definition.
 * This lets getSidebarRoutes() filter sidebar links by the user's role —
 * Role 3 will not see "Repositories" in the sidebar because its
 * allowedRoles = [1, 2] does not include 3.
 */

/** @type {Map<string, NavNode>} */
const _registry = new Map();

/**
 * @typedef {Object} NavNode
 * @property {string}      key
 * @property {string}      fullPath
 * @property {string}      title
 * @property {string|null} parent
 * @property {string[]}    children
 * @property {string|null} create
 * @property {boolean}     inSidebar
 * @property {number[]}    allowedRoles   ← NEW: stored so sidebar can filter
 */

// ─── Internals ────────────────────────────────────────────────────────────────

function joinPaths(...parts) {
  return "/" + parts.join("/").split("/").filter(Boolean).join("/");
}

function traverseRoutes(routes, basePath) {
  for (const route of routes) {
    const fullPath = route.path
      ? joinPaths(basePath, route.path)
      : basePath || "/";

    if (route.nav?.key) {
      _registry.set(route.nav.key, {
        key:          route.nav.key,
        fullPath,
        title:        route.nav.title        ?? route.nav.key,
        parent:       route.nav.parent       ?? null,
        children:     [],
        create:       route.nav.create       ?? null,
        inSidebar:    route.nav.inSidebar    ?? false,
        allowedRoles: route.allowedRoles     ?? [],  // ← from route definition
      });
    }

    if (Array.isArray(route.children)) {
      traverseRoutes(route.children, fullPath);
    }
  }
}

// ─── Public: build ────────────────────────────────────────────────────────────

/**
 * @param {object[]} features  pass getAllFeatures() result directly
 */
export function buildRouteRegistry(features) {
  _registry.clear();

  for (const feature of features) {
    traverseRoutes(feature.routes, feature.basePath ?? "");
  }

  // Wire children arrays
  for (const node of _registry.values()) {
    if (node.parent && _registry.has(node.parent)) {
      const parent = _registry.get(node.parent);
      if (!parent.children.includes(node.key)) {
        parent.children.push(node.key);
      }
    }
  }
}

// ─── Public: read ─────────────────────────────────────────────────────────────

export function getNavRoute(key)    { return _registry.get(key); }
export function getAllNavRoutes()   { return Array.from(_registry.values()); }

/**
 * Find best-matching NavNode for a concrete pathname.
 * Longest match wins.
 */
export function matchNavRoute(pathname) {
  let best = null, bestScore = -1;

  for (const node of _registry.values()) {
    const pattern = node.fullPath.replace(/:[^/]+/g, "[^/]+");
    const regex   = new RegExp(`^${pattern}$`);
    if (regex.test(pathname)) {
      const score = node.fullPath.split("/").length;
      if (score > bestScore) { best = node; bestScore = score; }
    }
  }
  return best;
}

/**
 * Build a concrete URL from a nav key + param values.
 * Throws if a required param is missing.
 */
export function buildPath(key, params = {}) {
  const node = _registry.get(key);
  if (!node) throw new Error(`[routeRegistry] Unknown nav key: "${key}"`);

  const missing = [];
  const path = node.fullPath.replace(/:([^/]+)/g, (_, name) => {
    if (params[name] == null) { missing.push(name); return `:${name}`; }
    return encodeURIComponent(params[name]);
  });

  if (missing.length) {
    throw new Error(`[buildPath] "${key}" needs params [${missing.join(", ")}]. Got: ${JSON.stringify(params)}`);
  }
  return path;
}

export function tryBuildPath(key, params = {}) {
  try { return buildPath(key, params); }
  catch { return null; }
}