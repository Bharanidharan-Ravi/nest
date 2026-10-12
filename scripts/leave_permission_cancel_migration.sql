/* =============================================================================
   Leave / Permission request CANCEL — migration (run on WG_APP_TEST1 first, then WG_APP)
   -----------------------------------------------------------------------------
   Employees can cancel their own request while it is still REQUESTED
   (PATCH /api/LeaveRequest/{id}/cancel, PATCH /api/PermissionRequest/{id}/cancel).
   The row is kept with STATUS = 'CANCELLED'. The existing STATUS check
   constraints only allow REQUESTED / APPROVED / REJECTED, so saving CANCELLED
   fails with a 500 until they are widened.

   Run manually (test first):
     sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P SEngine@0202 -C -i scripts\leave_permission_cancel_migration.sql
     sqlcmd -S WGSQLSAP -d WG_APP       -U sa -P SEngine@0202 -C -i scripts\leave_permission_cancel_migration.sql

   Idempotent / safe to re-run. Runs against whichever database -d points at.
   ============================================================================= */

-- LEAVE_REQUEST ---------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_LEAVE_REQUEST_STATUS' AND parent_object_id = OBJECT_ID(N'dbo.LEAVE_REQUEST')
             AND definition NOT LIKE N'%CANCELLED%')
    ALTER TABLE [dbo].[LEAVE_REQUEST] DROP CONSTRAINT CK_LEAVE_REQUEST_STATUS;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = N'CK_LEAVE_REQUEST_STATUS' AND parent_object_id = OBJECT_ID(N'dbo.LEAVE_REQUEST'))
    ALTER TABLE [dbo].[LEAVE_REQUEST] ADD CONSTRAINT CK_LEAVE_REQUEST_STATUS
        CHECK ([STATUS] IN ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'));
GO

-- PERMISSION_REQUEST ----------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_PERMISSION_REQUEST_STATUS' AND parent_object_id = OBJECT_ID(N'dbo.PERMISSION_REQUEST')
             AND definition NOT LIKE N'%CANCELLED%')
    ALTER TABLE [dbo].[PERMISSION_REQUEST] DROP CONSTRAINT CK_PERMISSION_REQUEST_STATUS;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = N'CK_PERMISSION_REQUEST_STATUS' AND parent_object_id = OBJECT_ID(N'dbo.PERMISSION_REQUEST'))
    ALTER TABLE [dbo].[PERMISSION_REQUEST] ADD CONSTRAINT CK_PERMISSION_REQUEST_STATUS
        CHECK ([STATUS] IN ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'));
GO

-- Verify ----------------------------------------------------------------------
SELECT t.name AS [table], cc.name AS [constraint], cc.definition
FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id = cc.parent_object_id
WHERE cc.name IN (N'CK_LEAVE_REQUEST_STATUS', N'CK_PERMISSION_REQUEST_STATUS');
GO
