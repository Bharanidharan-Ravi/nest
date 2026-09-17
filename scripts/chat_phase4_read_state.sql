/* =============================================================================
   Messenger E2EE — Phase 4: per-member read state (additive, run once on WGNEST)

   Adds ChatConversationMembers.LastReadAt so unread counts (the message bar
   badge) are tracked server-side and stay in sync across tabs and devices.
   NULL = the member has never opened the conversation (everything is unread).

   Does not touch any data; safe to re-run.
   ============================================================================= */
USE [WGNEST]
GO

IF COL_LENGTH(N'dbo.ChatConversationMembers', N'LastReadAt') IS NULL
    ALTER TABLE [dbo].[ChatConversationMembers] ADD [LastReadAt] [datetime2](7) NULL
GO
