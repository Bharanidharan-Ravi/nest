/* =============================================================================
   Chat recovery-code escrow — additive migration, run once against WGNEST.

   ChatUserKeyRecoveryEscrow stores each user's recovery code encrypted with the
   server-held admin key (APIGateWay.BusinessLayer.Helpers.ChatRecoveryEscrowCipher,
   config "ChatRecoveryEscrow:key") so support can re-issue it via
   GET /api/ChatKeys/{userId}/recovery-escrow (admin role only).

   WARNING: whoever holds ChatRecoveryEscrow:key can decrypt every row in this
   table, and therefore every user's chat private key. Treat that key like a
   master secret, and set a real value in appsettings before this goes live —
   it ships with a placeholder that fails closed until replaced.

   Does not touch ChatUserKeys or any other existing table.
   ============================================================================= */
USE [WG_APP]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

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
