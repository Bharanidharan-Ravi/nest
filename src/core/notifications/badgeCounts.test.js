import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "../query/queryKeys";

const executeApi = vi.fn();
vi.mock("../api/executor", () => ({ executeApi: (...args) => executeApi(...args) }));

const { queryClient } = await import("../api/queryClient");
const { fetchCount } = await import("./badgeCounts");

const response = {
  UnreadCount: { Ok: true, Data: { TICKET: 2 } },
  LeaveRequestCount: { Ok: true, Data: 3 },
  GetStaleTicketsForAssignee: { Ok: true, Data: [{ Issue_Id: "a" }] },
};

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("badgeCounts", () => {
  beforeEach(async () => {
    await nextTick();
    executeApi.mockReset();
    queryClient.clear();
  });

  it("shares one request between calls in the same tick", async () => {
    executeApi.mockResolvedValue(response);

    const [unread, leave, stale] = await Promise.all([
      fetchCount("UnreadCount"),
      fetchCount("LeaveRequestCount"),
      fetchCount("GetStaleTicketsForAssignee"),
    ]);

    expect(executeApi).toHaveBeenCalledTimes(1);
    expect(executeApi.mock.calls[0][0].url).toBe("/notification/counts");
    expect(unread).toEqual({ TICKET: 2 });
    expect(leave).toBe(3);
    expect(stale).toEqual([{ Issue_Id: "a" }]);
  });

  it("doesn't reuse a request from an earlier tick", async () => {
    executeApi.mockResolvedValue(response);

    await fetchCount("LeaveRequestCount");
    await nextTick();
    await fetchCount("LeaveRequestCount");

    expect(executeApi).toHaveBeenCalledTimes(2);
  });

  it("refreshes sibling caches, but never the tracked unread count", async () => {
    executeApi.mockResolvedValue(response);

    await fetchCount("LeaveRequestCount");

    expect(queryClient.getQueryData(queryKeys.notification.staleTickets())).toEqual([{ Issue_Id: "a" }]);
    expect(queryClient.getQueryData(queryKeys.notification.unreadCount())).toBeUndefined();
  });

  it("fails only the part that failed", async () => {
    executeApi.mockResolvedValue({
      ...response,
      LeaveRequestCount: { Ok: false, Err: { C: "LOAD_FAILED", M: "db down" } },
    });

    await expect(fetchCount("LeaveRequestCount")).rejects.toThrow("db down");
    await nextTick();
    await expect(fetchCount("GetStaleTicketsForAssignee")).resolves.toEqual([{ Issue_Id: "a" }]);
  });
});
