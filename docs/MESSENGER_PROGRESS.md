# Messenger Feature — Progress & Plan

> **Purpose of this file:** single source of truth for the in-app messenger work,
> so a new chat session can pick up exactly where the last one left off without
> re-deriving context. Update the **Status** and **Next Step** sections every
> time meaningful progress is made. Keep entries short — link to code instead
> of re-explaining it.

## Scope (full feature, in order)

We are building this **step by step, one piece at a time** — do not jump ahead
to a later step without the user asking.

1. ✅ **Key generation & rotation (E2EE foundation)** — done, see below.
2. ✅ **Public key lookup** — fetch participants' public keys to encrypt to
   them (needed before any chat UI) — done, see below.
3. ✅ **1:1 direct message chat** (send/receive, encrypted, persisted) —
   code done, see below (needs SQL run + browser test).
4. ⬜ Group chat (multi-participant encryption — sender keys or per-recipient
   fan-out, TBD when we get there).
5. ⬜ Media attachments in chat (images/files, encrypted at rest).
6. ⬜ Reactions (emoji reactions on messages — note: `Emoji_Reactions` table
   already exists for *ticket threads*; decide whether chat reuses it or gets
   its own table).
7. ⬜ @Tag / mentions of users in a message.
8. ⬜ Reply-to (threaded reply referencing another message).
9. ⬜ Entity tagging in messages — ticket / meeting / project / repo references
   (e.g. "#TCK-123" style), rendered as clickable chips.

Realtime delivery will piggyback on the existing SignalR `RealtimeHub` /
`RealtimeBroadcaster` middleware (already used for tickets/notifications) —
reuse that pipeline rather than building a new one, unless it proves unfit.

---

## Status

### Step 1 — Key generation & rotation — ✅ DONE

**What it does:** every login, this device gets an E2EE identity key
(ECDSA P-256, long-term) and a signed pre-key (ECDH P-256), rotated weekly
(WhatsApp/Signal-style). Private keys are generated non-extractable in the
browser (WebCrypto) and never leave it — only public keys + signatures reach
the server. No chat/message code yet — this is purely the key directory.

**Backend** (`D:\Project\nest\api\API\WGNestAPIGateway`):
- Tables: `ChatIdentityKeys`, `ChatSignedPreKeys` — SQL in
  `UI/scripts/chat_e2ee_keys.sql` (**not yet run against the real DB**).
- Models: `APIGateWay.ModalLayer/ChatsModal/Master/ChatIdentityKey.cs`,
  `ChatSignedPreKey.cs`; DTOs in `ChatsModal/DTOs/ChatKeyDtos.cs`.
- `IChatKeyRepo` / `ChatKeyRepo` (Business Layer) — verifies key type (must be
  P-256) and pre-key signature server-side before storing.
- `ChatKeysController` — `GET /api/ChatKeys/status`, `POST /api/ChatKeys/identity`,
  `POST /api/ChatKeys/prekey`.
- Wired into `APIGatewayDBContext` (2 new `DbSet`s) and `Program.cs` DI.
- Backend builds clean (`dotnet build` — 0 errors).

**Frontend** (`D:\Project\nest\UI`):
- `src/features/messenger/e2ee/keyManager.js` — generate/rotate logic, pure
  functions, dependency-injected (api/store/clock) for testability.
- `keyStore.js` — IndexedDB wrapper (private keys live here only).
- `chatKeys.api.js` — calls the 3 endpoints above (silent/background calls).
- `useChatKeyRotation.js` — hook wired into `src/app/App.jsx`, runs on login,
  on reload, and hourly (checks if the weekly rotation is due).
- Tests: `keyManager.test.js` — 6 tests, all passing (first login, repeat
  login no-op, 7-day rotation, retired pre-keys kept forever, lost-response
  recovery, server-lost-device recovery).
- Cross-checked: signed a key in Node's WebCrypto, verified it with the
  actual C# `ECDsa.VerifyData` — signatures are compatible.
- **Changed in Step 3:** retired pre-key private keys are no longer pruned
  (was: deleted 30 days after retirement). Server-stored message history is
  encrypted to whichever pre-key was current at send time, so pruning would
  make old history unreadable. Cost: ~1 small key per week in IndexedDB.

**Status / known gaps:**
- ✅ SQL run against **`WGNEST`** (the API's real DB — see Conventions; the
  script originally said `WG_APP`, which was wrong) and verified in a browser:
  identity + pre-key rows created on login.
- No UI indicator/settings screen for key status (not needed until later
  steps, maybe a "security code" verification screen eventually).
- Requires HTTPS/localhost (secure context) — silently no-ops otherwise with
  a console warning; acceptable for now.

### Step 2 — Public key lookup — ✅ DONE

**What it does:** given a list of userIds, returns every *usable* device
(active identity key + active, non-expired signed pre-key) for each — enough
for a sender to encrypt to all of a participant's devices. Multi-device is
supported (a user can have several active devices, e.g. laptop + phone).
Revoked identities and expired/rotated pre-keys are filtered out server-side;
a user with no currently-usable device comes back with an empty device list.

**Backend:**
- `IChatKeyRepo.GetParticipantKeysAsync` / `ChatKeyRepo` — joins
  `ChatIdentityKeys` (Status = Active) with `ChatSignedPreKeys`
  (IsActive = true AND ExpiresAt > now), grouped per requested userId. Caps
  at 200 userIds per call.
- `GET /api/ChatKeys/participants?userIds={guid}&userIds={guid}...` —
  `ChatKeysController.Participants`.
- New DTOs in `ChatKeyDtos.cs`: `DeviceKeysDto`, `ParticipantKeysDto`.

**Frontend:**
- `chatKeysApi.getParticipantKeys(userIds)` in `chatKeys.api.js` — builds the
  query string manually (`userIds=a&userIds=b`) instead of using axios's
  default array serialization (`userIds[]=a`), because ASP.NET Core's
  `[FromQuery] List<Guid>` only binds the bracket-less repeated-key form.

Used by the Step 3 send flow right before encrypting each message.

### Step 3 — 1:1 direct message chat — ✅ CODE DONE (not yet run end-to-end)

**Crypto design** (`src/features/messenger/e2ee/messageCrypto.js`):
- Per message: random AES-256-GCM content key encrypts `{ v: 1, type: "text", text }`.
  GCM additional data = `wg-chat-v1|conversationId|senderUserId|senderDeviceId|clientMessageId`
  (server can't move ciphertext to another conversation or relabel the sender).
- One ephemeral ECDH P-256 key per message. For each target device:
  ECDH(ephemeral, device's signed pre-key) → HKDF-SHA-256 (info binds deviceId,
  preKeyId, ephemeral key) → AES-KW wraps the content key (40 bytes).
- Targets = every verified device of the other member **plus all of the
  sender's own devices** (so the sender can read their history). This browser
  is always added from the local record even if the directory lags.
- `verifiedDevices()` drops any device whose pre-key signature doesn't verify
  against its identity key, or whose fingerprint doesn't match.
- Decrypt result: `ok` | `no-key` (not encrypted for this browser) | `error`.
- Plaintext is kept in memory only (never written to IndexedDB/localStorage).

**Backend:**
- SQL: `UI/scripts/chat_e2ee_messages.sql` (`USE [WGNEST]`) — tables
  `ChatConversations` (unique `DirectKey` = "minUserId|maxUserId"),
  `ChatConversationMembers`, `ChatEncryptedMessages` (unique
  SenderUserId+ClientMessageId for idempotent retries), `ChatMessageKeys`
  (unique MessageId+RecipientDeviceId). **Not yet executed.**
- Models: `ChatsModal/Master/ChatConversation.cs` (+ `ChatConversationMember`),
  `ChatEncryptedMessage.cs` (+ `ChatMessageKey`); DTOs `ChatsModal/DTOs/ChatMessageDtos.cs`.
- `IChatRepo` / `ChatRepo`, `ChatsController`:
  - `GET  /api/Chats` — my conversations, most recent first.
  - `POST /api/Chats/direct` `{ UserId }` — get-or-create (race-safe via unique index).
  - `GET  /api/Chats/{id}/messages?deviceId=&before=&take=50` — oldest-first page,
    each message carries only *this device's* wrapped key.
  - `POST /api/Chats/{id}/messages` — validates membership, base64/sizes, that
    every wrapped key targets an active device of a member with a real pre-key
    id (recipient user taken from the key directory, not the client), that the
    other member and the sending device are both included. Idempotent on
    ClientMessageId.
- Realtime: after commit, pushes SignalR event **`ChatMessage`** to each
  member's `user-{userId}` group, with keys filtered to that user's devices.
  Not routed through `RealtimeBroadcastMiddleware`/`EntityChanged` (that would
  also fan out to `global-admin`).
- Non-members get 404 (same as a nonexistent conversation).
- Wired: 4 `DbSet`s in `APIGatewayDBContext`, `IChatRepo` in `Program.cs`.
  Compiles with 0 errors.
- ⚠️ Pre-existing unused scaffold classes `ChatRoom` / `ChatParticipant` /
  `ChatMessage` (plaintext `MessageText`, string UserId, DbSets registered, no
  table, no usages) were **left untouched** — not part of this design. Ask the
  user before deleting them.

**Frontend:**
- `src/core/realtime/chatChannel.js` — subscribe/emit for `ChatMessage`;
  `realtimeManager.js` registers `connection.on("ChatMessage", emitChatMessage)`.
- `src/features/messenger/api/chat.api.js`, `hooks/useChat.js`
  (`useConversations`, `useOpenDirect`, `useMessages` infinite query newest-page-first,
  `useSendMessage`, `useChatRealtime`), `pages/MessengerPage.jsx`.
- Route `/messages` (`ROUTE_KEYS.MESSENGER`, sidebar "Messages"), roles
  `ADMIN_MANAGER` (`ROUTE_ROLES.MESSENGER`); registered in `src/app/bootstrap.js`.
  Selected conversation kept in `?c=` query param. People picker uses master
  `EmployeeList` (`UserID`, `UserName`, `Status === "Active"`).
- Tests: `messageCrypto.test.js` — 6 tests (multi-device round trip incl.
  sender's own copy, no-key on other browser, decrypt with retired pre-key,
  AAD tamper: moved conversation / spoofed sender, wrapped key swapped to
  another device, forged pre-key + wrong fingerprint dropped). All 12 messenger
  tests pass; `vite build` succeeds.

**Known gaps / open decisions:**
- ⚠️ **Offline > 7 days = unreachable.** Step 2 filters out expired pre-keys
  (user's choice), so if a user hasn't opened the app for over a week their
  pre-key is expired and nobody can message them ("can't receive secure
  messages yet"). Signal/WhatsApp keep using the last signed pre-key until the
  owner rotates. **Pending user decision:** allow the current (IsActive) pre-key
  even when past ExpiresAt, still excluding revoked/rotated keys.
- No sender authentication: messages aren't signed by the sender's identity
  key, so a malicious server could inject messages. Pair with a safety-number
  / fingerprint verification screen later.
- A new browser/device can't read history sent before it existed (inherent to
  E2EE; shows "wasn't encrypted for this browser").
- Chat updates only apply while `/messages` is open — no unread counts, badges,
  or notifications elsewhere yet. No read receipts / typing indicators.
- Page cursor uses `CreatedAt <` (SQL `datetime`, ~3ms precision); two messages
  with an identical timestamp at a page boundary could skip one. Rare.
- Role 3 (Viewer) users can't open `/messages` (route is ADMIN_MANAGER).
- Not yet tested in a browser with two users.

---

## Next Step

**Before Step 4:** run `scripts/chat_e2ee_messages.sql` on `WGNEST`, restart
the API, and test 1:1 chat with two users (two browsers). Resolve the
"offline > 7 days" decision above.

**Step 4 — Group chat.** Confirm scope with the user first (who can create
groups, add/remove members, admins, whether new members see earlier history).
The per-device fan-out envelope from Step 3 already supports many recipients
(capped at 50 keys per message server-side — revisit for large groups; sender
keys would avoid per-message fan-out).

---

## Conventions learned (for future steps)

- **Database:** the API connects to **`WGNEST`** on server `ANARA`
  (`WGNestAPIGateway/appsettings.json` → `ConnectionStrings:DefaultConnection`),
  not `WG_APP`. All chat SQL scripts must `USE [WGNEST]`.
- **Building while VS is running the API:** `dotnet build` fails with
  file-lock errors (MSB3027) on `bin/Debug`. Verify compile with
  `dotnet build WGNestAPIGateway/APIGateway.csproj -p:OutDir=<temp dir>/`.
- Feature registration: `src/features/<name>/index.js` exports `{ name, basePath, routes }`,
  added via `registerFeature` in `src/app/bootstrap.js`; route keys/paths in
  `src/core/routing/paths.js`; roles in `src/core/auth/permissions.js`
  (`ROUTE_ROLES`); `nav.inSidebar: true` puts it in the sidebar.
- SignalR hub puts every connection in `user-{userId}`; JSON payloads are
  PascalCase (`PropertyNamingPolicy = null`).
- API errors come back as `{ errorCode, errorMessage }`; the axios interceptor
  shows a global error toast even for `_silent` calls.

- Backend layering: `Controllers` → `IXxxRepo`/`XxxRepo` (Business Layer,
  handles transactions via `IDomainService.ExecuteInTransactionAsync`) →
  `APIGatewayDBContext` (EF Core). DTOs live in `ModalLayer`.
- Controllers are gated by `RepoScopePolicy` globally
  (`app.MapControllers().RequireAuthorization("RepoScopePolicy")`) — Admin/
  Manager roles bypass repo checks; Viewer role is restricted. Chat endpoints
  currently rely on Admin/Manager bypass or "no repoId in body" → auto-succeed;
  revisit if Viewer-role users need chat access.
- Success responses go through `ResponseWrappingMiddleware` — return the raw
  DTO (or `ApiResponseHelper.Success(data, message)`); `message: "NO"` means
  "success but don't toast it" (used by background/silent calls).
- Errors: throw `Exceptionlist.InvalidDataException` / `DataNotFoundException`
  etc. — `ErrorHandlingMiddleware` maps them to HTTP status codes.
- Frontend: feature folders under `src/features/<name>/`, API calls via
  `executeApi` (`src/core/api/executor.js`), pass `config: { _silent: true }`
  for background calls that shouldn't show the global loader/toast.
- Auth/session: `readUserFromSession()` (`src/core/auth/useCurrentUser.js`)
  decodes the JWT from `sessionStorage`; role/user id come from standard
  Microsoft claim URIs.
- Realtime: existing `RealtimeHub` (SignalR) + `RealtimeBroadcaster` pipeline
  is the established pattern for pushing live updates — reuse for chat
  message delivery rather than a new hub.
- Tests: Vitest, `environment: "node"`, files matched by
  `src/**/*.test.{js,jsx}`. WebCrypto is available in Node's test env, so
  crypto logic can be unit-tested directly (no browser needed).

---

## How to resume in a new chat

1. Read this file first.
2. Check the **Status** section for what's done vs. gaps.
3. Check **Next Step** for what to build next — confirm with the user before
   starting if it's been a while, since priorities may have shifted.
4. After finishing a step: update **Status** (mark done, list gaps), update
   **Next Step**, add anything new to **Conventions learned**.
