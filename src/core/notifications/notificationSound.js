// notificationSound.js
//
// One shared Audio element for the notification chime. Browsers block
// audio until the user has interacted with the page, so play() failures are
// swallowed — a blocked sound must never break notification processing.

import notificationSoundUrl from "../../assets/sounds/notification.wav";

// Several notifications in a burst → one chime, not a stack of overlapping ones
const MIN_GAP_MS = 1500;

let audio = null;
let lastPlayedAt = 0;

const getAudio = () => {
  if (!audio && typeof Audio !== "undefined") {
    audio = new Audio(notificationSoundUrl);
    audio.preload = "auto";
    audio.volume = 1;
  }
  return audio;
};

export const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_GAP_MS) return;

  const el = getAudio();
  if (!el) return;

  lastPlayedAt = now;
  try {
    el.currentTime = 0;
    const result = el.play();
    result?.catch?.((err) => {
      // NotAllowedError = autoplay policy; the page hasn't had a user gesture yet
      console.info("[Notification] Sound blocked by browser:", err?.name ?? err);
    });
  } catch (err) {
    console.info("[Notification] Sound unavailable:", err);
  }
};

// Called once on the first user interaction so the file is loaded before
// the first notification arrives.
export const preloadNotificationSound = () => {
  getAudio()?.load();
};
