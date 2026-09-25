/* =============================================================================
   Leave Management — full migration (run once against WG_APP)
   -----------------------------------------------------------------------------
   Combines, in dependency order:
     1. LEAVE_TYPE          + usp_GetLeaveTypes         (leave_type_migration.sql)
     2. LEAVE_REQUEST       + usp_GetLeaveRequests      (leave_request_migration.sql)
     3. PERMISSION_REQUEST  + usp_GetPermissionRequests (permission_request_migration.sql)

   INSERT/UPDATE (Create, approve/reject, actual-duration) for LEAVE_REQUEST and
   PERMISSION_REQUEST are done by the API through EF Core, not stored procs —
   so only read-side procs (the ones /sync/v2 calls) are needed here.

   Run manually:
     sqlcmd -S WGSQLSAP -d WG_APP -U sa -P SEngine@0202 -i scripts\leave_management_full_migration.sql
   or open in SSMS against WG_APP and execute.

   Idempotent / safe to re-run.
   ============================================================================= */
USE [WG_APP]
GO

/* =============================================================================
   1. LEAVE_TYPE
   ============================================================================= */
IF OBJECT_ID(N'dbo.LEAVE_TYPE', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[LEAVE_TYPE] (
        ID          INT           IDENTITY(1,1) NOT NULL,
        CODE        VARCHAR(20)   NOT NULL,
        NAME        NVARCHAR(100) NOT NULL,
        DESCRIPTION NVARCHAR(500) NULL,
        IS_ACTIVE   BIT           NOT NULL CONSTRAINT DF_LEAVE_TYPE_IS_ACTIVE DEFAULT (1),

        CONSTRAINT PK_LEAVE_TYPE PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT UQ_LEAVE_TYPE_CODE UNIQUE (CODE)
    )
END
GO

/* Seed rows — safe to re-run; only inserts codes that don't already exist. */
MERGE [dbo].[LEAVE_TYPE] AS target
USING (VALUES
    ('CL', N'Casual Leave',    NULL),
    ('CP', N'Client Place',    NULL),
    ('EL', N'Emergency Leave', NULL),
    ('LL', N'Long Leave',      NULL),
    ('ML', N'Marriage Leave',  NULL),
    ('SL', N'Sick Leave',      NULL),
    ('VL', N'Vacation Leave',  NULL)
) AS src (CODE, NAME, DESCRIPTION)
ON target.CODE = src.CODE
WHEN NOT MATCHED THEN
    INSERT (CODE, NAME, DESCRIPTION) VALUES (src.CODE, src.NAME, src.DESCRIPTION);
GO

/* Plain read (no role/user filtering — shared master list). Column aliases
   match what masterRegistry.js's leavetype.adapter already expects:
   { id: raw.code, name: raw.Name }. */
CREATE OR ALTER PROCEDURE [dbo].[usp_GetLeaveTypes]
    @DbName NVARCHAR(128) = NULL -- unused; every SyncExecutionService.ExecuteLocalAsync call sends this
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        LT.CODE        AS code,
        LT.NAME         AS Name,
        LT.DESCRIPTION  AS Description
    FROM [dbo].[LEAVE_TYPE] LT
    WHERE LT.IS_ACTIVE = 1
    ORDER BY LT.NAME;
END
GO

/* =============================================================================
   2. LEAVE_REQUEST
   ============================================================================= */
IF OBJECT_ID(N'dbo.LEAVE_REQUEST', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[LEAVE_REQUEST] (
        ID               UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_LEAVE_REQUEST_ID DEFAULT NEWID(),
        EMPLOYEE_ID      UNIQUEIDENTIFIER NOT NULL,
        LEAVE_FROM       DATE             NOT NULL,
        LEAVE_TO         DATE             NOT NULL,
        LEAVE_TYPE_ID    VARCHAR(20)      NOT NULL,
        NO_OF_LEAVE_DAYS INT              NOT NULL,
        COMMENTS         NVARCHAR(500)    NULL,
        STATUS           NVARCHAR(20)     NOT NULL CONSTRAINT DF_LEAVE_REQUEST_STATUS DEFAULT ('REQUESTED'),
        REQUESTED_DATE   DATETIME2(7)     NOT NULL CONSTRAINT DF_LEAVE_REQUEST_REQUESTED_DATE DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time'),
        APPROVED_BY      UNIQUEIDENTIFIER NULL,
        APPROVED_DATE    DATETIME2(7)     NULL,
        REJECT_REASON    NVARCHAR(500)    NULL,
        REJECTED_BY      UNIQUEIDENTIFIER NULL,
        REJECTED_DATE    DATETIME2(7)     NULL,
        CREATED_BY       UNIQUEIDENTIFIER NOT NULL,
        CREATED_DATE     DATETIME2(7)     NOT NULL CONSTRAINT DF_LEAVE_REQUEST_CREATED_DATE DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time'),
        UPDATED_BY       UNIQUEIDENTIFIER NULL,
        UPDATED_DATE     DATETIME2(7)     NULL,

        CONSTRAINT PK_LEAVE_REQUEST PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT CK_LEAVE_REQUEST_STATUS CHECK (STATUS IN ('REQUESTED', 'APPROVED', 'REJECTED')),
        CONSTRAINT CK_LEAVE_REQUEST_DATES CHECK (LEAVE_TO >= LEAVE_FROM)
    )

    CREATE INDEX IX_LEAVE_REQUEST_EMPLOYEE_ID ON [dbo].[LEAVE_REQUEST] (EMPLOYEE_ID)
    CREATE INDEX IX_LEAVE_REQUEST_STATUS      ON [dbo].[LEAVE_REQUEST] (STATUS)
END
GO

/* LEAVE_TYPE_ID was originally INT (a small static list). It now stores the
   leave type code (e.g. "CL", "EL") — widen it on any install that still has
   the old INT column. */
IF EXISTS (
    SELECT 1 FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.LEAVE_REQUEST') AND c.name = 'LEAVE_TYPE_ID' AND t.name = 'int'
)
BEGIN
    ALTER TABLE [dbo].[LEAVE_REQUEST] ALTER COLUMN LEAVE_TYPE_ID VARCHAR(20) NOT NULL
END
GO

/* Post-approval "not taken" flag: an admin can mark an APPROVED leave as not
   actually taken, without changing STATUS (still reads as APPROVED). */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.LEAVE_REQUEST') AND name = 'NOT_TAKEN'
)
BEGIN
    ALTER TABLE [dbo].[LEAVE_REQUEST] ADD
        NOT_TAKEN      BIT          NOT NULL CONSTRAINT DF_LEAVE_REQUEST_NOT_TAKEN DEFAULT (0),
        NOT_TAKEN_BY   UNIQUEIDENTIFIER NULL,
        NOT_TAKEN_DATE DATETIME2(7) NULL
END
GO

/* Role-aware read: @IsAdmin = 0 returns only the caller's own rows;
   @IsAdmin = 1 returns every row, with EmployeeName joined in from
   EMPLOYEEMASTER. */
CREATE OR ALTER PROCEDURE [dbo].[usp_GetLeaveRequests]
    @DbName  NVARCHAR(128) = NULL, -- unused; every SyncExecutionService.ExecuteLocalAsync call sends this
    @UserId  UNIQUEIDENTIFIER,
    @IsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        LR.ID,
        LR.EMPLOYEE_ID,
        EM.EmployeeName,
        LR.LEAVE_FROM,
        LR.LEAVE_TO,
        LR.LEAVE_TYPE_ID,
        LR.NO_OF_LEAVE_DAYS,
        LR.COMMENTS,
        LR.STATUS,
        LR.REQUESTED_DATE,
        LR.APPROVED_BY,
        LR.APPROVED_DATE,
        LR.REJECT_REASON,
        LR.REJECTED_BY,
        LR.REJECTED_DATE,
        LR.CREATED_BY,
        LR.CREATED_DATE,
        LR.UPDATED_BY,
        LR.UPDATED_DATE,
        LR.NOT_TAKEN,
        LR.NOT_TAKEN_BY,
        LR.NOT_TAKEN_DATE
    FROM [dbo].[LEAVE_REQUEST] LR
    LEFT JOIN [dbo].[EMPLOYEEMASTER] EM ON EM.EmployeeID = LR.EMPLOYEE_ID
    WHERE @IsAdmin = 1 OR LR.EMPLOYEE_ID = @UserId
    ORDER BY LR.REQUESTED_DATE DESC;
END
GO

/* =============================================================================
   3. PERMISSION_REQUEST
   ============================================================================= */
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

/* Role-aware read: @IsAdmin = 0 returns only the caller's own rows;
   @IsAdmin = 1 returns every row, with EmployeeName joined in from
   EMPLOYEEMASTER (same join key used by usp_GetLeaveRequests). */
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
