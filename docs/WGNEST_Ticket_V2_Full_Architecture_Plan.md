# WG-NEST Ticket System V2 – Full Scalable Architecture & Phase-by-Phase Implementation Plan

## 0. Purpose

This document defines the target architecture and phased implementation plan for the WG-NEST Ticket, Dashboard, Checked Tickets, Timesheet, filtering, pagination, master-data mapping, React Query caching, and SignalR update flow.

The primary objective is to replace the current large ticket-data retrieval path with a modular, query-driven, low-memory, reusable, scalable architecture.

### Phase gate rule

No phase is complete until:

1. Implementation is completed.
2. Automated tests are completed.
3. Manual tests are completed.
4. Performance checks for that phase are completed where applicable.
5. No P0/P1 defect remains.
6. Regression tests from previous phases pass.
7. Acceptance criteria are signed off.
8. Only then does the next phase begin.

---

# 1. Target System Architecture

```text
                         WG-NEST UI
                             |
                    Filter / Sort / View State
                             |
                       Canonical Query
                             |
                     Query Planner Engine
                     /                 \\
               LOCAL                   SERVER
                 |                       |
                 |                 Ticket API
                 |                       |
                 |              ---------------------
                 |              |        |          |
                 |         Ticket SP   Count SP  Summary SP
                 |                         |
                 |                   Timesheet SP
                 |                       (optional)
                 |              ---------------------
                 |                       |
                 |                  DTO / Response
                 |                       |
                 +----------- React Query Cache
                             |
                  Master Data React Query Cache
                  /        |         |        \\
             Project     Repository  Employee  Other Masters
                             |
                            UI
                             ^
                             |
                          SignalR
                             |
                       Domain Events
```

### Main responsibilities

**SQL/SP:** filtering, sorting, pagination, counts, summaries, database-heavy set operations.

**API:** validate and normalize the query, orchestrate focused SPs, execute independent work in controlled parallelism, shape DTOs, enforce business rules and errors.

**React Query:** server-state caching, infinite pages, freshness, refetching, retry, query identity.

**Zustand:** UI/client state only.

**Filter Engine:** evaluate tickets locally when local filtering is safe.

**Query Planner:** decide `LOCAL`, `CACHE`, or `SERVER` without hardcoded filter hierarchy.

**Master Cache:** resolve Project/Repository/Employee/Team/Label names from IDs.

**SignalR:** announce domain changes and invalidate/update relevant cached queries.

---

# 2. Core Architecture Principles

## 2.1 One Ticket API, multiple focused database operations

Use one domain-level Ticket query endpoint for Ticket List, Dashboard, Checked Tickets and Ticket views.

Do not create UI-specific endpoints such as DashboardTickets, CheckedTickets and MyTickets unless a future requirement becomes a genuinely different domain operation.

---

## 2.2 Replace the giant SP

Do not keep adding filters, joins, audit, timesheet, summaries and UI-specific logic to the current huge Ticket SP.

Use focused database operations:

- `Get Tickets`
- `Get Ticket Count`
- `Get Ticket Summary`
- `Get Timesheet / Time Summary`
- Optional `Get Detail`
- Optional `Get History / Audit`
- Optional `Get Comments / Activity`

Each operation has one clear responsibility.

---

## 2.3 Server-side dataset operations

The server/database must own operations that determine which records exist in the result set:

- Status
- Repository
- Project
- Team
- Owner
- Assignee
- Label
- Handler
- Battery
- Flags
- Search
- Date range
- Sorting
- Pagination
- Authorization scope

The browser must not download the full ticket table and calculate these over thousands of rows.

---

## 2.4 Safe local filtering

The UI may filter locally only when:

1. The parent cached result is known to be complete.
2. The new query is a strict narrowing of that complete parent query.
3. The local filter semantics are known to be equivalent to server semantics.

Otherwise the Query Planner chooses `SERVER`.

If the exact query already exists in React Query cache and is usable, choose `CACHE`.

---

## 2.5 Master names from client cache

Ticket payloads should primarily contain IDs for reusable reference data:

- ProjectId
- RepositoryId
- OwnerId
- AssigneeIds
- TeamId
- LabelIds
- StatusId
- PriorityId
- HandlerId

Project, repository and employee names should come from existing React Query master caches.

Do not introduce N+1 enrichment queries from the API.

---

## 2.6 SignalR is domain-based

Use domain events such as:

- TicketCreated
- TicketUpdated
- TicketDeleted
- TicketStatusChanged
- TicketAssigned
- TicketTimeUpdated
- ProjectUpdated
- RepositoryUpdated
- EmployeeUpdated

Do not create events coupled to page names such as DashboardTicketUpdated.

---

# 3. Database Architecture

## 3.1 SP 1 – Ticket Page

Example name:

`SP_Ticket_GetPage`

Responsibilities:

- Apply authorization scope.
- Apply all supported server filters.
- Apply sorting.
- Apply pagination.
- Return lightweight Ticket list projection.
- Avoid unnecessary large joins and collections.

The result should contain core fields needed by the Ticket list plus foreign keys.

Do not return full comments, attachments, audit history or full timesheet history in the normal list query.

---

## 3.2 SP 2 – Ticket Count

Example name:

`SP_Ticket_GetCount`

Responsibilities:

- Return total matching records for the exact normalized Ticket query.
- Use the same filtering and authorization semantics as the page query.

`totalCount` must represent the database result set, not the number currently loaded in the browser.

---

## 3.3 SP 3 – Ticket Summary

Example name:

`SP_Ticket_GetSummary`

Responsibilities:

Return global counts such as:

- Open
- Closed
- Hold
- In Queue
- Need Confirmation
- Any future status groups

The summary must not be calculated from only the currently loaded page.

---

## 3.4 SP 4 – Timesheet / Time Summary

Example name:

`SP_Ticket_GetTimeSummary`

Responsibilities:

- Return time-related information only when requested.
- Support date ranges appropriate to the Timesheet screen.
- Return summary-level data for list pages when possible.
- Return detailed entries only for detail views or explicit requests.

The Ticket API can invoke this SP when `includeTimeSummary` / equivalent is requested.

---

## 3.5 Optional focused operations

Add only when required:

- `SP_Ticket_GetDetail`
- `SP_Ticket_GetHistory`
- `SP_Ticket_GetComments`
- `SP_Ticket_GetAttachments`
- `SP_Ticket_GetActivity`

These remain focused operations and should not be folded into the main list SP.

---

# 4. Database Query Strategy

## 4.1 Filter before expensive enrichment

Logical execution order:

```text
All permitted tickets
      |
      v
Filter
      |
      v
Sort
      |
      v
Pagination
      |
      v
Lightweight projection
```

Do not perform large one-to-many joins across the entire Ticket table before pagination.

---

## 4.2 Avoid row multiplication

Do not create large intermediate results such as:

`Ticket x Assignee x Label x Audit x TimeEntry`

Use focused relationship queries or aggregation where necessary.

---

## 4.3 Indexing

Review real execution plans and workload for common access paths such as:

- Status + UpdatedAt
- Project + Status + UpdatedAt
- Repository + Status + UpdatedAt
- Assignee + Status + UpdatedAt
- Owner + Status + UpdatedAt
- Team + Status + UpdatedAt
- Date + Status

Do not create an index for every possible combination without evidence.

---

## 4.4 Authorization

Authorization must be enforced server-side.

Client-side visibility checks must never be the security boundary.

---

# 5. API Architecture

## 5.1 One Ticket query endpoint

Conceptually:

```text
Ticket Query Request
   |
   +-- filters
   +-- sort
   +-- pagination
   +-- include options
   |
   v
Ticket Controller
   |
   v
Ticket Service
   |
   v
Ticket Repository
   |
   +--> Ticket Page SP
   +--> Count SP
   +--> Summary SP
   +--> Time Summary SP (optional)
   |
   v
DTO / Response Shaper
   |
   v
React UI
```

---

## 5.2 Parallel database work

Independent database operations can be executed in controlled parallelism:

```text
              Ticket API
                  |
       +----------+----------+
       |          |          |
       v          v          v
    Ticket      Count      Summary
      SP          SP          SP
                  |
             optional
                  |
             Time SP
```

Wait for all required operations before shaping the final response.

### Important limit

Do not interpret parallel execution as unlimited database concurrency. Measure SQL Server resource usage. If parallel calls create CPU, memory or blocking pressure, control or reduce concurrency.

---

# 6. API Response Shape

Normal Ticket List response should conceptually contain:

```text
items
  TicketId
  TicketNo
  Title
  StatusId
  PriorityId
  Progress
  ProjectId
  RepositoryId
  OwnerId
  AssigneeIds
  TeamId
  LabelIds
  HandlerId
  Flags
  Dates

pagination
  page
  pageSize
  totalCount
  hasNextPage

summary (when requested)

timeSummary (when requested)
```

Keep list responses lightweight.

Do not create one DTO containing every possible Ticket-related object for every screen.

---

# 7. UI Architecture

## 7.1 React Query

React Query owns:

- Ticket list data
- Infinite pages
- Ticket detail
- Optional timesheet data
- Master data
- Query cache
- Fresh/stale state
- Retry/refetch

---

## 7.2 Zustand

Zustand should remain responsible for UI/client state such as:

- Filter-panel UI state
- Selected Ticket
- Display mode
- Temporary UI state
- Other non-server state

---

# 8. Existing Filter Engine + New Query Planner

Do not throw away the current UI filter engine.

Split responsibilities conceptually into two layers.

### Local Filter Evaluator

Determines whether an already-loaded Ticket matches a filter.

### Query Planner

Determines whether the new query can be satisfied locally, from cache, or from the server.

The Query Planner must not contain a hierarchy such as:

`Repository -> Project -> Team -> Owner -> Assignee -> Battery -> Flags -> Handler`

because these are different filter types and the hierarchy will not scale.

---

# 9. Query Planner Decision Model

Every filter change is represented as:

`Previous Query -> Next Query`

The engine evaluates the relationship.

## 9.1 LOCAL

Use local filtering when:

`Current Dataset Complete AND Next Query is a strict subset of Current Query`

---

## 9.2 CACHE

Use cached data when the exact normalized query already exists in React Query cache and its state is acceptable.

---

## 9.3 SERVER

Use server execution when:

- Parent data is partial.
- Filter is removed.
- Filter is replaced by a sibling value.
- Query is broadened.
- Sorting changes.
- Search changes.
- No safe complete parent query exists.
- Local semantics do not exactly match server semantics.

---

# 10. Filter Sequence Example

## Q1

`Status = Open`

Suppose API returns:

`totalCount = 100`

`loaded = 20`

`complete = false`

Adding Repository = TP must go to SERVER.

---

## Q2

`Status = Open + Repository = TP`

Suppose:

`totalCount = 50`

`loaded = 20`

`complete = false`

Adding Project = TP App must go to SERVER.

---

## Q3

`Status = Open + Repository = TP + Project = TP App`

Suppose:

`totalCount = 15`

`loaded = 15`

`complete = true`

Adding Assignee = Bharani can now be LOCAL because Q3 is complete and the new query narrows Q3.

Adding another flag/battery/team filter can also remain local while the same conditions are true.

---

## Changing a filter

`Project = TP App -> Project = CRM App`

This is a replacement/sibling query, not a guaranteed subset.

Use CACHE if the exact CRM query is already available and usable; otherwise SERVER.

---

## Removing a filter

`Open + Repository + Project -> Open + Repository`

The result space expands. Use CACHE if the exact broader query is already available; otherwise SERVER.

---

# 11. Query State and Coverage

Each cached logical query should have coverage metadata conceptually:

- loadedCount
- totalCount
- hasNextPage
- isComplete
- pageSize
- sort identity
- normalized filter identity

Complete means the client knows it has every record belonging to that query.

For a page size of 20:

- `totalCount = 15`, page 1 contains 15, `hasNextPage = false` -> complete.
- `totalCount = 50`, page 1 contains 20, `hasNextPage = true` -> partial.

Never infer completeness simply from the fact that one page contains fewer records than usual unless the server confirms the full result metadata.

---

# 12. Query Normalization

Every query must be canonicalized before it becomes a React Query key.

Normalization should:

- Remove meaningless empty values.
- Sort unordered multi-select IDs.
- Normalize dates.
- Normalize equivalent status selections.
- Normalize sort settings.
- Produce the same key for equivalent queries.

This prevents duplicate caches for logically identical queries.

---

# 13. Master Data Mapping

Existing React Query master caches remain the source for names.

Preferred master data:

- Projects
- Repositories
- Employees
- Teams
- Labels
- Statuses
- Priorities
- Other reusable reference data

Build centralized ID lookup maps rather than performing repeated array `.find()` operations for every Ticket row.

Conceptually:

```text
Project ID -> Project object
Repository ID -> Repository object
Employee ID -> Employee object
```

Then normalization resolves the latest master object.

---

# 14. Why names should not be copied permanently into Ticket cache

Prefer storing Ticket foreign keys in the Ticket response.

When a Project master record changes:

```text
Project SignalR event
       |
       v
Project React Query cache update
       |
       v
Ticket normalization resolves ProjectId again
       |
       v
Ticket UI shows current Project name
```

This avoids stale duplicated master descriptions inside Ticket records.

---

# 15. Infinite Scroll

The current visible-count technique should be replaced by true server pagination.

## Target flow

```text
Initial
   -> page 1

Scroll
   -> page 2

Continue
   -> page 3
```

React Query should own the infinite-page cache.

---

## 15.1 Three-page working window

The requested optimization is:

`previous + current + next`

Use a controlled working window so scrolling is smooth without allowing unbounded pages to accumulate in memory.

A preferred implementation is to keep the current page and prefetch the next page, while retaining the previous page when needed for backward navigation.

If the API contract explicitly returns previous/current/next in one response, enforce strict de-duplication and payload limits so a page-window request cannot become large.

---

## 15.2 Query changes reset pagination

Any change that creates a different logical dataset must reset to page 1:

- Filter replacement
- Filter expansion
- Status change
- Search change
- Sort change
- Date range change

Do not continue page 4 of the old query as page 4 of a new query.

---

# 16. Page Size

Start with 20 records per page, but keep it configurable.

Validate the final value using:

- API latency
- DB latency
- payload size
- browser memory
- DOM/render cost
- scrolling smoothness

---

# 17. API Call Minimization

The target is not zero API calls. The target is the minimum necessary number of calls while preserving correct results.

Use:

- Canonical query keys
- React Query cache
- Query Planner
- Local narrowing when safe
- Debounced search
- Batched multi-filter changes
- Prefetching
- SignalR invalidation

---

# 18. Search and Sorting

Global search must be server-side when it needs to cover records not loaded in the browser.

Text search should be debounced, starting around 300–500 ms and adjusted based on UX testing.

Global sorting must be server-side because sorting a single loaded page cannot establish the correct order of records across all pages.

---

# 19. Status Tabs and Counts

Status tabs are query filters.

Do not calculate global status counts from currently loaded browser rows.

Use the Summary SP for:

- Open
- Closed
- Hold
- In Queue
- Need Confirmation

The count must represent the server-side result set.

---

# 20. Timesheet and History

One Ticket API may support optional expansions.

Normal list:

`includeTimeSummary = false`

Timesheet list:

`includeTimeSummary = true`

Ticket detail may support:

`includeTimeEntries = true`

History/detail may support:

`includeHistory = true`

These options map to focused SP/query operations. They should not make the normal Ticket list response huge.

---

# 21. Caching Strategy

## Ticket data

Suggested starting policy:

- staleTime: approximately 60 seconds
- gcTime: longer than staleTime so useful query branches can be reused

The values must be validated against memory usage and realtime behavior.

## Master data

Keep the existing long-lived strategy for relatively static master data.

SignalR should provide freshness for actual changes; the 60-second Ticket stale period is a fallback, not the realtime mechanism.

---

# 22. SignalR Strategy

Initial safe strategy:

```text
TicketChanged event
       |
       v
Invalidate relevant Ticket list queries
       |
       v
React Query refetches active query
```

Do not initially attempt to manually patch every page of every filtered query.

Later, optimize to targeted cache patching only if measurement proves invalidation/refetch is a bottleneck.

---

# 23. Error and Fallback Strategy

## Normal Ticket request failure

- Keep valid cached data where appropriate.
- Show a clear error/retry state.
- Do not replace useful data with an empty state just because a refresh failed.

## Next page failure

- Keep previous pages visible.
- Show a retry control.
- Do not destroy successfully loaded pages.

## Optional Timesheet failure

If Timesheet is optional, define whether normal Ticket data remains usable while the time section reports an error. Do not silently return incomplete time data as if it were correct.

## Master-data failure

Ticket data should remain usable. Show safe fallback values when a referenced master object is unavailable and allow the master query to retry.

## SignalR failure

The application must continue functioning with normal API/cache behavior. SignalR is the realtime enhancement, not the only source of correctness.

---

# 24. Performance Targets

Treat these as measurable targets under a defined workload.

## API

Target normal Ticket query:

`p95 <= 300 ms`

Measure separately:

- Database time
- Repository time
- Service/response-shaping time
- Serialization time
- Network time

## Payload

Target normal Ticket page:

`<= 1 MB`

Preferably much smaller.

Timesheet/history expansions need separate budgets.

## UI

Target:

- No visible filter freeze.
- No noticeable scroll lag.
- No uncontrolled list rerendering.
- No duplicate requests for the same logical query.
- No full-ticket-dataset memory growth.

---

# 25. Observability and Debugging

Every Ticket request should be traceable.

Log/measure at minimum:

- Correlation ID
- Normalized query identity/hash
- User context
- SP name
- SP duration
- API total duration
- Rows returned
- Payload size
- Cache mode where applicable
- LOCAL/CACHE/SERVER execution decision
- Timesheet include state

Example diagnostic structure:

```text
Ticket Query
------------------------
Ticket SP         85 ms
Count SP          20 ms
Summary SP        18 ms
Time SP           40 ms
DTO shaping        8 ms
Serialization      7 ms
Total             112 ms
Rows               20
Payload           120 KB
```

---

# 26. Reusable Package Structure

Keep truly generic infrastructure centralized.

Conceptual structure:

```text
packages/
|
+-- query-engine/
|    +-- normalization
|    +-- query comparison
|    +-- query keys
|    +-- planner
|
+-- filter-engine/
|    +-- filter definitions
|    +-- local evaluator
|    +-- normalization
|
+-- list-engine/
|    +-- list state
|    +-- pagination
|    +-- infinite query helpers
|
+-- master-data/
|    +-- master query hooks
|    +-- lookup maps
|    +-- normalization helpers
|
+-- realtime/
|    +-- SignalR event handling
|    +-- cache invalidation
|
+-- ticket/
     +-- Ticket-specific query definitions
     +-- API adapter
     +-- Ticket normalizer
```

The exact package names should follow existing WG-Platform conventions.

---

# 27. Zero-Hardcode Principle

Avoid logic such as:

- If Dashboard do X.
- If Checked do Y.
- If Repository call API.
- If Assignee filter locally.
- If Project call another API.

Instead:

```text
View declares query
      |
      v
Filter definition declares semantics
      |
      v
Query Planner compares old/new query
      |
      v
LOCAL / CACHE / SERVER
```

A future module should only need its query/filter definitions and database operations while reusing the platform engine.

---

# 28. Phase 0 – Baseline and Contract Freeze

## Objective

Measure the current system before changing behavior.

## Tasks

Record:

- Current giant SP duration
- SQL CPU
- Logical reads
- Memory grant/usage
- API duration
- Response payload size
- Browser memory impact
- Ticket row count returned
- Filter behavior
- Sort behavior
- Status counts
- Infinite scroll behavior
- SignalR behavior

Capture representative queries for:

- Open
- Closed
- Project
- Repository
- Assignee
- Multi-filter
- Timesheet
- Checked Tickets
- Dashboard

## Automated tests

Create baseline functional regression tests for current expected behavior.

## Manual tests

Run the existing UI and record known functional/performance problems.

## Exit criteria

Baseline metrics are captured and the new API/DB query contract is agreed.

---

# 29. Phase 1 – Database Decomposition

## Objective

Replace the huge Ticket retrieval procedure with focused SPs.

## Tasks

Create:

- Ticket GetPage
- Ticket Count
- Ticket Summary
- Ticket Time Summary

Implement server-side:

- filters
- sorting
- pagination
- authorization

Review indexes using actual execution plans.

## Automated tests

At minimum:

1. Open status
2. Closed status
3. Repository filter
4. Project filter
5. Team filter
6. Owner filter
7. Assignee filter
8. Label filter
9. Handler filter
10. Battery filter
11. Flag filter
12. Date filter
13. Combined filters
14. Sorting
15. Page 1
16. Middle page
17. Last page
18. Empty result
19. Count accuracy
20. Authorization exclusion

## Manual tests

Run representative queries in staging.

Inspect:

- execution plan
- duration
- logical reads
- CPU
- rows returned
- correctness against old SP

## Exit criteria

Focused SPs are functionally correct and materially reduce unnecessary data retrieval/work.

---

# 30. Phase 2 – Ticket API

## Objective

Introduce the new Ticket query endpoint.

## Tasks

Implement:

- request validation
- query normalization
- repository execution
- controlled parallel SP execution
- DTO mapping
- response shaping
- structured errors
- correlation logging
- optional Timesheet support
- optional Summary support

## Automated tests

Test:

1. Default query
2. Status query
3. Repository query
4. Project query
5. Team query
6. Owner query
7. Assignee query
8. Combined filters
9. Search
10. Sort
11. Pagination
12. Count
13. Summary
14. Timesheet include
15. Invalid filter
16. Invalid page
17. Unauthorized request
18. DB error
19. Timeout
20. Optional-operation failure behavior
21. Parallel execution behavior

## Manual tests

Use an API client/browser Network panel.

Verify:

- request query
- response shape
- response time
- payload size
- total count
- summary counts
- optional time data

Compare with old behavior.

## Exit criteria

New API is functionally complete without depending on the giant Ticket SP.

---

# 31. Phase 3 – UI Data Layer Migration

## Objective

Move Ticket screens from full-data retrieval to server pagination.

## Tasks

Introduce/restructure:

- useTicketList
- Ticket query normalization
- Ticket React Query keys
- Infinite query integration
- Lightweight Ticket normalization
- Master cache lookup

Remove assumptions that the browser contains all tickets.

## Automated tests

Test:

- First page
- Next page
- Last page
- Empty result
- Cache reuse
- Cache isolation
- Error/retry
- Master lookup
- Missing master fallback

## Manual tests

Verify:

- Ticket List
- Dashboard My Tickets
- Checked Tickets
- Timesheet
- Loading states
- Empty states
- Error states
- Scrolling
- Refresh

## Exit criteria

No full Ticket dataset is loaded into browser memory for normal list pages.

---

# 32. Phase 4 – Master Data Mapping

## Objective

Resolve reference names through existing React Query master caches.

## Tasks

Use cached:

- Project
- Repository
- Employee
- Team
- Label
- Status
- Priority

Build centralized lookup maps.

## Automated tests

Test correct Project, Repository, Owner, Assignee, Team and Label resolution, including missing-master cases.

## Manual tests

Change a Project name and verify the Ticket UI updates through the master cache flow without requiring Ticket enrichment requests.

## Exit criteria

No repeated API/DB enrichment is required for standard master names.

---

# 33. Phase 5 – Query Planner / Hybrid Filter Engine

## Objective

Add generic LOCAL/CACHE/SERVER query decisions.

## Tasks

Implement:

- filter definition metadata
- normalized query representation
- query comparison
- narrowing detection
- broadening detection
- replacement detection
- parent query coverage
- exact-query cache detection
- local filter integration
- server query generation

## Automated tests

### Complete parent + narrowing

- Add Assignee -> LOCAL
- Add Flag -> LOCAL
- Add Battery -> LOCAL
- Add Team -> LOCAL

### Partial parent

- Add Assignee -> SERVER
- Add Project -> SERVER

### Replacement

- Project A -> Project B -> SERVER/CACHE
- Repository A -> Repository B -> SERVER/CACHE
- Open -> Closed -> SERVER/CACHE

### Expansion

- Remove Project -> SERVER/CACHE
- Remove Repository -> SERVER/CACHE
- Clear filters -> SERVER/CACHE

### Cache

- Exact fresh query -> CACHE
- Equivalent normalized query -> same key

### Multi-select

Validate OR/AND semantics and range semantics.

## Manual test sequence

```text
Q1: Open
Q2: Open + Repository TP
Q3: Q2 + Project TP App
Q4: Q3 + Assignee Bharani
Q5: Q4 + Flag
Q6: Project TP App -> CRM App
Q7: Repository TP -> another repository
Q8: Remove Project
Q9: Clear filters
```

Verify Network requests against the expected planner decision.

## Exit criteria

Filter behavior requires no filter-name hierarchy or page-specific hardcode.

---

# 34. Phase 6 – Infinite Scroll / Page Window

## Objective

Replace current visible-count loading with true server-driven infinite pagination.

## Tasks

Implement:

- page loading
- next-page prefetch
- previous-page retention where useful
- optional three-page working window
- duplicate prevention
- end-of-data handling
- page reset on query change

## Automated tests

1. Initial page
2. Next page
3. Third page
4. End of data
5. Query filter change resets page
6. Sort change resets page
7. Duplicate page prevention
8. Next-page failure keeps previous pages
9. Retry next page
10. Cached next page reuse

## Manual tests

Scroll through 20, 40, 60 and 100+ records.

Verify:

- no duplicates
- no skipped rows
- correct order
- no jumpy scroll
- no uncontrolled memory growth
- correct filter behavior

## Exit criteria

Infinite scroll is server-driven and stable.

---

# 35. Phase 7 – Counts and Summary

## Objective

Move global status counts away from browser data.

## Tasks

Implement Summary SP/API behavior.

Ensure summary uses the same base filter semantics as the Ticket query, excluding/reinterpreting status as required by the product definition.

## Automated tests

Verify all status groups and filtered combinations.

## Manual tests

Load only one page of a large dataset and verify counts still represent the full matching database set.

## Exit criteria

Counts are never derived from only the visible browser page.

---

# 36. Phase 8 – Timesheet and History Expansions

## Objective

Add secondary Ticket data without recreating the giant SP.

## Tasks

Implement optional:

- Time Summary
- Detailed Time Entries
- History/Audit
- Detail-specific expansions

## Automated tests

Verify normal list excludes heavy data and explicit expansion returns correct data.

## Manual tests

Compare Timesheet totals and History content against the current application.

## Exit criteria

Timesheet and History work through focused database operations without inflating the normal Ticket list.

---

# 37. Phase 9 – SignalR Integration

## Objective

Make realtime updates compatible with paginated React Query data.

## Tasks

Support relevant Ticket and master-data events.

Start with safe cache invalidation rather than complex page-by-page mutation.

## Automated tests

Test:

- Ticket update
- Status change
- Owner change
- Assignee change
- Time update
- Master update
- reconnect
- duplicate events where applicable
- multiple clients

## Manual tests

Use two browser sessions.

Change Ticket data in one session and verify the other session updates.

Change Project/Employee master data and verify Ticket display names update.

## Exit criteria

Realtime behavior is correct and does not create request storms.

---

# 38. Phase 10 – Performance Engineering

## Objective

Meet defined latency, payload and UI performance targets.

## Automated performance workloads

Test:

- Small result set
- Medium result set
- Large result set
- Heavy filter combinations
- Timesheet mode
- High-concurrency access
- Repeated cached queries
- Realtime update load

Measure:

- p50
- p95
- p99
- DB CPU
- logical reads
- memory grants
- API CPU/memory
- payload size
- UI render time

## Acceptance targets

Normal Ticket query:

`p95 <= 300 ms` under the agreed test workload.

Normal Ticket payload:

`<= 1 MB`, preferably much smaller.

No visible scrolling/filter lag in agreed browser/device test conditions.

## Manual tests

Use browser DevTools:

- Network
- Performance
- Memory

Confirm no 70+ MB full Ticket response and no repeated duplicate requests.

## Exit criteria

Performance targets are achieved or formally accepted with documented evidence.

---

# 39. Phase 11 – Resilience and Failure Testing

## Scenarios

### Database unavailable

Expected:

- Structured API error
- No UI crash
- Retry path

### Count or summary failure

Decide whether the operation is mandatory or degradable. Never silently present incorrect counts.

### Timesheet failure

If optional, normal Ticket data can remain usable while time data reports an error.

### Next page failure

Previously loaded pages remain visible.

### SignalR disconnect

Normal API and cache behavior continues.

### Slow network

Existing data remains usable while new data loads.

---

# 40. Phase 12 – Migration and Cutover

## Stage 1 – Side-by-side validation

Run old and new paths simultaneously for comparison.

Compare:

- Ticket IDs
- total counts
- status counts
- sorting
- filters
- Timesheet values
- detail/history values

## Stage 2 – Move Ticket List

Switch the main Ticket page to the new path.

## Stage 3 – Move Dashboard

Move My Tickets and related Ticket views.

## Stage 4 – Move Checked Tickets

Validate checked-specific filtering.

## Stage 5 – Move Timesheet

Validate time behavior and payload.

## Stage 6 – Rollback readiness

Keep the old path available temporarily until the new path has been stable for the agreed production period.

## Stage 7 – Retirement

Remove the giant SP/path only after performance, correctness and production stability are demonstrated.

---

# 41. Complete Manual Testing Matrix

## Ticket list

Test every filter:

- Status
- Repository
- Project
- Team
- Owner
- Assignee
- Label
- Handler
- Battery
- Flags
- Search
- Date
- Sort

## Filter combinations

At minimum:

- Status + Repository
- Status + Project
- Status + Assignee
- Repository + Project
- Project + Team
- Project + Owner
- Repository + Assignee
- Multiple filters
- Remove one filter
- Remove all filters
- Replace one filter
- Multi-select filters

## Pagination boundaries

Test:

- 0 records
- 1 record
- 19 records
- 20 records
- 21 records
- 39 records
- 40 records
- 41 records
- 100+
- exact last page
- partial last page

## Query Planner

For each test capture:

```text
Query transition
Expected mode
Actual mode
Network request happened?
Cache used?
Rows shown
Total count
```

## Master data

Change Project, Repository, Employee and Team names and verify dependent Ticket UI updates.

## SignalR

Test status, owner, assignee, progress, due date, time and master-data changes from another session.

---

# 42. Automated Test Pyramid

## Database tests

Focus on:

- filter correctness
- pagination correctness
- sort correctness
- count correctness
- authorization

## API unit tests

Focus on:

- validation
- normalization
- orchestration
- mapping
- error behavior

## API integration tests

Focus on:

- real database interaction
- combined filters
- parallel SP execution
- optional expansions

## UI unit tests

Focus on:

- filter evaluator
- query planner
- query normalization
- query keys
- master lookup
- normalization

## UI integration tests

Focus on:

- React Query
- infinite scroll
- cache reuse
- filter transitions
- errors/retry

## E2E tests

Focus on complete user flows:

- Dashboard
- Ticket List
- Checked Tickets
- Timesheet
- Ticket Detail
- SignalR

---

# 43. Regression Gate After Every Phase

Before the next phase starts, rerun:

- Authentication
- Dashboard
- Ticket List
- Checked Tickets
- Timesheet
- Ticket Detail
- Master data
- SignalR
- Navigation
- Permissions
- Error handling

No phase can progress if a previous feature has regressed.

---

# 44. Naming and Maintainability

Recommended conceptual names:

### API

- TicketController
- TicketService
- TicketRepository
- TicketQuery
- TicketListDto
- TicketDetailDto
- TicketSummaryDto
- TicketTimeSummaryDto

### UI

- useTicketList
- useTicket
- TicketQueryPlanner
- TicketQueryNormalizer
- TicketNormalizer
- TicketFilterDefinitions

### Database

- SP_Ticket_GetPage
- SP_Ticket_GetCount
- SP_Ticket_GetSummary
- SP_Ticket_GetTimeSummary
- SP_Ticket_GetDetail
- SP_Ticket_GetHistory

Avoid generic names such as `GetData`, `CommonSP`, `FinalSP`, `NewSP`, or `GodSP`.

---

# 45. Comments and Code Organization

Comments should explain decisions, not repeat syntax.

Useful comments explain:

- why a query is parallelized
- why local filtering is safe
- why a filter must go server-side
- why a cache is invalidated
- why a specific index is needed
- why an optional expansion is kept out of the normal list

Prefer reusable helper functions over duplicated page-level logic.

Do not move every helper into a shared package automatically. Promote only genuinely reusable abstractions.

---

# 46. What Must Not Happen

Do not create:

- One giant Ticket SP.
- One giant Ticket DTO with every related object.
- N+1 master-data calls.
- A global array containing the full Ticket table.
- Browser-calculated global counts.
- Browser-only global sorting after server pagination.
- Browser-only authorization as the security boundary.
- Hardcoded filter hierarchy.
- Unlimited parallel SP execution.
- Unlimited retained infinite-scroll pages.

---

# 47. Final End-to-End Flow

## Normal Ticket List

```text
User opens Ticket page
        |
        v
Default query: Status = Open
        |
        v
Query Planner
        |
        v
SERVER / CACHE
        |
        v
Ticket API
        |
        +---- Ticket Page SP
        +---- Count SP
        +---- Summary SP
        |
        v
Lightweight Ticket DTO
        |
        v
React Query
        |
        +---- Project master cache
        +---- Repository master cache
        +---- Employee master cache
        |
        v
Normalizer / view-model mapping
        |
        v
Ticket UI
```

## Safe local narrowing

```text
Current complete cached query
        |
        v
User adds narrowing filter
        |
        v
Query Planner
        |
        v
LOCAL
        |
        v
Local Filter Evaluator
        |
        v
UI
```

## Expanded/replaced query

```text
Filter removed/replaced
        |
        v
Query Planner
        |
        +---- exact query cached -> CACHE
        |
        +---- otherwise -> SERVER
```

## Infinite scroll

```text
Page 1
  |
  +--> prefetch Page 2
  |
  v
Page 2 becomes active
  |
  +--> prefetch Page 3
```

## Realtime

```text
Domain change
    |
    v
SignalR
    |
    v
React Query invalidation/update
    |
    v
Active query refetch
    |
    v
Normalizer
    |
    v
UI
```

---

# 48. Final Phase Order

```text
Phase 0  Baseline + contract freeze
      |
Phase 1  Database decomposition
      |
Phase 2  Ticket API
      |
Phase 3  UI data migration
      |
Phase 4  Master data mapping
      |
Phase 5  Query Planner / hybrid filters
      |
Phase 6  Infinite Scroll / page window
      |
Phase 7  Counts / Summary
      |
Phase 8  Timesheet / History expansions
      |
Phase 9  SignalR
      |
Phase 10 Performance
      |
Phase 11 Resilience
      |
Phase 12 Cutover
```

Every arrow is a hard quality gate: **automated tests + manual tests + regression + acceptance sign-off before proceeding.**

---

# 49. Definition of Done – Entire System

## Database

- Focused Ticket SPs exist.
- No giant Ticket retrieval SP is required.
- Filters execute server-side.
- Sorting executes server-side.
- Pagination executes server-side.
- Counts are correct.
- Summary is correct.
- Authorization is enforced.
- Execution plans and indexes have been reviewed.

## API

- One Ticket query endpoint supports all required Ticket views.
- Optional Timesheet/History operations are supported.
- Independent operations use controlled parallelism.
- DTO shaping is consistent.
- Structured errors exist.
- Correlation logging exists.
- No N+1 master enrichment.

## UI

- Ticket lists use server pagination.
- Infinite scroll is stable.
- React Query caches normalized queries.
- Master data is resolved from cache.
- Filter planner correctly chooses LOCAL/CACHE/SERVER.
- Filters reset pagination where required.
- Sorting resets pagination.
- Loading/empty/error/retry states work.

## Realtime

- Ticket changes propagate.
- Master-data changes propagate.
- Reconnect works.
- No request storms occur.

## Performance

- Normal query meets p95 target.
- Payload is within budget.
- Browser memory is controlled.
- No visible scroll/filter lag.
- No unnecessary duplicate API calls.

## Testing

- Database tests pass.
- API unit/integration tests pass.
- UI unit/integration tests pass.
- E2E tests pass.
- Manual regression passes.
- Performance tests pass.
- Failure/recovery tests pass.
- No unresolved P0/P1 defects remain.

---

# 50. Final Architecture Principle

> **The UI describes the Ticket query.**
>
> **The Query Planner determines whether that query can be satisfied from a complete cached parent, an exact cached query, or the server.**
>
> **The Ticket API orchestrates focused database operations.**
>
> **SQL performs filtering, sorting, pagination and aggregation close to the data.**
>
> **The API shapes lightweight DTOs.**
>
> **React Query owns server-state caching.**
>
> **Master caches resolve reusable reference data.**
>
> **SignalR announces domain changes.**
>
> **Shared packages provide reusable infrastructure without becoming another God-level abstraction.**
>
> This architecture should be reusable for future WG-NEST modules with the same query, filter, pagination, caching, realtime, testing and observability pattern.
