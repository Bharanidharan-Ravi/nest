/* =============================================================================
   Messenger E2EE — Step 1: public key directory
   -----------------------------------------------------------------------------
   Only PUBLIC keys are stored here. Private keys are generated in the browser
   (WebCrypto, non-extractable) and never leave the user's device.

   ChatIdentityKeys   long-term identity key per user + device (ECDSA P-256)
   ChatSignedPreKeys  ECDH P-256 key signed by the identity key, rotated weekly
   ============================================================================= */
USE [WGNEST]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID(N'[dbo].[ChatIdentityKeys]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ChatIdentityKeys](
        [IdentityKeyId] [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatIdentityKeys_Id] DEFAULT (NEWID()),
        [UserId]        [uniqueidentifier] NOT NULL,
        [DeviceId]      [uniqueidentifier] NOT NULL,
        [PublicKey]     [varchar](512)     NOT NULL,   -- base64 SPKI (P-256)
        [Fingerprint]   [char](64)         NOT NULL,   -- SHA-256 hex of SPKI, used for "security code"
        [DeviceInfo]    [nvarchar](max)    NULL,
        [Status]        [varchar](20)      NOT NULL CONSTRAINT [DF_ChatIdentityKeys_Status] DEFAULT ('Active'), -- Active | Revoked
        [CreatedAt]     [datetime]         NOT NULL,
        [RevokedAt]     [datetime]         NULL,
        CONSTRAINT [PK_ChatIdentityKeys] PRIMARY KEY CLUSTERED ([IdentityKeyId] ASC)
    ) ON [PRIMARY]
END
GO

-- One active identity per user + device
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ChatIdentityKeys_User_Device_Active')
    CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatIdentityKeys_User_Device_Active]
        ON [dbo].[ChatIdentityKeys] ([UserId], [DeviceId])
        WHERE [Status] = 'Active'
GO

IF OBJECT_ID(N'[dbo].[ChatSignedPreKeys]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ChatSignedPreKeys](
        [PreKeyId]      [uniqueidentifier] NOT NULL CONSTRAINT [DF_ChatSignedPreKeys_Id] DEFAULT (NEWID()),
        [IdentityKeyId] [uniqueidentifier] NOT NULL,
        [UserId]        [uniqueidentifier] NOT NULL,
        [DeviceId]      [uniqueidentifier] NOT NULL,
        [KeyId]         [int]              NOT NULL,   -- client-side sequence, lets a device find the matching private key
        [PublicKey]     [varchar](512)     NOT NULL,   -- base64 SPKI (P-256)
        [Signature]     [varchar](256)     NOT NULL,   -- base64 ECDSA-SHA256 (IEEE P1363) over the SPKI bytes
        [IsActive]      [bit]              NOT NULL CONSTRAINT [DF_ChatSignedPreKeys_IsActive] DEFAULT ((1)),
        [CreatedAt]     [datetime]         NOT NULL,
        [ExpiresAt]     [datetime]         NOT NULL,   -- CreatedAt + 7 days
        [RotatedAt]     [datetime]         NULL,
        CONSTRAINT [PK_ChatSignedPreKeys] PRIMARY KEY CLUSTERED ([PreKeyId] ASC),
        CONSTRAINT [FK_ChatSignedPreKeys_Identity] FOREIGN KEY ([IdentityKeyId])
            REFERENCES [dbo].[ChatIdentityKeys] ([IdentityKeyId])
    ) ON [PRIMARY]
END
GO

-- One active pre-key per user + device
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ChatSignedPreKeys_User_Device_Active')
    CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatSignedPreKeys_User_Device_Active]
        ON [dbo].[ChatSignedPreKeys] ([UserId], [DeviceId])
        WHERE [IsActive] = 1
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ChatSignedPreKeys_Identity_KeyId')
    CREATE UNIQUE NONCLUSTERED INDEX [UX_ChatSignedPreKeys_Identity_KeyId]
        ON [dbo].[ChatSignedPreKeys] ([IdentityKeyId], [KeyId])
GO
