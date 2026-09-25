// browserNotification.js
//
// Thin wrapper over the browser Notification API.
//   granted → show OS notifications
//   denied  → do nothing; in-app badge/title/sound still work
//   default → ask only from a user gesture, and auto-ask at most once per browser
//             (the bell icon can still ask explicitly)

import appIconUrl from "../../assets/WORKGLOWLOGO.png";

const ASKED_KEY = "wgNotificationPermissionAsked";

// The logo is a wide banner; the OS shows notification icons as a square and
// crops/zooms whatever it gets. Fit the whole logo, padded, into a square.
const ICON_SIZE = 192;
const ICON_PADDING = 0.14;

let iconUrl = appIconUrl;

const buildSquareIcon = () => {
  if (typeof document === "undefined" || typeof Image === "undefined") return;
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = ICON_SIZE;
      const inner = ICON_SIZE * (1 - ICON_PADDING * 2);
      const scale = Math.min(inner / img.width, inner / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      canvas
        .getContext("2d")
        .drawImage(img, (ICON_SIZE - w) / 2, (ICON_SIZE - h) / 2, w, h);
      iconUrl = canvas.toDataURL("image/png");
    } catch {
      // keep the original logo
    }
  };
  img.src = appIconUrl;
};

buildSquareIcon();

export const isBrowserNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getNotificationPermission = () =>
  isBrowserNotificationSupported() ? Notification.permission : "denied";

const hasAutoAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) === "1";
  } catch {
    return false;
  }
};

const markAutoAsked = () => {
  try {
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // storage blocked — worst case we ask again next session
  }
};

// The bell/calendar may re-ask after a dismissed prompt, but only once per
// page load — never a prompt on every click.
let explicitAskedThisSession = false;

/**
 * Must be called from a user gesture (click/keydown) — browsers ignore or
 * penalise permission prompts that aren't.
 * @param {{ explicit?: boolean }} opts explicit = user clicked something
 *   notification-related (e.g. the bell), so ask even if we auto-asked before.
 */
export const requestNotificationPermission = async ({ explicit = false } = {}) => {
  if (getNotificationPermission() !== "default") return getNotificationPermission();
  if (explicit ? explicitAskedThisSession : hasAutoAsked()) return "default";

  if (explicit) explicitAskedThisSession = true;
  markAutoAsked();
  try {
    return await Notification.requestPermission();
  } catch {
    return getNotificationPermission();
  }
};

// WhatsApp-style: while the user is looking at the app the in-app UI is enough;
// OS notifications are for when the tab is hidden or another window has focus.
export const isAppInForeground = () =>
  document.visibilityState === "visible" && document.hasFocus();

/**
 * @param {{ id?: string, title: string, body?: string, onClick?: () => void }} n
 */
export const showBrowserNotification = ({ id, title, body, onClick }) => {
  if (getNotificationPermission() !== "granted") return null;

  try {
    const notification = new Notification(title || "New notification", {
      body: body || "",
      icon: iconUrl,
      // Same tag → the OS replaces rather than stacks (also collapses the
      // same notification arriving in two open tabs)
      tag: id ? `wg-notification-${id}` : undefined,
    });

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
    return notification;
  } catch (err) {
    // e.g. Android Chrome only allows notifications from a service worker
    console.info("[Notification] Browser notification failed:", err);
    return null;
  }
};
