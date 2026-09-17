/* =============================================================================
   Messenger E2EE — Phase 1: master schema (user-based keys)
   -----------------------------------------------------------------------------
   Replaces the earlier device-based design (chat_e2ee_keys.sql +
   chat_e2ee_messages.sql). Each USER now has one ECDH P-256 key pair; the
   private key is wrapped in the browser twice (by a PBKDF2 key derived from the
   login password, and by one derived from a recovery code) and only those
   opaque blobs reach the server. The server can never decrypt messages.

   ChatUserKeys             public key + password/recovery wrapped private key
   ChatConversations        1 = Direct, 2 = Group
   ChatConversationMembers  who is in a conversation (Admin | Member)
   ChatEncryptedMessages    ciphertext (+ optional reply reference)
   ChatMessageKeys          message content key wrapped for one recipient user
   ChatMessageReactions     emoji reactions
   ChatMessageTags          @user / #ticket / #meeting / #project / #repo refs
   ChatMediaAttachments     encrypted files / voice notes on local disk

   WARNING: drops every old chat table. Existing chat data (keys, conversations,
   messages) is deleted — it was encrypted to per-device keys the new design
   can't use anyway.
   ============================================================================= */
USE [WGNEST]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ---------------------------------------------------------------------------
   1. Drop old device-based tables (children before parents because of FKs)
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   2. ChatUserKeys — one key pair per user
   Wrapped blobs are [12-byte IV | AES-GCM ciphertext of the PKCS#8 private key]
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   3. ChatConversations
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   4. ChatConversationMembers
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   5. ChatEncryptedMessages
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   6. ChatMessageKeys — content key wrapped per recipient user (sender included)
   --------------------------------------------------------------------------- */
CREATE TABLE [dbo].[ChatMessageKeys](
    [MessageId]         [uniqueidentifier] NOT NULL,
    [RecipientUserId]   [uniqueidentifier] NOT NULL,
    [WrappedMessageKey] [varbinary](256)   NOT NULL,
    CONSTRAINT [PK_ChatMessageKeys] PRIMARY KEY CLUSTERED ([MessageId] ASC, [RecipientUserId] ASC),
    CONSTRAINT [FK_ChatMessageKeys_Message] FOREIGN KEY ([MessageId])
        REFERENCES [dbo].[ChatEncryptedMessages] ([Id]) ON DELETE CASCADE
) ON [PRIMARY]
GO

/* ---------------------------------------------------------------------------
   7. ChatMessageReactions
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   8. ChatMessageTags
   --------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   9. ChatMediaAttachments
   --------------------------------------------------------------------------- */
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
