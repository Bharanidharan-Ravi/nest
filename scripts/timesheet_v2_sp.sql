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
