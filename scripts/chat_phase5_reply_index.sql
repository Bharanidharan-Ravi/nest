/* =============================================================================
   Messenger E2EE — Phase 5: index for threaded replies (additive, run once on WGNEST)

   ChatEncryptedMessages.ReplyToMessageId already exists (added in the Phase 1
   master schema) but had no index — every "find the message this is a reply
   to" lookup would be a table scan. Groups (Type/Title/ChatConversationMembers.Role)
   also already exist from Phase 1, so no schema change is needed for group chat.

   Does not touch any data; safe to re-run.
   ============================================================================= */
USE [WGNEST]
GO

SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ChatEncryptedMessages_ReplyToMessageId'
      AND object_id = OBJECT_ID(N'dbo.ChatEncryptedMessages')
)
    CREATE INDEX [IX_ChatEncryptedMessages_ReplyToMessageId]
        ON [dbo].[ChatEncryptedMessages] ([ReplyToMessageId])
        WHERE [ReplyToMessageId] IS NOT NULL
GO
