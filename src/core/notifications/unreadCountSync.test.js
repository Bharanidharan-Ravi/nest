import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/queryKeys";
import {
  applyRealtimeNotification,
  markRealtimeEvent,
  resetUnreadCountSync,
  trackUnreadCountRequest,
} from "./unreadCountSync";

const unreadKey = queryKeys.notification.unreadCount();

let queryClient;

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// A count request as the app makes it; resolve it whenever the test wants
const startCountRequest = () => {
  const response = deferred();
  const landed = queryClient.fetchQuery({
    queryKey: unreadKey,
    queryFn: () => trackUnreadCountRequest(() => response.promise),
    staleTime: 0,
  });
  return { respond: response.resolve, fail: response.reject, landed };
};

const serverCount = async (value) => {
  const req = startCountRequest();
  req.respond(value);
  await req.landed;
};

const count = () => queryClient.getQueryData(unreadKey);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  resetUnreadCountSync();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, structuralSharing: false } },
  });
  await serverCount({ TICKET: 5 });
  // Most events arrive well after the last poll
  vi.advanceTimersByTime(20_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("unreadCountSync", () => {
  it("bumps only the notification's own type", async () => {
    await serverCount({ TICKET: 3, MEETING: 1, LEAVE_REQUEST: 2 });
    vi.advanceTimersByTime(20_000);

    applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");

    expect(count()).toEqual({ TICKET: 4, MEETING: 1, LEAVE_REQUEST: 2 });
  });

  it("keeps the +1 when an older request lands after the local bump", async () => {
    const poll = startCountRequest(); // started before the notification existed
    const event = markRealtimeEvent();
    applyRealtimeNotification(queryClient, event, "TICKET");
    expect(count()).toEqual({ TICKET: 6 });

    poll.respond({ TICKET: 5 });
    await poll.landed;

    expect(count()).toEqual({ TICKET: 6 });
  });

  it("keeps the +1 when an older request lands during the list lookup (T1–T5)", async () => {
    const poll = startCountRequest(); // T1: server still at 5
    const event = markRealtimeEvent(); // T3: SignalR arrives
    poll.respond({ TICKET: 5 }); // T5: old response lands first
    await poll.landed;

    applyRealtimeNotification(queryClient, event, "TICKET"); // lookup done

    expect(count()).toEqual({ TICKET: 6 });
  });

  it("doesn't double count a request that started after the event", async () => {
    const event = markRealtimeEvent();
    await serverCount({ TICKET: 6 });

    applyRealtimeNotification(queryClient, event, "TICKET");

    expect(count()).toEqual({ TICKET: 6 });
  });

  it("counts a burst exactly, whatever order the responses land in", async () => {
    const pollBefore = startCountRequest();
    const events = [markRealtimeEvent(), markRealtimeEvent(), markRealtimeEvent()];
    applyRealtimeNotification(queryClient, events[0], "TICKET");
    pollBefore.respond({ TICKET: 5 });
    await pollBefore.landed;
    applyRealtimeNotification(queryClient, events[1], "TICKET");
    applyRealtimeNotification(queryClient, events[2], "TICKET");

    expect(count()).toEqual({ TICKET: 8 });
  });

  it("reconciles once per burst when a response was ambiguous", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const poll = startCountRequest();
    const events = Array.from({ length: 20 }, () => markRealtimeEvent());
    events.forEach((e) => applyRealtimeNotification(queryClient, e, "TICKET"));
    poll.respond({ TICKET: 5 });
    await poll.landed;

    expect(count()).toEqual({ TICKET: 25 });
    vi.advanceTimersByTime(1000);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: unreadKey });
  });

  it("makes no extra requests when nothing is ambiguous", () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    for (let i = 0; i < 20; i++) {
      applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");
    }

    expect(count()).toEqual({ TICKET: 25 });
    vi.advanceTimersByTime(5000);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("converges to the server when a response already included the event", async () => {
    // Poll saw the new notification (6) and landed just before SignalR arrived
    await serverCount({ TICKET: 6 });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");
    vi.advanceTimersByTime(1000);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: unreadKey });

    await serverCount({ TICKET: 6 }); // the reconciliation fetch
    expect(count()).toEqual({ TICKET: 6 });
  });

  it("drops the local +1 once the user marks it seen", async () => {
    applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");
    expect(count()).toEqual({ TICKET: 6 });

    await serverCount({ TICKET: 0 }); // mark-seen → invalidate → refetch

    expect(count()).toEqual({ TICKET: 0 });
  });

  it("doesn't resurrect a notification seen before its lookup finished", async () => {
    const event = markRealtimeEvent();
    await serverCount({ TICKET: 0 }); // mark-seen refetch lands first

    applyRealtimeNotification(queryClient, event, "TICKET");

    expect(count()).toEqual({ TICKET: 0 });
  });

  it("keeps the cached count when a count request fails", async () => {
    applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");
    const req = startCountRequest();
    req.fail(new Error("network"));
    await expect(req.landed).rejects.toThrow("network");

    expect(count()).toEqual({ TICKET: 6 });
  });

  it("asks the server when the type is unknown", () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    applyRealtimeNotification(queryClient, markRealtimeEvent(), undefined);

    expect(count()).toEqual({ TICKET: 5 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: unreadKey });
  });

  it("forgets unconfirmed increments on logout", async () => {
    const poll = startCountRequest();
    applyRealtimeNotification(queryClient, markRealtimeEvent(), "TICKET");
    resetUnreadCountSync();
    poll.respond({ TICKET: 2 });
    await poll.landed;

    expect(count()).toEqual({ TICKET: 2 });
  });
});
