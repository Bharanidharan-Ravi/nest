/**
 * src/core/routing/paths.js
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SINGLE SOURCE OF TRUTH — all route keys + URL patterns ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Zero imports. Just plain strings.
 *
 * ROUTE_KEYS  → stable IDs used by goTo(), getBreadcrumbs(), canCreate() etc.
 * PATHS       → React Router URL patterns (may contain :params)
 *
 * Adding a new route  → add one pair here + wire in feature index
 * Renaming a URL      → change PATHS here only, nothing else
 */

export const ROUTE_KEYS = {
  // ── App shell ─────────────────────────────────────────────
  DASHBOARD:         "app.dashboard",

  // ── Repository ────────────────────────────────────────────
  REPO_LIST:         "repository.list",
  REPO_CREATE:       "repository.create",
  REPO_DETAIL:       "repository.detail",
  REPO_OVERVIEW:     "repository.overview",

    // ── Tickets (standalone) ───────────────────────────────
  TICKET_LIST:       "tickets.list",
  TICKET_CREATE:     "ticket.create",
  TICKET_DETAIL:     "ticket.detail",

  // ── Tickets (inside a repo) ───────────────────────────────
  REPO_TICKET_LIST:       "repository.tickets",
  REPO_TICKET_CREATE:     "repository.ticket.create",
  REPO_TICKET_DETAIL:     "repository.ticket.detail",

  // ── Projects (inside a repo) ──────────────────────────────
  REPO_PROJ_LIST:    "repository.projects",
  REPO_PROJ_CREATE:  "repository.project.create",
  REPO_PROJ_DETAIL:  "repository.project.detail",
  REPO_PROJ_EDIT:    "repository.project.edit",

  // ── Projects (standalone /projects) ──────────────────────
  PROJ_LIST:         "project.list",
  PROJ_CREATE:       "project.create",
  PROJ_DETAIL:       "project.detail",
  PROJ_OVERVIEW:     "project.overview",
  PROJ_EDIT:         "project.edit",
  
  PROJ_TICKET_LIST:  "project.tickets",
  PROJ_TICKET_CREATE:  "project.ticket.create",
  PROJ_TICKET_EDIT:  "project.ticket.edit",  
};

export const PATHS = {
  // ── App shell ─────────────────────────────────────────────
  DASHBOARD:         "/dashboard",

  // ── Repository ────────────────────────────────────────────
  REPO_LIST:         "/repository",
  REPO_CREATE:       "/repository/create",
  REPO_DETAIL:       "/repository/:repoId",
  REPO_OVERVIEW:     "/repository/:repoId/overview",

  // ── Tickets (standalone) ───────────────────────────────
  TICKET_LIST:       "/tickets",
  TICKET_CREATE:     "/tickets/create",
  TICKET_DETAIL:     "/tickets/:ticketId",

  // ── Tickets (inside a repo) ───────────────────────────────
  REPO_TICKET_LIST:       "/repository/:repoId/t",
  REPO_TICKET_CREATE:     "/repository/:repoId/t/create",
  REPO_TICKET_DETAIL:     "/repository/:repoId/t/:ticketId",

  // ── Projects (inside a repo) ──────────────────────────────
  REPO_PROJ_LIST:    "/repository/:repoId/p",
  REPO_PROJ_CREATE:  "/repository/:repoId/p/create",
  REPO_PROJ_DETAIL:  "/repository/:repoId/p/:projId",
  REPO_PROJ_EDIT:    "/repository/:repoId/p/:projId/edit",

  // ── Projects (standalone /projects) ──────────────────────
  PROJ_LIST:         "/projects",
  PROJ_CREATE:       "/projects/create",
  PROJ_DETAIL:       "/projects/:projId",
  PROJ_OVERVIEW:     "/projects/:projId/overview",
  PROJ_EDIT:         "/projects/:projId/edit",

  PROJ_TICKET_LIST:  "/projects/:projId/t",
  PROJ_TICKET_CREATE: "/projects/:projId/t/create",
  PROJ_TICKET_EDIT:   "/projects/:projId/t/:ticketId/edit",
};