/* =============================================================================
   Chat / Messenger — Combined migration (all phases in one file)
   -----------------------------------------------------------------------------
   Merges, in order:
     1. chat_e2ee_master_schema.sql     - Phase 1: master schema (user-based keys)
     2. chat_recovery_escrow_schema.sql - recovery-code escrow (additive)
     3. chat_phase4_read_state.sql      - Phase 4: per-member read state (additive)
     4. chat_phase5_reply_index.sql     - Phase 5: threaded-reply index (additive)
     5. chat_group_icon_schema.sql      - Group icon column (additive)

   Run this single file top to bottom against WG_APP with SQLCMD / SSMS.

   WARNING (carried over from Phase 1): section 1 DROPS every existing chat
   table (old device-based keys, conversations, messages, reactions, tags,
   attachments) before recreating them. Any existing chat data is deleted -
   it was encrypted to per-device keys the new design can't use anyway.
   Sections 2-5 are additive/idempotent and safe to re-run on their own.
   ============================================================================= */
USE [WG_APP]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* =============================================================================
   SECTION 1 — Phase 1: master schema (user-based keys)
   =============================================================================
   Each USER has one ECDH P-256 key pair; the private key is wrapped in the
   browser twice (by a PBKDF2 key derived from the login password, and by one
   derived from a recovery code) and only those opaque blobs reach the server.
   The server can never decrypt messages.

   ChatUserKeys             public key + password/recovery wrapped private key
   ChatConversations        1 = Direct, 2 = Group
   ChatConversationMembers  who is in a conversation (Admin | Member)
   ChatEncryptedMessages    ciphertext (+ optional reply reference)
   ChatMessageKeys          message content key wrapped for one recipient user
   ChatMessageReactions     emoji reactions
   ChatMessageTags          @user / #ticket / #meeting / #project / #repo refs
   ChatMediaAttachments     encrypted files / voice notes on local disk
   ============================================================================= */

-- 1.1 Drop old device-based tables (children before parents because of FKs)
IF OBJECT_ID(N'[dbo].[ChatMediaAttachments]', N'U')    IS NOT NULL DROP TABLE [dbo].[ChatMediaAttachments]
IF OBJECT_ID(N'[dbo].[ChatMessageTags]', N'U')         IS NOT NULL DROP TABLE [dbo].[ChatMessageTags]
IF OBJECT_ID(N'[dbo].[ChatMessageReactions]', N'U')    IS NOT NULL DROP TABLE [dbo].[ChatMessageReactions]
IF OBJECT_ID(N'[dbo].[ChatMessageKeys]', N'U')         IS NOT NULL DROP TABLE [dbo].[ChatMessageKeys]
IF OBJECT_ID(N'[dbo].[ChatEncryptedMessages]', N'U')   IS NOT NULL DROP TABLE [dbo].[ChatEncryptedMessages]
IF OBJECT_ID(N'[dbo].[ChatConversationMembers]', N'U') IS NOT NULL DROP TABLE [dbo].[ChatConversationMembers]
IF OBJECT_ID(N'[dbo].[ChatConversations]', N'U')       IS NOT NULL DROP TABLE [dbo].[ChatConversations]
IF OBJECT_ID(N'[dbo].[ChatSignedPreKeys]', N'U')       IS NOT NULL DROP TABLE [dbo].[ChatSignedPreKeys]
IF OBJECT_ID(N'[dbo].[ChatIdentityKeys]', N'U')        IS NOT NULL DROP TABLE [dbo].[ChatIdentityKeys]
IF OBJECT_ID(N'[dbo].[ChatUserKeys]', N'U')            IS NOT NULL DROP TABLE [dbo].[ChatUserKeys]
GO

-- 1.2 ChatUserKeys — one key pair per user
-- Wrapped blobs are [12-byte IV | AES-GCM ciphertext of the PKCS#8 private key]
CREATE TABLE [dbo].[ChatUserKeys](
    [UserId]            [uniqueidentifier] NOT NULL,
    [PublicKey]         [varchar](256)     NOT NULL,   -- base64 SPKI (P-256)
    [WrappedByPassword] [varbinary](1024)  NOT NULL,
    [PasswordSalt]      [varbinary](64)    NOT NULL,
    [WrappedByRecovery] [varbinary](1024)  NOT NULL,
    [RecoverySalt]      [varbinary](64)    NOT NULL,
    [KeyVersion]        [int]              NOT NULL CONSTRAINT [DF_ChatUserKeys_KeyVersion] DEFAULT ((1)),
    [CreatedAt]         [datetime2](7)     NOT NULL,
    [RotatedAt]         [datetime2](7)     NULL,
    CONSTRAINT [PK_ChatUserKeys] PRIMARY KEY CLUSTERED ([UserId] ASC)
) ON [PRIMARY]
GO

-- 1.3 ChatConversations
CREATE TABLE [dbo].[ChatConversations](
    [Id]              [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatConversations_Id] DEFAULT (NEWID()),
    [Type]            [tinyint]          NOT NULL,   -- 1 = Direct, 2 = Group
    [Title]           [nvarchar](120)    NULL,       -- NULL for Direct
    [DirectKey]       [varchar](100)     NULL,       -- "<min userId>|<max userId>" for Direct, NULL for Group
    [CreatedByUserId] [uniqueidentifier] NOT NULL,
    [CreatedAt]       [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatConversations] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_ChatConversations_Type] CHECK ([Type] IN (1, 2)),
    CONSTRAINT [CK_ChatConversations_DirectKey] CHECK (
        ([Type] = 1 AND [DirectKey] IS NOT NULL) OR ([Type] = 2 AND [DirectKey] IS NULL))
) ON [PRIMARY]
GO

-- Exactly one direct conversation per pair of users
CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatConversations_DirectKey]
    ON [dbo].[ChatConversations] ([DirectKey])
    WHERE [DirectKey] IS NOT NULL
GO

-- 1.4 ChatConversationMembers
CREATE TABLE [dbo].[ChatConversationMembers](
    [ConversationId] [uniqueidentifier] NOT NULL,
    [UserId]         [uniqueidentifier] NOT NULL,
    [Role]           [nvarchar](10)     NOT NULL CONSTRAINT [DF_ChatConversationMembers_Role] DEFAULT (N'Member'),
    [JoinedAt]       [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatConversationMembers] PRIMARY KEY CLUSTERED ([ConversationId] ASC, [UserId] ASC),
    CONSTRAINT [CK_ChatConversationMembers_Role] CHECK ([Role] IN (N'Admin', N'Member')),
    CONSTRAINT [FK_ChatConversationMembers_Conversation] FOREIGN KEY ([ConversationId])
        REFERENCES [dbo].[ChatConversations] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

-- "My conversations" lookup
CREATE NONCLUSTERED INDEX [IX_ChatConversationMembers_User]
    ON [dbo].[ChatConversationMembers] ([UserId]) INCLUDE ([Role])
GO

-- 1.5 ChatEncryptedMessages
CREATE TABLE [dbo].[ChatEncryptedMessages](
    [Id]               [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatEncryptedMessages_Id] DEFAULT (NEWID()),
    [ConversationId]   [uniqueidentifier] NOT NULL,
    [SenderUserId]     [uniqueidentifier] NOT NULL,
    [ClientMessageId]  [nvarchar](100)    NOT NULL,   -- generated by the sender; makes retries idempotent
    [EncryptedPayload] [varbinary](max)   NOT NULL,   -- [12-byte IV | AES-256-GCM ciphertext + tag]
    [ReplyToMessageId] [uniqueidentifier] NULL,
    [CreatedAt]        [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatEncryptedMessages] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatEncryptedMessages_Conversation] FOREIGN KEY ([ConversationId])
        REFERENCES [dbo].[ChatConversations] ([Id]),
    CONSTRAINT [FK_ChatEncryptedMessages_ReplyTo] FOREIGN KEY ([ReplyToMessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id])
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatEncryptedMessages_Sender_ClientMessageId]
    ON [dbo].[ChatEncryptedMessages] ([SenderUserId], [ClientMessageId])
GO

-- Timeline paging (Id breaks ties between identical timestamps)
CREATE NONCLUSTERED INDEX [IX_ChatEncryptedMessages_Conversation_CreatedAt]
    ON [dbo].[ChatEncryptedMessages] ([ConversationId], [CreatedAt] DESC, [Id])
GO

-- 1.6 ChatMessageKeys — content key wrapped per recipient user (sender included)
CREATE TABLE [dbo].[ChatMessageKeys](
    [MessageId]         [uniqueidentifier] NOT NULL,
    [RecipientUserId]   [uniqueidentifier] NOT NULL,
    [WrappedMessageKey] [varbinary](256)   NOT NULL,
    CONSTRAINT [PK_ChatMessageKeys] PRIMARY KEY CLUSTERED ([MessageId] ASC, [RecipientUserId] ASC),
    CONSTRAINT [FK_ChatMessageKeys_Message] FOREIGN KEY ([MessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

-- 1.7 ChatMessageReactions
CREATE TABLE [dbo].[ChatMessageReactions](
    [Id]        [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatMessageReactions_Id] DEFAULT (NEWID()),
    [MessageId] [uniqueidentifier] NOT NULL,
    [UserId]    [uniqueidentifier] NOT NULL,
    [Emoji]     [nvarchar](16)     NOT NULL,
    [CreatedAt] [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatMessageReactions] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatMessageReactions_Message] FOREIGN KEY ([MessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatMessageReactions_Message_User_Emoji]
    ON [dbo].[ChatMessageReactions] ([MessageId], [UserId], [Emoji])
GO

-- 1.8 ChatMessageTags
CREATE TABLE [dbo].[ChatMessageTags](
    [Id]          [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatMessageTags_Id] DEFAULT (NEWID()),
    [MessageId]   [uniqueidentifier] NOT NULL,
    [EntityType]  [nvarchar](20)     NOT NULL,   -- User | Ticket | Meeting | Project | Repo
    [EntityId]    [nvarchar](100)    NOT NULL,
    [DisplayText] [nvarchar](100)    NOT NULL,
    CONSTRAINT [PK_ChatMessageTags] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_ChatMessageTags_EntityType] CHECK ([EntityType] IN (N'User', N'Ticket', N'Meeting', N'Project', N'Repo')),
    CONSTRAINT [FK_ChatMessageTags_Message] FOREIGN KEY ([MessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_ChatMessageTags_Message]
    ON [dbo].[ChatMessageTags] ([MessageId])
GO

-- "Where was this ticket / user mentioned"
CREATE NONCLUSTERED INDEX [IX_ChatMessageTags_Entity]
    ON [dbo].[ChatMessageTags] ([EntityType], [EntityId]) INCLUDE ([MessageId])
GO

-- 1.9 ChatMediaAttachments
CREATE TABLE [dbo].[ChatMediaAttachments](
    [Id]               [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatMediaAttachments_Id] DEFAULT (NEWID()),
    [MessageId]        [uniqueidentifier] NOT NULL,
    [StoragePath]      [nvarchar](500)    NOT NULL,
    [OriginalFileName] [nvarchar](255)    NOT NULL,
    [MimeType]         [nvarchar](100)    NOT NULL,
    [FileSize]         [bigint]           NOT NULL,
    [EncryptedFileKey] [varbinary](256)   NOT NULL,
    [Iv]               [varbinary](12)    NOT NULL,
    [CreatedAt]        [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatMediaAttachments] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatMediaAttachments_Message] FOREIGN KEY ([MessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_ChatMediaAttachments_Message]
    ON [dbo].[ChatMediaAttachments] ([MessageId])
GO


/* =============================================================================
   SECTION 2 — Chat recovery-code escrow (additive)
   =============================================================================
   Stores each user's recovery code encrypted with the server-held admin key
   (APIGateWay.BusinessLayer.Helpers.ChatRecoveryEscrowCipher, config
   "ChatRecoveryEscrow:key") so support can re-issue it via
   GET /api/ChatKeys/{userId}/recovery-escrow (admin role only).

   WARNING: whoever holds ChatRecoveryEscrow:key can decrypt every row in this
   table, and therefore every user's chat private key. Treat that key like a
   master secret, and set a real value in appsettings before this goes live -
   it ships with a placeholder that fails closed until replaced.
   ============================================================================= */

IF OBJECT_ID(N'[dbo].[ChatUserKeyRecoveryEscrow]', N'U') IS NOT NULL
    DROP TABLE [dbo].[ChatUserKeyRecoveryEscrow]
GO

CREATE TABLE [dbo].[ChatUserKeyRecoveryEscrow](
    [UserId]               [uniqueidentifier] NOT NULL,
    [EncryptedRecoveryCode] [nvarchar](200)    NOT NULL,  -- base64 [12B IV | 16B tag | ciphertext]
    [CreatedAt]            [datetime2](7)     NOT NULL,
    CONSTRAINT [PK_ChatUserKeyRecoveryEscrow] PRIMARY KEY CLUSTERED ([UserId] ASC),
    CONSTRAINT [FK_ChatUserKeyRecoveryEscrow_ChatUserKeys] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[ChatUserKeys] ([UserId]) ON DELETE CASCADE
) ON [PRIMARY]
GO


/* =============================================================================
   SECTION 3 — Phase 4: per-member read state (additive, safe to re-run)
   =============================================================================
   Adds ChatConversationMembers.LastReadAt so unread counts (the message bar
   badge) are tracked server-side and stay in sync across tabs and devices.
   NULL = the member has never opened the conversation (everything is unread).
   ============================================================================= */

IF COL_LENGTH(N'dbo.ChatConversationMembers', N'LastReadAt') IS NULL
    ALTER TABLE [dbo].[ChatConversationMembers] ADD [LastReadAt] [datetime2](7) NULL
GO


/* =============================================================================
   SECTION 4 — Phase 5: index for threaded replies (additive, safe to re-run)
   =============================================================================
   ChatEncryptedMessages.ReplyToMessageId already exists (added in section 1)
   but had no index - every "find the message this is a reply to" lookup would
   be a table scan. Groups (Type/Title/ChatConversationMembers.Role) also
   already exist from section 1, so no schema change is needed for group chat.
   ============================================================================= */

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ChatEncryptedMessages_ReplyToMessageId'
      AND object_id = OBJECT_ID(N'dbo.ChatEncryptedMessages')
)
    CREATE INDEX [IX_ChatEncryptedMessages_ReplyToMessageId]
        ON [dbo].[ChatEncryptedMessages] ([ReplyToMessageId])
        WHERE [ReplyToMessageId] IS NOT NULL
GO


/* =============================================================================
   SECTION 5 — Group info: group icon (additive, safe to re-run)
   =============================================================================
   Adds ChatConversations.GroupIconUrl - the public URL of an admin-set group
   photo (plain static file under FileSettings:OriginalFolder/ChatGroupIcons,
   NOT end-to-end encrypted, same trust level as an employee profile photo).
   NULL for Direct conversations and for groups that haven't set one yet.
   ============================================================================= */

IF COL_LENGTH(N'dbo.ChatConversations', N'GroupIconUrl') IS NULL
    ALTER TABLE [dbo].[ChatConversations] ADD [GroupIconUrl] [nvarchar](500) NULL
GO
