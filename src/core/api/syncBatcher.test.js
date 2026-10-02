import { beforeEach, describe, expect, it, vi } from "vitest";

const setError = vi.fn();
vi.mock("../state/useUIStore", () => ({ useUIStore: { getState: () => ({ setError }) } }));

const { createSyncBatcher } = await import("./syncBatcher");

const sync = (keys, params, config) => ({
  url: "/sync/v2",
  method: "POST",
  payload: { ConfigKeys: keys, ...(params && { Params: params }) },
  config,
});

const ok = (data) => ({ Ok: true, Data: data });

describe("createSyncBatcher", () => {
  let send;
  let execute;

  beforeEach(() => {
    setError.mockClear();
    send = vi.fn(async ({ payload }) =>
      Object.fromEntries((payload?.ConfigKeys ?? []).map((k) => [k, ok([k])])),
    );
    execute = createSyncBatcher(send, { windowMs: 0 });
  });

  it("merges concurrent calls and gives each caller only its keys", async () => {
    const [a, b] = await Promise.all([
      execute(sync(["BannerData"], { BannerData: { FromDate: null } }, { _silent: true })),
      execute(sync(["GetStaleTicketsForAssignee"], { GetStaleTicketsForAssignee: { Assignee_Id: "u1" } })),
    ]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].payload).toEqual({
      ConfigKeys: ["BannerData", "GetStaleTicketsForAssignee"],
      Params: {
        BannerData: { FromDate: null },
        GetStaleTicketsForAssignee: { Assignee_Id: "u1" },
      },
    });
    // Shows the loader if any caller wanted it
    expect(send.mock.calls[0][0].config._silent).toBe(false);
    expect(a).toEqual({ BannerData: ok(["BannerData"]) });
    expect(b).toEqual({ GetStaleTicketsForAssignee: ok(["GetStaleTicketsForAssignee"]) });
  });

  it("accepts lower-case configKeys/params", async () => {
    await Promise.all([
      execute({ ...sync([]), payload: { configKeys: ["BannerData"], params: { BannerData: { x: 1 } } } }),
      execute(sync(["AllHour"])),
    ]);
    expect(send.mock.calls[0][0].payload).toEqual({
      ConfigKeys: ["BannerData", "AllHour"],
      Params: { BannerData: { x: 1 } },
    });
  });

  it("sends a repeated key in its own request", async () => {
    await Promise.all([
      execute(sync(["TicketListV2"], { TicketListV2: { Filters: "a" } })),
      execute(sync(["TicketListV2"], { TicketListV2: { Filters: "b" } })),
    ]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("passes non-sync and lone requests through unchanged", async () => {
    const lone = sync(["AllHour"]);
    await execute(lone);
    await execute({ url: "/Chats", method: "GET" });
    expect(send.mock.calls[0][0]).toBe(lone);
    expect(send.mock.calls[1][0]).toEqual({ url: "/Chats", method: "GET" });
  });

  it("fails only the caller whose keys all failed", async () => {
    send.mockResolvedValueOnce({
      BannerData: ok([]),
      CheckedTickets: { Ok: false, Err: { C: "ACCESS_DENIED", M: "Not allowed" } },
    });
    const [banner, checked] = await Promise.allSettled([
      execute(sync(["BannerData"])),
      execute(sync(["CheckedTickets"])),
    ]);
    expect(banner.status).toBe("fulfilled");
    expect(checked.status).toBe("rejected");
    expect(checked.reason.message).toBe("Not allowed");
    expect(setError).toHaveBeenCalledWith("Not allowed");
  });

  it("rejects every caller when the merged request fails", async () => {
    send.mockRejectedValueOnce(new Error("network"));
    const results = await Promise.allSettled([execute(sync(["A"])), execute(sync(["B"]))]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
  });
});
