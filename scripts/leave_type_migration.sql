/* =============================================================================
   Leave Type Master — migration (run once against WG_APP)
   -----------------------------------------------------------------------------
   Creates LEAVE_TYPE, a local replacement for the SAP-backed "LEAVETYPE"
   /sync/v2 master (see masterRegistry.js → leavetype, ConfigKey "LEAVETYPE").
   Only NAME / CODE / DESCRIPTION are stored — LEAVE_REQUEST.LEAVE_TYPE_ID
   already stores the CODE (e.g. "CL", "EL"), so no other table changes.

   Run manually:
     sqlcmd -S WGSQLSAP -d WG_APP -U sa -P SEngine@0202 -i scripts\leave_type_migration.sql
   or open in SSMS against WG_APP and execute.

   Idempotent / safe to re-run.
   ============================================================================= */
USE [WG_APP]
GO

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

/* -----------------------------------------------------------------------------
   usp_GetLeaveTypes
   Plain read (no role/user filtering needed — it's a shared master list).
   Matches the shape masterRegistry.js's leavetype.adapter already expects:
   { id: raw.code, name: raw.Name } — CODE/NAME columns are aliased below so
   the SyncRepositoryConfigStore.cs ConfigKey mapping can stay "LEAVETYPE".
   ----------------------------------------------------------------------------- */
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
