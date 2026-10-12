/* =============================================================================
   GetBannerMessage — @ActiveOnly (run on WG_APP_TEST1 first, then WG_APP)
   -----------------------------------------------------------------------------
   The header ticker loaded every banner ever created and kept only the active
   ones in the browser. With @ActiveOnly = 1 the SP returns only
   Status = 'Active' banners whose EndDate is today or later — the same rule
   the header applied client side. The API passes sync Params straight through
   as SP parameters, so no API change is needed. The admin banner screens don't
   send ActiveOnly (default 0) and still get the full list.

   Run manually (test first):
     sqlcmd -S WGSQLSAP -d WG_APP_TEST1 -U sa -P SEngine@0202 -C -i scripts\banner_active_only_sp.sql
     sqlcmd -S WGSQLSAP -d WG_APP       -U sa -P SEngine@0202 -C -i scripts\banner_active_only_sp.sql

   Idempotent / safe to re-run. Runs against whichever database -d points at.
   ============================================================================= */

CREATE OR ALTER PROCEDURE [dbo].[GetBannerMessage]
(
    @DbName NVARCHAR(255) = NULL,
    @BannerMessageId UNIQUEIDENTIFIER = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @ActiveOnly BIT = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bm.BannerMessageId,
        bm.MessageText,
        bm.MessageTypeId,
        bm.Status,
        bm.StartDate,
        bm.EndDate,
        bm.ToClient,
        bm.CreatedBy,
        bm.CreatedAt,
        bm.UpdatedBy,
        bm.UpdatedAt,
        bmt.ColorCode,
        bmt.Type_Name,
        bmt.IconClass
    FROM dbo.BannerMessage bm
    LEFT JOIN dbo.BannerMessageType bmt ON bm.MessageTypeId = bmt.MessageTypeId
    WHERE 1 = 1
        AND (@BannerMessageId IS NULL OR bm.BannerMessageId = @BannerMessageId)
        AND (@FromDate IS NULL OR bm.StartDate >= @FromDate)
        AND (@ToDate IS NULL OR bm.EndDate <= @ToDate)
        AND (
            @ActiveOnly = 0
            OR (bm.Status = N'Active' AND bm.EndDate >= CAST(GETDATE() AS DATE))
        )
    ORDER BY bm.CreatedAt DESC;
END
GO
