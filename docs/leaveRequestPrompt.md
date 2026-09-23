# Leave Request Management — Implementation Prompt

Act as an expert .NET 8 and React developer working inside the existing WGNest app. Build the **Leave Request Management** module by **reusing existing framework pieces** — do not reinvent form rendering, list/tab rendering, master-data fetching, auth, or confirmation dialogs. Only create files listed under "New Files" below.

---

## Reuse — do not recreate

| Concern | Reuse this |
|---|---|
| Config-driven create/edit form | `src/packages/crud/pages/EntityFormPage.jsx` + `formFramework/*` (same pattern as `src/features/tickets/config/ticketForm.config.js`) |
| Tabbed table/list view (Requested/Approved/Rejected tabs) | `src/packages/ui-List/components/ListProvider.jsx` + `ListLayout.jsx` (`enableTabs: true`, `tabConfig`, table view — see `src/features/tickets/config/TicketUI.config.jsx` + `TicketsPage.jsx`) |
| Dropdown master data (Leave Type from SAP) | `src/core/master/registry/masterRegistry.js` — add one `leaveType` entry (`source: "api"`, pattern identical to the existing `department` entry) + one selector in `src/core/master/selectors/selectors.js` |
| Current user / role (admin vs employee) | `src/core/auth/useCurrentUser.js` (`isAdmin`, `role`, `userId`) — do NOT add new role logic |
| API calls | `src/core/api/executor.js` (`executeApi`) — same pattern as other features, no new axios wrapper |
| Approve/Reject confirm + reason capture | `src/app/shared/confirmation/confirmationModel.jsx` (reuse for Approve; extend usage with a reason textbox for Reject — do not build a new modal component) |
| Route registration | `src/core/routing/paths.js` (add `ROUTE_KEYS`/`PATHS` entries only) + feature `index.js` pattern (see `src/features/tickets/index.js`) |
| Date diff util | `src/app/shared/utilities/utilities.jsx` — add `calcLeaveDays(from, to)` if no existing date-diff helper is found there |

---

## New Files (feature: `src/features/leaveRequest/`)

```
src/features/leaveRequest/
├── index.js                          # route registration (list, create, edit)
├── elements.js                       # lazy imports for pages
├── pages/
│   ├── LeaveRequestPage.jsx          # ListProvider + ListLayout, tabs: Requested/Approved/Rejected
│   └── LeaveRequestFormPage.jsx      # wraps EntityFormPage with leaveRequestForm.config.js
├── config/
│   ├── leaveRequestForm.config.js    # field config: fromDate, toDate, leaveType(select, SAP), comments, computed noOfDays
│   └── LeaveRequestUI.config.jsx     # ListProvider config: tabConfig by STATUS, columns, admin-only "Employee Name" column, row actions (Edit/Approve/Reject)
├── component/
│   └── RejectReasonDialog.jsx        # thin wrapper around confirmationModel adding a required reason textarea
```
No hooks/ folder needed — GET reuses `useLeaveRequestMaster()` (see below), same as `useTeamMaster`/`useProjectMaster`.

Also touch (no new files, just additions):
- `src/core/routing/paths.js` — `LEAVE_LIST`, `LEAVE_CREATE`, `LEAVE_EDIT`
- `src/core/master/registry/masterRegistry.js` — `leaveType` master
- `src/core/master/selectors/selectors.js` — `useLeaveTypeOptions()`
- `src/app/shared/utils/normalizer.js` — `normalizeLeaveRequest(raw)` (same style as `normalizeTicket`)
- Feature bootstrap wherever features are registered (see how `TicketsFeature` is imported into the app registry)

---

## Backend

### SQL migration
Already written: `scripts/leave_request_migration.sql` — creates `LEAVE_REQUEST` against `WG_APP`. Timestamp defaults use IST (`SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time'`), not `SYSUTCDATETIME()`, to match the API which writes IST. Run manually:
```
sqlcmd -S <server> -d WG_APP -i scripts\leave_request_migration.sql
```
Do not re-generate the schema inline in code — apply this file as-is.

### API — follow existing controller/repo pattern (`IXxxRepo`, `APIGatewayDBContext`), 3 endpoints only:

1. `POST /api/leave-requests` — create (status forced to `REQUESTED`, `CREATED_BY`/`REQUESTED_DATE` from session).
2. `GET` via the existing `/sync/v2` engine — reuse it, do not add a new REST route. Register `GetLeaveRequests` as a ConfigKey mapped to `usp_GetLeaveRequests` (already in `scripts/leave_request_migration.sql`). Backend resolves `@UserId`/`@IsAdmin` from the JWT (same as other `/sync/v2` configs) — the frontend never sends them. FE reuses the master-sync framework (done): `leaveRequest` entry added to `masterRegistry.js` (`source: "api"`, url `/sync/v2`, payload `buildSyncPayload({ configKey: "GetLeaveRequests" })`) + `useLeaveRequestMaster()` selector in `selectors.js` — call it exactly like `useTeamMaster()`/`useProjectMaster()`.
3. `PUT /api/leave-requests/{id}` — single endpoint handles 3 actions via a `Action` field in the body:
   - `Update` (employee, only when `STATUS = REQUESTED`)
   - `Approve` (admin) → sets `STATUS`, `APPROVED_BY`, `APPROVED_DATE`
   - `Reject` (admin, requires `RejectReason`) → sets `STATUS`, `REJECT_REASON`, `REJECTED_BY`, `REJECTED_DATE`

---

## Frontend Behavior Notes

- **Form**: `fromDate`, `toDate`, `leaveType` (SAP dropdown via `leaveType` master), `comments`. `noOfLeaveDays` is a derived/disabled field (`effectDependencies: ["fromDate","toDate"]`, like `estimateHours` in `ticketForm.config.js`), not user-editable.
- **Employee tabs**: Requested / Approved / Rejected — filter by `STATUS`, same `tabConfig` shape as `TicketUI.config.jsx`.
- **Employee edit**: only allowed when row `STATUS === "REQUESTED"` — gate via `disableWhen`/`onEditClick` guard, same as ticket edit gating.
- **Admin**: same page, `isAdmin` from `useCurrentUser()` adds `Employee Name` column + Approve/Reject row actions; Reject opens `RejectReasonDialog` requiring a reason before calling PUT with `Action: "Reject"`.
- **Table columns** (both roles per spec): S.No, [Employee Name — admin only], Requested Date, From Date, To Date, Leave Type, No. of Leave Days, Comments, Status, Reject Reason, Rejected By, Rejected Date, Action.

---

## Execution Rule

Implement in this order, pausing for confirmation after each: (1) SQL + backend API, (2) `masterRegistry`/`selectors` leave-type master, (3) form config + create/edit page, (4) list/tabs page with admin approve/reject actions. Do not scaffold a new list, tab, or modal primitive — extend the existing ones above.
