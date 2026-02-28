/**
 * src/core/auth/permissions.js
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  After login, check the console for:                                ║
 * ║  "=== [useCurrentUser] Role value found ===" to confirm the number  ║
 * ║  your API returns, then update ROLES below to match.                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Role definitions (update numbers to match your API):
 *   1 = Master Admin  → full access to everything
 *   2 = Manager       → all pages + actions EXCEPT label/employee create & edit
 *   3 = Viewer        → only dashboard, projects, tickets — no repo list
 */

export const ROLES = {
  ADMIN:   1,
  MANAGER: 2,
  VIEWER:  3,
};

// Shorthand — used in the arrays below
const ALL           = [1, 2, 3];
const ADMIN_MANAGER = [1, 2];
const ADMIN_ONLY    = [1];

// ─── Route-level access ───────────────────────────────────────────────────────
// These are used as `allowedRoles` in every feature's route definition.
// RoleGuard checks these on EVERY page render / navigation.
// If the user's role is not in the array → redirect to /login immediately.

export const ROUTE_ROLES = {
  // ── Dashboard (all roles) ────────────────────────────────────────────
  DASHBOARD:        ALL,

  // ── Repository (Role 3 cannot access repo list or create) ────────────
  REPO_LIST:        ADMIN_MANAGER,   // ← Role 3 redirected to /login
  REPO_CREATE:      ADMIN_MANAGER,
  REPO_DETAIL:      ALL,             // ← Role 3 CAN open a specific repo
  REPO_OVERVIEW:    ALL,

  // ── Tickets (all roles) ──────────────────────────────────────────────
  TICKET_LIST:      ALL,
  TICKET_CREATE:    ALL,
  TICKET_DETAIL:    ALL,

  // ── Projects inside a repo (all roles) ──────────────────────────────
  REPO_PROJ_LIST:   ALL,
  REPO_PROJ_CREATE: ALL,

  // ── Standalone projects (all roles) ─────────────────────────────────
  PROJ_LIST:        ALL,
  PROJ_CREATE:      ALL,
  PROJ_DETAIL:      ALL,
  PROJ_OVERVIEW:    ALL,
  PROJ_TICKET_LIST: ALL,

  // ── Labels & Employees (all roles can VIEW) ──────────────────────────
  LABEL_LIST:       ALL,
  EMPLOYEE_LIST:    ALL,
};

// ─── UI-level permissions ─────────────────────────────────────────────────────
// Used by useCurrentUser().can() inside components.
// Controls visibility of buttons and forms — not entire pages.

export const PERMISSIONS = {
  // Repository
  REPO_CREATE:       ADMIN_MANAGER,
  REPO_EDIT:         ADMIN_MANAGER,
  REPO_DELETE:       ADMIN_ONLY,

  // Tickets
  TICKET_CREATE:     ALL,
  TICKET_EDIT:       ALL,
  TICKET_DELETE:     ADMIN_MANAGER,

  // Projects
  PROJECT_CREATE:    ALL,
  PROJECT_EDIT:      ALL,
  PROJECT_DELETE:    ADMIN_MANAGER,

  // Labels — Role 2 and 3 can only VIEW
  LABEL_VIEW:        ALL,
  LABEL_CREATE:      ADMIN_ONLY,
  LABEL_EDIT:        ADMIN_ONLY,
  LABEL_DELETE:      ADMIN_ONLY,

  // Employees — Role 2 and 3 can only VIEW
  EMPLOYEE_VIEW:     ALL,
  EMPLOYEE_CREATE:   ADMIN_ONLY,
  EMPLOYEE_EDIT:     ADMIN_ONLY,
  EMPLOYEE_DELETE:   ADMIN_ONLY,

  // Settings
  SETTINGS_VIEW:     ADMIN_MANAGER,
  SETTINGS_EDIT:     ADMIN_ONLY,
};