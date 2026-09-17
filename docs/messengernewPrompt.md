# WGNest Enterprise E2EE Messenger — Master Implementation Plan

Act as an expert .NET 8 and React developer. We are building the WGNest ticketing app's in-app messenger with:
- User-Based Zero-Knowledge End-to-End Encryption (ECDH P-256 + AES-GCM + PBKDF2 password/recovery wrapping)
- Multi-device synchronization across mobile, tablet, and desktop
- 1:1 Direct Messaging and Multi-Participant Group Chats
- Threaded Replies (`ReplyToMessageId`)
- Realtime Emoji Reactions
- Contextual Entity Tagging (`@user`, `#ticket`, `#meeting`, `#project`, `#repo`)
- Encrypted Media Attachments & Voice Notes stored on the local server

---

## Strict Execution Rules
1. Execute this project **strictly one phase at a time**. Wait for my explicit command (e.g., "Start Phase 1") before beginning.
2. For each phase, provide the complete, production-ready implementation code.
3. **DO NOT generate tests initially.** After reviewing your code, I will type: `"Phase [X] tests"`. You will then generate complete unit and integration tests for that specific phase.
4. **DO NOT proceed to the next phase** until I explicitly confirm that all tests have passed (e.g., "Phase [X] passed, start Phase [X+1]").
5. Follow existing project conventions: .NET 8 Web API, C# repository pattern (`IXxxRepo`), SQL Server (`USE [WGNEST]`), React frontend, and SignalR for real-time delivery.

---

## Phase 1: Database Schema & Core Backend Models (Master Foundation)

**Objective:** Clean up old device-based chat tables and establish the complete SQL schema and .NET models for users, groups, messages, reactions, tags, and media.

**Implementation Scope:**
1. **SQL Script (`scripts/chat_e2ee_master_schema.sql`):**
   - Drop old tables if they exist (`ChatIdentityKeys`, `ChatSignedPreKeys`, `ChatMessageKeys`).
   - `ChatUserKeys`: `UserId` (PK, Guid), `PublicKey` (varchar/base64), `WrappedByPassword` (varbinary), `PasswordSalt` (varbinary), `WrappedByRecovery` (varbinary), `RecoverySalt` (varbinary), `KeyVersion` (int), `CreatedAt`, `RotatedAt`.
   - `ChatConversations`: `Id` (Guid), `Type` (tinyint: 1=Direct, 2=Group), `Title` (nvarchar, null for direct), `DirectKey` (varchar(100), unique, sorted "minUserId|maxUserId" for 1:1), `CreatedByUserId` (Guid), `CreatedAt` (datetime2).
   - `ChatConversationMembers`: `ConversationId` (Guid), `UserId` (Guid), `Role` (nvarchar: 'Admin' | 'Member'), `JoinedAt` (datetime2), PK on `(ConversationId, UserId)`.
   - `ChatEncryptedMessages`: `Id` (Guid), `ConversationId` (Guid), `SenderUserId` (Guid), `ClientMessageId` (nvarchar(100), unique with SenderUserId), `EncryptedPayload` (varbinary/base64), `ReplyToMessageId` (Guid, nullable), `CreatedAt` (datetime2).
   - `ChatMessageKeys`: `MessageId` (Guid), `RecipientUserId` (Guid), `WrappedMessageKey` (varbinary), PK on `(MessageId, RecipientUserId)`.
   - `ChatMessageReactions`: `Id` (Guid), `MessageId` (Guid), `UserId` (Guid), `Emoji` (nvarchar(16)), `CreatedAt` (datetime2), Unique on `(MessageId, UserId, Emoji)`.
   - `ChatMessageTags`: `Id` (Guid), `MessageId` (Guid), `EntityType` (nvarchar(20): 'User' | 'Ticket' | 'Meeting' | 'Project' | 'Repo'), `EntityId` (nvarchar(100)), `DisplayText` (nvarchar(100)).
   - `ChatMediaAttachments`: `Id` (Guid), `MessageId` (Guid), `StoragePath` (nvarchar(500)), `OriginalFileName` (nvarchar(255)), `MimeType` (nvarchar(100)), `FileSize` (bigint), `EncryptedFileKey` (varbinary), `Iv` (varbinary(12)), `CreatedAt` (datetime2).
2. **.NET Entity Models & DTOs:**
   - Create C# models in `ChatsModal/Master/` and DTOs in `ChatsModal/DTOs/`.
   - Wire all entities into `APIGatewayDBContext.cs`.
3. **Chat Keys Controller & Repo:**
   - `GET /api/ChatKeys/me`: Returns user key bundle (salts, wrapped blobs, key version).
   - `POST /api/ChatKeys/me`: Initial registration of public key and wrapped blobs.
   - `POST /api/ChatKeys/rewrap`: Updates `WrappedByPassword` after recovery code reset.
   - `GET /api/ChatKeys/participants`: Accepts `List<Guid> userIds`, returns active public keys.

*Stop and wait for: "Phase 1 tests"*

---

## Phase 2: Frontend Crypto Engine (`userKeyManager.js`)

**Objective:** Implement client-side WebCrypto key generation, PBKDF2 wrapping, recovery code generation, and IndexedDB storage.

**Implementation Scope:**
1. **`userKeyManager.js`:**
   - Generate ECDH P-256 keypair.
   - `deriveWrappingKey(secret, salt)`: PBKDF2-SHA256 with 600,000 iterations.
   - `wrapPrivateKey(cryptoKey, secret, salt)`: Export `pkcs8`, encrypt using `AES-GCM` with a 12-byte random IV. Prepend the IV: `[12-byte IV | Ciphertext]`.
   - `unwrapPrivateKey(wrappedBytes, secret, salt)`: Slice the first 12 bytes as IV, decrypt the remainder, import as a non-extractable CryptoKey.
2. **Recovery Code Generator:**
   - Generate a 24-character Base32 string grouped in dashed 4-character blocks: `WGN2-8F9K-M3NP-7X4R-29TV-B8CQ`.
   - Input sanitization function to strip dashes, whitespace, and normalize case.
3. **Storage (`keyStore.js`):**
   - Save the active non-extractable private `CryptoKey` into IndexedDB keyed by `UserId`.

*Stop and wait for: "Phase 2 tests"*

---

## Phase 3: Login Integration & Key Recovery UI

**Objective:** Wire key creation/unwrapping into login, and build the recovery UI for password resets.

**Implementation Scope:**
1. **Login Hook (`loginPage.jsx`):**
   - On login success, intercept the password in memory *only* to trigger chat initialization.
2. **Identity Initialization Hook (`useChatIdentity.js`):**
   - Call `GET /api/ChatKeys/me`.
   - **404:** Generate new keypair, derive password wrap, generate recovery code, derive recovery wrap. Send `POST /api/ChatKeys/me`. Open the "Save Recovery Code" modal.
   - **200:** Attempt unwrap using login password. On success, store key in IndexedDB.
   - **Unwrap Failure (Password was reset):** Keep IndexedDB empty, mark status as `LOCKED_NEED_RECOVERY`.
3. **Modals:**
   - `SaveRecoveryCodeModal.jsx`: Shows formatted code once, requires checkbox confirmation and copy button before dismissing.
   - `UnlockChatModal.jsx`: Displayed when chat is accessed with `LOCKED_NEED_RECOVERY`. Accepts recovery code, unwraps key, derives new password wrap with the current password, posts to `POST /api/ChatKeys/rewrap`, and unlocks chat.

*Stop and wait for: "Phase 3 tests"*

---

## Phase 4: 1:1 Direct Chat (Static-Static ECDH & SignalR Delivery)

**Objective:** Build end-to-end encrypted direct messaging between two users.

**Implementation Scope:**
1. **Encryption Engine (`messageCrypto.js`):**
   - Per-message AES-256-GCM content key ($K_{msg}$) encrypts `{ v: 1, type: "text", text }`.
   - AAD format: `wg-chat-v2|conversationId|senderUserId|clientMessageId`.
   - Static-Static ECDH between Sender Private Key and Recipient Public Key.
   - Derive wrap key: `K_wrap = HKDF-SHA256(IKM = ECDH_Secret, salt = MessageId, info = AAD)`.
   - Encrypt $K_{msg}$ for the recipient and for the sender's own copy.
2. **Backend Messaging Flow:**
   - `POST /api/Chats/direct`: Get or create 1:1 conversation based on sorted user GUIDs (`DirectKey`).
   - `POST /api/Chats/{id}/messages`: Validates conversation membership, saves encrypted message, saves recipient and sender key rows in `ChatMessageKeys`.
   - Push SignalR `ChatMessage` event to recipient's `user-{userId}` hub group.
3. **Frontend Chat View:**
   - Render conversation list and direct message timeline.
   - Decrypt messages in memory using the IndexedDB private key.

*Stop and wait for: "Phase 4 tests"*

---

## Phase 5: Threaded Replies & Multi-User Group Chat

**Objective:** Support group chats with multiple members and threaded message replies.

**Implementation Scope:**
1. **Group Chat Creation & Management:**
   - `POST /api/Chats/group`: Creates a group conversation (`Type = 2`, `Title`, `MemberUserIds`).
   - `POST /api/Chats/{id}/members`: Add or remove group members (Admin only).
2. **Group Message Encryption:**
   - Generate a single random AES-256-GCM content key ($K_{msg}$) per message.
   - Encrypt the message text with $K_{msg}$.
   - For every member in the group (including sender): derive an ECDH shared secret, compute HKDF wrap key, and insert a corresponding row into `ChatMessageKeys`.
3. **Threaded Replies:**
   - When replying, pass `ReplyToMessageId`.
   - Frontend renders the referenced message snippet above the input box and as a clickable quote banner in the message bubble.

*Stop and wait for: "Phase 5 tests"*

---

## Phase 6: Emoji Reactions & Realtime Reaction Sync

**Objective:** Add and remove emoji reactions on messages with instant SignalR fan-out.

**Implementation Scope:**
1. **Backend Endpoints:**
   - `POST /api/Chats/messages/{messageId}/reactions`: Toggle emoji reaction (adds if missing, removes if already present by that user).
   - Validates user belongs to the conversation.
   - Broadcasts `MessageReactionChanged` event via SignalR to `conversation-{id}`.
2. **Frontend UI:**
   - Hover popover on message bubbles with common emojis (👍, ❤️, 😂, 😮, 😢, 🎉) + custom picker.
   - Display reaction chips with count below the message bubble.
   - Realtime listener to increment/decrement counts instantly without refetching the whole conversation.

*Stop and wait for: "Phase 6 tests"*

---

## Phase 7: Contextual Tagging (@Users, #Tickets, #Meetings, #Projects, #Repos)

**Objective:** Allow users to tag tickets, projects, meetings, repos, and people in chat with rich clickable chips.

**Implementation Scope:**
1. **Frontend Mention & Tag Trigger (`ChatInput.jsx`):**
   - `@` triggers employee autocomplete dropdown.
   - `#` triggers entity picker dropdown (Tickets, Meetings, Projects, Repos).
2. **Metadata Extraction:**
   - Message text encrypts the raw tag tokens (e.g. `Check #TCK-1042 and discuss with @bharanidharan`).
   - Frontend extracts unencrypted metadata tags and sends them in the `tags` array of the message payload:
     `[{ entityType: "Ticket", entityId: "TCK-1042", displayText: "#TCK-1042" }]`.
3. **Backend Processing:**
   - Inserts records into `ChatMessageTags`.
   - Emits internal notification events (e.g., alert the assigned ticket owner or tagged user).
4. **Rich Rendering:**
   - Custom parser in the message bubble turns tokens into clickable chips that open ticket side-drawers, meeting links, or project pages directly inside WGNest.

*Stop and wait for: "Phase 7 tests"*

---

## Phase 8: Encrypted Media Attachments & Voice Notes (Local Server Storage)

**Objective:** Encrypt and upload files, images, and voice recordings directly to the local server disk.

**Implementation Scope:**
1. **Frontend Client-Side Encryption:**
   - Generate a random 256-bit AES-GCM file key ($K_{file}$) and 12-byte IV.
   - Encrypt the file/voice note blob in the browser before upload.
   - Encrypt $K_{file}$ using the message's content key.
2. **Upload & Streaming Backend:**
   - `POST /api/Chats/{id}/media`: Streams the raw encrypted ciphertext to local server storage (e.g., `D:\Project\nest\storage\chat_media\`).
   - Returns media ID and file path.
   - `GET /api/Chats/media/{mediaId}`: Streams encrypted bytes to authorized conversation members.
3. **Voice Note Recorder:**
   - Audio recorder component using browser `MediaRecorder` (`audio/webm;codecs=opus`).
   - Encrypts audio blob, uploads, and renders an inline player that decrypts in memory and streams to an HTML5 Audio object.

*Stop and wait for: "Phase 8 tests"*