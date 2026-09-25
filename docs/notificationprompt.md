# Phase 1 — Logged-in Realtime Notification Experience

## Objective

Implement a strong realtime notification experience for the existing web application, similar to the behavior users expect from WhatsApp Web.

### Phase 1 Scope

Notifications must work for **authenticated/logged-in users only**.

Do NOT implement notifications for logged-out users in this phase.

Do NOT introduce Web Push infrastructure, service workers, background push subscriptions, or a separate notification delivery architecture yet.

The existing authenticated SignalR notification mechanism must remain the primary realtime delivery mechanism.

---

# 1. First Analyze the Existing Implementation

Before changing any code, inspect the existing project and identify:

* Existing SignalR connection implementation
* SignalR authentication/access-token handling
* Existing SignalR event handlers
* Existing NotificationMaster / notification API
* Existing notification service/repository
* Existing EventCenter / PublishAsync implementation
* Existing notification unread-count API
* Existing React Query configuration
* Existing Zustand stores
* Existing notification hooks
* Existing header/navbar notification UI
* Existing authentication/login lifecycle
* Existing logout lifecycle
* Existing connection/reconnection handling
* Existing query keys used for notifications
* Existing notification components

### Critical requirement

**Reuse the current implementation wherever possible.**

Do not create:

* A second SignalR connection
* A second notification service
* A second notification store unnecessarily
* Duplicate notification APIs
* Duplicate unread-count APIs
* A parallel realtime architecture

First understand the current flow and extend it cleanly.

---

# 2. Required Phase 1 Behavior

When an authenticated user receives a new notification through the existing SignalR mechanism:

```text
SignalR NotificationReceived
        ↓
Notification Handler
        ↓
┌───────────────────────────────┐
│ 1. Update notification state  │
│ 2. Increase unread count      │
│ 3. Update browser tab title   │
│ 4. Play notification sound    │
│ 5. Show browser notification  │
└───────────────────────────────┘
```

All of these should happen from the **same notification event**.

Avoid making separate API calls for every UI action unless the existing architecture requires them.

---

# 3. Dynamic Browser Tab Title

Implement a reusable notification-title mechanism.

Normal state:

```text
MyApp
```

If 1 unread notification exists:

```text
(1) MyApp
```

If 5 unread notifications exist:

```text
(5) MyApp
```

If there are no unread notifications:

```text
MyApp
```

The original application title must be preserved.

Do not hard-code the application title in multiple places.

Create a reusable mechanism such as:

```javascript
useDocumentTitle()
```

or an appropriate existing utility if the project already has one.

Example behavior:

```javascript
document.title = unreadCount > 0
    ? `(${unreadCount}) ${baseTitle}`
    : baseTitle;
```

The title must remain synchronized with the application's notification state.

---

# 4. Notification Sound

When a new notification arrives, play a notification sound.

Requirements:

* Use a local application sound asset.
* Do not download a sound from an external website.
* Reuse an existing sound if the project already has one.
* If no sound exists, add a lightweight appropriate notification sound.
* The sound should play immediately when a new notification event is received.
* Avoid creating multiple Audio instances unnecessarily.
* Avoid overlapping sounds if several notifications arrive rapidly.
* Handle browser autoplay restrictions gracefully.

Example conceptual flow:

```text
New SignalR notification
        ↓
playNotificationSound()
```

The implementation must gracefully handle:

```javascript
audio.play().catch(...)
```

because browsers can block audio until the user has interacted with the website.

Do not allow a blocked audio attempt to break notification processing.

---

# 5. Browser Notification

Use the browser Notification API for authenticated users.

When a new notification arrives:

```text
New notification
       ↓
Browser supports Notification API?
       ↓
Permission granted?
       ↓
Show notification
```

Example:

```javascript
new Notification(notification.title, {
    body: notification.message,
    icon: "/logo.png"
});
```

Use the application's existing branding/icon if available.

Do not blindly request permission every time a notification arrives.

Permission handling must support:

```text
default
granted
denied
```

If permission is:

```text
granted
```

show the notification.

If:

```text
denied
```

continue normal in-app notification handling without errors.

If:

```text
default
```

do not repeatedly trigger permission prompts.

Implement a sensible permission-request flow based on an existing user interaction/login/header interaction if appropriate.

---

# 6. Browser Visibility / Other Tab / Other Application

The implementation should maximize notification behavior within normal browser security restrictions.

Handle these cases:

### Case A — User is actively using the application

```text
MyApp
↓
New notification
↓
Update notification UI
↓
Play sound
↓
Update tab title
↓
Browser notification according to UX rules
```

### Case B — User switches to another browser tab

```text
MyApp tab
      ↓
User switches to another tab
      ↓
SignalR receives notification
      ↓
Sound
      ↓
Tab title becomes:

(1) MyApp

      ↓
Browser notification
```

### Case C — User switches to another application

```text
MyApp running
      ↓
User opens VS Code / Outlook / another application
      ↓
SignalR receives notification
      ↓
Browser notification where supported
      ↓
Sound where browser allows it
```

### Important

Do not claim that browser notification/sound can be guaranteed in every operating-system/browser state.

Implement the **maximum behavior allowed by the browser and OS**, and gracefully handle restrictions.

---

# 7. Do Not Depend on Polling

Do not introduce aggressive polling just to detect notifications.

The existing SignalR realtime event should be the primary trigger.

Avoid:

```text
Every 5 seconds
    ↓
Call unread notification API
```

unless the existing architecture already uses such a mechanism for synchronization.

Prefer:

```text
SignalR
  ↓
Instant notification
  ↓
Update local React Query/Zustand state
```

---

# 8. React Query Integration

If the current application uses React Query for notification state, reuse the existing query keys.

When a notification arrives, update the relevant cache immediately.

For example:

```javascript
queryClient.setQueryData(
    ["notifications", "unread-count"],
    (old = 0) => old + 1
);
```

If the existing query structure is different, use the project's existing query key instead.

Do NOT invent duplicate query keys.

If the notification list is already cached, update it appropriately or invalidate/refetch only where necessary.

The objective is to avoid unnecessary API calls while keeping the UI realtime.

---

# 9. Zustand Integration

If notification state is already maintained through Zustand:

```text
SignalR
   ↓
Existing notification store
   ↓
unreadCount
   ↓
Header
   ↓
document.title
```

Reuse the existing Zustand store.

Do not create another global notification store if one already exists.

If a store is required and no suitable store exists, create a small focused notification store rather than adding notification state to an unrelated store.

---

# 10. Notification Deduplication

This is important.

A single SignalR notification must not accidentally produce:

```text
2 sounds
2 browser notifications
2 unread-count increments
```

because multiple handlers/components are subscribed to the same SignalR event.

Ensure the event handler is registered exactly once per authenticated connection lifecycle.

Also handle React development/StrictMode behavior correctly.

If the same notification can be received more than once, use the notification ID for deduplication.

Example:

```javascript
if (processedNotificationIds.has(notification.notificationId)) {
    return;
}
```

Use an appropriate bounded strategy rather than allowing an in-memory collection to grow forever.

---

# 11. Authentication Lifecycle

Notification functionality must follow authentication state.

### Login

```text
Login successful
      ↓
SignalR connects
      ↓
Notification handlers registered
      ↓
Notification system initialized
```

### Logout

```text
Logout
   ↓
SignalR disconnected
   ↓
Notification handlers removed
   ↓
Notification state cleaned/reset
   ↓
Browser tab title restored
```

After logout:

```text
MyApp
```

There must be no authenticated notification processing.

---

# 12. Reconnection

Reuse the existing SignalR reconnection mechanism.

When SignalR reconnects:

```text
Disconnected
    ↓
Reconnect
    ↓
Restore notification event handling
```

Do not create duplicate event subscriptions after reconnect.

The implementation must be safe against:

```text
connect
disconnect
reconnect
reconnect
disconnect
connect
```

without creating duplicate handlers.

---

# 13. Initial Unread Count

When the user logs in or the application initializes:

```text
API
 ↓
Get unread notification count
 ↓
React Query/Zustand
 ↓
Header badge
 ↓
Browser title
```

Example:

```text
5 unread notifications

Header:
🔔 5

Browser:
(5) MyApp
```

When a notification is read:

```text
Unread count:
5 → 4

Browser title:
(5) MyApp
→
(4) MyApp
```

When all notifications are read:

```text
MyApp
```

---

# 14. Browser Title Must Reflect Actual Unread State

Do not simply increment the browser title forever.

Bad:

```text
(1) MyApp
(2) MyApp
(3) MyApp
(4) MyApp
```

without considering reads.

Instead:

```text
Actual unread count
        ↓
document.title
```

The browser title should always represent the application's actual notification state.

---

# 15. Suggested Reusable Architecture

Prefer a centralized notification manager/hook:

```text
useNotificationManager()
```

Conceptually:

```javascript
useNotificationManager({
    signalRConnection,
    queryClient,
    notificationStore
});
```

Responsibilities:

```text
useNotificationManager
        │
        ├── SignalR event subscription
        ├── Deduplication
        ├── Notification state update
        ├── Unread count update
        ├── Sound
        ├── Browser Notification API
        └── Document title
```

Keep presentation/UI components separate.

For example:

```text
NotificationManager
        │
        ├── HeaderNotificationBell
        ├── NotificationPanel
        ├── BrowserTitleManager
        ├── NotificationSound
        └── BrowserNotification
```

Do not tightly couple these responsibilities to the header component.

---

# 16. Browser Limitations

The implementation must acknowledge and handle browser limitations.

We want to achieve the maximum possible behavior within normal browser restrictions.

Potential restrictions include:

* Notification permission can be denied by the user.
* Browsers may block notification permission requests unless triggered by user interaction.
* Audio autoplay may be blocked until the user interacts with the page.
* OS notification settings may disable notifications.
* Browser battery/resource-saving behavior may affect background tabs.
* Browser/OS focus modes may suppress notifications.
* Closing the browser completely is outside the scope of Phase 1.

Do not implement hacks to bypass browser security restrictions.

Instead:

```text
Browser allows → deliver notification
Browser blocks → gracefully continue in-app notification
```

---

# 17. Performance Requirements

This feature must be lightweight.

Do not:

* Create unnecessary intervals.
* Poll aggressively.
* Create multiple SignalR connections.
* Re-render the entire application for every notification.
* Create unnecessary Audio objects.
* Refetch the complete notification list for every event.

Use:

```text
SignalR
+
React Query cache updates
+
small notification state
+
centralized event handling
```

---

# 18. Deliverables

Before modifying code:

1. Analyze the existing notification architecture.
2. Identify all relevant files.
3. Explain the current notification flow.
4. Identify what can be reused.
5. Identify only the minimum changes required.

Then implement:

* Dynamic notification count
* Dynamic browser tab title
* Notification sound
* Browser Notification API
* SignalR integration
* Notification deduplication
* React Query/Zustand synchronization
* Authentication lifecycle handling
* Logout cleanup
* Reconnection safety
* Browser permission handling
* Graceful browser restriction handling

---

# 19. Testing Checklist

Test all of the following:

### Notification

* [ ] Send notification to logged-in user.
* [ ] Notification arrives through SignalR.
* [ ] Unread count increases.
* [ ] Header badge updates.
* [ ] Browser title changes.
* [ ] Sound plays where permitted.
* [ ] Browser notification appears where permitted.

### Multiple notifications

* [ ] 1 notification → `(1) MyApp`
* [ ] 3 notifications → `(3) MyApp`
* [ ] 10 notifications → `(10) MyApp`

### Read state

* [ ] Mark one notification as read.
* [ ] Count decreases.
* [ ] Browser title decreases.
* [ ] Mark all as read.
* [ ] Browser title returns to `MyApp`.

### Browser tabs

* [ ] Application active.
* [ ] Another browser tab active.
* [ ] Another browser window active.
* [ ] Another desktop application active.

### Authentication

* [ ] Login → notification system starts.
* [ ] Logout → notification system stops.
* [ ] Login again → notification system works again.

### SignalR

* [ ] Initial connection.
* [ ] Temporary disconnect.
* [ ] Reconnection.
* [ ] Multiple reconnects do not create duplicate handlers.

### Duplicate prevention

One server notification must result in:

```text
1 unread increment
1 sound
1 browser notification
1 notification entry
```

not multiple executions.

### Browser permissions

Test:

```text
Notification.permission = "default"
Notification.permission = "granted"
Notification.permission = "denied"
```

The application must remain stable in all three cases.

---

# 20. Important Phase Boundary

### Phase 1

```text
LOGIN REQUIRED
     ↓
SignalR
     ↓
Realtime notification
     ↓
├── In-app notification
├── Notification count
├── Browser tab title
├── Notification sound
└── Browser notification
```

### Phase 2 — NOT NOW

Later we can implement:

```text
User logged out
        ↓
Service Worker
        ↓
Web Push
        ↓
Push subscription
        ↓
Backend push provider
        ↓
Browser/OS notification
```

Do not implement Phase 2 as part of this task.

---

## Final Requirement

Do not blindly rewrite the notification system.

**First inspect the existing implementation and integrate this feature into the current architecture with the smallest clean change set possible.**

At the end, provide:

1. Current architecture found
2. Files/components reused
3. Files modified
4. New files created
5. Exact behavior implemented
6. Browser limitations encountered
7. Testing performed
8. Any recommended follow-up for Phase 2
