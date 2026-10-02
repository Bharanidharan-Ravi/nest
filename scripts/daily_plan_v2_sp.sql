/* =============================================================================
   dbo.GetDailyPlan_V2 — checked tickets (daily plan rows) only, no ticket data
   (run on WG_APP; safe to re-run)

   Why
     The old dbo.getdailyplan copied the ticket list columns (title, labels,
     assignees, project, repo ...), so every new ticket list column had to be
     added there too. Now it returns plan rows only; the Checked Tickets tab
     loads the tickets themselves from GetTicketList_V2 with the "issue"
     filter (TicketId list), so visibility, hours, labels etc. come from one
     place. Checked_Person is mapped in the UI from UserId (employee master).

   Same parameters as the old SP:
     @userId   — NULL = every user's plan
     @planDate — plan day

   dbo.getdailyplan stays for the API build still deployed; drop it after the
   new API (config key "CheckedTickets" → GetDailyPlan_V2) is live.
   ============================================================================= */

USE [WG_APP]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
  EXEC GetDailyPlan_V2 @DbName = 'wg_app', @userId = NULL, @planDate = '2026-10-02';
*/
CREATE OR ALTER PROCEDURE [dbo].[GetDailyPlan_V2]
(
    @DbName   NVARCHAR(100)    = NULL,   -- always sent by the API; unused
    @userId   UNIQUEIDENTIFIER = NULL,
    @planDate DATETIME
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dp.Id,
        dp.TicketId,
        dp.UserId,
        dp.PlannedDate,
        dp.Status,
        dp.UncheckComment,
        dp.ProjKey
    FROM dbo.DailyPlans dp
    WHERE (@userId IS NULL OR dp.UserId = @userId)
      AND dp.PlannedDate >= CAST(@planDate AS DATE)
      AND dp.PlannedDate <  DATEADD(DAY, 1, CAST(@planDate AS DATE))
      AND dp.Status <> 4;
END
GO
