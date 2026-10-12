/* =============================================================================
   ALL DB changes of 2026-10-12 — one file (WG_APP_TEST1 first, then WG_APP)
   -----------------------------------------------------------------------------
   Run order matters (each part is idempotent / safe to re-run):
     PART 1  scripts\ticket_v2_list_sp.sql
             TicketListQueryDef seed + TicketListV2_Base, GetTicketList_V2,
             GetTicketListCounts_V2, GetTicketDetail_V2, GetTicketTags_V2
     PART 2  scripts\timesheet_v2_sp.sql
             TicketHistory indexes + GetTimesheet_V2 (needs TicketListV2_Base
             from part 1)
     PART 3  scripts\banner_active_only_sp.sql
             GetBannerMessage with @ActiveOnly

   No USE: the database comes from sqlcmd -d.
     sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P <password> -C -b -i scripts\db_changes_2026-10-12.sql
     sqlcmd -S WGSQLSAP -d WG_APP       -U sa -P <password> -C -b -i scripts\db_changes_2026-10-12.sql
   ============================================================================= */

/* ############################################################################
   PART 1 — ticket_v2_list_sp.sql
   ############################################################################ */
PRINT N'PART 1 - ticket_v2_list_sp.sql';
GO

/* =============================================================================
   Ticket V2 — slim ticket LIST + COUNTS SPs with dynamic filters/sort/paging
   (WG_APP_TEST1 first, then WG_APP; safe to re-run)

   Creates
     1. dbo.TicketListQueryDef      — whitelist of filters (Kind 'F'), sorts
                                      (Kind 'S') and count facets (Kind 'C').
     2. dbo.TicketListV2_Base       — shared security scope + APPLY text, so
                                      list and counts can never disagree.
     3. dbo.GetTicketList_V2        — one page of tickets  (API key "TicketListV2").
     4. dbo.GetTicketListCounts_V2  — total + per-value counts for every filter
                                      dropdown / status tab (API key
                                      "TicketListCountsV2").
     5. dbo.GetTicketDetail_V2      — one ticket with the ticket screen / edit
                                      form columns (API key "TicketDetailV2");
                                      role 3 gets the client view only.
     6. dbo.GetTicketTags_V2        — id / code / title / owner / repo of every
                                      visible ticket for the "#" pickers (API
                                      key "TicketTagsV2").

   Why
     The list only needs ids + a few scalars. Names (employee, repo, project,
     team, label, status) are mapped in the UI from masters it already holds,
     so these SPs join NO master tables. All four share TicketListV2_Base, so
     security can't drift between them.
     With paging the UI no longer holds every ticket, so dropdown / tab counts
     come from GetTicketListCounts_V2 instead of being counted in the browser.

   Parameters (API side never changes when a filter is added)
     @Role, @UserId  — injected by the API from the JWT (IdentityParams).
     @RepoIds        — CSV of allowed repo ids, injected by the API for Role 3
                       (security scope, one call for all repos so paging works).
     @RepoId         — optional single repo (repo page / old fan-out).
     @Filters        — ONE JSON string built by the UI:
       {
         "f":      { "<filterKey>": [values...], ... },  -- every value an array
         "sort":   [ { "key": "<sortKey>", "dir": "asc|desc" }, ... ],
         "page":   1,                                    -- list only, 1-based
         "size":   50,                                   -- list only, max 500;
                                                         -- omit = all rows
         "facets": ["repo","status"]                     -- counts only; omit = all
       }
       e.g. {"f":{"status":[1,2],"owner":["__no_owner__"],"label":[4]},
             "sort":[{"key":"dueDate","dir":"asc"}],"page":2,"size":50}

   Adding a new filter / sort / count = INSERT one row into
   dbo.TicketListQueryDef. No SP change, no API change, no deploy. SqlText is
   trusted SQL written by a developer; '{V}' in a filter is replaced with
   OPENJSON(@Filters, '$.f."<key>"') so values are read from the parameter at
   run time and are NEVER concatenated into the SQL. Unknown keys are ignored.
   OPENJSON's value column is BIN2 collation: compare it to a text column with
   "value COLLATE DATABASE_DEFAULT" (see priority / search).

   Counts (facets)
     A facet row (Kind 'C') is a SELECT returning column "v" — the value(s) of
     that facet for ticket T0 (one row, or several for labels / assignees).
     Each facet is counted with every active filter EXCEPT the filter with the
     same key, so the Status tabs show all statuses and a multi-select dropdown
     still shows counts for the options not ticked yet. Facet values use the
     same format as the filter values (lower-case guids, ints as text,
     "__no_owner__", flag / battery names), so the UI can match them directly.
     Row "total" = tickets matching all filters (= the list's total rows).

   Output of the list (one row per ticket)
     Label_Ids, Assignee_Ids, Handler_Ids are comma-separated lower-case ids
     (UI splits and maps names from its masters). Assignee_Ids = work-stream
     resources (the owner is Assignee_Id). A NULL Move_to is sent as the empty
     guid so the UI shows it as "WorkGlow Solutions", as the old SP did; the
     handler / assignee filters treat the empty guid as NULL to match.
     TotalConsumeMinutes is minutes (INT); the UI formats it as H:MM.
     Description, HtmlDesc, the Web / Functional / Technical / Client times,
     CurrentStatusSummary and Streams_JSON (work streams with their hand-offs,
     ids only) are always NULL in the list; GetTicketDetail_V2 fills them.

   Visibility enforced here (was UI-only in isAllowedToView)
     private / status 19 tickets → only owner or active work-stream assignee.
     Role 3 → RaiseToClient = 1 only, only its repos (no repo = no rows),
     thread count / last comment use client-visible (toClient) threads only.
   ============================================================================= */

-- No USE: the database comes from sqlcmd -d (WG_APP_TEST1 first, then WG_APP)
--   sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P <password> -C -b -i scripts\ticket_v2_list_sp.sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ---------------------------------------------------------------------------
   1. Whitelist table
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.TicketListQueryDef', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TicketListQueryDef
    (
        Kind      CHAR(1)        NOT NULL,   -- 'F' filter, 'S' sort, 'C' count facet
        QueryKey  NVARCHAR(50)   NOT NULL,   -- key the UI sends
        SqlText   NVARCHAR(MAX)  NOT NULL,   -- predicate / sort expression / facet SELECT
        IsActive  BIT            NOT NULL CONSTRAINT DF_TicketListQueryDef_IsActive DEFAULT (1),
        Notes     NVARCHAR(500)  NULL,
        CONSTRAINT PK_TicketListQueryDef PRIMARY KEY (Kind, QueryKey),
        CONSTRAINT CK_TicketListQueryDef_Kind CHECK (Kind IN ('F', 'S', 'C')),
        -- key is embedded in a JSON path / literal: letters, digits, underscore only
        CONSTRAINT CK_TicketListQueryDef_Key CHECK (QueryKey NOT LIKE N'%[^A-Za-z0-9_]%' AND LEN(QueryKey) > 0)
    );
END
GO

-- Table created by the first version only allowed 'F' / 'S'.
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_TicketListQueryDef_Kind'
             AND definition NOT LIKE N'%''C''%')
BEGIN
    ALTER TABLE dbo.TicketListQueryDef DROP CONSTRAINT CK_TicketListQueryDef_Kind;
    ALTER TABLE dbo.TicketListQueryDef ADD CONSTRAINT CK_TicketListQueryDef_Kind
        CHECK (Kind IN ('F', 'S', 'C'));
END
GO

/* ---------------------------------------------------------------------------
   2. Seed filters, sorts and facets (re-runnable: updates existing rows)

   Aliases available to SqlText:
     T0  ISSUEMASTER
     TS  thread stats   (ThreadCount, TotalConsumeMinutes, LastThreadAt)
     LP  latest active progress log (Percentage)
     U   U.UpdatedAt  = greater of ticket / last thread update
   --------------------------------------------------------------------------- */
MERGE dbo.TicketListQueryDef AS D
USING (VALUES
    -- ── Filters ──────────────────────────────────────────────────────────
    ('F', N'issue',    N'T0.Issue_Id IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})',
                       N'Ticket ids (realtime row refresh)'),
    ('F', N'repo',     N'T0.RepoId IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})',
                       N'Repo filter'),
    ('F', N'project',  N'T0.Project_Id IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})',
                       N'Project filter'),
    ('F', N'status',   N'T0.Status IN (SELECT TRY_CAST(value AS INT) FROM {V})',
                       N'Status ids'),
    ('F', N'priority', N'T0.Priority IN (SELECT value COLLATE DATABASE_DEFAULT FROM {V})',
                       N'Priority text'),
    ('F', N'label',    N'EXISTS (SELECT 1 FROM ISSUE_LABELS IL
                                 WHERE IL.Issue_Id = T0.Issue_Id
                                   AND IL.Label_Id IN (SELECT TRY_CAST(value AS INT) FROM {V}))',
                       N'Label ids (any match)'),
    ('F', N'owner',    N'T0.Assignee_Id IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})
                         OR (T0.Assignee_Id IS NULL AND EXISTS (SELECT 1 FROM {V} WHERE value = N''__no_owner__''))',
                       N'Owner (main assignee) ids; "__no_owner__" = no owner'),
    ('F', N'assignee', N'EXISTS (SELECT 1 FROM WorkStreams WS
                                 WHERE WS.IssueId = T0.Issue_Id
                                   AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                                   AND WS.ResourceId IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V}))
                         OR EXISTS (SELECT 1 FROM IssueMoveTo M
                                 WHERE M.Issue_Id = T0.Issue_Id
                                   AND ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'')
                                       IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V}))',
                       N'Work-stream assignee ids, or handler repo ids (viewer "Assignee" filter)'),
    ('F', N'team',     N'EXISTS (SELECT 1 FROM EmployeeMaster E
                                 WHERE E.EmployeeID = T0.Assignee_Id
                                   AND E.Team IN (SELECT TRY_CAST(value AS INT) FROM {V}))',
                       N'Owner team ids'),
    ('F', N'handler',  N'EXISTS (SELECT 1 FROM IssueMoveTo M
                                 WHERE M.Issue_Id = T0.Issue_Id
                                   AND ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'')
                                       IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V}))',
                       N'Handler (moved-to) repo ids; empty guid = NULL Move_to'),
    ('F', N'member',   N'T0.Assignee_Id IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})
                         OR T0.CreatedBy IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V})
                         OR EXISTS (SELECT 1 FROM WorkStreams WS
                                 WHERE WS.IssueId = T0.Issue_Id
                                   AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                                   AND WS.ResourceId IN (SELECT TRY_CAST(value AS UNIQUEIDENTIFIER) FROM {V}))',
                       N'Owner, creator or assignee (old @EmployeeId: dashboard, meeting scheduler)'),
    ('F', N'flag',     N'EXISTS (SELECT 1 FROM {V} F WHERE
                              (F.value = N''isCloseRequested''  AND T0.IsCloseRequested = 1)
                           OR (F.value = N''priorityRequest''   AND T0.PriorityRequest = 1)
                           OR (F.value = N''funcResponse''      AND T0.FuncResponse = 1)
                           OR (F.value = N''webResponse''       AND T0.WebResponse = 1)
                           OR (F.value = N''technicalResponse'' AND T0.TechnicalResponse = 1)
                           OR (F.value = N''adminResponse''     AND T0.AdminResponse = 1)
                           OR (F.value = N''raiseToClient''     AND T0.RaiseToClient = 1)
                           OR (F.value = N''allFlags'' AND (T0.IsCloseRequested = 1 OR T0.PriorityRequest = 1
                                 OR T0.FuncResponse = 1 OR T0.WebResponse = 1 OR T0.TechnicalResponse = 1
                                 OR T0.AdminResponse = 1 OR T0.RaiseToClient = 1)))',
                       N'Special flags; "allFlags" = any flag'),
    ('F', N'battery',  N'EXISTS (SELECT 1 FROM {V} B
                                 CROSS APPLY (SELECT ISNULL(LP.Percentage, 0) AS P) X WHERE
                              (B.value = N''0-20''   AND X.P >= 0  AND X.P <= 20)
                           OR (B.value = N''21-40''  AND X.P > 20  AND X.P <= 40)
                           OR (B.value = N''41-60''  AND X.P > 40  AND X.P <= 60)
                           OR (B.value = N''61-80''  AND X.P > 60  AND X.P <= 80)
                           OR (B.value = N''81-100'' AND X.P > 80  AND X.P <= 100))',
                       N'Overall % buckets'),
    ('F', N'search',   N'EXISTS (SELECT 1 FROM {V} Q
                                 WHERE T0.Issue_Code LIKE N''%'' + Q.value COLLATE DATABASE_DEFAULT + N''%''
                                    OR T0.Title      LIKE N''%'' + Q.value COLLATE DATABASE_DEFAULT + N''%'')',
                       N'Free text on code / title (each value is one term, any match)'),

    -- ── Sorts (SP appends ASC/DESC) ─────────────────────────────────────
    ('S', N'flagsFirst', N'CASE
                             WHEN T0.Assignee_Id = @UserId AND T0.IsCloseRequested = 1 THEN 1
                             WHEN T0.PriorityRequest = 1 OR T0.FuncResponse = 1 OR T0.WebResponse = 1
                               OR T0.TechnicalResponse = 1 OR T0.AdminResponse = 1 THEN 1
                             ELSE 0 END',
                         N'Flagged tickets first (default, with updatedAt desc)'),
    ('S', N'updatedAt',  N'U.UpdatedAt',                 N'Last update incl. threads'),
    ('S', N'createdAt',  N'T0.CreatedAt',                N'Created date'),
    ('S', N'dueDate',    N'T0.Due_Date',                 N'Due date'),
    ('S', N'priority',   N'T0.Priority',                 N'Priority text'),
    ('S', N'title',      N'T0.Title',                    N'Title'),
    ('S', N'code',       N'T0.SiNo',                     N'Ticket number'),
    ('S', N'battery',    N'ISNULL(LP.Percentage, 0)',    N'Overall %'),
    ('S', N'consumed',   N'TS.TotalConsumeMinutes',      N'Logged time'),
    ('S', N'threads',    N'TS.ThreadCount',              N'Thread count'),
    -- Due buckets (sort "asc", then "dueDate" asc); no due date always last
    ('S', N'dueOverdueFirst',  N'CASE WHEN T0.Due_Date IS NULL THEN 9
                                     WHEN CAST(T0.Due_Date AS DATE) < CAST(GETDATE() AS DATE) THEN 1
                                     WHEN CAST(T0.Due_Date AS DATE) = CAST(GETDATE() AS DATE) THEN 2
                                     ELSE 3 END',
                               N'Due: overdue, today, upcoming'),
    ('S', N'dueTodayFirst',    N'CASE WHEN T0.Due_Date IS NULL THEN 9
                                     WHEN CAST(T0.Due_Date AS DATE) = CAST(GETDATE() AS DATE) THEN 1
                                     WHEN CAST(T0.Due_Date AS DATE) < CAST(GETDATE() AS DATE) THEN 2
                                     ELSE 3 END',
                               N'Due: today, overdue, upcoming'),
    ('S', N'dueUpcomingFirst', N'CASE WHEN T0.Due_Date IS NULL THEN 9
                                     WHEN CAST(T0.Due_Date AS DATE) > CAST(GETDATE() AS DATE) THEN 1
                                     WHEN CAST(T0.Due_Date AS DATE) = CAST(GETDATE() AS DATE) THEN 2
                                     ELSE 3 END',
                               N'Due: upcoming, today, overdue'),

    -- ── Count facets: SELECT ... AS v  (value format = filter value format) ─
    ('C', N'repo',     N'SELECT LOWER(CAST(T0.RepoId AS CHAR(36))) AS v',
                       N'Repositories dropdown'),
    ('C', N'project',  N'SELECT LOWER(CAST(T0.Project_Id AS CHAR(36))) AS v',
                       N'Projects dropdown'),
    ('C', N'status',   N'SELECT CAST(T0.Status AS NVARCHAR(20)) AS v',
                       N'Status tabs'),
    ('C', N'priority', N'SELECT T0.Priority AS v',
                       N'Priority'),
    ('C', N'label',    N'SELECT CAST(IL.Label_Id AS NVARCHAR(20)) AS v
                         FROM ISSUE_LABELS IL WHERE IL.Issue_Id = T0.Issue_Id',
                       N'Labels dropdown'),
    ('C', N'owner',    N'SELECT ISNULL(LOWER(CAST(T0.Assignee_Id AS CHAR(36))), N''__no_owner__'') AS v',
                       N'Owners dropdown'),
    ('C', N'assignee', N'SELECT LOWER(CAST(WS.ResourceId AS CHAR(36))) AS v
                         FROM WorkStreams WS
                         WHERE WS.IssueId = T0.Issue_Id
                           AND WS.ResourceId IS NOT NULL
                           AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                         UNION
                         SELECT LOWER(CAST(ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'') AS CHAR(36)))
                         FROM IssueMoveTo M WHERE M.Issue_Id = T0.Issue_Id',
                       N'Assignees dropdown (work-stream resources + handler repos)'),
    ('C', N'team',     N'SELECT CAST(E.Team AS NVARCHAR(20)) AS v
                         FROM EmployeeMaster E WHERE E.EmployeeID = T0.Assignee_Id',
                       N'Teams dropdown (owner team)'),
    ('C', N'handler',  N'SELECT LOWER(CAST(ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'') AS CHAR(36))) AS v
                         FROM IssueMoveTo M WHERE M.Issue_Id = T0.Issue_Id',
                       N'Handler dropdown'),
    ('C', N'flag',     N'SELECT F.v FROM (VALUES
                             (N''isCloseRequested'',  T0.IsCloseRequested),
                             (N''priorityRequest'',   T0.PriorityRequest),
                             (N''funcResponse'',      T0.FuncResponse),
                             (N''webResponse'',       T0.WebResponse),
                             (N''technicalResponse'', T0.TechnicalResponse),
                             (N''adminResponse'',     T0.AdminResponse),
                             (N''raiseToClient'',     T0.RaiseToClient),
                             (N''allFlags'', CASE WHEN T0.IsCloseRequested = 1 OR T0.PriorityRequest = 1
                                   OR T0.FuncResponse = 1 OR T0.WebResponse = 1 OR T0.TechnicalResponse = 1
                                   OR T0.AdminResponse = 1 OR T0.RaiseToClient = 1 THEN 1 ELSE 0 END)
                         ) F (v, b) WHERE F.b = 1',
                       N'Flags dropdown'),
    ('C', N'battery',  N'SELECT CASE
                             WHEN B.P >= 0  AND B.P <= 20  THEN N''0-20''
                             WHEN B.P > 20  AND B.P <= 40  THEN N''21-40''
                             WHEN B.P > 40  AND B.P <= 60  THEN N''41-60''
                             WHEN B.P > 60  AND B.P <= 80  THEN N''61-80''
                             WHEN B.P > 80  AND B.P <= 100 THEN N''81-100''
                           END AS v
                         FROM (SELECT ISNULL(LP.Percentage, 0) AS P) B',
                       N'Battery dropdown')
) AS S (Kind, QueryKey, SqlText, Notes)
ON D.Kind = S.Kind AND D.QueryKey = S.QueryKey
WHEN MATCHED THEN
    UPDATE SET SqlText = S.SqlText, Notes = S.Notes
WHEN NOT MATCHED THEN
    INSERT (Kind, QueryKey, SqlText, Notes) VALUES (S.Kind, S.QueryKey, S.SqlText, S.Notes);
GO

/* ---------------------------------------------------------------------------
   3. Shared pieces (one place for the security scope and the APPLYs)

   @Where      — fixed security predicates ("AND ..." lines) for alias T0.
   @Applies    — TS / LP / U APPLYs for alias T0.
   @Columns    — the row's SELECT list (list + detail SPs share one row
                 shape, so the API maps both with GetTicketListRow).
                 Needs @Applies and @RowApplies in the FROM.
   @RowApplies — LT APPLY (latest comment); only for the returned rows.
   All reference @Role, @UserId, @RepoId, @RepoIds: pass those to
   sp_executesql with exactly these names.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [dbo].[TicketListV2_Base]
(
    @Role       INT,
    @RepoId     UNIQUEIDENTIFIER = NULL,
    @RepoIds    NVARCHAR(MAX)    = NULL,
    @Where      NVARCHAR(MAX) OUTPUT,
    @Applies    NVARCHAR(MAX) OUTPUT,
    @Columns    NVARCHAR(MAX) = NULL OUTPUT,
    @RowApplies NVARCHAR(MAX) = NULL OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    SET @Where = CAST(N'' AS NVARCHAR(MAX));

    IF @RepoId IS NOT NULL
        SET @Where += N'
          AND T0.RepoId = @RepoId';

    IF NULLIF(@RepoIds, N'') IS NOT NULL
        SET @Where += N'
          AND T0.RepoId IN (SELECT TRY_CAST(TRIM(value) AS UNIQUEIDENTIFIER)
                            FROM STRING_SPLIT(@RepoIds, N'',''))';

    IF @Role = 3
    BEGIN
        SET @Where += N'
          AND T0.RaiseToClient = 1';

        -- A client with no repo scope sees nothing (the API always sends one).
        IF @RepoId IS NULL AND NULLIF(@RepoIds, N'') IS NULL
            SET @Where += N'
          AND 1 = 0';
    END

    SET @Where += N'
          AND (
                (ISNULL(T0.IsPrivate, 0) = 0 AND ISNULL(T0.Status, 0) <> 19)
             OR T0.Assignee_Id = @UserId
             OR EXISTS (SELECT 1 FROM WorkStreams WS
                        WHERE WS.IssueId = T0.Issue_Id
                          AND WS.ResourceId = @UserId
                          AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17))
          )';

    SET @Applies = CAST(N'' AS NVARCHAR(MAX)) + N'
        -- Thread stats for this ticket only, one pass over
        -- IX_ISSUETHREADS_IssueId_UpdatedAt (covers Hours, toClient).
        -- Unused columns are dropped by the optimizer.
        -- TeamConsumeMinutes: hours logged by staff only (client hours excluded).
        OUTER APPLY (
            SELECT
                COUNT(CASE WHEN @Role <> 3 OR IT.toClient = 1 THEN 1 END) AS ThreadCount,
                SUM(H.Minutes) AS TotalConsumeMinutes,
                SUM(CASE WHEN EM.EmployeeID IS NOT NULL THEN H.Minutes END) AS TeamConsumeMinutes,
                MAX(IT.UpdatedAt) AS LastThreadAt
            FROM ISSUETHREADS IT
            CROSS APPLY (
                SELECT CASE WHEN IT.Hours LIKE ''%:%'' THEN
                           TRY_CAST(LEFT(IT.Hours, CHARINDEX('':'', IT.Hours) - 1) AS INT) * 60
                         + TRY_CAST(SUBSTRING(IT.Hours, CHARINDEX('':'', IT.Hours) + 1, 50) AS INT)
                       END AS Minutes
            ) H
            LEFT JOIN EMPLOYEEMASTER EM ON EM.EmployeeID = IT.CreatedBy
            WHERE IT.Issue_Id = T0.Issue_Id
        ) TS

        -- Latest active progress log
        OUTER APPLY (
            SELECT TOP 1 TPL.Percentage
            FROM TicketProgressLogs TPL
            WHERE TPL.Issue_Id = T0.Issue_Id
              AND TPL.IsActive = 1
            ORDER BY TPL.CreatedAt DESC
        ) LP

        CROSS APPLY (
            SELECT CASE
                       WHEN TS.LastThreadAt IS NULL OR T0.UpdatedAt > TS.LastThreadAt
                       THEN T0.UpdatedAt
                       ELSE TS.LastThreadAt
                   END AS UpdatedAt
        ) U';

    SET @Columns = CAST(N'' AS NVARCHAR(MAX)) + N'
            T0.Issue_Id,
            T0.Issue_Code,
            T0.Title,
            T0.Status              AS StatusId,
            T0.Priority,
            T0.IsPrivate,
            T0.RaiseToClient,
            T0.ProjKey,
            T0.RepoKey,
            T0.Project_Id,
            T0.RepoId,
            T0.Assignee_Id,
            T0.CreatedBy,
            T0.CreatedAt,
            T0.UpdatedBy,
            U.UpdatedAt,
            T0.Due_Date,
            T0.Hours,
            T0.CompletionPct,
            ISNULL(LP.Percentage, 0) AS OverallPercentage,
            T0.IsCloseRequested,
            T0.PriorityRequest,
            T0.FuncResponse,
            T0.WebResponse,
            T0.TechnicalResponse,
            T0.AdminResponse,
            T0.ReopenedBy,
            ISNULL(TS.ThreadCount, 0) AS ThreadCount,
            TS.TotalConsumeMinutes,
            TS.TeamConsumeMinutes,
            LEFT(LT.CommentText, 300) AS commenttext,
            (
                SELECT STRING_AGG(CAST(IL.Label_Id AS VARCHAR(12)), '','')
                FROM ISSUE_LABELS IL
                WHERE IL.Issue_Id = T0.Issue_Id
            ) AS Label_Ids,
            (
                SELECT STRING_AGG(LOWER(CAST(X.ResourceId AS CHAR(36))), '','')
                FROM (
                    SELECT DISTINCT WS.ResourceId
                    FROM WorkStreams WS
                    WHERE WS.IssueId = T0.Issue_Id
                      AND WS.ResourceId IS NOT NULL
                      AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                ) X
            ) AS Assignee_Ids,
            (
                SELECT STRING_AGG(LOWER(CAST(ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'') AS CHAR(36))), '','')
                FROM IssueMoveTo M
                WHERE M.Issue_Id = T0.Issue_Id
            ) AS Handler_Ids';

    SET @RowApplies = CAST(N'' AS NVARCHAR(MAX)) + N'
        -- Latest thread comment (clients: latest client-visible thread)
        OUTER APPLY (
            SELECT TOP 1 IT.CommentText
            FROM ISSUETHREADS IT
            WHERE IT.Issue_Id = T0.Issue_Id
              AND (@Role <> 3 OR IT.toClient = 1)
            ORDER BY IT.UpdatedAt DESC, IT.ThreadId DESC
        ) LT';
END
GO

/* ---------------------------------------------------------------------------
   4. List SP — one page
   --------------------------------------------------------------------------- */
/*
set statistics io on
set statistics time on
  EXEC GetTicketList_V2 @DbName = 'wg_app', @Role = 1,
       @UserId = '00000000-0000-0000-0000-000000000000',
       @Filters = N'{"f":{"status":[1,2]},"sort":[{"key":"updatedAt","dir":"desc"}],"page":1,"size":50}';
set statistics io off
set statistics time off
*/
CREATE OR ALTER PROCEDURE [dbo].[GetTicketList_V2]
(
    @DbName  NVARCHAR(255)    = NULL,   -- always sent by the API; unused
    @Role    INT,
    @UserId  UNIQUEIDENTIFIER = NULL,
    @RepoId  UNIQUEIDENTIFIER = NULL,
    @RepoIds NVARCHAR(MAX)    = NULL,
    @Filters NVARCHAR(MAX)    = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Filters IS NOT NULL AND ISJSON(@Filters) = 0
        THROW 50001, N'GetTicketList_V2: @Filters is not valid JSON.', 1;

    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX), @order NVARCHAR(MAX),
            @columns NVARCHAR(MAX), @rowApplies NVARCHAR(MAX);

    EXEC dbo.TicketListV2_Base @Role, @RepoId, @RepoIds, @where OUTPUT, @applies OUTPUT,
                               @columns OUTPUT, @rowApplies OUTPUT;

    -- ── Dynamic filters: whitelisted keys with a non-empty array ────────
    SELECT @where += ISNULL(STRING_AGG(
               CAST(N'
          AND (' + REPLACE(D.SqlText, N'{V}',
                           N'OPENJSON(@Filters, N''$.f."' + D.QueryKey + N'"'')') + N')'
                    AS NVARCHAR(MAX)), N'')
           WITHIN GROUP (ORDER BY D.QueryKey), N'')
    FROM OPENJSON(JSON_QUERY(@Filters, N'$.f')) J
    JOIN dbo.TicketListQueryDef D
      ON D.Kind = 'F'
     AND D.IsActive = 1
     AND D.QueryKey = J.[key] COLLATE DATABASE_DEFAULT
    WHERE J.[type] = 4                               -- array
      AND EXISTS (SELECT 1 FROM OPENJSON(J.value));  -- not empty

    -- ── Dynamic sort: whitelisted keys, first occurrence wins ───────────
    SELECT @order = STRING_AGG(
               CAST(D.SqlText + CASE WHEN S.Dir = N'asc' THEN N' ASC' ELSE N' DESC' END
                    AS NVARCHAR(MAX)), N',
            ')
           WITHIN GROUP (ORDER BY S.Ord)
    FROM (
        SELECT
            CAST(A.[key] AS INT)                                   AS Ord,
            JSON_VALUE(A.value, N'$.key') COLLATE DATABASE_DEFAULT AS SortKey,
            LOWER(JSON_VALUE(A.value, N'$.dir'))                   AS Dir,
            ROW_NUMBER() OVER (PARTITION BY JSON_VALUE(A.value, N'$.key')
                               ORDER BY CAST(A.[key] AS INT))      AS Rn
        FROM OPENJSON(JSON_QUERY(@Filters, N'$.sort')) A
        WHERE A.[type] = 5                                   -- object
    ) S
    JOIN dbo.TicketListQueryDef D
      ON D.Kind = 'S'
     AND D.IsActive = 1
     AND D.QueryKey = S.SortKey
    WHERE S.Rn = 1;

    IF @order IS NULL   -- default: flagged first, then latest update
        SET @order = N'CASE
                WHEN T0.Assignee_Id = @UserId AND T0.IsCloseRequested = 1 THEN 1
                WHEN T0.PriorityRequest = 1 OR T0.FuncResponse = 1 OR T0.WebResponse = 1
                  OR T0.TechnicalResponse = 1 OR T0.AdminResponse = 1 THEN 1
                ELSE 0 END DESC,
            U.UpdatedAt DESC';

    -- ── Paging: "size" missing = all rows (realtime refresh, old callers) ─
    DECLARE @size BIGINT = TRY_CAST(JSON_VALUE(@Filters, N'$.size') AS BIGINT);
    DECLARE @page BIGINT = TRY_CAST(JSON_VALUE(@Filters, N'$.page') AS BIGINT);
    DECLARE @skip BIGINT = 0, @take BIGINT = 2147483647;

    IF @size IS NOT NULL
    BEGIN
        IF @size < 1   SET @size = 1;
        IF @size > 500 SET @size = 500;
        IF @page IS NULL OR @page < 1 SET @page = 1;
        IF @page > 1000000 SET @page = 1000000;
        SET @skip = (@page - 1) * @size;
        SET @take = @size;
    END

    -- Phase 1 picks the page's ids (only filter/sort work over all rows);
    -- phase 2 builds the heavy columns for those ids only.
    CREATE TABLE #pg (RowNo BIGINT NOT NULL PRIMARY KEY, Issue_Id UNIQUEIDENTIFIER NOT NULL);

    DECLARE @sql NVARCHAR(MAX) = CAST(N'' AS NVARCHAR(MAX)) + N'
        INSERT #pg (RowNo, Issue_Id)
        SELECT X.RowNo, X.Issue_Id
        FROM (
            SELECT
                T0.Issue_Id,
                ROW_NUMBER() OVER (ORDER BY ' + @order + N', T0.Issue_Id) AS RowNo
            FROM ISSUEMASTER T0' + @applies + N'
            WHERE 1 = 1' + @where + N'
        ) X
        WHERE X.RowNo >  @skip
          AND X.RowNo <= @skip + @take;

        -- Detail columns are NULL here (GetTicketDetail_V2 fills them): one
        -- row shape for both SPs; the API leaves null fields out of the JSON.
        SELECT' + @columns + N',
            CAST(NULL AS NVARCHAR(MAX)) AS Description,
            CAST(NULL AS NVARCHAR(MAX)) AS HtmlDesc,
            CAST(NULL AS NVARCHAR(100)) AS Web,
            CAST(NULL AS NVARCHAR(100)) AS Functional,
            CAST(NULL AS NVARCHAR(100)) AS Technical,
            CAST(NULL AS NVARCHAR(100)) AS Client,
            CAST(NULL AS NVARCHAR(MAX)) AS CurrentStatusSummary,
            CAST(NULL AS NVARCHAR(MAX)) AS Streams_JSON
        FROM #pg P
        JOIN ISSUEMASTER T0 ON T0.Issue_Id = P.Issue_Id' + @applies + @rowApplies + N'
        ORDER BY P.RowNo;';

    EXEC sp_executesql
        @sql,
        N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @RepoIds NVARCHAR(MAX),
          @Filters NVARCHAR(MAX), @skip BIGINT, @take BIGINT',
        @Role, @UserId, @RepoId, @RepoIds, @Filters, @skip, @take;
END
GO

/* ---------------------------------------------------------------------------
   5. Counts SP — total + per-value counts for every facet

   Output: Id (Facet:Value), Facet, Value, Cnt
     Facet 'total'  → Value NULL, Cnt = rows matching all filters
     Facet '<key>'  → one row per value, counted without the '<key>' filter

   How: each active filter is evaluated once into #pass. A ticket counts for
   facet K if it passes every filter, or fails only filter K (#c.MissKey).
   --------------------------------------------------------------------------- */
/*
  EXEC GetTicketListCounts_V2 @DbName = 'wg_app', @Role = 1,
       @UserId = '00000000-0000-0000-0000-000000000000',
       @Filters = N'{"f":{"status":[1]}}';
*/
CREATE OR ALTER PROCEDURE [dbo].[GetTicketListCounts_V2]
(
    @DbName  NVARCHAR(255)    = NULL,   -- always sent by the API; unused
    @Role    INT,
    @UserId  UNIQUEIDENTIFIER = NULL,
    @RepoId  UNIQUEIDENTIFIER = NULL,
    @RepoIds NVARCHAR(MAX)    = NULL,
    @Filters NVARCHAR(MAX)    = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Filters IS NOT NULL AND ISJSON(@Filters) = 0
        THROW 50001, N'GetTicketListCounts_V2: @Filters is not valid JSON.', 1;

    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX), @sql NVARCHAR(MAX);
    DECLARE @params NVARCHAR(500) = N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER,
                                      @RepoIds NVARCHAR(MAX), @Filters NVARCHAR(MAX)';

    EXEC dbo.TicketListV2_Base @Role, @RepoId, @RepoIds, @where OUTPUT, @applies OUTPUT;

    CREATE TABLE #s    (Issue_Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);
    CREATE TABLE #af   (QueryKey NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL PRIMARY KEY,
                        SqlText  NVARCHAR(MAX) NOT NULL);
    CREATE TABLE #pass (Issue_Id UNIQUEIDENTIFIER NOT NULL,
                        QueryKey NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL,
                        PRIMARY KEY (Issue_Id, QueryKey));
    CREATE TABLE #c    (Issue_Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        MissKey  NVARCHAR(50) COLLATE DATABASE_DEFAULT NULL);
    CREATE TABLE #out  (Facet NVARCHAR(50)  COLLATE DATABASE_DEFAULT NOT NULL,
                        Value NVARCHAR(200) COLLATE DATABASE_DEFAULT NULL,
                        Cnt   INT NOT NULL);

    -- Active filters (same rule as the list SP)
    INSERT #af (QueryKey, SqlText)
    SELECT DISTINCT D.QueryKey, D.SqlText
    FROM OPENJSON(JSON_QUERY(@Filters, N'$.f')) J
    JOIN dbo.TicketListQueryDef D
      ON D.Kind = 'F'
     AND D.IsActive = 1
     AND D.QueryKey = J.[key] COLLATE DATABASE_DEFAULT
    WHERE J.[type] = 4
      AND EXISTS (SELECT 1 FROM OPENJSON(J.value));

    DECLARE @n INT = (SELECT COUNT(*) FROM #af);

    -- Visible tickets, then which filters each one passes
    SET @sql = CAST(N'' AS NVARCHAR(MAX)) + N'
        INSERT #s (Issue_Id)
        SELECT T0.Issue_Id
        FROM ISSUEMASTER T0
        WHERE 1 = 1' + @where + N';';

    SELECT @sql += ISNULL(STRING_AGG(CAST(N'
        INSERT #pass (Issue_Id, QueryKey)
        SELECT T0.Issue_Id, N''' + A.QueryKey + N'''
        FROM #s S
        JOIN ISSUEMASTER T0 ON T0.Issue_Id = S.Issue_Id' + @applies + N'
        WHERE (' + REPLACE(A.SqlText, N'{V}',
                           N'OPENJSON(@Filters, N''$.f."' + A.QueryKey + N'"'')') + N');'
               AS NVARCHAR(MAX)), N''), N'')
    FROM #af A;

    EXEC sp_executesql @sql, @params, @Role, @UserId, @RepoId, @RepoIds, @Filters;

    -- Keep tickets failing at most one filter; remember which one
    INSERT #c (Issue_Id, MissKey)
    SELECT
        S.Issue_Id,
        CASE WHEN X.PassCnt = @n THEN NULL
             ELSE (SELECT TOP 1 A.QueryKey FROM #af A
                   WHERE NOT EXISTS (SELECT 1 FROM #pass P
                                     WHERE P.Issue_Id = S.Issue_Id
                                       AND P.QueryKey = A.QueryKey))
        END
    FROM #s S
    CROSS APPLY (SELECT COUNT(*) AS PassCnt FROM #pass P WHERE P.Issue_Id = S.Issue_Id) X
    WHERE X.PassCnt >= @n - 1;

    INSERT #out (Facet, Value, Cnt)
    SELECT N'total', NULL, COUNT(*) FROM #c WHERE MissKey IS NULL;

    -- Facets: all active ones, or only those listed in "facets"
    DECLARE @allFacets BIT =
        CASE WHEN EXISTS (SELECT 1 FROM OPENJSON(JSON_QUERY(@Filters, N'$.facets'))) THEN 0 ELSE 1 END;

    SET @sql = NULL;
    SELECT @sql = STRING_AGG(CAST(N'
        INSERT #out (Facet, Value, Cnt)
        SELECT N''' + D.QueryKey + N''', CAST(X.v AS NVARCHAR(200)), COUNT(DISTINCT T0.Issue_Id)
        FROM #c C
        JOIN ISSUEMASTER T0 ON T0.Issue_Id = C.Issue_Id' + @applies + N'
        CROSS APPLY (' + D.SqlText + N') X
        WHERE (C.MissKey IS NULL OR C.MissKey = N''' + D.QueryKey + N''')
          AND X.v IS NOT NULL
        GROUP BY CAST(X.v AS NVARCHAR(200));'
               AS NVARCHAR(MAX)), N'')
    FROM dbo.TicketListQueryDef D
    WHERE D.Kind = 'C'
      AND D.IsActive = 1
      AND (@allFacets = 1
           OR D.QueryKey IN (SELECT value COLLATE DATABASE_DEFAULT
                             FROM OPENJSON(JSON_QUERY(@Filters, N'$.facets'))));

    IF @sql IS NOT NULL
        EXEC sp_executesql @sql, @params, @Role, @UserId, @RepoId, @RepoIds, @Filters;

    SELECT
        Facet + N':' + ISNULL(Value, N'') AS Id,
        Facet,
        Value,
        Cnt
    FROM #out
    ORDER BY Facet, Cnt DESC, Value;
END
GO

/* ---------------------------------------------------------------------------
   6. Detail SP — one ticket (ticket screen, edit form, realtime row refresh)

   API key "TicketDetailV2", param IssueId. Same security as the list
   (TicketListV2_Base) and the same row shape (GetTicketListRow), but a
   primary-key seek: no filter JSON, no sort, no paging temp table.

   Role 3 (client) gets the client view only: the ticket, its labels,
   handlers ("Move To", required by the client edit form) and the
   client-visible thread count / latest comment. Owner, assignees, work
   streams, due date, estimates, logged / team times, progress and the
   internal request flags come back NULL / 0. (The API's ticket update keeps
   those fields unchanged for clients, so a client save can't clear them.)
   --------------------------------------------------------------------------- */
/*
set statistics io on
set statistics time on
  EXEC GetTicketDetail_V2 @DbName = 'wg_app', @Role = 1,
       @UserId = '00000000-0000-0000-0000-000000000000',
       @IssueId = '00000000-0000-0000-0000-000000000000';
set statistics io off
set statistics time off
*/
CREATE OR ALTER PROCEDURE [dbo].[GetTicketDetail_V2]
(
    @DbName  NVARCHAR(255)    = NULL,   -- always sent by the API; unused
    @Role    INT,
    @UserId  UNIQUEIDENTIFIER = NULL,
    @RepoId  UNIQUEIDENTIFIER = NULL,
    @RepoIds NVARCHAR(MAX)    = NULL,
    @IssueId UNIQUEIDENTIFIER = NULL    -- missing = no row
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX),
            @columns NVARCHAR(MAX), @rowApplies NVARCHAR(MAX), @select NVARCHAR(MAX);

    EXEC dbo.TicketListV2_Base @Role, @RepoId, @RepoIds, @where OUTPUT, @applies OUTPUT,
                               @columns OUTPUT, @rowApplies OUTPUT;

    IF @Role = 3
        SET @select = CAST(N'' AS NVARCHAR(MAX)) + N'
            T0.Issue_Id,
            T0.Issue_Code,
            T0.Title,
            T0.Status                         AS StatusId,
            T0.Priority,
            CAST(NULL AS BIT)                 AS IsPrivate,
            T0.RaiseToClient,
            T0.ProjKey,
            T0.RepoKey,
            T0.Project_Id,
            T0.RepoId,
            CAST(NULL AS UNIQUEIDENTIFIER)    AS Assignee_Id,
            T0.CreatedBy,
            T0.CreatedAt,
            CAST(NULL AS UNIQUEIDENTIFIER)    AS UpdatedBy,
            U.UpdatedAt,
            CAST(NULL AS DATETIME)            AS Due_Date,
            CAST(NULL AS NVARCHAR(50))        AS Hours,
            CAST(NULL AS DECIMAL(18, 2))      AS CompletionPct,
            CAST(NULL AS DECIMAL(18, 2))      AS OverallPercentage,
            CAST(0 AS BIT)                    AS IsCloseRequested,
            CAST(0 AS BIT)                    AS PriorityRequest,
            CAST(0 AS BIT)                    AS FuncResponse,
            CAST(0 AS BIT)                    AS WebResponse,
            CAST(0 AS BIT)                    AS TechnicalResponse,
            CAST(0 AS BIT)                    AS AdminResponse,
            CAST(NULL AS UNIQUEIDENTIFIER)    AS ReopenedBy,
            ISNULL(TS.ThreadCount, 0)         AS ThreadCount,   -- toClient threads only
            CAST(NULL AS INT)                 AS TotalConsumeMinutes,
            CAST(NULL AS INT)                 AS TeamConsumeMinutes,
            LEFT(LT.CommentText, 300)         AS commenttext,   -- toClient threads only
            (
                SELECT STRING_AGG(CAST(IL.Label_Id AS VARCHAR(12)), '','')
                FROM ISSUE_LABELS IL
                WHERE IL.Issue_Id = T0.Issue_Id
            ) AS Label_Ids,
            CAST(NULL AS NVARCHAR(MAX))       AS Assignee_Ids,
            (
                SELECT STRING_AGG(LOWER(CAST(ISNULL(M.Move_to, ''00000000-0000-0000-0000-000000000000'') AS CHAR(36))), '','')
                FROM IssueMoveTo M
                WHERE M.Issue_Id = T0.Issue_Id
            ) AS Handler_Ids,
            T0.Description,
            T0.HtmlDesc,
            CAST(NULL AS NVARCHAR(100))       AS Web,
            CAST(NULL AS NVARCHAR(100))       AS Functional,
            CAST(NULL AS NVARCHAR(100))       AS Technical,
            CAST(NULL AS NVARCHAR(100))       AS Client,
            CAST(NULL AS NVARCHAR(MAX))       AS CurrentStatusSummary,
            CAST(NULL AS NVARCHAR(MAX))       AS Streams_JSON';
    ELSE
        SET @select = @columns + N',
            T0.Description,
            T0.HtmlDesc,
            T0.Web,
            T0.Functional,
            T0.Technical,
            T0.Client,
            (
                SELECT TOP 1 TPL.StatusSummary
                FROM TicketProgressLogs TPL
                WHERE TPL.Issue_Id = T0.Issue_Id
                  AND TPL.IsActive = 1
                ORDER BY TPL.CreatedAt DESC
            ) AS CurrentStatusSummary,
            -- Active work streams + their hand-offs; names come from the masters
            (
                SELECT
                    WS.ResourceId AS Assignee_Id,
                    WS.StreamName AS Assignee_Type,
                    WS.StreamId,
                    WS.StreamStatus,
                    WS.CompletionPct,
                    WS.TargetDate,
                    WS.ThreadId,
                    WS.ParentThreadId,
                    (
                        SELECT
                            WH.HandsOffId,
                            WH.IssueId,
                            WH.SourceStreamId,
                            WH.TargetStreamId,
                            WH.InitiatingThreadId,
                            WH.Status,
                            WH.CompletionPct,
                            WH.ResolvedByHandOffId,
                            WH.CreatedBy,
                            WH.CreatedAt
                        FROM WorkStreamHandOffs WH
                        WHERE WH.IssueId = T0.Issue_Id
                          AND WH.SourceStreamId = WS.StreamId
                        FOR JSON PATH
                    ) AS HandOffData
                FROM WorkStreams WS
                WHERE WS.IssueId = T0.Issue_Id
                  AND WS.ResourceId IS NOT NULL
                  AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                FOR JSON PATH, INCLUDE_NULL_VALUES
            ) AS Streams_JSON';

    DECLARE @sql NVARCHAR(MAX) = CAST(N'' AS NVARCHAR(MAX)) + N'
        SELECT' + @select + N'
        FROM ISSUEMASTER T0' + @applies + @rowApplies + N'
        WHERE T0.Issue_Id = @IssueId' + @where + N';';

    EXEC sp_executesql
        @sql,
        N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @RepoIds NVARCHAR(MAX),
          @IssueId UNIQUEIDENTIFIER',
        @Role, @UserId, @RepoId, @RepoIds, @IssueId;
END
GO

/* ---------------------------------------------------------------------------
   7. Tags SP — "#" ticket pickers (chat tags, editor mentions)

   API key "TicketTagsV2". Every visible ticket (same security as the list),
   five columns, no APPLYs: one cheap scan, a small payload the UI caches and
   searches in the browser. Optional @RepoId = one repo (editor mentions).
   Assignee_Id (owner, for the chat-tag notification) is NULL for clients.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [dbo].[GetTicketTags_V2]
(
    @DbName  NVARCHAR(255)    = NULL,   -- always sent by the API; unused
    @Role    INT,
    @UserId  UNIQUEIDENTIFIER = NULL,
    @RepoId  UNIQUEIDENTIFIER = NULL,
    @RepoIds NVARCHAR(MAX)    = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX);

    -- Only @where is used; it references T0 alone (no APPLY aliases).
    EXEC dbo.TicketListV2_Base @Role, @RepoId, @RepoIds, @where OUTPUT, @applies OUTPUT;

    DECLARE @sql NVARCHAR(MAX) = CAST(N'' AS NVARCHAR(MAX)) + N'
        SELECT
            T0.Issue_Id,
            T0.Issue_Code,
            T0.Title,
            CASE WHEN @Role = 3 THEN NULL ELSE T0.Assignee_Id END AS Assignee_Id,
            T0.RepoId
        FROM ISSUEMASTER T0
        WHERE 1 = 1' + @where + N'
        ORDER BY T0.UpdatedAt DESC, T0.Issue_Id;';

    EXEC sp_executesql
        @sql,
        N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @RepoIds NVARCHAR(MAX)',
        @Role, @UserId, @RepoId, @RepoIds;
END
GO

/* ############################################################################
   PART 2 — timesheet_v2_sp.sql
   ############################################################################ */
PRINT N'PART 2 - timesheet_v2_sp.sql';
GO

/* =============================================================================
   dbo.GetTimesheet_V2 — timesheet ENTRIES only, no ticket data
   (WG_APP_TEST1 first, then WG_APP; safe to re-run)

   Why
     dbo.DashBoardTimesheetData copied the ticket columns (title, repo,
     project, labels, progress ...) into every row. Now this SP returns the
     timesheet entries only; the Timesheet tab loads the tickets themselves
     from GetTicketList_V2 with the "issue" filter (same as Checked Tickets),
     so title, labels, hours, battery and visibility come from one place.
     Employee / repo / project names are mapped in the UI from the masters.

   Needs dbo.TicketListV2_Base (scripts\ticket_v2_list_sp.sql): the same
   security scope as the ticket list (private / status 19 tickets only for
   their owner and assignees).

   Parameters
     @Role, @UserId  — injected by the API from the JWT (IdentityParams).
     @EmployeeID     — NULL = every employee.
     @FromDate, @ToDate — inclusive days.

   One row per entry (EntryType)
     WORK    — work-log thread with its hours.
     MEETING — meeting thread (ThreadType 'Meeting' / MeetingId set), written
               when the meeting is completed, with its hours.
     STATUS  — ticket closed / reopened WITHOUT a thread (edit screen /
               status change). Minutes NULL.
     Action  — 'C' closed / 'R' reopened, on the STATUS row or on the WORK /
               MEETING thread that closed / reopened the ticket (TicketHistory
               row with that ThreadId). NULL = plain entry.

     Ticket 1 created Oct 1, work logged daily, meeting Oct 5, closed Oct 10,
     reopened Oct 12 without a thread:
       Oct 1-4  WORK
       Oct 5    WORK + MEETING
       Oct 10   WORK, Action 'C' (closed with that thread)  — or, closed
                from the edit screen: WORK + STATUS 'C' (no work that day:
                STATUS 'C' only)
       Oct 12   STATUS 'R'
     Every close / reopen is a row of its own day, so a later reopen never
     hides an earlier close.

   Who / when
     A thread counts for its author (CreatedBy) and every co-contributor
     (ThreadCoContributors; meeting attendees marked present), one row each
     with the full hours (IsCoContributor = 1 for the co-contributors).
     STATUS rows count for the person who closed / reopened (ActorId).
     WorkDate = the day the work happened: From_Time (a completed meeting's
     thread has From_Time on the meeting day even when completed later),
     CreatedAt when there's no From_Time. STATUS rows: the event's CreatedAt.

   Columns
     Id (unique, "T:<ThreadId>:<EmployeeId>" / "H:<history id>"), EntryType,
     Action, Issue_Id, ThreadId, MeetingId, EmployeeId, IsCoContributor,
     WorkDate, EventAt, From_Time, To_Time, Minutes (INT), NewStatusId,
     Comment (first 1000 chars), CurrentStatusSummary (ticket's latest
     progress summary, shown in the timesheet tree).

   dbo.DashBoardTimesheetData stays for the API build still deployed; drop it
   after the new API (config key "TimesheetV2" → GetTimesheet_V2) is live.
   ============================================================================= */

-- No USE: the database comes from sqlcmd -d (WG_APP_TEST1 first, then WG_APP)
--   sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P <password> -C -b -i scripts\timesheet_v2_sp.sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* Thread close / reopen lookup and the direct close / reopen rows */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_TicketHistory_ThreadId_FieldName'
                 AND object_id = OBJECT_ID(N'dbo.TicketHistory'))
    CREATE NONCLUSTERED INDEX IX_TicketHistory_ThreadId_FieldName
        ON dbo.TicketHistory (ThreadId, FieldName)
        INCLUDE (IssueId, ActorId, CreatedAt);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_TicketHistory_FieldName_CreatedAt'
                 AND object_id = OBJECT_ID(N'dbo.TicketHistory'))
    CREATE NONCLUSTERED INDEX IX_TicketHistory_FieldName_CreatedAt
        ON dbo.TicketHistory (FieldName, CreatedAt)
        INCLUDE (IssueId, ActorId, ThreadId);
GO

/*
set statistics io on
set statistics time on
  EXEC GetTimesheet_V2 @DbName = 'wg_app', @Role = 1,
       @UserId = '00000000-0000-0000-0000-000000000000',
       @EmployeeID = NULL, @FromDate = '2026-10-01', @ToDate = '2026-10-12';
set statistics io off
set statistics time off
*/
CREATE OR ALTER PROCEDURE [dbo].[GetTimesheet_V2]
(
    @DbName     NVARCHAR(255)    = NULL,   -- always sent by the API; unused
    @Role       INT,
    @UserId     UNIQUEIDENTIFIER = NULL,
    @EmployeeID UNIQUEIDENTIFIER = NULL,
    @FromDate   DATE,
    @ToDate     DATE
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @FromDate IS NULL OR @ToDate IS NULL
        THROW 50001, N'GetTimesheet_V2: @FromDate and @ToDate are required.', 1;

    -- Visibility only (no repo scope: the key is staff-only)
    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX);
    EXEC dbo.TicketListV2_Base @Role, NULL, NULL, @where OUTPUT, @applies OUTPUT;

    -- TicketHistory TH → close / reopen action + new status; a malformed
    -- MetaJson gives NULLs instead of failing the whole call
    DECLARE @meta NVARCHAR(MAX) = N'
                SELECT
                    CASE WHEN ISJSON(TH.MetaJson) = 1
                         THEN JSON_VALUE(TH.MetaJson, ''$.action'') END                    AS Act,
                    CASE WHEN ISJSON(TH.MetaJson) = 1
                         THEN TRY_CAST(JSON_VALUE(TH.MetaJson, ''$.newState.id'') AS INT) END AS NewStatusId';

    DECLARE @sql NVARCHAR(MAX) = CAST(N'' AS NVARCHAR(MAX)) + N'
        DECLARE @from DATETIME2 = @FromDate,
                @to   DATETIME2 = DATEADD(DAY, 1, CAST(@ToDate AS DATETIME2));

        WITH Entries AS (
            -- ── Threads: work log + meetings, one row per person ──────────
            SELECT
                CONCAT(N''T:'', IT.ThreadId, N'':'', LOWER(CAST(P.EmployeeId AS CHAR(36)))) AS Id,
                CASE WHEN IT.ThreadType = ''Meeting'' OR IT.MeetingId IS NOT NULL
                     THEN ''MEETING'' ELSE ''WORK'' END     AS EntryType,
                CH.Action,
                IT.Issue_Id,
                IT.ThreadId,
                IT.MeetingId,
                P.EmployeeId,
                P.IsCoContributor,
                CAST(D.WorkAt AS DATE)                      AS WorkDate,
                D.WorkAt                                    AS EventAt,
                IT.From_Time,
                IT.To_Time,
                H.Minutes,
                CH.NewStatusId,
                LEFT(IT.CommentText, 1000)                  AS Comment
            FROM ISSUETHREADS IT
            JOIN ISSUEMASTER T0 ON T0.Issue_Id = IT.Issue_Id
            CROSS APPLY (SELECT ISNULL(IT.From_Time, IT.CreatedAt) AS WorkAt) D
            CROSS APPLY (
                SELECT CASE WHEN IT.Hours LIKE ''%:%'' THEN
                           TRY_CAST(LEFT(IT.Hours, CHARINDEX('':'', IT.Hours) - 1) AS INT) * 60
                         + TRY_CAST(SUBSTRING(IT.Hours, CHARINDEX('':'', IT.Hours) + 1, 50) AS INT)
                       END AS Minutes
            ) H
            CROSS APPLY (
                SELECT IT.CreatedBy AS EmployeeId, CAST(0 AS BIT) AS IsCoContributor
                UNION ALL
                SELECT TCC.EmployeeId, CAST(1 AS BIT)
                FROM ThreadCoContributors TCC
                WHERE TCC.ThreadId = IT.ThreadId
                  AND TCC.EmployeeId <> IT.CreatedBy
            ) P
            -- Did this thread close / reopen the ticket?
            OUTER APPLY (
                SELECT TOP 1
                    CASE M.Act WHEN ''closed'' THEN ''C'' ELSE ''R'' END AS Action,
                    M.NewStatusId
                FROM TicketHistory TH
                CROSS APPLY (' + @meta + N') M
                WHERE TH.ThreadId = IT.ThreadId
                  AND TH.FieldName = ''Status''
                  AND M.Act IN (''closed'', ''reopened'')
                ORDER BY TH.CreatedAt DESC
            ) CH
            WHERE D.WorkAt >= @from
              AND D.WorkAt <  @to
              AND (@EmployeeID IS NULL OR P.EmployeeId = @EmployeeID)' + @where + N'

            UNION ALL

            -- ── Closed / reopened without a thread ─────────────────────────
            SELECT
                CONCAT(N''H:'', LOWER(CAST(TH.Id AS CHAR(36)))),
                ''STATUS'',
                CASE M.Act WHEN ''closed'' THEN ''C'' ELSE ''R'' END,
                TH.IssueId,
                NULL,
                NULL,
                TH.ActorId,
                CAST(0 AS BIT),
                CAST(TH.CreatedAt AS DATE),
                TH.CreatedAt,
                NULL,
                NULL,
                NULL,
                M.NewStatusId,
                LEFT(TH.Summary, 1000)
            FROM TicketHistory TH
            JOIN ISSUEMASTER T0 ON T0.Issue_Id = TH.IssueId
            CROSS APPLY (' + @meta + N') M
            WHERE TH.FieldName = ''Status''
              AND TH.ThreadId IS NULL
              AND TH.CreatedAt >= @from
              AND TH.CreatedAt <  @to
              AND M.Act IN (''closed'', ''reopened'')
              AND (@EmployeeID IS NULL OR TH.ActorId = @EmployeeID)' + @where + N'
        )
        SELECT
            E.*,
            LP.StatusSummary AS CurrentStatusSummary
        FROM Entries E
        OUTER APPLY (
            SELECT TOP 1 LEFT(TPL.StatusSummary, 300) AS StatusSummary
            FROM TicketProgressLogs TPL
            WHERE TPL.Issue_Id = E.Issue_Id
              AND TPL.IsActive = 1
            ORDER BY TPL.CreatedAt DESC
        ) LP
        ORDER BY E.EventAt DESC, E.Id;';

    EXEC sp_executesql
        @sql,
        N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @RepoIds NVARCHAR(MAX),
          @EmployeeID UNIQUEIDENTIFIER, @FromDate DATE, @ToDate DATE',
        @Role, @UserId, NULL, NULL, @EmployeeID, @FromDate, @ToDate;
END
GO

/* ############################################################################
   PART 3 — banner_active_only_sp.sql
   ############################################################################ */
PRINT N'PART 3 - banner_active_only_sp.sql';
GO

/* =============================================================================
   GetBannerMessage — @ActiveOnly (run on WG_APP_TEST1 first, then WG_APP)
   -----------------------------------------------------------------------------
   The header ticker loaded every banner ever created and kept only the active
   ones in the browser. With @ActiveOnly = 1 the SP returns only
   Status = 'Active' banners whose EndDate is today or later — the same rule
   the header applied client side. The API passes sync Params straight through
   as SP parameters, so no API change is needed. The admin banner screens don't
   send ActiveOnly (default 0) and still get the full list.

   Run manually (test first):
     sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P SEngine@0202 -C -i scripts\banner_active_only_sp.sql
     sqlcmd -S WGSQLSAP -d WG_APP       -U sa -P SEngine@0202 -C -i scripts\banner_active_only_sp.sql

   Idempotent / safe to re-run. Runs against whichever database -d points at.
   ============================================================================= */

CREATE OR ALTER PROCEDURE [dbo].[GetBannerMessage]
(
    @DbName NVARCHAR(255) = NULL,
    @BannerMessageId UNIQUEIDENTIFIER = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @ActiveOnly BIT = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bm.BannerMessageId,
        bm.MessageText,
        bm.MessageTypeId,
        bm.Status,
        bm.StartDate,
        bm.EndDate,
        bm.ToClient,
        bm.CreatedBy,
        bm.CreatedAt,
        bm.UpdatedBy,
        bm.UpdatedAt,
        bmt.ColorCode,
        bmt.Type_Name,
        bmt.IconClass
    FROM dbo.BannerMessage bm
    LEFT JOIN dbo.BannerMessageType bmt ON bm.MessageTypeId = bmt.MessageTypeId
    WHERE 1 = 1
        AND (@BannerMessageId IS NULL OR bm.BannerMessageId = @BannerMessageId)
        AND (@FromDate IS NULL OR bm.StartDate >= @FromDate)
        AND (@ToDate IS NULL OR bm.EndDate <= @ToDate)
        AND (
            @ActiveOnly = 0
            OR (bm.Status = N'Active' AND bm.EndDate >= CAST(GETDATE() AS DATE))
        )
    ORDER BY bm.CreatedAt DESC;
END
GO

PRINT N'All 2026-10-12 changes applied.';
GO
