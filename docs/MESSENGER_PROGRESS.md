# Messenger Feature — Progress & Plan

> **Purpose of this file:** single source of truth for the in-app messenger work,
> so a new chat session can pick up exactly where the last one left off without
> re-deriving context. Update the **Status** and **Next Step** sections every
> time meaningful progress is made. Keep entries short — link to code instead
> of re-explaining it.

## ⚠️ Redesign in progress — see `docs/messengernewPrompt.md`

The device-based design below (Steps 1–3) is being **replaced** by a user-based
design (one key pair per user, wrapped by password + recovery code), built in
the 8 phases of `messengernewPrompt.md`. Steps 1–3 below are kept for history only.

### Phase 1 — Schema & key directory — ✅ DONE (automated tests pass + verified end-to-end in Swagger against the real DB)

**Manually verified in Swagger (real WGNEST DB, logged-in JWT):**
`GET /me` 404 before registering → `POST /me` 200 (KeyVersion 1) → repeat same
body 200 no-op → different PublicKey 409 → `GET /me` 200 matches → `GET
/participants?userIds=<self>` 200 returns the entry → `POST /rewrap` (KeyVersion
1) 200, KeyVersion bumped to 2, RotatedAt set, recovery wrapping untouched.
Stale-KeyVersion rewrap rejected with 400. All matched expected behavior.

**Tests:** new xunit project `APIGateWay.Tests` (added to `WGNestAPIGateway.sln`) —
first backend test project in this repo. `ChatKeyRepoTests.cs` (19 tests, all
passing) covers `ChatKeyRepo` against an EF Core InMemory database, faking
`IDomainService`/`ILoginContextService`/`IRequestStepContext` (`Fakes/FakeDomainService.cs`):
register (success, no-op resend, conflict on a different key, bad public key,
undersized wrapped blob, bad salt length), get-mine (null when unregistered,
returned after registration, not leaked to another userId), rewrap (404 with
no key, version bump + fields updated, 400 on stale KeyVersion), participants
(400 empty, 400 over 200, users without a key omitted, duplicate ids deduped).
Run with `dotnet test "APIGateWay.Tests/APIGateWay.Tests.csproj"` from
`WGNestAPIGateway/`. **Not covered by these tests** (need a real SQL Server + a
browser): the actual schema script, EF migrations/model binding against the
real `APIGatewayDBContext`, and the HTTP layer (`ChatKeysController`, JWT auth,
`RepoScopePolicy`).

- SQL: `scripts/chat_e2ee_master_schema.sql` — drops ALL old chat tables
  (ChatIdentityKeys, ChatSignedPreKeys, ChatConversations, ChatConversationMembers,
  ChatEncryptedMessages, ChatMessageKeys) and creates ChatUserKeys,
  ChatConversations, ChatConversationMembers, ChatEncryptedMessages,
  ChatMessageKeys, ChatMessageReactions, ChatMessageTags, ChatMediaAttachments.
  Old `chat_e2ee_keys.sql` / `chat_e2ee_messages.sql` deleted.
  **✅ Run against the real `WGNEST` DB on `ANARA` (2026-09-17)** — verified via
  `sqlcmd`: the 8 new tables exist, the 6 old device-based tables are gone.
- Backend (`D:\live work\Github\API\WGNestAPIGateway`):
  - Models `ChatsModal/Master/ChatUserKey.cs`, `ChatConversation.cs` (+ Member,
    `ChatConversationType` enum : byte), `ChatEncryptedMessage.cs` (+ MessageKey),
    `ChatMessageExtras.cs` (Reaction, Tag, MediaAttachment). Composite keys +
    unique indexes configured in `APIGatewayDBContext.OnModelCreating`.
  - Removed: `ChatIdentityKey`, `ChatSignedPreKey`, `ChatMessageDtos`, `IChatRepo`,
    `ChatRepo`, `ChatsController` (1:1 messaging is rebuilt in Phase 4).
  - `ChatKeysController`: `GET /me` (404 if none), `POST /me` (same PublicKey = no-op,
    different = 409), `POST /rewrap` (requires matching KeyVersion, bumps it),
    `GET /participants?userIds=..` (users without a key are omitted, max 200).
  - Builds with 0 errors.
- Frontend: `useChatKeyRotation` unwired from `App.jsx`; `MessengerFeature`
  unregistered in `bootstrap.js` until Phase 4. Old device-based files under
  `src/features/messenger/` are dead code, replaced in Phases 2–4.
- Leftover scaffolds `ChatRoom`/`ChatParticipant`/`ChatMessage` still untouched.

**Admin recovery escrow (support re-issue path, additive):**
- SQL: `scripts/chat_recovery_escrow_schema.sql` — adds `ChatUserKeyRecoveryEscrow`
  (`UserId` PK/FK → `ChatUserKeys` cascade-delete, `EncryptedRecoveryCode`,
  `CreatedAt`); doesn't touch any other chat table.
  **✅ Run against `WGNEST` on `ANARA` (2026-09-17)**.
- Backend: `ChatRecoveryEscrowCipher` (AES-256-GCM, key = SHA-256 of config
  `ChatRecoveryEscrow:key`) encrypts/decrypts the escrowed code; exposed via
  admin-only `GET /api/ChatKeys/{userId}/recovery-escrow`. Whoever holds that
  config key can decrypt any user's chat private key — treat it like a master
  secret, restrict who can read `appsettings.json`.
  **✅ `ChatRecoveryEscrow:key` set to a random 48-byte secret in
  `WGNestAPIGateway/appsettings.json` (2026-09-17)** — was a placeholder that
  threw at startup by design; not yet rotated/moved to a secret store.

### Phase 2 — Frontend crypto engine — ✅ CODE DONE + TESTS PASS

All in `src/features/messenger/e2ee/`:
- `userKeyManager.js` — `generateUserKeyPair` (ECDH P-256, deriveBits),
  `deriveWrappingKey` (PBKDF2-SHA256, 600k iterations -> AES-256-GCM),
  `wrapPrivateKey` / `unwrapPrivateKey` (blob = [12-byte IV | ciphertext], unwrap
  imports NON-extractable), `rewrapPrivateKey` (decrypts to pkcs8 and re-encrypts
  under a new secret without ever making an extractable CryptoKey).
  High-level flows for Phase 3: `createUserKeyBundle(password)` (returns the
  `POST /me` body + recovery code + stored key), `unlockWithPassword(bundle, pw)`,
  `recoverWithCode(bundle, code, currentPassword)` (returns the `POST /rewrap` body).
  Errors: `WrongSecretError` (wrong password/code), `InvalidRecoveryCodeError` (malformed code).
- `recoveryCode.js` — 24-char **Crockford** Base32 (the plan's example uses 8/9,
  which RFC 4648 Base32 lacks), grouped `XXXX-XXXX-...`. `normalizeRecoveryCode`
  strips dashes/whitespace, upper-cases, maps I/L->1 and O->0; the normalized form
  is the PBKDF2 secret.
- `keyStore.js` — rewritten. IndexedDB `wg-e2ee` v2, store `userKeys` keyed by
  userId (the old `deviceKeys` store is deleted on upgrade). `put` refuses
  extractable keys. `get` / `put` / `delete`.
- Deleted `useChatKeyRotation.js`. `keyManager.js`, `messageCrypto.js`, `useChat.js`
  and `MessengerPage.jsx` are still the old device-based code, replaced in Phase 4.
- Smoke-checked in Node: create -> unlock -> wrong password rejected -> recover with
  a lower-case, space-separated code -> re-wrapped key unlocks with the new
  password and is the same key pair. Output sizes match the Phase 1 server limits.
- **Tests:** `recoveryCode.test.js` (14) + `userKeyManager.test.js` (27) — 41 new
  tests, all passing (plus the 12 pre-existing messenger tests, unaffected).
  Covers: generation/format/normalize/validate for recovery codes (Crockford
  alphabet, look-alike mapping, idempotence); ECDH keypair + SPKI export/import
  agreeing on the same shared secret; PBKDF2 determinism per secret+salt; wrap/
  unwrap round-trip (unwrapped key non-extractable, blob = IV + ciphertext);
  `WrongSecretError` on wrong password/salt/tampered bytes; `rewrapPrivateKey`
  (new salt, old secret no longer opens the new blob); `createUserKeyBundle`
  payload shape and size limits matched against the Phase 1 server's actual
  validation ranges; `recoverWithCode`/`unlockWithPassword` end-to-end,
  `InvalidRecoveryCodeError` vs `WrongSecretError` distinction. Run:
  `npx vitest run src/features/messenger`.
  Runs in ~27s — expected, since 600,000 real PBKDF2 iterations run per
  wrap/unwrap call and many tests call it 2-4 times.
  **Not tested:** `keyStore.js` (thin IndexedDB wrapper — no fake-indexeddb
  dependency in this repo; same gap existed for the old device-based keyStore).
  Full suite: one pre-existing failure in `src/core/query/queryKeys.test.js`,
  unrelated to messenger and unmodified by this work (confirmed via git log).

### Phase 3 — Login integration & recovery UI — ✅ CODE DONE + TESTS PASS (real browser run still pending)

**`chatIdentityStore.js`** (new, `src/features/messenger/e2ee/`) — zustand store,
the state machine driving everything: `IDLE -> INITIALIZING -> READY`, or
`LOCKED_NEED_RECOVERY` (password changed since the key was wrapped) /
`LOCKED_NEED_PASSWORD` (key not in this browser, e.g. cleared site data) /
`UNSUPPORTED` (no secure context/WebCrypto/IndexedDB) / `ERROR`.
- `initializeAfterLogin({ userId, password })` — called right after login with
  the password still in memory. 404 from `GET /me` -> creates a key, POSTs it,
  and stores the recovery code in `pendingRecoveryCode` (shown once by the modal).
  409 (another tab/device registered first) -> fetches and uses their key instead.
  Wrong password (`WrongSecretError`, i.e. password was reset) -> drops any stale
  local key and opens the unlock modal in recovery mode.
- `restoreSession({ userId })` — called on app load with no password available
  (page reload). Reuses the local IndexedDB key if its public key still matches
  the server's; otherwise `LOCKED_NEED_PASSWORD`. Network/server failure with an
  existing local key -> stays `READY` (offline-tolerant); no local key -> `ERROR`.
- `unlockWithPassword` / `unlockWithRecoveryCode` — used by `UnlockChatModal`.
  Recovery re-wraps under the current password (`POST /rewrap`); on a 409/400
  KeyVersion race it re-fetches the bundle and retries once. Asks for the current
  password only when it isn't already in memory from login.
- `forgetLocalKey` — called on logout; deletes the IndexedDB key for that user
  (shared-computer safety) and resets in-memory state.
- The login password is held in a closure variable, never in the store or any
  storage, and is dropped as soon as a flow no longer needs it.
  A `generation` counter invalidates in-flight flows if a newer one starts
  (e.g. rapid re-login) or `reset()`/logout runs mid-flight.
- `chatKeys.api.js` — updated to Phase 1's endpoints (`getMine`/`register`/`rewrap`/
  `getParticipantKeys`); calls pass `_noErrorToast` (new axios config flag added
  to `apiClient.js`'s response interceptor) so an expected 404 on first login
  doesn't pop the global error toast — the store handles it silently.
- **UI:** `SaveRecoveryCodeModal.jsx` (copy button + confirmation checkbox,
  can't be dismissed until both are done), `UnlockChatModal.jsx` (password mode
  and recovery-code mode, switchable; recovery mode asks for the current
  password only if needed), `ChatIdentityModals.jsx` wrapping both, mounted once
  in `App.jsx`. `useChatIdentity.js` — `useChatIdentitySession(token)` (mounted in
  App; drives `restoreSession`/`reset` off the token) and `useChatIdentity()` for
  any component to read status.
- **Wired in:** `loginPage.jsx` calls `initializeAfterLogin` in the login
  mutation's `onSuccess`, in the background (not awaited, doesn't block
  navigation). `App.Hooks/Logout.js`'s `handleLogout` calls `forgetLocalKey`
  before the session API logout call.
- **Not wired to a page yet:** nothing surfaces `LOCKED_NEED_PASSWORD` to the
  user proactively outside of chat itself — Phase 4's chat page is expected to
  call `openUnlock()` when the user opens chat while locked.

**Tests:** `chatIdentityStore.test.js` — 16 tests, all passing, using the same
DI-fake pattern as Phases 1/2 (fake `api`/`keyStore`, real WebCrypto via
`userKeyManager`). Formalizes the earlier throwaway scenario script into a
permanent suite and adds a few more edge cases:
first login (key created + code shown, matches the real Crockford alphabet),
page reload (key reused, no re-register), re-login after logout (no new code,
same key, register is a no-op resend), login after a password reset (locked
for recovery, stale local key dropped, password remembered for the modal),
wrong recovery code rejected (stays locked), correct code recovers + rewraps
(KeyVersion bumps 1->2), re-login with the new password afterward (straight to
READY), reload with no local key (locked for password; recovery works both
via the remembered login password and via an explicitly supplied one —
`MissingPasswordError` when neither is given), direct `unlockWithPassword`
from `LOCKED_NEED_PASSWORD` (success and wrong-password-stays-locked), the
server key being wiped out from under a stale local copy (drops it, locks),
a 409 register race (another tab's key wins, ours locks for recovery instead
of silently overwriting), `UNSUPPORTED` short-circuit, `ERROR` on a network
failure during first login, offline-tolerant `restoreSession` (existing local
key keeps working when the server call throws), and `InvalidRecoveryCodeError`
thrown client-side before any network call for a malformed code.
Run: `npx vitest run src/features/messenger/e2ee/chatIdentityStore.test.js`.
Full suite (69 tests across 5 files) and `npx vite build` both still pass.
**Not covered by these tests** (need a real browser): actual login page
navigation, MUI modal rendering/interaction, real IndexedDB, and the
axios `_noErrorToast` wiring — see "Manual testing" below.

**✅ Phase 3 verified in a real browser by the user (2026-09-17)** — including the
escrow row being written on a genuine first-time registration.

### Phase 4 — 1:1 direct chat + message bar — ✅ CODE DONE (needs SQL run + browser test; no tests yet per the plan)

**⚠️ Run first:** `scripts/chat_phase4_read_state.sql` on `WGNEST` — adds nullable
`ChatConversationMembers.LastReadAt`. The EF model already maps it, so **every chat
endpoint fails with "Invalid column name 'LastReadAt'" until it's run.**

**Crypto** (`e2ee/messageCrypto.js`, rewritten; `MESSAGE_VERSION = "wg-chat-v2"`):
- Random AES-256-GCM K_msg encrypts `{ v: 1, type: "text", text }`; AAD =
  `wg-chat-v2|conversationId|senderUserId|clientMessageId` (lower-cased).
- Per member (sender included): `ECDH(sender priv, member pub)` -> `HKDF-SHA256(salt =
  messageId, info = AAD)` -> AES-KW wraps K_msg (40 bytes). Reader uses
  `ECDH(own priv, sender pub)`, so a wrap only opens if it was made with the sender's
  private key (implicit sender authentication, unlike the old v1).
- **messageId = ClientMessageId**: the client generates a UUID, it is the HKDF salt,
  and the server stores it as `ChatEncryptedMessages.Id`.
- `EncryptedPayload` = `[12-byte IV | ciphertext + tag]`, one column.
- Smoke-checked in Node (throwaway script, not committed): recipient + sender's own
  copy decrypt; wrong reader key, swapped sender key, moved conversation and relabelled
  sender all -> `error`; missing wrapped key -> `no-key`.
- `e2ee/chatCryptoSession.js` — the glue: private key from IndexedDB (cached per
  user), public-key directory cache (`GET /ChatKeys/participants`, **always refreshed
  on send**), in-memory decrypt cache (plaintext never persisted), caches cleared
  whenever the identity status/user changes. `RecipientNotReadyError` when a member
  has no chat key yet; `ChatLockedError` -> message status `locked`.
- Deleted the device-based `keyManager.js`, `keyManager.test.js`, old `messageCrypto.test.js`.

**Backend** (`ChatsController`, `IChatRepo`/`ChatRepo`, `ChatsModal/DTOs/ChatMessageDtos.cs`,
DI in `Program.cs`; compiles with 0 errors):
- `GET /api/Chats` — my conversations, newest activity first, with `UnreadCount`
  (others' messages after my `LastReadAt`), `LastReadAt`, `LastMessageAt` and
  `LastMessage` (ciphertext + my wrapped key, for a decrypted preview). An empty
  direct chat only appears for the user who opened it.
- `POST /api/Chats/direct { UserId }` — get-or-create by `DirectKey` (race-safe on the unique index).
- `GET /api/Chats/{id}/messages?before=&take=50` — oldest-first page, only my wrapped key.
- `POST /api/Chats/{id}/messages { ClientMessageId, EncryptedPayload, Keys[] }` —
  member check (404 for non-members), payload 29 B–64 KB, **exactly one 40-byte key
  per member**, every member must have a `ChatUserKeys` row, idempotent on
  ClientMessageId (retry returns the stored message). SignalR `ChatMessage` to each
  member's `user-{id}` group with only their key (sender's other tabs included).
- `POST /api/Chats/{id}/read { ReadUpTo }` — moves `LastReadAt` forward only (clamped
  to now), then SignalR `ChatRead` to my own `user-{id}` group so other tabs/devices
  clear the badge.

**Frontend:**
- `hooks/useChat.js` — `useConversations` (decrypts previews), `useUnreadTotal`,
  `useOpenDirect`, `useMessages` (infinite, newest page first), `useSendMessage`
  (optimistic "Sending…" bubble, failed bubble with retry that re-sends the same
  ciphertext), `markConversationRead`, `useChatRealtime` (single app-wide listener:
  upserts the timeline, bumps unread / re-sorts the list, marks read if the chat is on
  screen and the tab is visible, otherwise in-app pop-up + desktop notification if
  permitted; re-decrypts everything when chat becomes READY).
- `state/useChatUiStore.js` — dock open, up to 2 docked chat windows (min/close),
  which conversations are on screen, pop-up notifications (max 3, 6 s, pause on hover).
- **Messages screen** (sidebar "Messages", `/messages`, `?c=<id>`): `pages/MessengerPage.jsx`
  — people search (`NewChatPicker`), `ConversationList` (avatar, preview, time, unread
  badge), `ConversationView` (day dividers, load-older on scroll with position kept,
  auto-follow, Enter to send / Shift+Enter newline, 4000-char limit, locked/unsupported
  states via `ChatLockedNotice` -> `openUnlock()`).
- **Message bar on every screen**: `components/MessageDock.jsx`, mounted in
  `MainLayout` — bottom-right "Messaging" bar with total unread badge, expandable
  conversation list + new chat, docked mini chat windows (expand to full screen /
  minimize / close), notification pop-ups above it, "Turn on desktop alerts" prompt.
  Hidden on `/messages` itself (pop-ups still show). Phones: bar collapses to an icon;
  list and window open full-screen, one window at a time.
- Sidebar "Messages" link shows the unread total (`MessengerNavBadge`).
- `MessengerFeature` re-registered in `bootstrap.js`; `chatChannel.js` +
  `realtimeManager.js` handle `ChatRead` alongside `ChatMessage`.
- Checks: `npx vite build` passes, eslint clean on touched files, messenger suite 57/57
  (69 before, minus the 12 deleted device-based tests).

**Known gaps / decisions:**
- Chat (page, bar, badge) is limited to `ROUTE_ROLES.MESSENGER` = Admin/Manager, same
  as before — Viewer (role 3) sees none of it.
- No public-key verification (safety numbers): a malicious server could hand out a
  substituted public key. Same trust model as Phase 1's directory.
- If a user's key pair is ever replaced (server row deleted + re-registered), their
  older messages show "couldn't be decrypted" — the sender's current public key is
  used to decrypt.
- `before` cursor is `CreatedAt <` (datetime2, 100 ns) — identical timestamps at a page
  boundary could skip one; practically never.
- No typing indicators, read receipts shown to the other person, message edit/delete.
- Desktop notifications use `new Notification()` from the page; browsers that only
  allow them from a service worker silently fall back to the in-app pop-up.

### Phase 5 — Threaded replies + multi-user group chat — ✅ CODE DONE (needs SQL run + browser test; no tests yet per the plan)

**⚠️ Run first:** `scripts/chat_phase5_reply_index.sql` on `WGNEST` — adds an index on
`ChatEncryptedMessages.ReplyToMessageId`. Everything else this phase needed (`ChatConversation.Type`/
`Title`, `ChatConversationMember.Role`, `ChatEncryptedMessage.ReplyToMessageId`) already existed in the
Phase 1 master schema but wasn't wired up end-to-end — see below.

**Backend** (`ChatsController`, `IChatRepo`/`ChatRepo`, `ChatMessageDtos.cs`, `APIGatewayDBContext.cs`):
- `POST /api/Chats/group` `{ Title, MemberUserIds }` — creates a `Type = Group` conversation, caller
  becomes `Role = Admin`, everyone else `Role = Member`. Validates title (required, ≤100 chars), at
  least one other member, all members exist, ≤200 total.
- `POST /api/Chats/{id}/members` `{ AddUserIds, RemoveUserIds }` — Admin only (checked via the caller's
  `ChatConversationMember.Role`, not their app-wide role). 404 if not a member/not a group. Keeps at
  least one member and at least one admin after the change; new members always join as `Member`.
- `SendMessageDto` gained `ReplyToMessageId` (was already on the output DTO and entity, but never
  actually settable — a real gap fixed this phase). `SendMessageAsync` now validates the referenced
  message exists in the same conversation before storing it.
- **Group message encryption needed no backend changes** — `ValidateRecipientKeys` already required
  "exactly one wrapped key per member" using the live member count, not a hardcoded 2, so it was already
  N-member-safe. Same for the realtime broadcast loop (per-recipient `user-{id}` groups).
- Builds with 0 errors (`dotnet build WGNestAPIGateway/APIGateway.csproj`).

**Frontend** (`src/features/messenger/`):
- `e2ee/messageCrypto.js#encryptMessage` and `e2ee/chatCryptoSession.js#encryptTextMessage` were already
  N-recipient-generic (they map over `conversation.MemberUserIds` with no 2-member assumption) — **no
  crypto changes needed for groups**. `encryptTextMessage` gained a `replyToMessageId` param; it's added
  to the returned envelope as a **plain, unencrypted field** (`ReplyToMessageId`, same trust level as
  `ClientMessageId`) since the plan never asked for it to be part of the ciphertext/AAD.
- `hooks/useChat.js` — `isGroupConversation`, `conversationAvatarSeed` (group → conversationId, direct →
  the other member, replacing the old 1:1-only `otherMemberId` seed everywhere it was used for display),
  `useOpenGroup`, `useUpdateGroupMembers`. `useSendMessage` now takes `{ text, replyTo }` and threads
  `replyTo.MessageId` through to the crypto layer and onto the optimistic local bubble.
- `components/NewGroupPicker.jsx` (new) — title + multi-select member picker (chips with remove), mirrors
  `NewChatPicker`'s search UX. Wired into both `pages/MessengerPage.jsx` (sidebar header "New group"
  toggle) and `components/MessageDock.jsx` (dock "New group" link under the 1:1 picker).
- `components/ConversationView.jsx`:
  - Empty-state copy branches on `isGroupConversation` ("Only the N members of this group…" vs the old
    "Only you and X…").
  - Group messages from someone else show a small sender-name label above the bubble (not shown for
    consecutive/grouped messages from the same sender, matching the existing grouping logic).
  - **Reply UI**: hovering a bubble reveals a reply icon; clicking it sets a `replyTo` state that shows a
    dismissable "Replying to X: preview" banner above the composer. Sending passes `replyTo` into
    `useSendMessage`. A message with `ReplyToMessageId` renders a clickable quote strip inside its own
    bubble (sender + preview of the original, looked up from the already-loaded page via a
    `messageId -> message` map); clicking it smooth-scrolls to and briefly highlights the original if
    it's in the loaded page, otherwise shows "Original message: no longer available" (older page not
    loaded / never will load, e.g. very old reply chains — no fetch-by-id endpoint exists, so this is a
    known, accepted gap, not a bug).
- `components/ConversationList.jsx`, `pages/MessengerPage.jsx`, `components/MessageDock.jsx` — avatar
  seeds switched from `otherMemberId` to `conversationAvatarSeed`; group previews with no messages yet
  show "N members" instead of "No messages yet"; the Messages-page header and dock window header show
  the group title/member count.
- Checks: `npx vite build --mode development` passes (plain `npx vite build` segfaults on this machine
  regardless of Phase 5 — pre-existing local memory/esbuild issue, not caused by this change; use
  `--mode development` or a machine with more RAM to verify builds), eslint clean on touched files,
  full messenger suite 87/87 (no new automated tests yet — per the plan, those come on "Phase 5 tests").

**Known gaps / decisions:**
- No group settings/management screen yet (no UI calls `POST /Chats/{id}/members` — add/remove is
  backend-ready and callable via Swagger, but nothing in the app surfaces it). Add a "Group info" panel
  (title edit, member list, add/remove) as a small follow-up if wanted.
- No leave-group action (a member removing themselves would need the same admin-only endpoint to allow
  self-removal by non-admins too — currently only an Admin can call it at all).
- Reply quote strip can only resolve the original message's text if that page of the timeline happens to
  be loaded; there's no `GET /Chats/messages/{id}` to fetch a single message by id. Acceptable for now
  (same "load older" pattern as the rest of the timeline) but worth a small endpoint later if replies to
  very old messages turn out to be common.
- No @mention autocomplete or unencrypted tag metadata yet — that's Phase 7 (`ChatMessageTags` table
  already exists from Phase 1, unused).
- Group avatars are just colored initials from the group title (via `ChatAvatar`), no per-group photo.

### Phase 6 — Emoji reactions & realtime reaction sync — ✅ CODE DONE (no SQL needed; no tests yet per the plan)

No new schema — `ChatMessageReactions` (`Id`, `MessageId`, `UserId`, `Emoji`, `CreatedAt`, unique on
`(MessageId, UserId, Emoji)`) and its model/DbSet/index were already created in the Phase 1 master schema
and wired into `APIGatewayDBContext` ahead of time, just unused until now.

**Backend** (`ChatsController`, `IChatRepo`/`ChatRepo`, `ChatMessageDtos.cs`):
- `POST /api/Chats/messages/{messageId}/reactions` `{ Emoji }` — toggles the caller's reaction on that
  message (adds a row if they haven't reacted with that emoji yet, deletes it if they have). Validates
  the message exists and the caller is a member of its conversation (`RequireMembersAsync`, same
  membership check used everywhere else — 404 not 403 if they aren't a member). Emoji capped at 16 chars.
- Reactions are **unencrypted** — the plan doesn't ask for them to be part of the ciphertext/AAD, and
  "who reacted with 😀" isn't treated as confidential the way message text is.
- Realtime: broadcasts `MessageReactionChanged` (`{ MessageId, ConversationId, UserId, Emoji, Added }`)
  to every conversation member's `user-{id}` SignalR group (same per-member fan-out pattern as
  `ChatMessage`/`ChatRead` — this codebase's hub has no `conversation-{id}` groups, so despite the plan's
  wording that's the existing convention followed here instead). Response of the toggle call is the same
  delta payload the socket sends.
- `ChatMessageDto` gained `Reactions: List<{ UserId, Emoji }>`. `GetMessagesAsync` now joins
  `ChatMessageReactions` for the fetched page and attaches each message's rows; `SendMessageAsync`'s
  returned DTO and conversation-list previews always come back with an empty list (a message can't have
  a reaction before it exists).
- Builds with 0 errors (`dotnet build WGNestAPIGateway/APIGateway.csproj`).

**Frontend** (`src/features/messenger/`):
- `core/realtime/chatChannel.js` / `realtimeManager.js` — new `MessageReactionChanged` listener,
  `subscribeChatReaction`/`emitChatReaction`, same shape as the existing message/read channel pair.
- `hooks/useChat.js`:
  - `COMMON_REACTIONS` (👍 ❤️ 😂 😮 😢 🎉) and `groupReactions(message, userId)` — collapses a message's
    raw `{UserId, Emoji}` rows into UI chips `{ emoji, count, mine }`.
  - `applyReactionDelta` — patches one `{MessageId, Emoji, UserId, Added}` event straight into the
    `chatQueryKeys.messages(conversationId)` cache (no refetch); idempotent (skips if the cache already
    reflects that state), so it's safe to call from both the optimistic mutation and the realtime echo of
    that same action.
  - `useToggleReaction(conversationId)` — mutation that applies the delta optimistically (computed from
    the current cache, so the emoji picker/chip always toggles instantly) then calls the endpoint;
    on error it invalidates the timeline query rather than guessing a revert.
  - `useChatRealtime` now also subscribes to `subscribeChatReaction` and applies every incoming delta,
    including the actor's own (idempotent no-op there).
- `components/ConversationView.jsx` — `MessageBubble` renders reaction chips (emoji + count, highlighted
  if `mine`) below the bubble; clicking a chip toggles that reaction. A new `BubbleActions` component
  (reply icon + a `Smile` trigger) sits alongside each bubble on hover; the smile button opens a small
  popover of `COMMON_REACTIONS` positioned above it (closes on emoji pick or an outside click via a
  fixed-position backdrop). Reused for both `mine` and not-`mine` bubbles instead of duplicating the
  reply-button JSX that existed per-side before.
- Checks: `npx vite build --mode development` passes, `npx eslint src/features/messenger src/core/realtime
  --max-warnings=0` clean on touched files (two pre-existing unrelated errors remain in
  `realtimeManager.js`'s unused `finalRealtimeUrl` and `Userealtimesync.js` — not touched by this phase),
  full messenger suite 87/87 (no new automated tests yet — per the plan, those come on "Phase 6 tests").

**Known gaps / decisions:**
- No custom emoji picker beyond the 6 common ones — "+ custom picker" from the plan wasn't built; add an
  emoji-mart-style picker later if wanted.
- Toggle race: if two toggles from the same user land concurrently (e.g. two tabs), the "already reacted"
  check reads before the transaction — a rare double-toggle could add-then-immediately-remove instead of
  net-adding; not guarded further since the unique DB index still prevents a duplicate row, and a stray
  extra toggle is harmless (worst case: the chip is one click off until the next realtime event/refetch).
- Reaction chips read the already-decrypted-per-fetch `Reactions` array; there's no separate
  "who reacted" tooltip/list UI yet, just the count.

### Phase 7 — Contextual tagging (@user, #ticket, #meeting, #project, #repo) — ✅ CODE DONE + TESTS PASS

No new schema — `ChatMessageTags` (`Id`, `MessageId`, `EntityType`, `EntityId`, `DisplayText`, FK cascade-delete to
`ChatEncryptedMessages`, indexes on `MessageId` and `(EntityType, EntityId)`) already existed from the Phase 1
master schema, unused until now, same as Phase 6's reactions table.

**Backend** (`ChatMessageDtos.cs`, `ChatRepo.cs`, `APIGatewayDBContext.cs`):
- `SendMessageDto` gained `Tags: List<MessageTagDto>` (`EntityType`, `EntityId`, `DisplayText`, plus a
  **non-persisted** `NotifyUserId` used only for realtime fan-out); `ChatMessageDto` gained `Tags` on output,
  filled from a batch-loaded dictionary in `GetMessagesAsync` (same pattern as `Reactions`/Phase 6).
- `ChatRepo.ValidateTags` — caps at 30 tags/message, `EntityType` must be one of `ChatTagEntityType.All`, a
  `User` tag's `EntityId` must parse as a Guid, `EntityId`/`DisplayText` length-capped. Tag rows are inserted in
  the same transaction as the message/keys.
- **New realtime event `ChatMention`** (`ChatRepo.MentionEvent`) — after a successful send, `BroadcastMentionsAsync`
  resolves one target user per tag (`User` tags: parse `EntityId` as the userId; other types: the client-supplied
  `NotifyUserId`, e.g. a ticket's assignee) and pushes `{ ConversationId, MessageId, TaggedByUserId, EntityType,
  EntityId, DisplayText }` to that user's `user-{id}` SignalR group — even if they aren't a conversation member.
  Best-effort (try/catch, never blocks the send), same fire-and-forget convention as `BroadcastMessageAsync`/
  `BroadcastReactionAsync`. **Deliberately did not reuse the app's existing ticket-style `IEventCenter`/
  `NotificationRepository` pipeline** (the one `TicketFactory`/`EventCenter.cs` use) — that system resolves entity
  data by reflection off `SyncRepositoryConfigStore` entries and persists a DB notification row; wiring chat tags
  into it would have meant trusting undocumented reflection behavior against entities (`GetTickets`/`GetProject`/
  etc.) this feature had never touched. The lighter direct-SignalR approach matches every other Phase 4-6 realtime
  event in this feature and was judged safer than guessing at that machinery. **Known consequence:** `ChatMention`
  is NOT surfaced in the app's notification bell (`GET /notification/list`) — only as an in-app pop-up/desktop
  notification while the browser tab is open, same delivery guarantee as unread-message pop-ups. Add a DB-backed
  version later if "notify even when offline" turns out to matter for tags.
- Builds with 0 errors (`dotnet build WGNestAPIGateway.sln`).

**Frontend** (`src/features/messenger/`):
- **No dedicated search/autocomplete endpoints exist for Ticket/Project/Repo/Meeting** (confirmed: their
  controllers only have Create/Update/Status-patch routes). Reused the app's existing generic bulk-fetch
  mechanism instead — `hooks/useTagSources.js`:
  - `useTagPeopleSources()` — thin wrapper over the existing `useChatPeople()` (master data `EmployeeList`,
    already used by `NewChatPicker`/`NewGroupPicker`), reshaped into `{entityType, entityId, displayText, label}`.
  - `useTagEntitySources(enabled)` — Projects/Repos come from `useMasterData()` (`ProjectList`/`RepoList`, already
    in the boot-time bundle). Tickets/Meetings are **not** in that bundle, so they're fetched lazily via
    `POST /sync/v2` with `ConfigKeys: ["TicketsList"]` / `["MeetingData"]` (same mechanism `useTicketMaster`
    already uses unscoped for a full list) — `enabled` only flips true the first time the composer's `#` picker
    is opened, so idle conversations never pay for those two extra fetches.
  - Field mapping (see `GetTickets`/`GetProject`/`GetRepo`/`GetMeetingDto` on the backend): Ticket
    `#Issue_Code` → `Assignee_Id` as NotifyUserId; Project `#ProjectKey` → `Responsible`; Repo `#RepoKey` → no
    owner Guid field exists on `GetRepo` (only `OwnerName` string / `CreatedBy` Guid, not a true owner) so
    **`#repo` tags never trigger a `ChatMention` alert** — known, accepted gap; Meeting `#Title` → `Host_Id`.
- **Composer, extracted tag-picker logic directly in `components/ConversationView.jsx`** (no separate
  `ChatInput.jsx` file — the plan named one, but the existing `Composer` was already colocated with the timeline
  and splitting it out added a file without changing behavior, so the trigger/picker logic was added in place
  instead): typing `@` or `#` plus a non-whitespace run opens a dropdown (`detectTrigger`, a regex over the text
  up to the cursor) listing up to 8 matches from `useTagPeopleSources`/`useTagEntitySources`, filtered
  client-side on label/displayText substring. Picking an entry inserts its literal `displayText` token (e.g.
  `@bharanidharan`, `#TCK-1042`) into the textarea at the trigger position and records `{entityType, entityId,
  displayText, notifyUserId}` in a `Map` keyed by token text. `Enter` picks the first match while the dropdown is
  open (vs. sending); `Escape` closes just the dropdown. On send, the tags map is filtered to only entries whose
  `displayText` is still substring-present in the final text (handles the user deleting an inserted token) and
  passed to `onSend(text, tags, done)`.
- `hooks/useChat.js` — `useSendMessage`'s `mutate({ text, replyTo, tags })` now threads `tags` through
  `encryptTextMessage`; the optimistic local bubble carries `Tags` immediately (same shape as the server's
  `MessageTagDto[]`, so rendering doesn't need an "is this optimistic" branch).
- `e2ee/chatCryptoSession.js#encryptTextMessage` gained a `tags` param — like `ReplyToMessageId`, the tag rows
  are attached to `body.Tags` as **plain, unencrypted metadata after encryption** (`EntityType`/`EntityId`/
  `DisplayText` only identify *what* was referenced; the actual `@`/`#` token text is already inside the
  encrypted `payload.text`, consistent with `ChatMessageTag`'s own doc comment on the backend). Also exports
  `ChatTagEntityType` (mirrors the backend's `User|Ticket|Meeting|Project|Repo` constants) for both the picker
  and the renderer to share.
- **Rendering**: `ConversationView.jsx`'s `TaggedText` component splits a decrypted message's text on every
  `Tags[].DisplayText` token (regex alternation, longest-token-first so e.g. `#TCK-104` doesn't shadow
  `#TCK-1042`) and wraps matches in a highlighted `<span>`. `Ticket`/`Project`/`Repo` chips are clickable
  (`useNavigate` to `/tickets/:id`, `/projects/:id`, `/repository/:id` — the existing detail routes from
  `paths.js`); `User` chips are highlighted but not clickable (**no user-profile route exists in this app** —
  only `/employee/:id/edit`, an edit form, which isn't an appropriate mention target); `Meeting` chips link to
  `/meeting` (the list page) since **no per-meeting detail route exists yet** — both are known, accepted gaps
  rather than backend work invented to fill a routing hole that isn't this phase's job to create.
- `core/realtime/chatChannel.js` / `realtimeManager.js` — new `ChatMention` listener
  (`subscribeChatMention`/`emitChatMention`), same shape as the message/read/reaction channel trio.
  `useChat.js`'s `useChatRealtime` shows an in-app pop-up + desktop notification ("X mentioned #TCK-1042") when a
  `ChatMention` arrives for a conversation not currently on screen. **Known edge case, not fixed**: if the
  notified user isn't a conversation member (e.g. a ticket's assignee tagged into a chat they're not part of),
  clicking the pop-up tries to open that conversation and will fail (404, not a member) — there's no
  ticket-side "you were mentioned" surface yet, only this chat-side one. Acceptable for now; flag if it comes up.
- Checks: `npx vite build --mode development` passes (one retry needed — this machine's vite build is flaky
  independent of any code, per the existing note below), `npx eslint src/features/messenger src/core/realtime
  --max-warnings=0` shows only the two pre-existing unrelated errors noted in Phase 6 (`realtimeManager.js`'s
  unused `finalRealtimeUrl`, `Userealtimesync.js`'s unused `versionChecker`) — nothing new from this phase.

**Tests (added on "Phase 7 testing"):**
- **Backend** — `ChatRepoTests.cs` gained 18 new cases (51/51 in that file, 77/77 in the whole
  `APIGateWay.Tests` project): `ValidateTags` rejects >30 tags, an unsupported `EntityType`, a non-Guid `User`
  `EntityId`, and a missing `EntityId`/`DisplayText`; a valid send stores one `ChatMessageTag` row per tag and
  returns them on the response; `GetMessagesAsync` reattaches tags on refetch; `BroadcastMentionsAsync` sends
  `ChatMention` to a tagged `@user`'s own group, to a non-`User` tag's `NotifyUserId` (even when that user isn't
  a conversation member — the ticket-assignee-not-in-the-chat case), skips it entirely when no `NotifyUserId` is
  given (e.g. a `#repo` tag) or when the tag targets the sender themselves, and dedupes to a single broadcast
  when the same user is reachable via two different tags in one message. `FakeChatDbContext` (`Fakes/
  FakeDomainService.cs`) gained a `ChatMessageTags` DbSet — it didn't have one yet. Run:
  `dotnet test "APIGateWay.Tests/APIGateWay.Tests.csproj" --filter FullyQualifiedName~ChatRepoTests`.
- **Frontend** — three pieces of Phase 7 logic were pulled out of `ConversationView.jsx`/`useTagSources.js` into
  standalone, dependency-free modules specifically so they're unit-testable without React Testing Library (this
  repo has never used RTL — all existing messenger tests are plain-Vitest logic tests, see Conventions below):
  - `utils/tagTrigger.js#detectTrigger` (was inline in `Composer`) — `tagTrigger.test.js`, 9 tests: `@`/`#`
    detection at string start and mid-text, empty query right after the trigger char, no match with no trigger
    character, no match once a space follows the query, no match for an email-like `foo@bar` (no whitespace
    boundary before the `@`), cursor position (not string end) bounds the query, a second `#` later in the same
    message re-triggers, and a documented limitation: two trigger characters back-to-back with no whitespace
    between them (`"@foo#"`) aren't detected at all (no whitespace boundary exists for the second one).
  - `utils/tagText.js#splitTaggedText`/`tagPath` (was inline in `TaggedText`) — `tagText.test.js`, 11 tests:
    no-tags passthrough, a single tag splitting plain/tagged segments, a tag at the very start/end of the text,
    multiple distinct tags, **longest-token-first matching** (`#TCK-1042` matches whole even when a `#TCK-104`
    tag is also present, so a shorter code can't shadow a longer one that contains it), the same token appearing
    twice both get highlighted, a tag whose `DisplayText` isn't actually in the text is silently ignored (the
    "token was deleted before sending" case), an empty `DisplayText` doesn't match everything; `tagPath` for
    each entity type including the two documented routing gaps (`Meeting` → list page, `User` → no route, `null`).
  - `utils/tagEntities.js` (the normalization mapping was inline in `useTagEntitySources`/`useTagPeopleSources`)
    — `tagEntities.test.js`, 7 tests, one per `normalizeTicket`/`normalizeProject`/`normalizeRepo`/
    `normalizeMeeting`/`normalizePerson`, including the fallback-label and null-`notifyUserId` cases (no
    ProjectKey, no owner Guid on Repo, no Assignee_Id on a ticket).
  - `chatCryptoSession.test.js` gained 3 cases (12→15 in that file): `Tags` defaults to `[]`, tags are attached
    as plain PascalCase metadata (`{EntityType, EntityId, DisplayText, NotifyUserId}`) separate from the
    ciphertext, and a message with tags still encrypts/decrypts to the exact same plaintext (tags never touch
    the AES-GCM payload or the AAD).
  - `useTagSources.js`, the composer's `@`/`#` dropdown wiring, and `TaggedText`'s render itself are NOT
    directly tested (they're React hooks/components — this repo's existing convention is to keep hooks/JSX free
    of business logic precisely so the logic underneath is what gets unit-tested, which is what the extraction
    above achieves; no RTL dependency was added).
  Full messenger suite: **117/117** (87 before + 30 new). Run: `npx vitest run src/features/messenger`.

**Known gaps / decisions:**
- No custom `#` category filter (typing `#` shows tickets+projects+repos+meetings merged, 8 results total) — a
  future refinement could let `#ticket:`/`#proj:` etc. narrow the picker if the merged list feels noisy in practice.
- `ChatMention` has no persistent/offline delivery (see above) and no bell-icon integration.
- `#repo` tags never notify anyone (no owner Guid on `GetRepo`) and `Meeting` chips can't deep-link to a specific
  meeting (no detail route) — both pre-existing data/routing gaps this phase didn't invent fixes for.
- Tag matching for rendering is a plain substring split on `DisplayText`; if a message's plaintext coincidentally
  contains the same literal substring as a tag's `DisplayText` outside of where it was inserted (rare in
  practice), that occurrence would also get highlighted. Not guarded against — cosmetic only, no security impact.

### Phase 8 — Encrypted media attachments & voice notes — ✅ CODE DONE (no SQL needed; no tests yet per the plan)

No new schema — `ChatMediaAttachments` (`Id`, `MessageId` FK cascade-delete, `StoragePath`, `OriginalFileName`,
`MimeType`, `FileSize`, `EncryptedFileKey`, `Iv`, `CreatedAt`) already existed from the Phase 1 master schema,
unused until now, same as Phases 6/7's tables. **One attachment per message** in this design —
`ChatMediaAttachments.Id` is always set equal to the message's own id (`ClientMessageId`), so no separate
media id needs to travel inside the encrypted envelope for the recipient to know what to fetch.

**Crypto** (`e2ee/mediaCrypto.js`, new; `e2ee/messageCrypto.js`, extended):
- `mediaCrypto.js` — the file's own random AES-256-GCM key (`K_file`, extractable so it can be wrapped) + a
  fresh 12-byte IV encrypt the raw file/voice bytes, independent of the message's content key.
- `messageCrypto.js#encryptMessage` now also returns the generated content key (`K_msg`, extractable) instead
  of discarding it — needed so a media send can additionally wrap `K_file` with it. Its usages grew from
  `["encrypt"]` to `["encrypt", "wrapKey"]` (sender) / `["decrypt"]` to `["decrypt", "unwrapKey"]` (reader);
  unused by a plain text message, so this is not a wire-format change.
- New `wrapFileKey`/`unwrapFileKey` — WebCrypto `wrapKey`/`unwrapKey` with AES-GCM, `K_msg` as the
  wrapping key. Blob = `[12-byte wrap IV | wrapped 32-byte key + 16-byte tag]` = 60 bytes, matching the
  backend's `EncryptedFileKeyLength` check exactly (not a range check). The server never sees `K_file` unwrapped.
- `decryptMessage` now branches on `body.type`: `"text"` (unchanged), or `"media"`/`"voice"` (validates
  `fileName`/`mimeType`/`size` are present) — and for the latter two, also returns the unwrapped `K_msg`
  alongside `body` (as `contentKey`) so the caller can later unwrap `K_file` and fetch+decrypt the file itself,
  without re-deriving the ECDH shared secret a second time.
- `chatCryptoSession.js#encryptMediaMessage` — same recipient/replyTo/tags handling as `encryptTextMessage`,
  plus wraps the caller's `fileKey` with the freshly generated `K_msg` before discarding it from the returned
  envelope (a `CryptoKey` isn't serializable — it's deleted from the object right before the multipart body is
  built). `decryptMediaAttachment(message)` — fetches the ciphertext (`GET /Chats/media/{id}`), unwraps `K_file`
  with the message's cached `contentKey`, decrypts, returns plaintext bytes.

**Backend** (`ChatMessageDtos.cs`, `ChatRepo.cs`, `ChatsController.cs`, `APIGatewayDBContext.cs`, `appsettings.json`):
- `SendMediaMessageDto` (multipart/form-data: `ClientMessageId`, `EncryptedPayload`, `Keys[]`,
  `ReplyToMessageId`, `Tags[]` — same shape as a text send — plus `EncryptedFileKey`, `Iv`, `OriginalFileName`,
  `MimeType`, `File`). `ChatMessageDto` gained `Media: MediaAttachmentDto?` (null for a text message), filled
  the same batch-loaded way as `Reactions`/`Tags` in `GetMessagesAsync`, and threaded through
  `FindOwnMessageAsync`/`ToDto`/`BroadcastMessageAsync` so retries and the realtime `ChatMessage` push both
  carry it.
- `POST /api/Chats/{conversationId}/media` (`ChatRepo.SendMediaMessageAsync`) — same envelope/membership/
  reply/tag/"everyone has a key" validation as a text send (refactored `ValidateEnvelope`/`ValidateRecipientKeys`
  to take primitives so both send paths share them), plus: `EncryptedFileKey` must be exactly 60 bytes, `Iv`
  exactly 12, file ≤ 50 MB (`MaxMediaBytes`, matches the frontend's `MAX_MEDIA_BYTES` and the controller's
  `[RequestSizeLimit]`/`[RequestFormLimits]`). The file is written to disk (`{ChatMedia:StorageFolder}/
  {conversationId}/{ClientMessageId}.bin`) **before** the DB transaction opens, so a failed transaction (or a
  `DbUpdateException` retry race, same idempotency pattern as text) has a known path to delete
  (`TryDeleteFile`, best-effort, logged not thrown — mirrors `AttachmentService.RollbackPhysicalFiles`'s
  convention elsewhere in this codebase).
- `GET /api/Chats/media/{mediaId}` (`ChatRepo.GetMediaBase64Async`) — 404 (not 403) unless the caller is a
  member of the conversation the media's message belongs to (same `RequireMembersAsync` used everywhere).
  **Returns base64 inside the normal JSON envelope, not a raw byte stream** — this API's
  `ResponseWrappingMiddleware` buffers every response through a `StreamReader`/`WriteAsync` UTF-8 round-trip
  (to detect/insert the `{Code,Message,Data}` wrapper), which would silently corrupt arbitrary binary bytes
  (invalid UTF-8 sequences become `U+FFFD` and never round-trip back to the original bytes). This was caught
  before it shipped by noticing the existing `AttachmentController.Download` already avoids raw streaming for
  exactly this reason — this endpoint follows the same base64-JSON convention rather than fixing the shared
  middleware (which would touch every binary response in the app, well outside this phase's scope). Trade-off:
  ~33% larger payloads and the whole file buffered in memory (middleware + JSON string) — acceptable at the
  50 MB ceiling, worth revisiting only if that ceiling grows a lot later.
- Config: `appsettings.json` → `"ChatMedia": { "StorageFolder": "D:\\Project\\nest\\storage\\chat_media" }`
  (matches the plan's example path). `ChatRepo` now takes `IConfiguration` — `ChatRepoTests.cs`'s `MakeRepo()`
  fake harness updated to pass an in-memory `IConfiguration` pointing at a temp test folder, and its
  `FakeChatDbContext` gained a `ChatMediaAttachments` DbSet (it didn't have one yet, same gap Phase 7 hit for
  `ChatMessageTags`) — both were required just to keep the **existing** 77 backend tests passing, no new tests
  written yet per the plan's phase-gate rule.
- Builds with 0 errors (`dotnet build WGNestAPIGateway.sln`); all 77 existing backend tests still pass
  (`dotnet test APIGateWay.Tests --filter "FullyQualifiedName~ChatRepoTests|FullyQualifiedName~ChatKeyRepoTests"`).

**Frontend** (`src/features/messenger/`):
- `api/chat.api.js` — `sendMedia(conversationId, body, file)` builds the multipart `FormData` (indexed
  `Keys[i].*`/`Tags[i].*` fields, matching ASP.NET Core's default form-array binding — no JSON-string
  workaround needed) and posts with an explicit `Content-Type: multipart/form-data` override (same pattern
  `EntityFormPage.jsx#uploadFile` already uses against this same axios instance, which otherwise defaults every
  request to `application/json`). `getMedia(mediaId)` — plain GET, returns `{ FileData: base64 }`.
- `hooks/useChat.js#useSendMedia(conversation)` — `mutate({ file, kind, durationMs, replyTo, tags })`: generates
  `K_file`, encrypts the file, builds the envelope (`{ type: "media"|"voice", fileName, mimeType, size,
  durationMs? }`), calls `encryptMediaMessage`, shows an optimistic "pending" bubble (carrying a synthesized
  `Media` object so it renders immediately), uploads, then reconciles with the server's confirmed DTO — same
  optimistic/pending/failed shape as `useSendMessage`, but **not retryable yet**: unlike a failed text send
  (which keeps its ciphertext `envelope` and can resend it byte-for-byte), a failed media send doesn't retain
  the encrypted file bytes for a later retry click. `MessageBubble`'s retry button is gated on `!message.Media`
  for exactly this reason — clicking retry on a failed media bubble would otherwise fall through to
  `encryptTextMessage` with no text and silently misfire.
- `components/ConversationView.jsx`:
  - **Composer**: a paperclip button (hidden `<input type="file">`, any type, ≤ `MAX_MEDIA_BYTES`) and a mic
    button that swaps in for the send button whenever the text box is empty. `useVoiceRecorder` wraps
    `MediaRecorder` (`audio/webm;codecs=opus`, falling back to plain `audio/webm` if unsupported) — start/stop/
    cancel, a live elapsed-time readout while recording, and the microphone stream is released on stop, cancel,
    *and* unmount (closing a docked chat window mid-recording doesn't leave the mic hot).
  - **Rendering**: `MediaAttachmentContent` (images auto-decrypt to an inline thumbnail once sent — a
    `Blob`/`URL.createObjectURL` held only in memory and revoked on unmount; anything else shows a file-icon
    card with size, decrypting to a downloadable blob URL on tap) and `VoiceMessagePlayer` (tap-to-decrypt,
    then an inline `<audio>` element with play/pause and a `mm:ss` duration label). Both call
    `decryptMediaAttachment` — plaintext is never written to IndexedDB/localStorage, only ever an in-memory
    object URL, consistent with how text plaintext is already handled.
- `hooks/useChat.js#messagePreview` — branches on `body.type` for the conversation-list preview
  (`"🎤 Voice message"` / `"📎 <fileName>"`), was text-only before and would have thrown on `body.text` being
  undefined for a media message.
- Checks: `npx vite build --mode development` passes, `npx eslint src/features/messenger --max-warnings=0`
  clean, full messenger suite still 117/117 (no new tests yet per the plan — those come on "Phase 8 tests").

**Known gaps / decisions:**
- **No retry for a failed media/voice send** (see above) — the bubble just shows "Not sent" with no action.
  Worth adding if failed uploads turn out to be common (e.g. flaky connections on large files).
- **Images auto-decrypt on arrival**, including for a long scroll-back through history — fine at today's usage,
  but could mean many concurrent decrypt+fetch calls if a conversation has a lot of image history. Voice notes
  and other files are tap-to-load, so this only applies to images.
- **50 MB ceiling** (`MaxMediaBytes` / `MAX_MEDIA_BYTES` — keep these two in sync if it ever changes) — no
  chunked/resumable upload, so a large file on a slow connection is one long request.
- Conversation-list previews don't show a thumbnail for media messages, just the `messagePreview` text line —
  same limitation Phases 6/7 already accepted for reactions/tags not being reflected in `LastMessage`.
- No image compression/resizing before encryption — a large photo straight from a phone camera encrypts and
  uploads at full size.
- `ChatMediaAttachments` has no unique constraint tying it 1:1 to `ChatEncryptedMessages` (only a FK + a
  non-unique index) — the *code* never creates more than one per message, but nothing at the DB level
  prevents it if some future change did.

### Recovery-code escrow (admin-recoverable) — ✅ DONE (backend tests pass, needs the SQL script + a real key)

By design, the recovery code was previously shown once and never sent to the
server (pure zero-knowledge — server could never decrypt anyone's key). At the
user's explicit request this was changed: the recovery code is now also sent
to the server at registration and stored **encrypted with a server-held admin
key**, so support can re-issue it to a user who loses it. This is a deliberate
trade-off away from pure zero-knowledge — anyone holding the admin key can
decrypt any user's recovery code, and therefore their chat private key and
message history. It was a conscious choice, confirmed with the user before
implementing (options offered: stay client-only / encrypted admin-recoverable
/ plaintext — "encrypted, admin-recoverable" was chosen).

- **New table:** `ChatUserKeyRecoveryEscrow` (`UserId` PK/FK to `ChatUserKeys`,
  `EncryptedRecoveryCode`, `CreatedAt`). SQL: `scripts/chat_recovery_escrow_schema.sql`
  — **not yet run against the real WGNEST DB**, run it before this can work end-to-end.
- **Backend:** `ChatRecoveryEscrowCipher` (`APIGateWay.Business Layer/Helper/`) —
  AES-256-GCM, key from config `ChatRecoveryEscrow:key` (SHA-256-hashed to 32
  bytes so any length secret works), separate from the existing `EncryptionKey`
  used for JWT/user-info so it can be rotated/restricted independently.
  `appsettings.json` ships a placeholder (`REPLACE_ME_WITH_A_LONG_RANDOM_ADMIN_ONLY_SECRET`)
  that fails closed (throws at startup) until replaced with a real secret —
  **must be set before deploying this**, and treated as a master secret (restrict
  file/access, rotate it, don't commit a real value to a public repo).
  `RegisterChatUserKeyDto` gained `RecoveryCode` (plaintext, validated against
  the same `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX` Crockford-Base32 shape the client
  generates); `ChatKeyRepo.RegisterMyKeyAsync` encrypts and escrows it in the
  same transaction as the key insert (not written again on a no-op resend).
  New admin-only endpoint `GET /api/ChatKeys/{userId}/recovery-escrow` ->
  `ChatKeyRepo.GetRecoveryEscrowAsync` — throws `UnauthorizedException` unless
  `_loginContext.role == AppRoles.Admin` (existing role-based pattern, no new
  `[Authorize(Roles=...)]` needed since this codebase doesn't use that).
- **Frontend:** `createUserKeyBundle` now includes `RecoveryCode` in the
  `registration` object it returns, so it rides along on the existing
  `POST /ChatKeys/me` call — no new API call needed. `SaveRecoveryCodeModal.jsx`
  copy softened ("contact support to have it re-issued" instead of "we can't
  recover it for you").
- **Tests:** `ChatKeyRepoTests.cs` — 7 new tests (26 total, all passing):
  invalid recovery code shape rejected on register, admin can read back the
  decrypted escrow, non-admin gets `UnauthorizedException`, missing escrow
  gets `DataNotFoundException`. Fake cipher (`FakeChatRecoveryEscrowCipher`)
  added to `Fakes/FakeDomainService.cs`. Run:
  `dotnet test "APIGateWay.Tests/APIGateWay.Tests.csproj" --filter FullyQualifiedName~ChatKeyRepoTests`.
- **Not built yet:** no admin UI calls the new endpoint — it's callable via
  Swagger/Postman only for now. Add a support-facing screen when/if needed.

## Scope (full feature, in order)

We are building this **step by step, one piece at a time** — do not jump ahead
to a later step without the user asking.

1. ✅ **Key generation & rotation (E2EE foundation)** — done, see below.
2. ✅ **Public key lookup** — fetch participants' public keys to encrypt to
   them (needed before any chat UI) — done, see below.
3. ✅ **1:1 direct message chat** (send/receive, encrypted, persisted) —
   code done, see below (needs SQL run + browser test).
4. ✅ Group chat (per-recipient fan-out; same crypto engine as 1:1, code
   already generalized to N members — see Phase 5 below).
5. ✅ Media attachments in chat (images/files/voice notes, encrypted at rest — see Phase 8 below).
6. ✅ Reactions (emoji reactions on messages, own `ChatMessageReactions` table —
   see Phase 6 below; the pre-existing `Emoji_Reactions` table is for *ticket
   threads* and was left untouched/unreused).
7. ✅ @Tag / mentions of users in a message — see Phase 7 below.
8. ✅ Reply-to (threaded reply referencing another message) — see Phase 5 below.
9. ✅ Entity tagging in messages — ticket / meeting / project / repo references
   (e.g. "#TCK-123" style), rendered as clickable chips — see Phase 7 below.

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

## Manual testing — Phase 3 (Login integration & recovery UI)

Prereqs: `scripts/chat_e2ee_master_schema.sql` has been run on `WGNEST` (Phase
1), the API is running with that DB, and the frontend is `npm run dev` (needs
`localhost` or HTTPS — WebCrypto/IndexedDB require a secure context; a plain
`http://<lan-ip>` origin will silently land in `UNSUPPORTED`).

Open DevTools → Application tab (IndexedDB `wg-e2ee` store `userKeys`) and
Network tab so you can see `ChatKeys` calls and clear state between scenarios.

1. **First login (key creation)**
   - Log in as a test user who has never used chat.
   - Expect: shortly after login, the **"Save your chat recovery code"** modal
     appears with a 24-character grouped code (`XXXX-XXXX-...`).
   - Click **Copy code**, confirm it's on the clipboard (paste it somewhere).
   - Try clicking **Done** with the checkbox unchecked → button stays
     disabled. Check "I have saved my recovery code" → **Done** enables and
     closes the modal.
   - In Network tab: one `GET /ChatKeys/me` (404), one `POST /ChatKeys/me`
     (200). In IndexedDB: a `userKeys` row for this user.
   - **Write down the recovery code shown** — you'll need it in step 4.

2. **Page reload (key reuse)**
   - Reload the page (still logged in).
   - Expect: no modal, no recovery code, chat silently becomes ready.
     `GET /ChatKeys/me` returns 200; no `POST`.

3. **Logout / re-login (same password)**
   - Log out, log back in with the same password.
   - Expect: no new recovery code modal (the key already exists server-side
     and unwraps fine with the same password).

4. **Password reset → recovery flow**
   - As an admin (or via whatever reset flow exists), change this user's
     WGNest login password.
   - Log in with the **new** password.
   - Expect: the **"Unlock secure chat"** modal opens automatically in
     recovery-code mode ("Your password has changed...").
   - Enter a **wrong** recovery code → inline error, modal stays open.
   - Enter the **correct** code from step 1 → modal closes, chat becomes
     ready. In Network tab: `POST /ChatKeys/rewrap` returns 200 with a bumped
     `KeyVersion`.
   - Reload the page → should stay ready with no further prompts (the key is
     now wrapped under the new password).

5. **"Not now" / deferred unlock**
   - Trigger a locked state again (e.g. clear IndexedDB for this origin in
     DevTools → Application → IndexedDB → delete `wg-e2ee`, then reload).
   - Expect status `LOCKED_NEED_PASSWORD`. Since nothing calls `openUnlock()`
     outside of chat yet (that's wired in Phase 4), you won't see the modal
     pop automatically here — that's expected per the "Not wired to a page
     yet" gap below. This is really a Phase 4 smoke check once that page
     exists; for now confirm via a quick console check:
     `useChatIdentityStore.getState().status` should read
     `"LOCKED_NEED_PASSWORD"`.

6. **Recovery code without a remembered password (cold unlock)**
   - With the key cleared from IndexedDB (step 5) and the login password no
     longer in memory (i.e. this isn't right after a fresh login), manually
     open the unlock flow from the console:
     `useChatIdentityStore.getState().openUnlock()`, then switch to "Use
     recovery code" in the modal.
   - Expect: the recovery form now also asks for your **current password**
     (two fields: current password + confirm) before it will submit, since
     `hasLoginPassword` is false.
   - Submit with mismatched confirm password → inline "Passwords don't match",
     submit stays disabled. Fix it and submit → unlocks, re-wraps, ready.

7. **Two tabs / two devices race (optional, lower priority)**
   - Clear the key for a brand-new test user (never used chat). Open the app
     in two tabs, log in as that user in both nearly simultaneously.
   - Expect: one tab shows the recovery-code modal; the other silently ends
     up `READY` using the same key (no error, no duplicate registration) —
     confirms the 409 conflict path.

8. **Malformed recovery code input**
   - In the unlock modal's recovery mode, type garbage (too short, wrong
     characters) and submit.
   - Expect a client-side validation error message (mentions "24 letters and
     numbers") with **no network call** — check the Network tab shows no new
     `rewrap` request for that submit.

If all of the above behave as described, Phase 3 is good to mark verified in
a real browser and this file's "not yet tested" note can be removed.

---

## Manual testing — Phase 4 (1:1 chat + message bar)

Prereqs: run `scripts/chat_phase4_read_state.sql` on `WGNEST`, restart the API,
`npm run dev` on `localhost`. Use **two different users who have both logged in
once since Phase 3** (so both have a chat key) — e.g. a normal window and an
incognito window. Keep DevTools Network open (`Chats` calls, WS frames).

1. **Sidebar screen** — "Messages" is in the sidebar; `/messages` shows the list +
   "Select a conversation". The bottom message bar is hidden on this page.
2. **Start a chat** — search user B, pick them -> `POST /Chats/direct` 200, URL gets
   `?c=`, empty timeline says only you and B can read it. Pick B again -> same conversation.
3. **Send** — A sends "hello": bubble shows "Sending…" then a time. Network body has
   only `EncryptedPayload` + 2 `Keys` — no plaintext anywhere. In SQL:
   `ChatEncryptedMessages` 1 row (`Id` = `ClientMessageId`), `ChatMessageKeys` 2 rows.
4. **Receive live** — B on the dashboard (not `/messages`): pop-up "A: hello" bottom-right,
   bar badge = 1, sidebar "Messages" badge = 1. Click pop-up -> docked window opens,
   badge clears, `POST /Chats/{id}/read` 200, `LastReadAt` set in SQL.
5. **Reply in the dock** — B replies from the mini window; A (on `/messages` with the
   chat open) sees it appear with no badge/pop-up.
6. **Unread while away** — B closes the window, A sends 3 messages -> B's badge = 3,
   conversation bold with preview "…" of the newest. Open it -> 0.
7. **Multi-tab read sync** — B in two tabs; read in one -> other tab's badge clears (`ChatRead`).
8. **Reload / history** — reload both: history decrypts, previews show text, "You: " prefix
   on own last message. Send > 50 messages (or temporarily lower `PAGE_SIZE`) and scroll up
   -> older page loads without jumping.
9. **Failed send + retry** — stop the API, send -> red "Not sent · Tap to retry"; start
   API, tap retry -> sent once (one DB row, no duplicate).
10. **Recipient without a key** — message a user who never logged in since Phase 3 ->
    inline "…hasn't set up secure chat yet", nothing stored.
11. **Locked** — delete IndexedDB `wg-e2ee`, reload -> timeline shows "Secure chat is
    locked…" + "Unlock secure chat" -> unlock modal -> messages decrypt, previews update.
12. **Dock UI** — minimize/expand/close windows, open a 3rd chat (oldest window drops),
    "Open full Messages view" and the expand icon go to `/messages?c=`. Narrow the
    browser to phone width: bar becomes an icon, list/window open full-screen.
13. **Desktop alerts** — click "Turn on desktop alerts", allow; switch to another tab,
    receive a message -> OS notification; clicking it focuses WGNest and opens the chat.
14. **Non-member** — as user C, `GET /api/Chats/{A-B conversation id}/messages` in
    Swagger -> 404.

---

## Next Step

Phase 7 was confirmed passed, and Phase 8 (encrypted media attachments &
voice notes) was completed immediately per that confirmation. Code for
Phase 8 is done (see the Phase 8 section above); no automated tests yet
per the plan's rule. `ChatRepo.SendMediaMessageAsync` creates
`ChatMedia:StorageFolder` (and its per-conversation subfolder) on disk
automatically on first use via `Directory.CreateDirectory`, so no manual
folder setup is required — just restart the API after pulling this change so
it picks up the new `appsettings.json` config, then the user's manual
browser verification, then "Phase 8 passed" to close out the plan (Phase 8
is the last one in `messengernewPrompt.md`).

**Phase 8 manual test:** no SQL to run — `ChatMediaAttachments` already
exists on `WGNEST` from the Phase 1 master schema. Manually test in a real
browser, two logged-in users:
- Click the paperclip, pick an image — confirm a "Sending…" bubble appears,
  then the image thumbnail once sent; open it in a new tab via the thumbnail
  link and confirm it matches the original file exactly (no corruption).
- Click the paperclip, pick a non-image file (e.g. a PDF or .zip) — confirm a
  file-icon card with its name/size appears; tap it, confirm it downloads and
  opens correctly.
- Try a file over 50 MB — confirm it's rejected client-side with no network
  call (check the Network tab).
- Click the mic button, allow microphone access, speak for a few seconds,
  click stop — confirm a voice-message bubble appears with a duration label;
  tap play, confirm audio plays back correctly. Click mic then Cancel mid-
  recording — confirm nothing is sent and the mic indicator turns off.
- On the recipient's side (realtime, not a reload): confirm the image/file/
  voice bubble appears the same way, and the conversation list preview shows
  "📎 filename" / "🎤 Voice message" instead of raw text.
- Reload the page and scroll to an older image/file/voice message — confirm
  it still decrypts correctly from a fresh page load (not just the realtime
  push).
- Stop the API mid-upload (or throttle the network) to force a failed send —
  confirm the bubble shows "Not sent" with **no** retry button (known gap,
  documented above) and doesn't corrupt the conversation.
- As a third user not in the conversation, try `GET /api/Chats/media/{id}`
  for that attachment's id in Swagger — confirm 404.

*(The Steps 1-4 group-chat note that used to live here belonged to the old
device-based design, which Steps 1-3 above were superseded by; it no longer
applies now that the phase-based redesign is in progress.)*

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
