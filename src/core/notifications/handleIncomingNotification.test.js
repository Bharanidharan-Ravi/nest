import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/queryKeys";

const listResponse = vi.fn();

vi.mock("../../app/Hooks/useNotificationCount", () => ({
  fetchNotificationList: () => listResponse(),
}));
vi.mock("./notificationSound", () => ({ playNotificationSound: vi.fn() }));
vi.mock("./browserNotification", () => ({
  isAppInForeground: vi.fn(() => true),
  showBrowserNotification: vi.fn(),
}));

const { handleIncomingNotification, withActorName } = await import("./handleIncomingNotification");
const { resetUnreadCountSync, trackUnreadCountRequest } = await import("./unreadCountSync");
const { playNotificationSound } = await import("./notificationSound");
const { isAppInForeground, showBrowserNotification } = await import("./browserNotification");

const unreadKey = queryKeys.notification.unreadCount();
const item = (id, type = "TICKET") => ({
  NotificationId: id,
  Title: `Title ${id}`,
  Message: `Message ${id}`,
  EntityType: type,
  ActorName: "Func",
});

describe("withActorName", () => {
  it("appends who did it", () => {
    expect(withActorName("Ticket T1: New comment added to ticket", "Func")).toBe(
      "Ticket T1: New comment added to ticket by Func",
    );
    expect(withActorName("Leave request was approved.", "Admin")).toBe(
      "Leave request was approved by Admin",
    );
  });

  it("doesn't repeat a name the message already has", () => {
    expect(withActorName("Func requested 2 day(s) leave.", "func")).toBe(
      "Func requested 2 day(s) leave.",
    );
  });

  it("leaves the message alone without an actor", () => {
    expect(withActorName("Ticket T1: updated", undefined)).toBe("Ticket T1: updated");
  });
});

let queryClient;

// Fills the cache the way the count query does
const serverCount = (value) =>
  queryClient.fetchQuery({
    queryKey: unreadKey,
    queryFn: () => trackUnreadCountRequest(async () => value),
    staleTime: 0,
  });

beforeEach(async () => {
  vi.clearAllMocks();
  isAppInForeground.mockReturnValue(true);
  resetUnreadCountSync();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, structuralSharing: false } },
  });
  // Last poll was a minute ago
  vi.useFakeTimers({ toFake: ["Date"], now: Date.now() - 60_000 });
  await serverCount({ TICKET: 2 });
  vi.useRealTimers();
});

describe("handleIncomingNotification", () => {
  it("bumps the matching bucket once and chimes", async () => {
    listResponse.mockResolvedValue([item("n1", "MEETING")]);

    await handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: true });

    expect(queryClient.getQueryData(unreadKey)).toEqual({ TICKET: 2, MEETING: 1 });
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
    expect(showBrowserNotification).not.toHaveBeenCalled();
  });

  it("shows an OS notification only when the app is in the background", async () => {
    isAppInForeground.mockReturnValue(false);
    listResponse.mockResolvedValue([item("n1")]);

    await handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: true });

    expect(showBrowserNotification).toHaveBeenCalledWith({
      id: "n1",
      title: "Title n1",
      body: "Message n1 by Func",
    });
  });

  it("doesn't double count when the server count was fetched after the event", async () => {
    listResponse.mockImplementation(async () => {
      // unread-count poll starts and lands while the list request is in flight
      await serverCount({ TICKET: 3 });
      return [item("n1")];
    });

    await handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: true });

    expect(queryClient.getQueryData(unreadKey)).toEqual({ TICKET: 3 });
  });

  it("counts every notification in a burst", async () => {
    listResponse.mockResolvedValue([item("n1"), item("n2"), item("n3")]);

    await Promise.all(
      ["n1", "n2", "n3"].map((id) =>
        handleIncomingNotification(queryClient, { notificationId: id, alertsEnabled: true }),
      ),
    );

    expect(queryClient.getQueryData(unreadKey)).toEqual({ TICKET: 5 });
  });

  it("doesn't alert for a notification that isn't in the user's list", async () => {
    listResponse.mockResolvedValue([item("other")]);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: true });

    expect(playNotificationSound).not.toHaveBeenCalled();
    expect(showBrowserNotification).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: unreadKey });
  });

  it("keeps processing when the list request fails", async () => {
    listResponse.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: true }),
    ).resolves.toBeUndefined();
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it("scopes the cross-tab alert lock to the user", async () => {
    const held = new Set();
    vi.stubGlobal("navigator", {
      locks: {
        request: (name, _opts, cb) => {
          if (held.has(name)) return Promise.resolve(cb(null));
          held.add(name);
          cb({ name });
          return Promise.resolve();
        },
      },
    });
    listResponse.mockResolvedValue([item("n1")]);

    try {
      // Same user in a second tab → one chime; a different user → their own chime
      await handleIncomingNotification(queryClient, { notificationId: "n1", userId: "A", alertsEnabled: true });
      await handleIncomingNotification(queryClient, { notificationId: "n1", userId: "A", alertsEnabled: true });
      await handleIncomingNotification(queryClient, { notificationId: "n1", userId: "B", alertsEnabled: true });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(playNotificationSound).toHaveBeenCalledTimes(2);
    expect([...held]).toEqual(["wg-notification-a-n1", "wg-notification-b-n1"]);
  });

  it("updates the cache without alerts for viewers", async () => {
    isAppInForeground.mockReturnValue(false);
    listResponse.mockResolvedValue([item("n1")]);

    await handleIncomingNotification(queryClient, { notificationId: "n1", alertsEnabled: false });

    expect(queryClient.getQueryData(unreadKey)).toEqual({ TICKET: 3 });
    expect(playNotificationSound).not.toHaveBeenCalled();
    expect(showBrowserNotification).not.toHaveBeenCalled();
  });
});
