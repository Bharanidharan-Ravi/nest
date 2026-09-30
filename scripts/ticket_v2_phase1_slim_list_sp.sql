/* =============================================================================
   Ticket V2 — Phase 1: slim ticket list SP (additive, run once on WG_APP)

   Creates dbo.GetIssuesByID_V2. Same parameters and same result columns as
   dbo.GetIssuesByID, so the sync layer (GetTickets DTO) and the UI need no
   change. The old SP is NOT touched — it stays for rollback and for the golden
   comparison (ticket_v2_phase1_golden_compare.sql).

   What changes
   1. List calls (@IssueId IS NULL) no longer build the columns the list never
      reads. They are still returned, as NULL, so the column set is unchanged:
        - Description, HtmlDesc
        - Attachment_JSON               (non-sargable TRY_CAST join)
        - All_Assignees[].HandOffData   (key omitted from the JSON)
      Single-ticket calls (@IssueId set: detail page, edit page, realtime row
      refresh) still return the full row, so a realtime refresh that swaps the
      fresh row into a list cache stays correct.
   2. Thread count (TC) and latest thread (T5) were derived tables that grouped
      / ranked the WHOLE ISSUETHREADS table on every call. They are now
      OUTER APPLY lookups per returned ticket, served by the existing index
      IX_ISSUETHREADS_IssueId_UpdatedAt (Issue_Id, UpdatedAt DESC)
      INCLUDE (ThreadId, Hours, toClient, CommentText).
      Semantics kept: TC counts only toClient = 1 threads when @RepoId is set;
      T5 is the latest thread by UpdatedAt (ThreadId DESC breaks ties, which
      the old ROW_NUMBER left undefined).

   Filters, role rule, ORDER BY and every other column are unchanged.

   Rollback: point "TicketsList" in SyncRepositoryConfigStore.cs back to
   "GetIssuesByID". Safe to re-run (CREATE OR ALTER).
   ============================================================================= */

USE [WG_APP]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
set statistics io on
set statistics time on
  EXEC GetIssuesByID_V2 'wg_app', NULL, NULL, NULL, NULL, 2;
set statistics io off
set statistics time off
*/

CREATE OR ALTER PROCEDURE [dbo].[GetIssuesByID_V2]
(
    @DbName NVARCHAR(255),
    @IssueId UNIQUEIDENTIFIER = NULL,
    @ProjectId UNIQUEIDENTIFIER = NULL,
    @RepoId UNIQUEIDENTIFIER = NULL,
    @EmployeeId UNIQUEIDENTIFIER = NULL,
    @Role INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX);

    -- Heavy columns: built only for a single-ticket call
    DECLARE @isSingle BIT = CASE WHEN @IssueId IS NOT NULL THEN 1 ELSE 0 END;

    DECLARE @descCols NVARCHAR(MAX) = CASE WHEN @isSingle = 1
        THEN N'
                T0.Description,'
        ELSE N'
                CAST(NULL AS NVARCHAR(MAX)) AS Description,' END;

    DECLARE @htmlDescCol NVARCHAR(MAX) = CASE WHEN @isSingle = 1
        THEN N'
                T0.HtmlDesc,'
        ELSE N'
                CAST(NULL AS NVARCHAR(MAX)) AS HtmlDesc,' END;

    DECLARE @handOffCol NVARCHAR(MAX) = CASE WHEN @isSingle = 1
        THEN N',
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
                      AND WH.SourceStreamId = CR.StreamId
                    FOR JSON PATH
                ) AS HandOffData'
        ELSE N'' END;

    DECLARE @attachmentCol NVARCHAR(MAX) = CASE WHEN @isSingle = 1
        THEN N'
                (
                    SELECT
                        AM.AttachmentId,
                        AM.FileName,
                        AM.RelativePath
                    FROM ATTACHMENTMASTER AM
                    WHERE TRY_CAST(AM.ModuleId AS UNIQUEIDENTIFIER) = T0.Issue_Id
                    FOR JSON PATH
                ) AS Attachment_JSON,'
        ELSE N'
                CAST(NULL AS NVARCHAR(MAX)) AS Attachment_JSON,' END;

    SET @sql = CAST(N'' AS NVARCHAR(MAX)) + N'
        SELECT
                ISNULL(TC.ThreadCount, 0) AS ThreadCount,
                T0.IsPrivate,
                T0.ProjKey,
                T0.Issue_Id,
                T0.Issue_Code,
                T0.Title,' + @descCols + N'
                T0.Status AS StatusId,
                SM.Status_Name AS Status,
                T0.CreatedBy,
                T0.CompletionPct,
                ISNULL(LatestProgress.Percentage, 0) AS OverallPercentage,
                LatestProgress.StatusSummary AS CurrentStatusSummary,

                -- CreatedBy Team Info
                EM.team AS CreatedBy_Team,
                T2C.teamid AS CreatedBy_TeamId,
                T2C.TeamName AS CreatedBy_TeamName,

                -- Main Assignee Team Info
                T1A.team AS Assignee_Team,
                T2A.teamid AS Assignee_TeamId,
                T2A.TeamName AS Assignee_TeamName,

                -- Issuer Name Logic
                CASE
                    WHEN @EmployeeId IS NOT NULL THEN
                        CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM WorkStreams WS
                                WHERE WS.IssueId = T0.Issue_Id
                                  AND WS.ResourceId = @EmployeeId
                                  AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                            ) THEN T3.EmployeeName
                            WHEN T0.Assignee_Id = @EmployeeId THEN EM.EmployeeName
                            ELSE EM.EmployeeName
                        END
                    ELSE EM.EmployeeName
                END AS Issuer_Name,
                T0.CreatedAt,
                T0.Project_Id,
                T0.Assignee_Id,
                COALESCE(RU.UserName, T3.EmployeeName) AS Assignee_Name,
                COALESCE(EM.EmployeeName, RE.UserName) AS TicketCreater,
                T0.Due_Date,
                T0.RepoId,
                T0.RepoKey,
                T0.Hours,
                (
                    SELECT
                        CAST(
                            SUM(
                                CAST(LEFT(IT.Hours, CHARINDEX('':'', IT.Hours) - 1) AS INT) * 60
                              + CAST(SUBSTRING(IT.Hours, CHARINDEX('':'', IT.Hours) + 1, LEN(IT.Hours)) AS INT)
                            ) / 60 AS VARCHAR(10)
                        )
                        + '':''
                        + RIGHT(
                            ''0'' + CAST(
                                SUM(
                                    CAST(LEFT(IT.Hours, CHARINDEX('':'', IT.Hours) - 1) AS INT) * 60
                                  + CAST(SUBSTRING(IT.Hours, CHARINDEX('':'', IT.Hours) + 1, LEN(IT.Hours)) AS INT)
                                ) % 60 AS VARCHAR(2)
                            ), 2
                        )
                    FROM ' + QUOTENAME(@DbName) + N'.dbo.ISSUETHREADS IT
                    WHERE IT.Issue_Id = T0.Issue_Id
                      AND IT.Hours IS NOT NULL
                      AND IT.Hours LIKE ''%:%''
                ) AS TotalConsumeTime,
                T0.Web,
                T0.Functional,
                T0.Technical,
                T0.Client,' + @htmlDescCol + N'
                T0.UpdatedBy,
                (
                    SELECT
                        T8.Move_to,
                        ISNULL(T1.Title, ''WorkGlow Solutions'') AS Title
                    FROM IssueMoveTo T8
                    LEFT JOIN RepositoryMasters T1
                        ON T1.Repo_Id = T8.Move_to
                    WHERE T8.Issue_Id = T0.Issue_Id
                    FOR JSON PATH
                ) AS Move_toJson,

                -- All Assignees JSON with full team info
                (
                    SELECT
                        COALESCE(Emp.EmployeeID, RPU.UserId) AS Assignee_Id,
                        COALESCE(RPU.UserName, Emp.EmployeeName) AS Assignee_Name,
                        Emp.Team AS Assignee_Team,
                        TM.TeamID AS Assignee_TeamId,
                        TM.TeamName AS Assignee_TeamName,
                        CR.RoleType AS Assignee_Type,
                        CR.StreamId,
                        CR.StreamStatus,
                        SM_WS.Status_Name AS StatusName,
                        CR.CompletionPct,
                        CR.TargetDate,
                        CR.ThreadId,
                        CR.ParentThreadId' + @handOffCol + N'
                    FROM
                    (
                        -- Main Assignee
                        SELECT
                            T0.Assignee_Id AS EmpId,
                            ''Main Assignee'' AS RoleType,
                            CAST(NULL AS UNIQUEIDENTIFIER) AS StreamId,
                            CAST(NULL AS INT) AS StreamStatus,
                            CAST(NULL AS DECIMAL(18,0)) AS CompletionPct,
                            CAST(NULL AS DATETIME2(7)) AS TargetDate,
                            CAST(NULL AS INT) AS ThreadId,
                            CAST(NULL AS BIGINT) AS ParentThreadId
                        WHERE T0.Assignee_Id IS NOT NULL

                        UNION ALL

                        -- WorkStreams Assignees
                        SELECT
                            WS.ResourceId AS EmpId,
                            WS.StreamName AS RoleType,
                            WS.StreamId,
                            WS.StreamStatus,
                            WS.CompletionPct,
                            WS.TargetDate,
                            WS.ThreadId,
                            WS.ParentThreadId
                        FROM WorkStreams WS
                        WHERE WS.IssueId = T0.Issue_Id
                          AND WS.ResourceId IS NOT NULL
                          AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
                    ) CR
                    LEFT JOIN EmployeeMaster Emp
                        ON Emp.EmployeeID = CR.EmpId
                    LEFT JOIN RepoUsers RPU
                        ON RPU.UserId = CR.EmpId
                    LEFT JOIN TEAMMASTER TM
                        ON Emp.Team = TM.TeamID
                    LEFT JOIN StatusMasters SM_WS
                        ON SM_WS.Status_Id = CR.StreamStatus
                    FOR JSON PATH, INCLUDE_NULL_VALUES
                ) AS All_Assignees,

                -- UpdatedAt Logic
                CASE
                    WHEN T5.LastUpdated IS NULL THEN T0.UpdatedAt
                    WHEN T0.UpdatedAt IS NOT NULL AND T5.LastUpdated IS NOT NULL THEN
                        CASE
                            WHEN T0.UpdatedAt > T5.LastUpdated THEN T0.UpdatedAt
                            ELSE T5.LastUpdated
                        END
                    ELSE T5.LastUpdated
                END AS UpdatedAt,

                -- Labels
                (
                    SELECT
                        L.Id AS LABEL_ID,
                        L.Title AS LABEL_TITLE,
                        L.Color AS LABEL_COLOR
                    FROM ISSUE_LABELS IL
                    INNER JOIN LabelMaster L
                        ON L.Id = IL.Label_Id
                    WHERE IL.Issue_Id = T0.Issue_Id
                    FOR JSON PATH
                ) AS Labels_JSON,
' + @attachmentCol + N'
                ROW_NUMBER() OVER (ORDER BY T0.CreatedAt DESC) AS RowNum,
                T0.Priority,
                T0.ReopenedBy,
                T0.PriorityRequest,
                T0.FuncResponse,
                T0.IsCloseRequested,
                T0.WebResponse,
                T0.TechnicalResponse,
                T5.CommentText AS commenttext,
                T0.AdminResponse,
                CASE
                    WHEN T0.RaiseToClient = 0 THEN CAST(0 AS BIT)
                    ELSE CAST(1 AS BIT)
                END AS RaiseToClient
        FROM ISSUEMASTER T0

        -- Thread count for this ticket only (was: GROUP BY over all threads)
        OUTER APPLY (
            SELECT COUNT(IT.ThreadId) AS ThreadCount
            FROM ISSUETHREADS IT
            WHERE IT.Issue_Id = T0.Issue_Id
              AND (@RepoId IS NULL OR IT.toClient = 1)
        ) TC
        LEFT JOIN EmployeeMaster T1A ON T1A.EmployeeID = T0.Assignee_Id
        LEFT JOIN TEAMMASTER T2A ON T1A.Team = T2A.TeamID
        LEFT JOIN EmployeeMaster T3 ON T3.EmployeeID = T0.Assignee_Id
        LEFT JOIN EmployeeMaster EM ON EM.EmployeeID = T0.CreatedBy
        LEFT JOIN RepoUsers RE ON RE.UserId = T0.CreatedBy
        LEFT JOIN TEAMMASTER T2C ON EM.Team = T2C.TeamID
        LEFT JOIN RepoUsers RU ON RU.UserId = T0.Assignee_Id
        LEFT JOIN StatusMasters SM ON SM.Status_Id = T0.Status

        -- Latest thread for this ticket only (was: ROW_NUMBER over all threads)
        OUTER APPLY (
            SELECT TOP 1
                IT.UpdatedAt AS LastUpdated,
                IT.CommentText
            FROM ISSUETHREADS IT
            WHERE IT.Issue_Id = T0.Issue_Id
            ORDER BY IT.UpdatedAt DESC, IT.ThreadId DESC
        ) T5

        -- Latest active progress log per ticket
        OUTER APPLY (
            SELECT TOP 1 Percentage, StatusSummary
            FROM TicketProgressLogs TPL
            WHERE TPL.Issue_Id = T0.Issue_Id
              AND TPL.IsActive = 1
            ORDER BY TPL.CreatedAt DESC
        ) LatestProgress

        WHERE 1 = 1
    ';

    -- Filters
    IF @IssueId IS NOT NULL
        SET @sql += N' AND T0.Issue_Id = @IssueId';

    IF @ProjectId IS NOT NULL
        SET @sql += N' AND T0.Project_Id = @ProjectId';

    IF @RepoId IS NOT NULL
        SET @sql += N' AND T0.RepoId = @RepoId';

    IF @EmployeeId IS NOT NULL
    BEGIN
        SET @sql += N'
        AND (
            T0.Assignee_Id = @EmployeeId
            OR T0.CreatedBy = @EmployeeId
            OR EXISTS (
                SELECT 1
                FROM WorkStreams WS
                WHERE WS.IssueId = T0.Issue_Id
                  AND WS.ResourceId = @EmployeeId
                  AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
            )
        )';
    END

    -- Role filter
    SET @sql += N'
        AND (
            (@Role = 3 AND T0.RaiseToClient = 1)   -- Role 3: only RaiseToClient = 1
            OR (@Role <> 3)                        -- Other roles: no extra filter
        )
    ';

    SET @sql += N'
        ORDER BY
            CASE
                WHEN @EmployeeId IS NOT NULL AND T0.Assignee_Id = @EmployeeId AND T0.IsCloseRequested = 1 THEN 1
                WHEN T0.PriorityRequest = 1 THEN 1
                WHEN T0.FuncResponse = 1 THEN 1
                WHEN T0.WebResponse = 1 THEN 1
                WHEN T0.TechnicalResponse = 1 THEN 1
                WHEN T0.AdminResponse = 1 THEN 1
                ELSE 0
            END DESC,
            UpdatedAt DESC
    ';

    EXEC sp_executesql
        @sql,
        N'@IssueId UNIQUEIDENTIFIER, @ProjectId UNIQUEIDENTIFIER, @RepoId UNIQUEIDENTIFIER, @EmployeeId UNIQUEIDENTIFIER, @Role INT',
        @IssueId, @ProjectId, @RepoId, @EmployeeId, @Role;
END
GO
