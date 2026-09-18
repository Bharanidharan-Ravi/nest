/* =============================================================================
   Messenger — Group info: group icon (additive, run once on WGNEST)

   Adds ChatConversations.GroupIconUrl — the public URL of an admin-set group
   photo (plain static file under FileSettings:OriginalFolder/ChatGroupIcons,
   NOT end-to-end encrypted, same trust level as an employee profile photo).
   NULL for Direct conversations and for groups that haven't set one yet.

   Does not touch any data; safe to re-run.
   ============================================================================= */
USE [WG_APP]
GO

IF COL_LENGTH(N'dbo.ChatConversations', N'GroupIconUrl') IS NULL
    ALTER TABLE [dbo].[ChatConversations] ADD [GroupIconUrl] [nvarchar](500) NULL
GO
