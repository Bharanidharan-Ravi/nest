/* =============================================================================
   DB changes — 2026-10-02 .. 2026-10-03   (run on WG_APP; safe to re-run)

   Collected from commits 411373b, 9a13333 (scripts/ folder). Every object is
   CREATE OR ALTER / MERGE, so the whole file can be re-run.

   TABLES
     No table structure change. Data change only: 3 new sort rows in
     dbo.TicketListQueryDef (dueOverdueFirst, dueTodayFirst, dueUpcomingFirst).

   STORED PROCEDURES
     1. dbo.TicketListV2_Base      — adds TeamConsumeMinutes (staff-only hours)
     2. dbo.GetTicketList_V2       — returns TeamConsumeMinutes
     3. dbo.GetDailyPlan_V2        — new (plan rows only, no ticket columns)
     4. dbo.GetAllUserOnlineStatus — IST fix, IsOnline / StatusSince columns

   Run order: section 1 before 2/3 (new sort keys are read by the list SP).
   The full original definitions stay in scripts/ticket_v2_list_sp.sql,
   scripts/daily_plan_v2_sp.sql and scripts/user_online_status_sp.sql.
   ============================================================================= */

USE [WG_APP]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ---------------------------------------------------------------------------
   1. TABLE DATA — dbo.TicketListQueryDef: due-bucket sort keys (new rows)
   --------------------------------------------------------------------------- */
MERGE dbo.TicketListQueryDef AS D
USING (VALUES
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
                               N'Due: upcoming, today, overdue')
) AS S (Kind, QueryKey, SqlText, Notes)
ON D.Kind = S.Kind AND D.QueryKey = S.QueryKey
WHEN MATCHED THEN
    UPDATE SET SqlText = S.SqlText, Notes = S.Notes
WHEN NOT MATCHED THEN
    INSERT (Kind, QueryKey, SqlText, Notes) VALUES (S.Kind, S.QueryKey, S.SqlText, S.Notes);
GO

/* ---------------------------------------------------------------------------
   2. SP — dbo.TicketListV2_Base  (TeamConsumeMinutes added to the TS apply)

   Shared pieces (one place for the security scope and the APPLYs)
     @Where   — fixed security predicates ("AND ..." lines) for alias T0.
     @Applies — TS / LP / U APPLYs for alias T0.
     Both reference @Role, @UserId, @RepoId, @RepoIds: pass those to
     sp_executesql with exactly these names.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [dbo].[TicketListV2_Base]
(
    @Role     INT,
    @RepoId   UNIQUEIDENTIFIER = NULL,
    @RepoIds  NVARCHAR(MAX)    = NULL,
    @Where    NVARCHAR(MAX) OUTPUT,
    @Applies  NVARCHAR(MAX) OUTPUT
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
END
GO

/* ---------------------------------------------------------------------------
   3. SP — dbo.GetTicketList_V2  (returns TS.TeamConsumeMinutes)
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

    DECLARE @where NVARCHAR(MAX), @applies NVARCHAR(MAX), @order NVARCHAR(MAX);

    EXEC dbo.TicketListV2_Base @Role, @RepoId, @RepoIds, @where OUTPUT, @applies OUTPUT;

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

        SELECT
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
            ) AS Handler_Ids
        FROM #pg P
        JOIN ISSUEMASTER T0 ON T0.Issue_Id = P.Issue_Id' + @applies + N'

        -- Latest thread comment (clients: latest client-visible thread)
        OUTER APPLY (
            SELECT TOP 1 IT.CommentText
            FROM ISSUETHREADS IT
            WHERE IT.Issue_Id = T0.Issue_Id
              AND (@Role <> 3 OR IT.toClient = 1)
            ORDER BY IT.UpdatedAt DESC, IT.ThreadId DESC
        ) LT

        ORDER BY P.RowNo;';

    EXEC sp_executesql
        @sql,
        N'@Role INT, @UserId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @RepoIds NVARCHAR(MAX),
          @Filters NVARCHAR(MAX), @skip BIGINT, @take BIGINT',
        @Role, @UserId, @RepoId, @RepoIds, @Filters, @skip, @take;
END
GO

/* ---------------------------------------------------------------------------
   4. SP — dbo.GetDailyPlan_V2  (new)
   --------------------------------------------------------------------------- */
/*
  EXEC GetDailyPlan_V2 @DbName = 'wg_app', @userId = NULL, @planDate = '2026-10-02';
*/
CREATE OR ALTER PROCEDURE [dbo].[GetDailyPlan_V2]
(
    @DbName   NVARCHAR(100)    = NULL,   -- always sent by the API; unused
    @userId   UNIQUEIDENTIFIER = NULL,
    @planDate DATETIME
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dp.Id,
        dp.TicketId,
        dp.UserId,
        dp.PlannedDate,
        dp.Status,
        dp.UncheckComment,
        dp.ProjKey
    FROM dbo.DailyPlans dp
    WHERE (@userId IS NULL OR dp.UserId = @userId)
      AND dp.PlannedDate >= CAST(@planDate AS DATE)
      AND dp.PlannedDate <  DATEADD(DAY, 1, CAST(@planDate AS DATE))
      AND dp.Status <> 4;
END
GO

/* ---------------------------------------------------------------------------
   5. SP — dbo.GetAllUserOnlineStatus  (IST fix, IsOnline / StatusSince)
   --------------------------------------------------------------------------- */
-- ============================================================================
-- dbo.GetAllUserOnlineStatus  (sync key "GetUserOnlineStatus", returned by every
-- POST /Login/heartbeat)
--
-- One row per employee, presence computed here from dbo.UserSession so every
-- client shows the same thing. All UserSession times are IST (dbo.GET_IST_DATE()).
--
--   Online  → a session that is not logged out and whose last heartbeat (or its
--             login, before the first heartbeat) is within @OfflineAfterSeconds.
--             StatusSince = earliest LoginAt of those live sessions ("online since")
--   Offline → StatusSince = when the latest session ended: LogoutAt, else its
--             LastHeartbeat, else LoginAt ("offline since"). NULL = never logged in.
--
-- Fixes in the previous version:
--   * LastHeartbeat (IST) was compared with SYSUTCDATETIME() - 5 min, so a closed
--     tab stayed "online" for ~5.5 hours (IST is UTC+5:30).
--   * Only the most recently updated session was checked, so a user with a dead
--     tab plus a live tab could show offline.
--   * IsOnline was computed but not mapped by the API, so each screen guessed
--     from LastHeartbeat with its own 30 s / 60 s rule.
--
-- Run before deploying the API (the API maps the new IsOnline / StatusSince
-- columns; the old API ignores them, so this is safe to run first).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.GetAllUserOnlineStatus
    @DbName              NVARCHAR(255),
    @OfflineAfterSeconds INT = 60
AS
BEGIN
    SET NOCOUNT ON;

    IF DB_ID(@DbName) IS NULL
        THROW 50001, 'The specified database does not exist.', 1;

    DECLARE @Cutoff DATETIME2 = DATEADD(SECOND, -@OfflineAfterSeconds, dbo.GET_IST_DATE());

    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT
            em.EmployeeID,
            em.EmployeeName,

            lastSession.LoginAt,
            lastSession.LogoutAt,
            lastSession.LastHeartbeat,
            lastSession.IsActive,

            CAST(CASE WHEN live.OnlineSince IS NULL THEN 0 ELSE 1 END AS BIT) AS IsOnline,
            COALESCE(live.OnlineSince, lastSession.EndedAt)                   AS StatusSince

        FROM ' + QUOTENAME(@DbName) + N'.dbo.EMPLOYEEMASTER AS em

        OUTER APPLY
        (
            SELECT MIN(s.LoginAt) AS OnlineSince
            FROM ' + QUOTENAME(@DbName) + N'.dbo.UserSession AS s
            WHERE s.UserId = em.EmployeeID
              AND s.IsActive = 1
              AND s.LogoutAt IS NULL
              AND COALESCE(s.LastHeartbeat, s.LoginAt) >= @Cutoff
        ) AS live

        OUTER APPLY
        (
            SELECT TOP (1)
                s.LoginAt,
                s.LogoutAt,
                s.LastHeartbeat,
                s.IsActive,
                COALESCE(s.LogoutAt, s.LastHeartbeat, s.LoginAt) AS EndedAt
            FROM ' + QUOTENAME(@DbName) + N'.dbo.UserSession AS s
            WHERE s.UserId = em.EmployeeID
            ORDER BY COALESCE(s.LogoutAt, s.LastHeartbeat, s.LoginAt) DESC
        ) AS lastSession

        ORDER BY em.EmployeeName;
    ';

    EXEC sys.sp_executesql @sql, N'@Cutoff DATETIME2', @Cutoff = @Cutoff;
END;
GO

-- Check (read-only): who is online right now and since when
-- EXEC dbo.GetAllUserOnlineStatus @DbName = 'WG_APP';
