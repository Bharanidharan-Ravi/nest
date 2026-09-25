/* =============================================================================
   Permission Request Management — migration (run once against WG_APP)
   -----------------------------------------------------------------------------
   Creates PERMISSION_REQUEST — short-duration (hours/minutes) permission
   requests, separate from LEAVE_REQUEST (see leave_request_migration.sql).
   Same approval workflow shape (STATUS/APPROVED_BY/REJECTED_BY/audit columns)
   so it can reuse the same admin approve/reject pattern later.

   Run manually:
     sqlcmd -S WGSQLSAP -d WG_APP -U sa -P SEngine@0202 -i scripts\permission_request_migration.sql
   or open in SSMS against WG_APP and execute.

   Idempotent / safe to re-run.
   ============================================================================= */
USE [WG_APP]
GO

IF OBJECT_ID(N'dbo.PERMISSION_REQUEST', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PERMISSION_REQUEST] (
        ID               UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PERMISSION_REQUEST_ID DEFAULT NEWID(),
        EMPLOYEE_ID      UNIQUEIDENTIFIER NOT NULL,
        PERMISSION_DATE  DATE             NOT NULL,
        DURATION_MINUTES INT              NOT NULL,
        REMARKS          NVARCHAR(500)    NULL,
        STATUS           NVARCHAR(20)     NOT NULL CONSTRAINT DF_PERMISSION_REQUEST_STATUS DEFAULT ('REQUESTED'),
        REQUESTED_DATE   DATETIME2(7)     NOT NULL CONSTRAINT DF_PERMISSION_REQUEST_REQUESTED_DATE DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time'),
        APPROVED_BY      UNIQUEIDENTIFIER NULL,
        APPROVED_DATE    DATETIME2(7)     NULL,
        REJECT_REASON    NVARCHAR(500)    NULL,
        REJECTED_BY      UNIQUEIDENTIFIER NULL,
        REJECTED_DATE    DATETIME2(7)     NULL,
        CREATED_BY       UNIQUEIDENTIFIER NOT NULL,
        CREATED_DATE     DATETIME2(7)     NOT NULL CONSTRAINT DF_PERMISSION_REQUEST_CREATED_DATE DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time'),
        UPDATED_BY       UNIQUEIDENTIFIER NULL,
        UPDATED_DATE     DATETIME2(7)     NULL,

        CONSTRAINT PK_PERMISSION_REQUEST PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT CK_PERMISSION_REQUEST_STATUS CHECK (STATUS IN ('REQUESTED', 'APPROVED', 'REJECTED')),
        CONSTRAINT CK_PERMISSION_REQUEST_DURATION CHECK (DURATION_MINUTES > 0)
    )

    CREATE INDEX IX_PERMISSION_REQUEST_EMPLOYEE_ID ON [dbo].[PERMISSION_REQUEST] (EMPLOYEE_ID)
    CREATE INDEX IX_PERMISSION_REQUEST_STATUS      ON [dbo].[PERMISSION_REQUEST] (STATUS)
END
GO

/* Post-approval "actual duration" edit: after the employee returns, an admin
   records how much time was actually used (e.g. asked for 180 min, took 120)
   without changing the originally requested DURATION_MINUTES. */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.PERMISSION_REQUEST') AND name = 'ACTUAL_DURATION_MINUTES'
)
BEGIN
    ALTER TABLE [dbo].[PERMISSION_REQUEST] ADD
        ACTUAL_DURATION_MINUTES INT              NULL,
        ACTUAL_DURATION_BY      UNIQUEIDENTIFIER NULL,
        ACTUAL_DURATION_DATE    DATETIME2(7)     NULL
END
GO

/* -----------------------------------------------------------------------------
   usp_GetPermissionRequests
   Role-aware read: @IsAdmin = 0 returns only the caller's own rows;
   @IsAdmin = 1 returns every row, with EmployeeName joined in from
   EMPLOYEEMASTER (same join key used by usp_GetLeaveRequests).
   ----------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [dbo].[usp_GetPermissionRequests]
    @DbName  NVARCHAR(128) = NULL, -- unused; every SyncExecutionService.ExecuteLocalAsync call sends this
    @UserId  UNIQUEIDENTIFIER,
    @IsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PR.ID,
        PR.EMPLOYEE_ID,
        EM.EmployeeName,
        PR.PERMISSION_DATE,
        PR.DURATION_MINUTES,
        PR.REMARKS,
        PR.STATUS,
        PR.REQUESTED_DATE,
        PR.APPROVED_BY,
        PR.APPROVED_DATE,
        PR.REJECT_REASON,
        PR.REJECTED_BY,
        PR.REJECTED_DATE,
        PR.CREATED_BY,
        PR.CREATED_DATE,
        PR.UPDATED_BY,
        PR.UPDATED_DATE,
        PR.ACTUAL_DURATION_MINUTES,
        PR.ACTUAL_DURATION_BY,
        PR.ACTUAL_DURATION_DATE
    FROM [dbo].[PERMISSION_REQUEST] PR
    LEFT JOIN [dbo].[EMPLOYEEMASTER] EM ON EM.EmployeeID = PR.EMPLOYEE_ID
    WHERE @IsAdmin = 1 OR PR.EMPLOYEE_ID = @UserId
    ORDER BY PR.REQUESTED_DATE DESC;
END
GO
