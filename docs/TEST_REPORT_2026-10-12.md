# WG Nest — Test Report (Performance, Security, Responsive)

**Date:** 2026-10-12
**Roles tested:** bharani (Manager, role 2), func (Admin, role 1), tp1 (Client / repo user, role 3)

## Test environment

- **Stack:** the local API (`https://localhost:8008`) and UI (`http://localhost:5173`), against `WGSQLSAP / WG_APP`.
- **Why not live:**
  - The live database has `func` inactive and `tp1` missing, so only the Manager could log in there.
  - An earlier Manager-only run on live (nest.workglow.in) is included under Performance.
- **Scope:**
  - Read-only. No records were created, edited or deleted.
- **What applies to live:**
  - Findings in application code apply to live as well.
  - Response headers and other transport settings should be re-checked behind the live reverse proxy, which may add or change them.

## Summary

| Area | Result |
|---|---|
| Security | 2 High, 2 Medium, 3 Low. Admin-only endpoints and login responses pass. |
| Performance | No slow API. The live bottleneck is a 2.6 MB profile photo. A repo-lookup cache was added for role 3. |
| Responsive | Pass. No horizontal scroll at 375 / 768 / 1440 px for any role. |

---

## 1. Security

### High — A client (role 3) can read data from every repository

**Cause:**
- Sync access rules are an allowlist in `SyncKeyPolicy.Rules`.
- Any sync key **not** in that list is passed through **without scoping** for roles 2 and 3, so the default is allow, not deny.
- The code is in `APIGateWay.Business Layer/Auth/Syncrequestenricher.cs`, lines 80–89.

**Evidence:** row counts returned to each role for the same request:

| Sync key | Client (tp1) | Manager | Admin | Scoped? |
|---|---|---|---|---|
| `RepoList` | 1 | 19 | 19 | Yes (in Rules) |
| `EmployeeList` | denied | 35 | 35 | Yes (in Rules) |
| `MeetingData` | 156 | 156 | 156 | **No:** all meetings in all repos |
| `TicketHistory` | 2413 | 2413 | 2413 | **No:** all ticket history in all repos |
| `GetUserOnlineStatus` | 35 | 35 | 35 | **No:** every employee's online status |
| `TeamMaster` | 3 | 3 | 3 | **No:** full team list |

**Fix:**
- Deny by default: refuse a key that isn't in `SyncKeyPolicy.Rules` for roles 2 and 3.
- Give every key that role 3 may call an entry in `SyncKeyPolicy.Rules` that sets its repo scope.

**Status: fixed locally, not deployed.**
- A key without a rule is now denied for role 3. Manager (role 2) still skips the rules by design.
- Ticket-detail keys require the ticket id, and the ticket must be in one of the client's repos.
- `ClientData` is limited to the client's repos.
- The heartbeat no longer returns staff presence to clients.
- The UI no longer requests `UpcomingMeeting` for clients.
- Retest: `MeetingData`, `TicketHistory`, `GetUserOnlineStatus` and `TeamMaster` are denied for tp1. The client's ticket list, ticket detail and ticket create pages still load with no errors.

### High — Attachments can be downloaded without logging in, by guessable ID

**Evidence:**
- `GET /api/Attachment/download/1` returns **200 with no token**. The action is marked `[AllowAnonymous]` (`AttachmentController.cs`, lines 45–46).
- The ID is a sequential integer, so files can be listed by counting up.
- `GET /api/direct-download/{id}` (`Program.cs`, line 266) is also anonymous.

**Fix:**
- Require login on both endpoints.
- Check that the caller has access to the attachment's repo.

**Status: fixed locally, not deployed.**
- Download, `direct-download` and `POST /api/Attachment/upload` (also anonymous) now require login. Retest: no token returns 401.
- The per-repo check is not possible yet, because the `DBAttachment` table has no repo or ticket column.

### Medium — CORS accepts any website, with credentials

**Evidence:**
- The policy uses `SetIsOriginAllowed(origin => true)` together with `AllowCredentials()` (`Program.cs`, lines 196–203).
- A preflight from `https://attacker.example` comes back as allowed.
- This is set in application code, so it applies to live too.

**Fix:** allow only the real front-end origins, e.g. `https://nest.workglow.in`.

**Status: fixed locally, not deployed.**
- Outside Development, the policy uses `WithOrigins(...)` from the new `Cors:AllowedOrigins` setting in `appsettings.json`, which lists only `https://nest.workglow.in`.
- With `ASPNETCORE_ENVIRONMENT=Development`, any origin is allowed, so every local dev port works without being listed.
- `*` and blank entries are ignored. If the setting is missing, only `https://nest.workglow.in` is allowed.
- New tests in `CorsOriginsTests` check that:
  - the listed origins pass, with credentials;
  - `https://attacker.example`, `https://nest.workglow.in.attacker.example`, `http://nest.workglow.in` and `null` are rejected.
- Any other front-end that calls this API from a browser must be added to `Cors:AllowedOrigins` before deploying. TPCrmV2 is one: it points at `nestapi.workglow.in`.

### Medium — The client-side encryption key is not secret

**Evidence:**
- `VITE_APP_ENCRYPTION_KEY` is built into the JavaScript bundle, so any user can read it.
- Anything encrypted with it in the browser can be decrypted by that user.

**Fix:**
- Treat it as obfuscation only.
- Never rely on it to hide data from the user who holds it.
- Keep real secrets on the server.

**Status: fixed locally, not deployed.**
- **Retest:** the current production bundle does not contain the key. The only file that read it (`Decryption.jsx`) was never imported, so Vite left it out. It would have been exposed as soon as anything imported that file.
- **The server no longer uses the key for login:**
  - The middleware that decrypted it is disabled.
  - Nothing calls `EncryptUserInfo`.
  - Requests are authenticated with JWT.
- **Removed:**
  - `Decryption.jsx`;
  - the commented-out decrypt code in `AuthGuard.jsx`;
  - `VITE_APP_ENCRYPTION_KEY` from `.env.development`, `.env.production` and `.env.testenv`.
- **New build guard:** `vite.config.js` fails the build if any `VITE_*` variable name contains KEY, SECRET, PASSWORD, PRIVATE or CREDENTIAL.
- **Follow-up:** rotate `EncryptionKey:key` on the server, because the old value sat in front-end env files.

### Low

- **Swagger is public in production:**
  - `/swagger/v1/swagger.json` lists all 78 endpoints.
  - It is enabled unconditionally (`Program.cs`, line 254).
  - Fix: turn it off outside development.
- **Security headers are missing** from the API response:
  - The missing headers are `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options` and `X-Frame-Options`.
  - Check the live reverse proxy, which may already add them.
- **A single `sync/v2` key sent without its parameters returns 500 instead of 400.**
  - This is a robustness issue, not a security one.

### Passed

- **Missing token:** requests without a token are rejected with 401.
- **Admin-only endpoints:** `ChatKeys/{userId}/recovery-escrow` and `db-migration/*` return 401/403 for Manager and Client.
- **Login responses:**
  - A wrong password and an unknown user get the same answer: "No Valid User."
  - So login doesn't reveal which usernames exist.
- **Scoped keys:** `RepoList` and `EmployeeList` are correctly limited by role.

---

## 2. Performance

### Startup (local, login → landing page)

| Role | Landing page | Startup | Main-thread long tasks |
|---|---|---|---|
| Manager | /dashboard | 2.58 s | 6 tasks, 516 ms |
| Admin | /dashboard | 2.57 s | 4 tasks, 369 ms |
| Client | /tickets | 2.38 s | 3 tasks, 290 ms |

- **API calls:**
  - No single API call dominates.
  - `sync/v2` is the heaviest, at about 93 kB and 0.7–0.9 s for Admin and Manager.
- **Long tasks:** 290–516 ms of long tasks during load cause moderate jank, worth trimming.

### Live test (Manager only)

On nest.workglow.in, every startup call answered in about 120–190 ms, and `ChatKeys/me` took about 30 ms on the server. HTTP/2 is enabled.

**Main finding:**
- When the page opens, the user's **2.6 MB** profile photo loads at the same time as the API calls and slows them down.
- Other employee photos are 150–700 kB.

**Recommendation:**
- On upload, also save a small thumbnail (about 200 px, under 20 kB).
- Use the thumbnail in the header and lists.

### Repo-lookup cache (implemented)

- **What it does:** `RepoAccessService` now caches each user's repo list in memory.
- **Cache key and lifetime:** keyed by SQL server, database and user, for 2 minutes.
- **Invalidation:** cleared when `PostRepo` or `PostCustomer` adds users.
- **Effect:** removes one database query from every role-3 request.
- **Not affected:** Admin and Manager, who skip this lookup.
- **Status:**
  - The solution builds and all 77 API tests pass.
  - Not yet deployed.
  - The API instance used in this test was started before this change, so it doesn't include it.

---

## 3. Responsive

Each role was tested at 375 px (phone), 768 px (tablet) and 1440 px (desktop).

| Role | 375 px | 768 px | 1440 px |
|---|---|---|---|
| Manager | Pass | Pass | Pass |
| Admin | Pass | Pass | Pass |
| Client | Pass | Pass | Pass |

- **Horizontal scroll:** none on any page or width (`scrollWidth − clientWidth = 0`).
- **Flagged elements:** the only elements reaching past the viewport were inside SVG icons, clipped by the SVG itself. They cause no visible overflow.

---

## Recommended order

1. Deny unlisted sync keys by default for role 3 (High).
2. Require login on attachment downloads and check the repo (High).
3. Limit CORS to the real front-end origins (Medium, fixed locally).
3a. Remove the encryption key from the client env (Medium, fixed locally).
4. Add avatar thumbnails (biggest performance gain on live).
5. Turn off Swagger in production and confirm the security headers on the live proxy (Low).
6. Deploy the repo-lookup cache.
