/* =============================================================================
   Leave Request Management — migration (run once against WG_APP)
   -----------------------------------------------------------------------------
   Creates LEAVE_REQUEST. All timestamp defaults use Indian Standard Time
   (not UTC) to match the API, which writes IST for REQUESTED_DATE / APPROVED_DATE
   / REJECTED_DATE / CREATED_DATE / UPDATED_DATE.

   Run manually:
     sqlcmd -S WGSQLSAP -d WG_APP -U sa -P SEngine@0202 -i scripts\leave_request_migration.sql
   or open in SSMS against WG_APP and execute.

   Idempotent / safe to re-run.
   ============================================================================= */
USE [WG_APP]
GO

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
   SAP leave type code (e.g. "CL", "EL") from the LEAVETYPE /sync/v2 master,
   so widen it on any install that still has the old INT column. */
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

/* -----------------------------------------------------------------------------
   usp_GetLeaveRequests
   Role-aware read: @IsAdmin = 0 returns only the caller's own rows;
   @IsAdmin = 1 returns every row, with EmployeeName joined in from
   EMPLOYEEMASTER (same join key used elsewhere: EMPLOYEEMASTER.EmployeeID).
   ----------------------------------------------------------------------------- */
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
