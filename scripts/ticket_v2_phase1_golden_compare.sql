/* =============================================================================
   Ticket V2 — Phase 1: golden comparison  GetIssuesByID  vs  GetIssuesByID_V2

   Read-only. Runs both SPs with the same parameters and reports:
     1. Timing + logical reads    (Messages tab — STATISTICS IO/TIME, and ms below)
     2. Row count and result size (bytes) of each SP
     3. Rows only in one result   (Issue_Id set must be identical)
     4. List-field differences    (every column the list uses)
     5. Assignee differences      (All_Assignees compared without HandOffData)
     6. Order differences         (only ties on flag + UpdatedAt may move)
     7. Single-ticket call only:  heavy columns must be identical
        (Description, HtmlDesc, Attachment_JSON, All_Assignees incl. HandOffData)

   PASS = sections 3, 4, 5 and 7 return zero rows.
   Known allowed difference in 4: "commenttext" when a ticket has two threads
   with the same UpdatedAt (old SP picked either one; new SP picks highest
   ThreadId). Section 4 lists the differing column names so this is visible.

   Run once per Phase 0 query: set the parameters below and execute.
   ============================================================================= */

USE [WG_APP]
GO
SET NOCOUNT ON;

DECLARE @DbName     NVARCHAR(255)    = N'wg_app';
DECLARE @IssueId    UNIQUEIDENTIFIER = NULL;
DECLARE @ProjectId  UNIQUEIDENTIFIER = NULL;
DECLARE @RepoId     UNIQUEIDENTIFIER = NULL;
DECLARE @EmployeeId UNIQUEIDENTIFIER = NULL;
DECLARE @Role       INT              = 1;

-- Result columns of both SPs, in output order. All NVARCHAR(MAX) so INSERT…EXEC
-- converts every type the same way for both.
IF OBJECT_ID('tempdb..#Old') IS NOT NULL DROP TABLE #Old;
IF OBJECT_ID('tempdb..#New') IS NOT NULL DROP TABLE #New;

CREATE TABLE #Old (
    Seq INT IDENTITY(1,1),
    ThreadCount NVARCHAR(MAX), IsPrivate NVARCHAR(MAX), ProjKey NVARCHAR(MAX), Issue_Id NVARCHAR(MAX),
    Issue_Code NVARCHAR(MAX), Title NVARCHAR(MAX), Description NVARCHAR(MAX), StatusId NVARCHAR(MAX),
    Status NVARCHAR(MAX), CreatedBy NVARCHAR(MAX), CompletionPct NVARCHAR(MAX), OverallPercentage NVARCHAR(MAX),
    CurrentStatusSummary NVARCHAR(MAX), CreatedBy_Team NVARCHAR(MAX), CreatedBy_TeamId NVARCHAR(MAX),
    CreatedBy_TeamName NVARCHAR(MAX), Assignee_Team NVARCHAR(MAX), Assignee_TeamId NVARCHAR(MAX),
    Assignee_TeamName NVARCHAR(MAX), Issuer_Name NVARCHAR(MAX), CreatedAt NVARCHAR(MAX), Project_Id NVARCHAR(MAX),
    Assignee_Id NVARCHAR(MAX), Assignee_Name NVARCHAR(MAX), TicketCreater NVARCHAR(MAX), Due_Date NVARCHAR(MAX),
    RepoId NVARCHAR(MAX), RepoKey NVARCHAR(MAX), Hours NVARCHAR(MAX), TotalConsumeTime NVARCHAR(MAX),
    Web NVARCHAR(MAX), Functional NVARCHAR(MAX), Technical NVARCHAR(MAX), Client NVARCHAR(MAX),
    HtmlDesc NVARCHAR(MAX), UpdatedBy NVARCHAR(MAX), Move_toJson NVARCHAR(MAX), All_Assignees NVARCHAR(MAX),
    UpdatedAt NVARCHAR(MAX), Labels_JSON NVARCHAR(MAX), Attachment_JSON NVARCHAR(MAX), RowNum NVARCHAR(MAX),
    Priority NVARCHAR(MAX), ReopenedBy NVARCHAR(MAX), PriorityRequest NVARCHAR(MAX), FuncResponse NVARCHAR(MAX),
    IsCloseRequested NVARCHAR(MAX), WebResponse NVARCHAR(MAX), TechnicalResponse NVARCHAR(MAX),
    commenttext NVARCHAR(MAX), AdminResponse NVARCHAR(MAX), RaiseToClient NVARCHAR(MAX)
);
SELECT TOP 0 * INTO #New FROM #Old;

DECLARE @t0 DATETIME2, @msOld INT, @msNew INT;

SET STATISTICS IO ON;
SET STATISTICS TIME ON;

PRINT '===== OLD: GetIssuesByID =====';
SET @t0 = SYSDATETIME();
INSERT INTO #Old (
    ThreadCount, IsPrivate, ProjKey, Issue_Id, Issue_Code, Title, Description, StatusId, Status, CreatedBy,
    CompletionPct, OverallPercentage, CurrentStatusSummary, CreatedBy_Team, CreatedBy_TeamId, CreatedBy_TeamName,
    Assignee_Team, Assignee_TeamId, Assignee_TeamName, Issuer_Name, CreatedAt, Project_Id, Assignee_Id,
    Assignee_Name, TicketCreater, Due_Date, RepoId, RepoKey, Hours, TotalConsumeTime, Web, Functional, Technical,
    Client, HtmlDesc, UpdatedBy, Move_toJson, All_Assignees, UpdatedAt, Labels_JSON, Attachment_JSON, RowNum,
    Priority, ReopenedBy, PriorityRequest, FuncResponse, IsCloseRequested, WebResponse, TechnicalResponse,
    commenttext, AdminResponse, RaiseToClient)
EXEC dbo.GetIssuesByID @DbName, @IssueId, @ProjectId, @RepoId, @EmployeeId, @Role;
SET @msOld = DATEDIFF(MILLISECOND, @t0, SYSDATETIME());

PRINT '===== NEW: GetIssuesByID_V2 =====';
SET @t0 = SYSDATETIME();
INSERT INTO #New (
    ThreadCount, IsPrivate, ProjKey, Issue_Id, Issue_Code, Title, Description, StatusId, Status, CreatedBy,
    CompletionPct, OverallPercentage, CurrentStatusSummary, CreatedBy_Team, CreatedBy_TeamId, CreatedBy_TeamName,
    Assignee_Team, Assignee_TeamId, Assignee_TeamName, Issuer_Name, CreatedAt, Project_Id, Assignee_Id,
    Assignee_Name, TicketCreater, Due_Date, RepoId, RepoKey, Hours, TotalConsumeTime, Web, Functional, Technical,
    Client, HtmlDesc, UpdatedBy, Move_toJson, All_Assignees, UpdatedAt, Labels_JSON, Attachment_JSON, RowNum,
    Priority, ReopenedBy, PriorityRequest, FuncResponse, IsCloseRequested, WebResponse, TechnicalResponse,
    commenttext, AdminResponse, RaiseToClient)
EXEC dbo.GetIssuesByID_V2 @DbName, @IssueId, @ProjectId, @RepoId, @EmployeeId, @Role;
SET @msNew = DATEDIFF(MILLISECOND, @t0, SYSDATETIME());

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- ── 1 + 2. Timing, rows, size ───────────────────────────────────────────────
-- Bytes = sum of DATALENGTH of every column as NVARCHAR (2 bytes/char). The
-- JSON sent to the browser is roughly half this (UTF-8) plus property names.
;WITH Sz AS (
    SELECT 'old' AS Sp, Seq,
        ISNULL(DATALENGTH(Description),0) + ISNULL(DATALENGTH(HtmlDesc),0) AS DescBytes,
        ISNULL(DATALENGTH(Attachment_JSON),0) AS AttachBytes,
        ISNULL(DATALENGTH(All_Assignees),0) AS AssigneeBytes,
        ISNULL(DATALENGTH(ThreadCount),0)+ISNULL(DATALENGTH(IsPrivate),0)+ISNULL(DATALENGTH(ProjKey),0)+ISNULL(DATALENGTH(Issue_Id),0)
        +ISNULL(DATALENGTH(Issue_Code),0)+ISNULL(DATALENGTH(Title),0)+ISNULL(DATALENGTH(StatusId),0)+ISNULL(DATALENGTH(Status),0)
        +ISNULL(DATALENGTH(CreatedBy),0)+ISNULL(DATALENGTH(CompletionPct),0)+ISNULL(DATALENGTH(OverallPercentage),0)
        +ISNULL(DATALENGTH(CurrentStatusSummary),0)+ISNULL(DATALENGTH(CreatedBy_Team),0)+ISNULL(DATALENGTH(CreatedBy_TeamId),0)
        +ISNULL(DATALENGTH(CreatedBy_TeamName),0)+ISNULL(DATALENGTH(Assignee_Team),0)+ISNULL(DATALENGTH(Assignee_TeamId),0)
        +ISNULL(DATALENGTH(Assignee_TeamName),0)+ISNULL(DATALENGTH(Issuer_Name),0)+ISNULL(DATALENGTH(CreatedAt),0)
        +ISNULL(DATALENGTH(Project_Id),0)+ISNULL(DATALENGTH(Assignee_Id),0)+ISNULL(DATALENGTH(Assignee_Name),0)
        +ISNULL(DATALENGTH(TicketCreater),0)+ISNULL(DATALENGTH(Due_Date),0)+ISNULL(DATALENGTH(RepoId),0)+ISNULL(DATALENGTH(RepoKey),0)
        +ISNULL(DATALENGTH(Hours),0)+ISNULL(DATALENGTH(TotalConsumeTime),0)+ISNULL(DATALENGTH(Web),0)+ISNULL(DATALENGTH(Functional),0)
        +ISNULL(DATALENGTH(Technical),0)+ISNULL(DATALENGTH(Client),0)+ISNULL(DATALENGTH(UpdatedBy),0)+ISNULL(DATALENGTH(Move_toJson),0)
        +ISNULL(DATALENGTH(UpdatedAt),0)+ISNULL(DATALENGTH(Labels_JSON),0)+ISNULL(DATALENGTH(RowNum),0)+ISNULL(DATALENGTH(Priority),0)
        +ISNULL(DATALENGTH(ReopenedBy),0)+ISNULL(DATALENGTH(PriorityRequest),0)+ISNULL(DATALENGTH(FuncResponse),0)
        +ISNULL(DATALENGTH(IsCloseRequested),0)+ISNULL(DATALENGTH(WebResponse),0)+ISNULL(DATALENGTH(TechnicalResponse),0)
        +ISNULL(DATALENGTH(commenttext),0)+ISNULL(DATALENGTH(AdminResponse),0)+ISNULL(DATALENGTH(RaiseToClient),0) AS OtherBytes
    FROM #Old
    UNION ALL
    SELECT 'new', Seq,
        ISNULL(DATALENGTH(Description),0) + ISNULL(DATALENGTH(HtmlDesc),0),
        ISNULL(DATALENGTH(Attachment_JSON),0),
        ISNULL(DATALENGTH(All_Assignees),0),
        ISNULL(DATALENGTH(ThreadCount),0)+ISNULL(DATALENGTH(IsPrivate),0)+ISNULL(DATALENGTH(ProjKey),0)+ISNULL(DATALENGTH(Issue_Id),0)
        +ISNULL(DATALENGTH(Issue_Code),0)+ISNULL(DATALENGTH(Title),0)+ISNULL(DATALENGTH(StatusId),0)+ISNULL(DATALENGTH(Status),0)
        +ISNULL(DATALENGTH(CreatedBy),0)+ISNULL(DATALENGTH(CompletionPct),0)+ISNULL(DATALENGTH(OverallPercentage),0)
        +ISNULL(DATALENGTH(CurrentStatusSummary),0)+ISNULL(DATALENGTH(CreatedBy_Team),0)+ISNULL(DATALENGTH(CreatedBy_TeamId),0)
        +ISNULL(DATALENGTH(CreatedBy_TeamName),0)+ISNULL(DATALENGTH(Assignee_Team),0)+ISNULL(DATALENGTH(Assignee_TeamId),0)
        +ISNULL(DATALENGTH(Assignee_TeamName),0)+ISNULL(DATALENGTH(Issuer_Name),0)+ISNULL(DATALENGTH(CreatedAt),0)
        +ISNULL(DATALENGTH(Project_Id),0)+ISNULL(DATALENGTH(Assignee_Id),0)+ISNULL(DATALENGTH(Assignee_Name),0)
        +ISNULL(DATALENGTH(TicketCreater),0)+ISNULL(DATALENGTH(Due_Date),0)+ISNULL(DATALENGTH(RepoId),0)+ISNULL(DATALENGTH(RepoKey),0)
        +ISNULL(DATALENGTH(Hours),0)+ISNULL(DATALENGTH(TotalConsumeTime),0)+ISNULL(DATALENGTH(Web),0)+ISNULL(DATALENGTH(Functional),0)
        +ISNULL(DATALENGTH(Technical),0)+ISNULL(DATALENGTH(Client),0)+ISNULL(DATALENGTH(UpdatedBy),0)+ISNULL(DATALENGTH(Move_toJson),0)
        +ISNULL(DATALENGTH(UpdatedAt),0)+ISNULL(DATALENGTH(Labels_JSON),0)+ISNULL(DATALENGTH(RowNum),0)+ISNULL(DATALENGTH(Priority),0)
        +ISNULL(DATALENGTH(ReopenedBy),0)+ISNULL(DATALENGTH(PriorityRequest),0)+ISNULL(DATALENGTH(FuncResponse),0)
        +ISNULL(DATALENGTH(IsCloseRequested),0)+ISNULL(DATALENGTH(WebResponse),0)+ISNULL(DATALENGTH(TechnicalResponse),0)
        +ISNULL(DATALENGTH(commenttext),0)+ISNULL(DATALENGTH(AdminResponse),0)+ISNULL(DATALENGTH(RaiseToClient),0)
    FROM #New
)
SELECT
    Sp,
    CASE Sp WHEN 'old' THEN @msOld ELSE @msNew END AS DurationMs,
    COUNT(*) AS [Rows],
    SUM(DescBytes) AS DescBytes,
    SUM(AttachBytes) AS AttachBytes,
    SUM(AssigneeBytes) AS AssigneeBytes,
    SUM(OtherBytes) AS OtherBytes,
    SUM(DescBytes + AttachBytes + AssigneeBytes + OtherBytes) AS TotalBytes
FROM Sz
GROUP BY Sp
ORDER BY Sp DESC;

-- ── 3. Rows only in one result (must be empty) ──────────────────────────────
SELECT 'only in old' AS Diff, Issue_Id, Issue_Code, Title FROM #Old
WHERE Issue_Id NOT IN (SELECT Issue_Id FROM #New)
UNION ALL
SELECT 'only in new', Issue_Id, Issue_Code, Title FROM #New
WHERE Issue_Id NOT IN (SELECT Issue_Id FROM #Old);

-- ── 4. List-field differences (must be empty, see commenttext note) ─────────
-- One row per ticket + column that differs.
SELECT O.Issue_Id, O.Issue_Code, C.Col, C.OldVal, C.NewVal
FROM #Old O
JOIN #New N ON N.Issue_Id = O.Issue_Id
CROSS APPLY (VALUES
    ('ThreadCount', O.ThreadCount, N.ThreadCount), ('IsPrivate', O.IsPrivate, N.IsPrivate),
    ('ProjKey', O.ProjKey, N.ProjKey), ('Issue_Code', O.Issue_Code, N.Issue_Code), ('Title', O.Title, N.Title),
    ('StatusId', O.StatusId, N.StatusId), ('Status', O.Status, N.Status), ('CreatedBy', O.CreatedBy, N.CreatedBy),
    ('CompletionPct', O.CompletionPct, N.CompletionPct), ('OverallPercentage', O.OverallPercentage, N.OverallPercentage),
    ('CurrentStatusSummary', O.CurrentStatusSummary, N.CurrentStatusSummary),
    ('CreatedBy_Team', O.CreatedBy_Team, N.CreatedBy_Team), ('CreatedBy_TeamId', O.CreatedBy_TeamId, N.CreatedBy_TeamId),
    ('CreatedBy_TeamName', O.CreatedBy_TeamName, N.CreatedBy_TeamName), ('Assignee_Team', O.Assignee_Team, N.Assignee_Team),
    ('Assignee_TeamId', O.Assignee_TeamId, N.Assignee_TeamId), ('Assignee_TeamName', O.Assignee_TeamName, N.Assignee_TeamName),
    ('Issuer_Name', O.Issuer_Name, N.Issuer_Name), ('CreatedAt', O.CreatedAt, N.CreatedAt), ('Project_Id', O.Project_Id, N.Project_Id),
    ('Assignee_Id', O.Assignee_Id, N.Assignee_Id), ('Assignee_Name', O.Assignee_Name, N.Assignee_Name),
    ('TicketCreater', O.TicketCreater, N.TicketCreater), ('Due_Date', O.Due_Date, N.Due_Date), ('RepoId', O.RepoId, N.RepoId),
    ('RepoKey', O.RepoKey, N.RepoKey), ('Hours', O.Hours, N.Hours), ('TotalConsumeTime', O.TotalConsumeTime, N.TotalConsumeTime),
    ('Web', O.Web, N.Web), ('Functional', O.Functional, N.Functional), ('Technical', O.Technical, N.Technical),
    ('Client', O.Client, N.Client), ('UpdatedBy', O.UpdatedBy, N.UpdatedBy), ('Move_toJson', O.Move_toJson, N.Move_toJson),
    ('UpdatedAt', O.UpdatedAt, N.UpdatedAt), ('Labels_JSON', O.Labels_JSON, N.Labels_JSON), ('Priority', O.Priority, N.Priority),
    ('ReopenedBy', O.ReopenedBy, N.ReopenedBy), ('PriorityRequest', O.PriorityRequest, N.PriorityRequest),
    ('FuncResponse', O.FuncResponse, N.FuncResponse), ('IsCloseRequested', O.IsCloseRequested, N.IsCloseRequested),
    ('WebResponse', O.WebResponse, N.WebResponse), ('TechnicalResponse', O.TechnicalResponse, N.TechnicalResponse),
    ('commenttext', O.commenttext, N.commenttext), ('AdminResponse', O.AdminResponse, N.AdminResponse),
    ('RaiseToClient', O.RaiseToClient, N.RaiseToClient)
) C (Col, OldVal, NewVal)
WHERE EXISTS (SELECT C.OldVal EXCEPT SELECT C.NewVal)   -- NULL-safe "is different"
ORDER BY O.Issue_Code, C.Col;

-- ── 5. Assignee differences, HandOffData ignored (must be empty) ────────────
;WITH A AS (
    SELECT 'old' AS Sp, O.Issue_Id, J.*
    FROM #Old O
    CROSS APPLY OPENJSON(O.All_Assignees) WITH (
        Assignee_Id NVARCHAR(50), Assignee_Name NVARCHAR(400), Assignee_Team NVARCHAR(50),
        Assignee_TeamId NVARCHAR(50), Assignee_TeamName NVARCHAR(400), Assignee_Type NVARCHAR(400),
        StreamId NVARCHAR(50), StreamStatus NVARCHAR(50), StatusName NVARCHAR(400),
        CompletionPct NVARCHAR(50), TargetDate NVARCHAR(50), ThreadId NVARCHAR(50), ParentThreadId NVARCHAR(50)
    ) J
    UNION ALL
    SELECT 'new', N.Issue_Id, J.*
    FROM #New N
    CROSS APPLY OPENJSON(N.All_Assignees) WITH (
        Assignee_Id NVARCHAR(50), Assignee_Name NVARCHAR(400), Assignee_Team NVARCHAR(50),
        Assignee_TeamId NVARCHAR(50), Assignee_TeamName NVARCHAR(400), Assignee_Type NVARCHAR(400),
        StreamId NVARCHAR(50), StreamStatus NVARCHAR(50), StatusName NVARCHAR(400),
        CompletionPct NVARCHAR(50), TargetDate NVARCHAR(50), ThreadId NVARCHAR(50), ParentThreadId NVARCHAR(50)
    ) J
),
OldA AS (SELECT Issue_Id, Assignee_Id, Assignee_Name, Assignee_Team, Assignee_TeamId, Assignee_TeamName, Assignee_Type,
                StreamId, StreamStatus, StatusName, CompletionPct, TargetDate, ThreadId, ParentThreadId FROM A WHERE Sp = 'old'),
NewA AS (SELECT Issue_Id, Assignee_Id, Assignee_Name, Assignee_Team, Assignee_TeamId, Assignee_TeamName, Assignee_Type,
                StreamId, StreamStatus, StatusName, CompletionPct, TargetDate, ThreadId, ParentThreadId FROM A WHERE Sp = 'new')
SELECT 'assignee only in old' AS Diff, * FROM (SELECT * FROM OldA EXCEPT SELECT * FROM NewA) X
UNION ALL
SELECT 'assignee only in new', * FROM (SELECT * FROM NewA EXCEPT SELECT * FROM OldA) Y;

-- ── 6. Order differences (informational) ────────────────────────────────────
-- Tickets whose position moved. Expected only inside groups with the same
-- flag + UpdatedAt (ties have no defined order in either SP).
SELECT O.Seq AS OldPos, N.Seq AS NewPos, O.Issue_Code, O.UpdatedAt AS OldUpdatedAt, N.UpdatedAt AS NewUpdatedAt
FROM #Old O
JOIN #New N ON N.Issue_Id = O.Issue_Id
WHERE O.Seq <> N.Seq
ORDER BY O.Seq;

-- ── 7. Single-ticket call: heavy columns identical (must be empty) ─────────
IF @IssueId IS NOT NULL
BEGIN
    SELECT O.Issue_Id, C.Col
    FROM #Old O
    JOIN #New N ON N.Issue_Id = O.Issue_Id
    CROSS APPLY (VALUES
        ('Description', O.Description, N.Description),
        ('HtmlDesc', O.HtmlDesc, N.HtmlDesc),
        ('Attachment_JSON', O.Attachment_JSON, N.Attachment_JSON),
        ('All_Assignees', O.All_Assignees, N.All_Assignees)
    ) C (Col, OldVal, NewVal)
    WHERE EXISTS (SELECT C.OldVal EXCEPT SELECT C.NewVal);
END
ELSE
    -- List call: the new SP must leave the heavy columns empty
    SELECT 'list call returned heavy data' AS Problem, Issue_Code
    FROM #New
    WHERE Description IS NOT NULL OR HtmlDesc IS NOT NULL OR Attachment_JSON IS NOT NULL
       OR All_Assignees LIKE '%"HandOffData"%';
GO
