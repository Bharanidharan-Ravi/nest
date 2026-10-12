// MeetingReminder.jsx
//
// Mounted once in the authenticated layout, so it works on whatever screen the
// user is on. For meetings the user organizes or attends:
//   - 5 minutes before the start: popup + chime (+ OS notification when the
//     tab is in the background)
//   - user opens the app / returns to the tab after the start: "in progress,
//     started X minutes ago" popup + chime
// Each day's meeting is shown once, also across reloads and open tabs.

import { useEffect, useRef, useState } from "react";
import { BellRing, Clock, Radio, X } from "lucide-react";
import { useUpcomingMeeting } from "../hooks";
import { dueMeetings, phaseOf, reminderLabel } from "../Helpers/reminders";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { playNotificationSound } from "../../../core/notifications/notificationSound";
import { isAppInForeground, showBrowserNotification } from "../../../core/notifications/browserNotification";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";

const CHECK_EVERY_MS = 15 * 1000;
const REMINDED_KEY = "wgMeetingRemindersShown";

const today = () => new Date().toDateString();

// "Already shown" keys for today. Kept in localStorage so a reload or a
// second tab doesn't show them again; yesterday's keys are dropped.
function readReminded() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMINDED_KEY) || "{}");
    return saved.day === today() ? new Set(saved.keys) : new Set();
  } catch {
    return new Set();
  }
}

function saveReminded(keys) {
  try {
    localStorage.setItem(REMINDED_KEY, JSON.stringify({ day: today(), keys: [...keys] }));
  } catch {
    // storage blocked: worst case a reload shows them again
  }
}

const PHASE_STYLE = {
  soon: { Icon: Clock, text: "text-amber-700" },
  live: { Icon: Radio, text: "text-green-700" },
};

export default function MeetingReminder() {
  const { data: upcoming } = useUpcomingMeeting();
  const { goTo } = useSmartNavigation();
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  const upcomingRef = useRef(upcoming);
  upcomingRef.current = upcoming;

  const [shown, setShown] = useState([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const check = () => {
      const current = new Date();
      setNow(current);

      const reminded = readReminded();
      const fresh = dueMeetings(upcomingRef.current, current, readUserFromSession()?.userId).filter(
        (meeting) => !reminded.has(meeting.reminderKey)
      );
      if (!fresh.length) return;

      fresh.forEach((meeting) => reminded.add(meeting.reminderKey));
      saveReminded(reminded);
      setShown((list) => [...list, ...fresh]);

      playNotificationSound();

      if (!isAppInForeground()) {
        fresh.forEach((meeting) =>
          showBrowserNotification({
            id: `meeting-${meeting.reminderKey}`,
            title: meeting.title || "Meeting reminder",
            body: reminderLabel(meeting, current),
            onClick: () => goToRef.current(ROUTE_KEYS.MEETING_LIST),
          })
        );
      }
    };

    // Re-check as soon as the list changes and when the user comes back to the
    // tab, since timers in a background tab are throttled
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [upcoming]);

  if (!shown.length) return null;

  const close = () => setShown([]);
  const open = () => {
    close();
    goToRef.current(ROUTE_KEYS.MEETING_LIST);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4">
      <div
        role="alertdialog"
        aria-label="Meeting reminder"
        className="w-[380px] max-w-full rounded-xl border border-amber-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2 rounded-t-xl bg-amber-50 px-4 py-2.5">
          <BellRing size={16} className="text-amber-600" />
          <p className="flex-1 text-sm font-semibold text-gray-900">
            Meeting reminder
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss reminder"
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto px-4">
          {shown.map((meeting) => {
            const { Icon, text } = PHASE_STYLE[phaseOf(meeting, now)];
            return (
              <li key={meeting.reminderKey} className="py-2.5">
                <p className="truncate text-sm font-medium text-gray-900" title={meeting.title}>
                  {meeting.title || "Untitled Meeting"}
                </p>
                <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${text}`}>
                  <Icon size={12} className="shrink-0" />
                  {reminderLabel(meeting, now)}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {meeting.startLabel}
                  {meeting.endLabel ? ` - ${meeting.endLabel}` : ""}
                  {meeting.Organizer ? ` · ${meeting.Organizer}` : ""}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-2.5">
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={open}
            className="rounded-md bg-brand-yellow px-3 py-1 text-xs font-medium text-white hover:bg-yellow-500"
          >
            Open meetings
          </button>
        </div>
      </div>
    </div>
  );
}
