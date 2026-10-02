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
