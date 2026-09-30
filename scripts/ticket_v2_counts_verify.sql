/* ===========================================================================
   Verify GetTicketListCounts_V2 + GetTicketList_V2 paging against plain,
   hand-written SQL (no dynamic SQL, no TicketListQueryDef).

   Read-only. Every check prints PASS/FAIL; any FAIL lists the diff rows.
   Run on WG_APP:  sqlcmd ... -i scripts\ticket_v2_counts_verify.sql
   =========================================================================== */
SET NOCOUNT ON;

DECLARE @User UNIQUEIDENTIFIER =
    -- a user who owns at least one private ticket, so the private rule is exercised
    (SELECT TOP 1 Assignee_Id FROM ISSUEMASTER
     WHERE IsPrivate = 1 AND Assignee_Id IS NOT NULL
     GROUP BY Assignee_Id ORDER BY COUNT(*) DESC);
IF @User IS NULL SET @User = '00000000-0000-0000-0000-000000000000';
PRINT 'UserId used: ' + CAST(@User AS VARCHAR(36));

/* ---- visible tickets for role 1 (the security rule, written by hand) ---- */
IF OBJECT_ID('tempdb..#vis') IS NOT NULL DROP TABLE #vis;
SELECT T.Issue_Id INTO #vis
FROM ISSUEMASTER T
WHERE (ISNULL(T.IsPrivate, 0) = 0 AND ISNULL(T.Status, 0) <> 19)
   OR T.Assignee_Id = @User
   OR EXISTS (SELECT 1 FROM WorkStreams WS WHERE WS.IssueId = T.Issue_Id AND WS.ResourceId = @User
              AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17));

/* ---- (issue, facet, value) for every facet, written by hand ---- */
IF OBJECT_ID('tempdb..#fv') IS NOT NULL DROP TABLE #fv;
CREATE TABLE #fv (Issue_Id UNIQUEIDENTIFIER, Facet NVARCHAR(50) COLLATE DATABASE_DEFAULT,
                  Value NVARCHAR(200) COLLATE DATABASE_DEFAULT);

INSERT #fv SELECT T.Issue_Id, 'status',   CAST(T.Status AS NVARCHAR(20))            FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id WHERE T.Status IS NOT NULL;
INSERT #fv SELECT T.Issue_Id, 'repo',     LOWER(CONVERT(CHAR(36), T.RepoId))        FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id WHERE T.RepoId IS NOT NULL;
INSERT #fv SELECT T.Issue_Id, 'project',  LOWER(CONVERT(CHAR(36), T.Project_Id))    FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id WHERE T.Project_Id IS NOT NULL;
INSERT #fv SELECT T.Issue_Id, 'priority', T.Priority                                FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id WHERE T.Priority IS NOT NULL;
INSERT #fv SELECT T.Issue_Id, 'owner',    ISNULL(LOWER(CONVERT(CHAR(36), T.Assignee_Id)), '__no_owner__')
                                                                                    FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id;
INSERT #fv SELECT DISTINCT T.Issue_Id, 'team', CAST(E.Team AS NVARCHAR(20))
           FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id
           JOIN EmployeeMaster E ON E.EmployeeID = T.Assignee_Id WHERE E.Team IS NOT NULL;
INSERT #fv SELECT DISTINCT IL.Issue_Id, 'label', CAST(IL.Label_Id AS NVARCHAR(20))
           FROM ISSUE_LABELS IL JOIN #vis V ON V.Issue_Id = IL.Issue_Id WHERE IL.Label_Id IS NOT NULL;
INSERT #fv SELECT DISTINCT M.Issue_Id, 'handler', LOWER(CONVERT(CHAR(36), ISNULL(M.Move_to, '00000000-0000-0000-0000-000000000000')))
           FROM IssueMoveTo M JOIN #vis V ON V.Issue_Id = M.Issue_Id;
INSERT #fv SELECT DISTINCT A.Issue_Id, 'assignee', A.v FROM (
               SELECT WS.IssueId AS Issue_Id, LOWER(CONVERT(CHAR(36), WS.ResourceId)) AS v
               FROM WorkStreams WS WHERE WS.ResourceId IS NOT NULL AND (WS.StreamStatus IS NULL OR WS.StreamStatus <> 17)
               UNION
               SELECT M.Issue_Id, LOWER(CONVERT(CHAR(36), ISNULL(M.Move_to, '00000000-0000-0000-0000-000000000000')))
               FROM IssueMoveTo M) A
           JOIN #vis V ON V.Issue_Id = A.Issue_Id;
INSERT #fv SELECT T.Issue_Id, 'flag', F.v
           FROM ISSUEMASTER T JOIN #vis V ON V.Issue_Id = T.Issue_Id
           CROSS APPLY (VALUES ('isCloseRequested', T.IsCloseRequested), ('priorityRequest', T.PriorityRequest),
                               ('funcResponse', T.FuncResponse), ('webResponse', T.WebResponse),
                               ('technicalResponse', T.TechnicalResponse), ('adminResponse', T.AdminResponse),
                               ('raiseToClient', T.RaiseToClient)) F (v, b)
           WHERE F.b = 1;
INSERT #fv SELECT DISTINCT Issue_Id, 'flag', 'allFlags' FROM #fv WHERE Facet = 'flag';
INSERT #fv SELECT V.Issue_Id, 'battery', B.v
           FROM #vis V
           OUTER APPLY (SELECT TOP 1 TPL.Percentage FROM TicketProgressLogs TPL
                        WHERE TPL.Issue_Id = V.Issue_Id AND TPL.IsActive = 1 ORDER BY TPL.CreatedAt DESC) LP
           CROSS APPLY (SELECT ISNULL(LP.Percentage, 0) AS P) X
           CROSS APPLY (SELECT CASE WHEN X.P >= 0 AND X.P <= 20 THEN '0-20'  WHEN X.P > 20 AND X.P <= 40 THEN '21-40'
                                    WHEN X.P > 40 AND X.P <= 60 THEN '41-60' WHEN X.P > 60 AND X.P <= 80 THEN '61-80'
                                    WHEN X.P > 80 AND X.P <= 100 THEN '81-100' END AS v) B
           WHERE B.v IS NOT NULL;

/* ---- tests: (name, filters json, filter list as facet=value rows) ---- */
IF OBJECT_ID('tempdb..#tests') IS NOT NULL DROP TABLE #tests;
CREATE TABLE #tests (TestNo INT, Name NVARCHAR(100), Filters NVARCHAR(MAX));
IF OBJECT_ID('tempdb..#tf') IS NOT NULL DROP TABLE #tf;
CREATE TABLE #tf (TestNo INT, Facet NVARCHAR(50) COLLATE DATABASE_DEFAULT, Value NVARCHAR(200) COLLATE DATABASE_DEFAULT);

DECLARE @topRepo NVARCHAR(36)  = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'repo'  GROUP BY Value ORDER BY COUNT(*) DESC);
DECLARE @topOwner NVARCHAR(36) = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'owner' AND Value <> '__no_owner__' GROUP BY Value ORDER BY COUNT(*) DESC);
DECLARE @topLabel NVARCHAR(20) = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'label' GROUP BY Value ORDER BY COUNT(*) DESC);

-- 1: your swagger payload
INSERT #tests VALUES (1, 'status=[1]', N'{"f":{"status":[1]}}');
INSERT #tf VALUES (1, 'status', '1');
-- 2: UI "Open" tab = every status except 10,14,15,16,17,18
INSERT #tests SELECT 2, 'Open tab (status not in 10,14-18)',
       N'{"f":{"status":[' + STRING_AGG(Value, ',') + N']}}'
       FROM (SELECT DISTINCT Value FROM #fv WHERE Facet = 'status' AND Value NOT IN ('10','14','15','16','17','18')) S;
INSERT #tf SELECT DISTINCT 2, 'status', Value FROM #fv WHERE Facet = 'status' AND Value NOT IN ('10','14','15','16','17','18');
-- 3: no filters
INSERT #tests VALUES (3, 'no filters', N'{"f":{}}');
-- 4: three filters at once (checks exclude-own per facet)
INSERT #tests VALUES (4, 'status=[1,5] + repo + owner + label',
       N'{"f":{"status":[1,5],"repo":["' + @topRepo + N'"],"owner":["' + @topOwner + N'"],"label":[' + @topLabel + N']}}');
INSERT #tf VALUES (4, 'status', '1'), (4, 'status', '5'), (4, 'repo', @topRepo), (4, 'owner', @topOwner), (4, 'label', @topLabel);
-- 5: no-owner + empty-guid handler + flag + battery
DECLARE @topHandler NVARCHAR(36) = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'handler'  GROUP BY Value ORDER BY COUNT(*) DESC);
DECLARE @topAssign  NVARCHAR(36) = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'assignee' GROUP BY Value ORDER BY COUNT(*) DESC);
DECLARE @topTeam    NVARCHAR(20) = (SELECT TOP 1 Value FROM #fv WHERE Facet = 'team'     GROUP BY Value ORDER BY COUNT(*) DESC);
INSERT #tests VALUES (5, 'handler + assignee + team + battery 0-20',
       N'{"f":{"handler":["' + @topHandler + N'","00000000-0000-0000-0000-000000000000"],"assignee":["' + @topAssign
       + N'"],"team":[' + @topTeam + N'],"battery":["0-20"]}}');
INSERT #tf VALUES (5, 'handler', @topHandler), (5, 'handler', '00000000-0000-0000-0000-000000000000'),
                  (5, 'assignee', @topAssign), (5, 'team', @topTeam), (5, 'battery', '0-20');
-- 6: owner incl. no owner + flags
INSERT #tests VALUES (6, 'owner (__no_owner__ + top) + flag priorityRequest/allFlags',
       N'{"f":{"owner":["__no_owner__","' + @topOwner + N'"],"flag":["allFlags"]}}');
INSERT #tf VALUES (6, 'owner', '__no_owner__'), (6, 'owner', @topOwner), (6, 'flag', 'allFlags');

IF OBJECT_ID('tempdb..#got') IS NOT NULL DROP TABLE #got;
CREATE TABLE #got (Id NVARCHAR(300), Facet NVARCHAR(50) COLLATE DATABASE_DEFAULT,
                   Value NVARCHAR(200) COLLATE DATABASE_DEFAULT, Cnt INT);
IF OBJECT_ID('tempdb..#exp') IS NOT NULL DROP TABLE #exp;
CREATE TABLE #exp (Facet NVARCHAR(50) COLLATE DATABASE_DEFAULT, Value NVARCHAR(200) COLLATE DATABASE_DEFAULT, Cnt INT);
IF OBJECT_ID('tempdb..#pass') IS NOT NULL DROP TABLE #pass;
CREATE TABLE #pass (Issue_Id UNIQUEIDENTIFIER, Facet NVARCHAR(50) COLLATE DATABASE_DEFAULT);

IF OBJECT_ID('tempdb..#L') IS NOT NULL DROP TABLE #L;
SELECT TOP 0 T0.Issue_Id, T0.Issue_Code, T0.Title, T0.Status AS StatusId, T0.Priority, T0.IsPrivate, T0.RaiseToClient,
       T0.ProjKey, T0.RepoKey, T0.Project_Id, T0.RepoId, T0.Assignee_Id, T0.CreatedBy, T0.CreatedAt, T0.UpdatedBy,
       CAST(NULL AS DATETIME2) AS UpdatedAt, T0.Due_Date, T0.Hours, T0.CompletionPct, CAST(NULL AS FLOAT) AS OverallPercentage,
       T0.IsCloseRequested, T0.PriorityRequest, T0.FuncResponse, T0.WebResponse, T0.TechnicalResponse, T0.AdminResponse,
       T0.ReopenedBy, CAST(NULL AS INT) AS ThreadCount, CAST(NULL AS INT) AS TotalConsumeMinutes,
       CAST(NULL AS NVARCHAR(MAX)) AS commenttext, CAST(NULL AS NVARCHAR(MAX)) AS Label_Ids,
       CAST(NULL AS NVARCHAR(MAX)) AS Assignee_Ids, CAST(NULL AS NVARCHAR(MAX)) AS Handler_Ids
INTO #L FROM ISSUEMASTER T0;
ALTER TABLE #L ADD PageNo INT NULL;

DECLARE @t INT = 1, @name NVARCHAR(100), @f NVARCHAR(MAX), @bad INT, @total INT;
WHILE @t <= (SELECT MAX(TestNo) FROM #tests)
BEGIN
    SELECT @name = Name, @f = Filters FROM #tests WHERE TestNo = @t;
    PRINT '';
    PRINT '=== Test ' + CAST(@t AS VARCHAR) + ': ' + @name;
    PRINT '    ' + @f;

    /* actual */
    TRUNCATE TABLE #got;
    INSERT #got EXEC dbo.GetTicketListCounts_V2 @DbName = 'wg_app', @Role = 1, @UserId = @User, @Filters = @f;

    /* expected: for facet K, tickets passing every filter except K */
    TRUNCATE TABLE #pass;
    -- tickets x facets they pass (facets without a filter pass everything)
    INSERT #pass
    SELECT V.Issue_Id, K.Facet
    FROM #vis V
    CROSS JOIN (SELECT DISTINCT Facet FROM #fv UNION SELECT 'total') K
    WHERE NOT EXISTS (   -- no active filter (other than K itself) that the ticket fails
        SELECT 1 FROM (SELECT DISTINCT Facet FROM #tf WHERE TestNo = @t) AF
        WHERE AF.Facet <> K.Facet
          AND NOT EXISTS (SELECT 1 FROM #fv X JOIN #tf F ON F.TestNo = @t AND F.Facet = X.Facet AND F.Value = X.Value
                          WHERE X.Issue_Id = V.Issue_Id AND X.Facet = AF.Facet));

    TRUNCATE TABLE #exp;
    INSERT #exp SELECT 'total', NULL, COUNT(*) FROM #pass WHERE Facet = 'total';
    INSERT #exp SELECT X.Facet, X.Value, COUNT(DISTINCT X.Issue_Id)
                FROM #fv X JOIN #pass P ON P.Issue_Id = X.Issue_Id AND P.Facet = X.Facet
                GROUP BY X.Facet, X.Value;

    SELECT @bad = COUNT(*)
    FROM #exp E FULL JOIN #got G ON G.Facet = E.Facet AND ISNULL(G.Value, '') = ISNULL(E.Value, '')
    WHERE ISNULL(E.Cnt, -1) <> ISNULL(G.Cnt, -1);

    DECLARE @gotRows INT, @expRows INT, @expTotal INT;
    SELECT @total = Cnt FROM #got WHERE Facet = 'total';
    SELECT @expTotal = Cnt FROM #exp WHERE Facet = 'total';
    SELECT @gotRows = COUNT(*) FROM #got;
    SELECT @expRows = COUNT(*) FROM #exp;
    PRINT '    counts SP : ' + CAST(@gotRows AS VARCHAR) + ' rows, total = ' + CAST(@total AS VARCHAR)
        + ' | expected : ' + CAST(@expRows AS VARCHAR) + ' rows, total = ' + CAST(@expTotal AS VARCHAR);
    PRINT '    COUNTS    : ' + CASE WHEN @bad = 0 THEN 'PASS (every facet/value identical)' ELSE 'FAIL (' + CAST(@bad AS VARCHAR) + ' diffs)' END;

    IF @bad > 0
        SELECT TOP 30 ISNULL(E.Facet, G.Facet) AS Facet, ISNULL(E.Value, G.Value) AS Value, E.Cnt AS Expected, G.Cnt AS Got
        FROM #exp E FULL JOIN #got G ON G.Facet = E.Facet AND ISNULL(G.Value, '') = ISNULL(E.Value, '')
        WHERE ISNULL(E.Cnt, -1) <> ISNULL(G.Cnt, -1);

    /* paging: walk every page of 50; rows must add up to total, no dupes, same ids as unpaged */
    TRUNCATE TABLE #L;
    DECLARE @p INT = 1, @got INT = 1, @pf NVARCHAR(MAX);
    WHILE @got > 0 AND @p < 100
    BEGIN
        SET @pf = JSON_MODIFY(JSON_MODIFY(@f, '$.page', @p), '$.size', 50);
        INSERT #L (Issue_Id, Issue_Code, Title, StatusId, Priority, IsPrivate, RaiseToClient, ProjKey, RepoKey, Project_Id, RepoId,
                   Assignee_Id, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt, Due_Date, Hours, CompletionPct, OverallPercentage,
                   IsCloseRequested, PriorityRequest, FuncResponse, WebResponse, TechnicalResponse, AdminResponse, ReopenedBy,
                   ThreadCount, TotalConsumeMinutes, commenttext, Label_Ids, Assignee_Ids, Handler_Ids)
        EXEC dbo.GetTicketList_V2 @DbName = 'wg_app', @Role = 1, @UserId = @User, @Filters = @pf;
        SET @got = @@ROWCOUNT;
        UPDATE #L SET PageNo = @p WHERE PageNo IS NULL;
        SET @p += 1;
    END

    DECLARE @rows INT, @dist INT, @big INT, @notExp INT;
    SELECT @rows = COUNT(*), @dist = COUNT(DISTINCT Issue_Id) FROM #L;
    SELECT @big = COUNT(*) FROM (SELECT PageNo FROM #L GROUP BY PageNo HAVING COUNT(*) > 50) Z;
    SELECT @notExp = COUNT(*) FROM #L L
    WHERE NOT EXISTS (SELECT 1 FROM #pass P WHERE P.Facet = 'total' AND P.Issue_Id = L.Issue_Id);
    PRINT '    PAGING    : ' + CAST(@p - 2 AS VARCHAR) + ' pages, ' + CAST(@rows AS VARCHAR) + ' rows, '
        + CAST(@dist AS VARCHAR) + ' distinct -> '
        + CASE WHEN @rows = @total AND @dist = @rows AND @big = 0 AND @notExp = 0
               THEN 'PASS (pages add up to total, no duplicates, no page > 50, all rows match filter)'
               ELSE 'FAIL (rows=' + CAST(@rows AS VARCHAR) + ' total=' + CAST(@total AS VARCHAR)
                    + ' dupes=' + CAST(@rows - @dist AS VARCHAR) + ' oversized pages=' + CAST(@big AS VARCHAR)
                    + ' rows outside filter=' + CAST(@notExp AS VARCHAR) + ')' END;

    SET @t += 1;
END

/* ---- the numbers the UI tabs would show (role 1, this user, no other filters) ---- */
PRINT '';
PRINT '=== UI tab numbers from the status facet (no filters)';
TRUNCATE TABLE #got;
INSERT #got EXEC dbo.GetTicketListCounts_V2 @DbName = 'wg_app', @Role = 1, @UserId = @User, @Filters = N'{"f":{}}';
SELECT Tab, SUM(Cnt) AS Cnt FROM (
    SELECT CASE WHEN Value IN ('15','16','17') THEN 'Closed' WHEN Value = '14' THEN 'Hold'
                WHEN Value = '18' THEN 'In Queue' WHEN Value = '10' THEN 'Need Confirmation' ELSE 'Open' END AS Tab, Cnt
    FROM #got WHERE Facet = 'status') Z
GROUP BY Tab ORDER BY Tab;
