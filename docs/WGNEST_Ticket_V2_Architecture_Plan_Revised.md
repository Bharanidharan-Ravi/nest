# WG-NEST Ticket System V2 – Revised Architecture & Implementation Plan

> Revision of `WGNEST_Ticket_V2_Full_Architecture_Plan.md` (kept unchanged for reference).
> This version is grounded in the current codebase (UI: `WG-Nest-pack`, API: `WGNestAPIGateway`, DB: `GetIssuesByID`) and changes scope, phase order and several technical decisions.

---

## 0. Purpose

Replace the current "load every ticket, filter in the browser" path with server-side filtering, sorting, pagination and counts, while keeping the parts of the current system that already work well (config-driven list UI, master-data cache, realtime row patching).

### Phase gate rule

A phase is complete when:

1. Implementation is done.
2. Automated tests for the phase pass (including the golden comparison, §12).
3. Manual checks for the phase are done.
4. Performance numbers for the phase are recorded where applicable.
5. No P0/P1 defect remains and previous-phase regression passes.

---

## 1. What changed from V1 of this plan

| # | Change | Reason |
|---|---|---|
| 1 | New **Phase 1 "Quick win"**: slim the existing SP before any paging work | Most of the payload is heavy columns, not row count (§2.1) |
| 2 | **Private-ticket visibility moves into SQL** in Phase 2 | Currently enforced only in the browser (§2.2) |
| 3 | **Single SP call over all allowed repos** instead of per-repo fan-out | Fan-out + array concatenation cannot be paged or sorted (§2.3) |
| 4 | **Dedicated `POST /tickets/query` endpoint** instead of `/sync/v2` | Sync layer has string-only params and returns flat arrays without paging metadata |
| 5 | **Filter facet counts** added to scope (decision required) | Every filter has `showCounts: true`; V1 only covered status tabs |
| 6 | **Filter and sort semantics contract** (§6, §7) | Current filters have non-obvious rules that SQL must reproduce exactly |
| 7 | **Persisted `LastActivityAt` column** + **keyset (cursor) pagination** | Sort column is computed today; offset paging duplicates/skips rows under realtime updates |
| 8 | SignalR: **adapt the existing dispatcher**, do not regress to invalidate-only | Current dispatcher already does targeted row replacement |
| 9 | **Other full-list consumers** in scope (mentions, detail page, meeting scheduler) | They also call the giant SP |
| 10 | Checked Tickets and Timesheet **keep their own SPs** (paged), not merged into Ticket API | They are different datasets (plan dates, time logs) |
| 11 | Master mapping, server counts and realtime adaptation **ship together** with the UI cutover | Each breaks as soon as the data shape changes |
| 12 | **Query Planner (LOCAL/CACHE/SERVER) becomes optional**, after performance phase | Low benefit with 20-row pages; high cost of keeping JS and SQL semantics identical |
| 13 | Lighter process: 8 phases, feature flag, golden comparison tests | Fits team size and current test infrastructure |

---

## 2. Current state (findings)

### 2.1 Data path

```text
TicketsPage / Dashboard / Mentions / Detail
        |
useTicketMaster  →  POST /sync/v2  { ConfigKeys: ["TicketsList"], Params }
        |
SyncV2Controller → SyncRequestEnricher → SyncRepositoryV2
        |
GetIssuesByID (dynamic SQL, one row per ticket, whole scope)
        |
Browser: normalizeTicket → applyListFilters → sort → tabCounts → filterCounts → slice(visibleCount)
```

Relevant files:

- `src/features/tickets/hooks/useTicketMaster.js` – ticket list query.
- `src/features/tickets/pages/TicketsPage.jsx` – filter definitions (custom JS filters), `isAllowedToView`.
- `src/packages/ui-List/hooks/useListState.js` – local filter, sort, tab counts, facet counts, `visibleCount` paging.
- `src/packages/ui-List/core/filterEngine.js` – shared hook-free filter engine.
- `src/core/filters/ticketFilters.js` – mentions/pickers use full repo ticket list.
- `src/core/realtime/realtimeDispatcher.js` – realtime cache patching.
- API: `SyncRepositoryConfigStore.cs` (`TicketsList` → `GetIssuesByID`), `Syncrequestenricher.cs`, `SyncKeyPolicy.cs`, `SyncRepositoryV2.cs`.

### 2.2 `GetIssuesByID` cost drivers

Per row, the SP returns or computes:

- `Description` and `HtmlDesc` (full HTML body) – **not used by the list card**.
- `Attachment_JSON` – not used by the list card; also joins on `TRY_CAST(ModuleId AS UNIQUEIDENTIFIER)` (non-sargable).
- `All_Assignees` JSON with nested `HandOffData` JSON per stream.
- `Move_toJson` JSON.
- `Labels_JSON`.
- `TotalConsumeTime` – parses `hours` strings of every thread of the ticket.
- Latest thread (`T5`) – `ROW_NUMBER() OVER (PARTITION BY Issue_Id ...)` over the **entire** `IssueThreads` table.
- Thread count (`TC`) – `GROUP BY` over the entire `IssueThreads` table.
- `UpdatedAt` – computed as max(ticket.UpdatedAt, last thread UpdatedAt); used for sorting, so it cannot use an index.

Visibility rules today:

- Role 3: `RaiseToClient = 1` is enforced in SQL. ✅
- Private tickets / status 19: enforced **only in the browser** (`isAllowedToView`), partly by matching assignee *name*. ❌ Security gap.

### 2.3 Role 3 fan-out

`SyncRequestEnricher` creates one execution unit per allowed repo; `SyncRepositoryV2` runs them in parallel and concatenates the arrays. With pagination this would return `pageSize × repoCount` rows in no global order, with no correct total count.

### 2.4 Browser work

For every change of filter/search/sort, `useListState` re-normalizes and re-filters the full list, and `filterCounts` evaluates `filters × options × rows`. This is a main source of UI freeze.

### 2.5 Realtime

`realtimeDispatcher.js` already:

- deduplicates events,
- debounces per ticket (250 ms),
- fetches the fresh row for that ticket (`fetchTicketRow`) and replaces it in every cached list that contains it,
- invalidates derived screens (timesheet, checked, stale) with a 1 s debounce.

It assumes cached lists are plain arrays and re-sorts by `UpdatedAt` after patching.

### 2.6 Tests available

- UI: Vitest (a few unit tests exist, e.g. `queryKeys.test.js`).
- API: `APIGateWay.Tests` project.
- DB: no test harness.

---

## 3. Target architecture

```text
                    WG-NEST UI
                        |
         Filter / Sort / Search state (useListState, Zustand)
                        |
              Canonical Ticket Query (normalized)
                        |
          React Query  useInfiniteQuery  (key = canonical query)
                        |
               POST /tickets/query
                        |
     TicketQueryController → TicketQueryService → TicketQueryRepository
        (validate, normalize, resolve auth scope once)
                        |
        +---------------+---------------+-----------------+
        |               |               |                 |
  SP_Ticket_GetPage  SP_Ticket_GetCount  SP_Ticket_GetSummary  SP_Ticket_GetFacets (optional)
        |
   Lightweight rows (IDs + core fields)
                        |
   Master lookup maps (Project / Repo / Employee / Team / Label / Status)
                        |
                       UI
                        ^
                        |
      SignalR → realtimeDispatcher (InfiniteData-aware row patch / invalidate)
```

Responsibilities:

- **SQL**: authorization scope, filtering, sorting, keyset paging, counts, summary, facets.
- **API**: validation, normalization, auth scope resolution, bounded parallel SP calls, DTO shaping, structured errors, logging.
- **React Query**: server-state cache, infinite pages (`maxPages`), freshness, retry.
- **Zustand / useListState**: UI state only (filter panel, view mode, selection).
- **Master cache**: ID → object lookup for names, colors, avatars.
- **SignalR**: domain events that patch or invalidate cached ticket queries.

---

## 4. Core principles (kept from V1, with clarifications)

1. **One ticket query endpoint** for Ticket List, Dashboard "My Tickets", project/repo lists and ticket pickers. Checked Tickets and Timesheet keep their own focused SPs.
2. **No giant SP.** Each SP has one responsibility.
3. **Server owns the result set**: status, repo, project, team, owner, assignee, label, handler, battery, flags, search, date, sort, paging, authorization.
4. **IDs in rows, names from master cache.** No N+1 enrichment.
5. **Authorization is server-side only.** Client checks are UI convenience, never the boundary.
6. **Domain events** (TicketUpdated, TicketCreated, …), not page events.
7. **No hardcoded filter hierarchy.** Filter behaviour comes from filter definitions.

---

## 5. Database design

### 5.1 Schema additions

| Change | Purpose |
|---|---|
| `ISSUEMASTER.LastActivityAt DATETIME2` | Persisted max(ticket update, last thread). Updated on ticket update and on thread insert/update. Backfill once. |
| `ISSUEMASTER.FlagPriority AS (CASE WHEN PriorityRequest=1 OR IsCloseRequested=1 OR AdminResponse=1 OR FuncResponse=1 OR TechnicalResponse=1 OR WebResponse=1 THEN 1 ELSE 0 END) PERSISTED` | Indexable default-sort key |
| `ISSUEMASTER.ThreadCount INT` (or indexed view) | Avoid full `IssueThreads` aggregation per request |
| `ISSUEMASTER.TotalConsumeMinutes INT` | Avoid string parsing of `hours` per request; maintained on thread write |
| `ISSUEMASTER.LatestProgressPct` | Battery filter / display without `OUTER APPLY` on every row |

If adding columns is not acceptable, use a side table `IssueStats(Issue_Id PK, LastActivityAt, ThreadCount, TotalConsumeMinutes, LatestProgressPct, LastCommentText)` maintained by the same write paths.

Also store thread hours as minutes (`INT`) going forward; keep the string column until migration completes.

### 5.2 SP_Ticket_GetPage

Inputs (typed, not a string dictionary):

- `@UserId`, `@Role`
- `@RepoIds` – table-valued parameter (allowed + requested repos, resolved by API)
- `@ProjectIds`, `@StatusIds`, `@OwnerIds`, `@AssigneeIds`, `@TeamIds`, `@LabelIds`, `@HandlerRepoIds` – TVPs
- `@Flags` – TVP or bitmask
- `@BatteryRanges` – TVP of (min, max)
- `@NoOwner BIT`
- `@Search NVARCHAR(200)`
- `@DueFrom`, `@DueTo`, `@CreatedFrom`, `@CreatedTo`
- `@SortKey`, `@SortDir`
- `@Cursor*` – last row's sort values + `Issue_Id`
- `@PageSize` (server-capped, e.g. max 100)

Execution order:

```text
Permitted tickets (auth scope, incl. private/status 19 rule)
   → filters (EXISTS for one-to-many: assignees, labels, handlers)
   → ORDER BY sort keys + Issue_Id
   → keyset seek, TOP (@PageSize + 1)
   → then join/aggregate only for those rows (labels, assignee IDs)
```

Output (lightweight):

```text
IssueId, IssueCode, Title, StatusId, Priority, ProjectId, RepoId,
OwnerId (Assignee_Id), CreatedBy, AssigneeIds (JSON array of {id, type, teamId, streamStatus, pct}),
HandlerRepoIds (JSON array), LabelIds (JSON array),
Flags (PriorityRequest, IsCloseRequested, FuncResponse, TechnicalResponse, WebResponse, AdminResponse, RaiseToClient),
IsPrivate, ProgressPct, StatusSummary, ThreadCount, LastCommentText (truncated),
TotalConsumeMinutes, DueDate, CreatedAt, LastActivityAt
```

Not returned in list: `Description`, `HtmlDesc`, attachments, handoff history, full comment text.

`TOP (@PageSize + 1)` lets the API set `hasNextPage` without a count.

### 5.3 SP_Ticket_GetCount

Same inputs minus cursor/sort. Returns `TotalCount`. Must share filter logic with GetPage (see §5.7).

### 5.4 SP_Ticket_GetSummary

Same filter inputs **excluding status**. Returns counts per status group:

| Tab | Rule (from `TicketUI.config.jsx`) |
|---|---|
| open | status NOT IN (10, 14, 15, 16, 17, 18) |
| closed | status IN (15, 16, 17) |
| hold | status IN (14) |
| queue | status IN (18) |
| clientconfirm | status IN (10) |

Move these groups to a table (`StatusGroup`) or a single config shared by UI and SQL so they are not duplicated.

Viewer (role 3) only shows open / closed / queue.

### 5.5 SP_Ticket_GetFacets (decision required, §14)

For each facet filter, counts per option **with all other filters applied** (current `filterCounts` behaviour). Options:

- **A.** Implement with one grouped query per facet (bounded: ~8 facets). Called only when the filter panel is open, cached separately.
- **B.** Show counts only for status tabs; drop per-option counts.
- **C.** Show counts only for a few cheap facets (Project, Repo, Status).

Recommendation: **C** first, extend to A if users need it.

### 5.6 Other focused SPs

- `SP_Ticket_GetDetail` – one ticket with `Description`, `HtmlDesc`, attachments, assignees + handoffs. Replaces the detail page's use of the list SP.
- `SP_Ticket_Search` – code/title search, `TOP 10`, for `#` mentions and pickers.
- Existing Checked Tickets / Timesheet SPs – add paging and slim projections; keep separate.

### 5.7 Keeping Page / Count / Summary in sync

Put the shared WHERE logic in one place:

- an inline table-valued function `fn_Ticket_Filtered(@params…)` returning `Issue_Id` + sort keys, used by all three SPs, **or**
- one SP with `@Mode = 'page' | 'count' | 'summary'` if the function form produces poor plans.

Measure both; choose by execution plan.

### 5.8 Indexing (validate with real plans)

Starting candidates:

- `(RepoId, Status, FlagPriority DESC, LastActivityAt DESC, Issue_Id)` INCLUDE core list columns
- `(Project_Id, Status, FlagPriority DESC, LastActivityAt DESC, Issue_Id)`
- `(Assignee_Id, Status, LastActivityAt DESC)`
- `WorkStreams (ResourceId, IssueId) INCLUDE (StreamStatus)`
- `ISSUE_LABELS (Label_Id, Issue_Id)`
- `IssueMoveTo (Move_to, Issue_Id)`
- `IssueThreads (Issue_Id, UpdatedAt DESC)`
- Fix attachment lookup: store `ModuleId` as `UNIQUEIDENTIFIER` or add a computed, indexed column.

Do not add indexes without an execution plan showing the need.

### 5.9 Search

`searchFields` today: title, ticketKey, priority. Server search:

- Leading `#` stripped; exact code match ranks first, then code prefix, then title prefix, then contains (same as `rankTicket` in `ticketFilters.js`).
- All tokens must match (`searchMode: "allTokens"`).
- `LIKE '%x%'` is acceptable at current volume; consider a full-text index if p95 exceeds budget.

---

## 6. Filter semantics contract

This table is the source of truth for SQL and for any future local evaluator. Matching is **by ID only** (name matching is removed).

| Filter key (UI) | Meaning | SQL rule | Multi-select |
|---|---|---|---|
| `is` (tab) | Status group | §5.4 | single |
| `repoId` | Ticket repo | `RepoId IN @RepoIds` (intersected with allowed repos) | OR |
| `project` | Ticket project | `Project_Id IN @ProjectIds` | OR |
| `label` | Has label | `EXISTS ISSUE_LABELS WHERE Label_Id IN @LabelIds` | OR (current UI ranks by match count – see §7) |
| `assginedTo` (Owner) | Main assignee | `Assignee_Id IN @OwnerIds`; `__no_owner__` → `Assignee_Id IS NULL` | OR |
| `multiAssignees` (Assignee) | Work-stream assignee **excluding main assignee**, OR handler repo | `EXISTS WorkStreams WHERE ResourceId IN @AssigneeIds AND (StreamStatus IS NULL OR StreamStatus <> 17)` OR `EXISTS IssueMoveTo WHERE Move_to IN @AssigneeIds` | OR |
| `multiAssignees` (viewer) | Options are repos + "WorkGlow Solutions" | Same as handler rule | OR |
| `teamId` | Main assignee's team | `EXISTS main assignee with Team IN @TeamIds` | OR |
| `move_toJson` (Handler) | Ticket moved to repo | `EXISTS IssueMoveTo WHERE Move_to IN @HandlerRepoIds` | OR |
| `customBoolean` (Flags) | Any selected flag true; `allFlags` → any of all flags | `(flag1 = 1 OR flag2 = 1 …)` | OR |
| `overallPercentage` (Battery) | Latest active progress % in range | Ranges `0–20`, `21–40` (`>20 AND <=40`), …, `81–100`; NULL progress never matches | OR |
| text | Search | §5.9 | – |
| date filters | Due / created range | inclusive, normalized to UTC day bounds | – |

Across different filters: **AND**.

Open questions to confirm in Phase 0:

- Should the Assignee filter keep including handler repos, or should that be only the Handler filter?
- Should Team include work-stream assignees' teams, not only the main assignee?

---

## 7. Sort contract

| Sort key | Rule | Keyset columns |
|---|---|---|
| default (`updatedAt` desc, non-viewer) | `FlagPriority DESC, LastActivityAt DESC, Issue_Id DESC` | FlagPriority, LastActivityAt, Issue_Id |
| default (viewer) | `LastActivityAt DESC, Issue_Id DESC` | LastActivityAt, Issue_Id |
| `updatedAt` asc/desc | `LastActivityAt, Issue_Id` | same |
| `createdAt` asc/desc | `CreatedAt, Issue_Id` | same |
| `dueDate` `overdue_first` / `today_first` / `upcoming_first` | Bucket (overdue / today / upcoming / null last) mapped to priority per option, then `Due_Date ASC`, `Issue_Id` | Bucket, Due_Date, Issue_Id |

Notes:

- Today the non-viewer default sort flags in this order: priorityRequest, isCloseRequested, adminResponse, funcResponse, technicalResponse, webResponse (lexicographic). The SP currently uses "any flag". **Confirm which is required**; the lexicographic version needs a computed sort key.
- "Today" for due buckets uses the server's business time zone; pass the client's date if needed.
- The current label match-score ranking (tickets matching more selected labels first) is **dropped** unless product requires it. If kept, compute `LabelMatchCount` in SQL and put it first in the sort.

---

## 8. API design

### 8.1 Endpoint

`POST /tickets/query` – new controller in `WGNestAPIGateway`. Does not go through `/sync/v2`.

Auth scope:

- Reuse `SyncKeyPolicy` / `RepoScopeValidator` logic to resolve allowed repos **once**.
- Pass allowed repos to the SP as one TVP. **No per-repo fan-out.**
- Role, user ID come from `ILoginContextService`, never from the request body.

### 8.2 Request

```json
{
  "filters": {
    "status": "open",
    "repoIds": [],
    "projectIds": [],
    "ownerIds": [],
    "noOwner": false,
    "assigneeIds": [],
    "teamIds": [],
    "labelIds": [],
    "handlerRepoIds": [],
    "flags": [],
    "battery": ["0-20"],
    "search": "",
    "dueFrom": null,
    "dueTo": null
  },
  "sort": { "key": "default", "dir": "desc" },
  "page": { "size": 20, "cursor": null },
  "include": { "count": true, "summary": true, "facets": false }
}
```

### 8.3 Response

```json
{
  "items": [ /* lightweight rows, §5.2 */ ],
  "page": { "size": 20, "nextCursor": "opaque-base64", "hasNextPage": true },
  "totalCount": 134,
  "summary": { "open": 134, "closed": 902, "hold": 4, "queue": 11, "clientconfirm": 3 },
  "facets": null,
  "meta": { "queryHash": "…", "correlationId": "…" }
}
```

- `nextCursor` is opaque (encoded sort values + Issue_Id); the UI never builds it.
- `totalCount` and `summary` are requested only on the **first page** of a query; later pages send `include.count = false`.

### 8.4 Execution

- Page, Count, Summary run in parallel with a **bounded** degree (e.g. `SemaphoreSlim` of 3 per request), each on its own connection.
- If Count/Summary fails: return items with `totalCount = null` / `summary = null` and an `errors` entry; the UI shows "—", never a wrong number.
- If Page fails: structured error, HTTP 5xx.
- Command timeout per SP; cancellation token from the request.

### 8.5 Other endpoints

- `GET /tickets/{id}` → `SP_Ticket_GetDetail`.
- `GET /tickets/search?repoId=&q=&limit=10` → `SP_Ticket_Search`.
- `POST /tickets/facets` (if §5.5 option A/C).

---

## 9. UI design

### 9.1 `useTicketList`

New hook in `src/features/tickets/hooks/`:

- Builds the canonical query from `useListState` (filters, tab, text, sort).
- `useInfiniteQuery` with:
  - `queryKey: ["ticket", "query", canonicalQuery]`
  - `getNextPageParam: (last) => last.page.hasNextPage ? last.page.nextCursor : undefined`
  - `maxPages: 3` (bounded memory; add `getPreviousPageParam` if backward reload is needed)
  - `placeholderData: keepPreviousData` (no empty flash on filter change)
  - `staleTime: 60_000`, `gcTime: 5 * 60_000`
- Search debounced 300–400 ms.

### 9.2 Query normalization

`normalizeTicketQuery(query)`:

- drops empty values,
- sorts multi-select ID arrays,
- lowercases GUIDs,
- trims search, strips leading `#`,
- normalizes dates to `YYYY-MM-DD`,
- maps sort to `{ key, dir }`.

Unit-tested: equivalent queries produce identical keys.

### 9.3 `useListState` changes

Add a **server mode** (`config.dataMode = "server"`):

- skip local filter / sort / `tabCounts` / `filterCounts`,
- read `tabCounts` from `summary`, `filterCounts` from `facets`,
- `loadMore` → `fetchNextPage`, `hasMore` → `hasNextPage`, `total` → `totalCount`.

Keep the existing local mode for small lists (labels, projects, employees, etc.). Other modules are not affected.

Filter definitions in `TicketsPage.jsx` keep `key`, `view`, `options`, `allowedRoles`; the `customFilter` functions are replaced by an `apiKey` mapping to the request field (§8.2).

### 9.4 Master lookup

`useMasterLookup()` in `src/core/master/` builds memoized `Map`s from the existing master cache:

`projectById`, `repoById`, `employeeById`, `teamById`, `labelById`, `statusById`.

`normalizeTicket` is updated to accept the lightweight row + lookup maps and produce the same view-model fields the card uses today (`project`, `assignedTo` name, labels with color, etc.). Missing master object → safe fallback ("Unknown"), no crash.

### 9.5 Other consumers

| Consumer | Today | Target |
|---|---|---|
| Ticket list (global/repo/project) | full list | `useTicketList` |
| Dashboard "My Tickets" | `TicketsList` with `assignedTo` api filter | `useTicketList` with owner/assignee = me |
| Ticket detail header | list SP with `IssueId` | `GET /tickets/{id}` |
| `#` mentions / pickers (`ticketFilters.js`) | full repo list, local filter | `GET /tickets/search` (keep `rankTicket` rule server-side) |
| Meeting scheduler (`byEmployee`) | list SP with `EmployeeId` | `useTicketList` with assignee filter, or search endpoint |
| Checked Tickets | own configKey | own SP, paged |
| Timesheet | own configKey | own SP, date-bounded; summary vs entries split |

### 9.6 Rendering

- Card and table views render only loaded pages (≤ 60 rows with `maxPages: 3`).
- Add virtualization only if measurements show render cost; not required at this row count.

---

## 10. Realtime (SignalR) adaptation

Keep `realtimeDispatcher.js` and its row-replacement approach. Changes:

1. **InfiniteData support** – `extractList` / `wrapList` handle `{ pages: [{ items }], pageParams }` in addition to arrays.
2. **Update event** – replace the row in whichever page contains it; **do not re-sort** (`applyAction` currently sorts by `UpdatedAt`). If the change affects the sort key or filter match, invalidate that query instead.
3. **Create event** – invalidate matching `["ticket","query",…]` queries (active ones refetch); do not prepend.
4. **Delete / lost visibility** – remove the row from pages; decrement nothing locally (counts refetch with the query).
5. **Fresh row fetch** – `fetchTicketRow` uses `GET /tickets/{id}` (lightweight row) instead of the full list SP.
6. **Scope guard** – remove the "first row's project" check; the query key carries the filters.
7. **Summary / counts** – invalidate summary with the same debounce as derived screens (1 s).
8. **Reconnect** – `invalidateQueries({ refetchType: "active" })` instead of invalidating everything.
9. **Master updates** – already patch the master cache; ticket names update automatically through lookup maps.

---

## 11. Phases

### Phase 0 – Baseline and contract

Tasks:

- Measure current: `GetIssuesByID` duration, logical reads, CPU, rows, payload size per role; API duration; browser memory and filter-change time.
- Capture ~20 representative queries (per role; open/closed; repo; project; assignee; team; flags; battery; multi-filter; search; each sort; dashboard; checked; timesheet).
- Confirm §6 filter semantics and §7 sort rules with product.
- Decide facet counts (§5.5) and dedicated endpoint (§8.1).

Exit: baseline numbers recorded; contract tables signed off.

### Phase 1 – Quick win: slim the current SP

Status: **implemented, not yet deployed** (2026-09-29).

What was built:

- `scripts/ticket_v2_phase1_slim_list_sp.sql` creates `GetIssuesByID_V2`. It has the same parameters and result columns as `GetIssuesByID`, so the `GetTickets` DTO and the UI are unchanged.
  - List calls (`@IssueId` NULL) return `Description`, `HtmlDesc` and `Attachment_JSON` as NULL, and leave `HandOffData` out of `All_Assignees`.
  - Single-ticket calls (`@IssueId` set) still return the full row. These are the detail page, edit page and realtime `fetchTicketRow`. So the detail page needs no separate description call, and a realtime row swapped into a list cache is still correct.
  - `TC` and `T5` now use per-ticket `OUTER APPLY` instead of grouping or ranking the whole `ISSUETHREADS` table. The existing index `IX_ISSUETHREADS_IssueId_UpdatedAt` covers both, so no new index is needed.
  - Filters, the role rule and `ORDER BY` are unchanged.
- `SyncRepositoryConfigStore.cs`: `TicketsList` now points at `GetIssuesByID_V2`. To roll back, change it back to `GetIssuesByID`. The old SP is left untouched.
- `scripts/ticket_v2_phase1_golden_compare.sql` runs both SPs with the same parameters. It reports duration, rows and bytes, and any differences in rows, list fields, assignees, order and single-ticket heavy columns.

Deploy order: SQL script first, then the API.

Tests: run the golden comparison for each Phase 0 query. Sections 3, 4, 5 and 7 must return zero rows. The one allowed difference is `commenttext` when two threads share the same `UpdatedAt`.

Manual checks:
- The ticket list cards, filters (including the Assignee, Team and Move-to handlers) and counts look the same.
- The detail page shows the description, attachments and the handoff tree.
- The edit form is pre-filled with the description.
- After a realtime update on an open detail page, the description is still shown.

Exit: payload and SP time reduced (record numbers); no functional change for users.

### Phase 2 – Database decomposition

Tasks:

- Schema additions (§5.1) + backfill + write-path maintenance.
- `fn_Ticket_Filtered` (or mode SP), `SP_Ticket_GetPage`, `SP_Ticket_GetCount`, `SP_Ticket_GetSummary`, `SP_Ticket_GetDetail`, `SP_Ticket_Search`, optional facets.
- Private-ticket / status 19 visibility and role 3 `RaiseToClient` in SQL.
- Allowed-repo TVP; keyset paging.
- Index review with actual plans.

Tests (SQL scripts run in CI or manually against staging copy):

- each filter in §6, combined filters, each sort in §7,
- page 1 / middle / last / empty; page boundaries 0, 1, 19, 20, 21, 40, 41, 100+,
- no duplicates/skips across pages while `LastActivityAt` of a row changes between page loads,
- count and summary equal to `COUNT(*)` of the unpaged filtered set,
- private ticket hidden from non-assignee; role 3 sees only `RaiseToClient = 1` in allowed repos,
- golden comparison vs old SP (same ID set, ignoring order where sort differs by design).

Exit: correct results; p95 SP time within budget on staging data.

### Phase 3 – Ticket API

Tasks: controller, service, repository; request validation (page size cap, known sort keys, GUID arrays); bounded parallel execution; DTO mapping; cursor encode/decode; structured errors; correlation logging; detail and search endpoints.

Tests (`APIGateWay.Tests`):

- validation (invalid sort, page size > cap, bad cursor, bad GUIDs),
- auth scope: role 1/2/3, repo not allowed → excluded,
- count/summary failure → items returned, null counts + error entry,
- page failure → structured error,
- timeout/cancellation,
- parallelism bounded.

Exit: endpoint returns correct data for all Phase 0 queries without calling `GetIssuesByID`.

### Phase 4 – UI cutover (behind feature flag)

Tasks (ship together):

- `normalizeTicketQuery`, `useTicketList`, server mode in `useListState`.
- `useMasterLookup`, updated `normalizeTicket`.
- Tabs from `summary`, filter counts from facets (per Phase 0 decision).
- Realtime changes (§10).
- Mentions/pickers → search endpoint; detail page → detail endpoint.
- Feature flag (per user or role) to switch between old and new path.

Tests (Vitest):

- query normalization / key equality,
- master lookup + missing-master fallback,
- dispatcher: update in page N, create → invalidate, delete, reconnect scope,
- `useListState` server mode mapping (tabs, total, hasMore).

Manual:

- ticket list (global / repo / project), dashboard My Tickets, detail page, mentions,
- each filter and sort; filter change resets to first page; no stale rows flash,
- scroll 20 / 40 / 60 / 100+; no duplicates; memory stays bounded,
- two browser sessions: update status/assignee/comment in one, verify the other,
- rename a project/employee; ticket names update without refetching tickets,
- roles 1, 2, 3.

Exit: flag on for internal users with no P0/P1 for an agreed period.

### Phase 5 – Dashboard, Checked Tickets, Timesheet

Tasks: add paging and slim projections to their SPs; Timesheet split into summary (list) and entries (on demand); keep derived-screen invalidation.

Exit: no screen loads the full ticket set.

### Phase 6 – Performance and resilience

Workloads: small/medium/large result sets, heavy filter combos, timesheet mode, concurrent users, realtime bursts.

Measure p50/p95/p99, SQL CPU/reads/memory grants, API CPU/memory, payload, UI render time.

Failure checks: DB down, count/summary failure, next-page failure (previous pages stay, retry works), SignalR disconnect (app still works), slow network (old data stays visible).

Exit: targets in §13 met or accepted with evidence.

### Phase 7 – Rollout and retirement

1. Enable flag for all roles.
2. Keep old path available for an agreed period (rollback = flag off).
3. Remove `GetIssuesByID` list usage, `TicketsList` list config, local-mode code paths for tickets, `isAllowedToView`.

### Optional (after Phase 6, only if metrics justify)

- **Query Planner (LOCAL / CACHE / SERVER)** as in V1 §8–§11. Only useful when many queries return ≤ one page. Requires the local evaluator to follow §6 exactly and a shared test suite run against both JS and SQL.
- **Targeted page patching for Create events** instead of invalidation.
- Full-text search index.

---

## 12. Testing strategy

| Layer | Main tool | Focus |
|---|---|---|
| DB | SQL test scripts against a staging copy | Golden comparison vs old SP; filter/sort/paging/count/auth |
| API unit | `APIGateWay.Tests` | validation, normalization, cursor, error shaping, auth scope |
| API integration | `APIGateWay.Tests` + staging DB | parallel execution, real filters |
| UI unit | Vitest | query normalization, master lookup, dispatcher, list-state server mode |
| Manual / E2E | Two-browser checklist | lists, dashboard, detail, mentions, realtime, roles |

**Golden comparison** is the main safety net: for each captured Phase 0 query, the new path must return the same set of Issue_Ids (and same counts) as the old path, except where the contract deliberately changed behaviour (documented per case).

Regression after every phase: login, dashboard, ticket list, detail, checked tickets, timesheet, master data, SignalR, navigation, permissions.

---

## 13. Targets

| Metric | Target |
|---|---|
| Ticket page API p95 (first page incl. count + summary) | ≤ 300 ms |
| Next page API p95 | ≤ 150 ms |
| First-page payload | ≤ 100 KB typical, hard limit 1 MB |
| Rows in memory per list | ≤ 60 (`maxPages: 3` × 20) |
| Filter change → rows shown | no visible freeze; old rows shown until new arrive |
| Duplicate requests for the same query | 0 |

---

## 14. Decisions required before Phase 2

| # | Decision | Recommendation |
|---|---|---|
| 1 | Facet counts: full / none / partial | Partial (Project, Repo, Status) |
| 2 | Dedicated `/tickets/query` vs extending `/sync/v2` | Dedicated endpoint |
| 3 | New columns on `ISSUEMASTER` vs `IssueStats` side table | Side table if schema changes to `ISSUEMASTER` are risky |
| 4 | Default sort: "any flag first" vs ordered flags | Confirm with product |
| 5 | Keep label match-score ranking | Drop |
| 6 | Assignee filter includes handler repos | Confirm with product |
| 7 | Team filter: main assignee only vs all streams | Confirm with product |

---

## 15. Observability

Log per ticket query: correlation ID, query hash, user/role, SP names and durations, total API duration, rows returned, payload size, include flags, errors. Expose the same fields in a debug header or log line so the Network panel can be matched to server logs.

---

## 16. Must not happen

- A new giant ticket SP or giant DTO.
- Per-repo fan-out merged in the API for paged queries.
- Client-side visibility as the only protection for private tickets.
- Browser-calculated global counts or global sort after server paging.
- Offset paging for lists sorted by activity time.
- Unbounded parallel SP calls or unbounded retained pages.
- Name-based matching in filters.
- A hardcoded filter hierarchy or page-specific branches in shared code.
