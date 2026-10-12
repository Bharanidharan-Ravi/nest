import { describe, expect, it } from "vitest";
import { summarizeThreads } from "./useCheckedTicketList";

describe("summarizeThreads", () => {
  it("sums a ticket's thread minutes and keeps its latest thread", () => {
    const byTicket = summarizeThreads([
      { Issue_Id: "T1", ThreadId: 1, EventAt: "2026-10-12T10:00:00", Minutes: 90, Comment: "First" },
      { Issue_Id: "t1", ThreadId: 2, EventAt: "2026-10-12T15:00:00", Minutes: 60, Comment: "Closed" },
      // A close without a thread adds nothing
      { Issue_Id: "t1", ThreadId: null, EventAt: "2026-10-12T16:00:00", Minutes: null },
      { Issue_Id: "t2", ThreadId: 3, EventAt: "2026-10-12T09:00:00", Minutes: 30, Comment: "Meet" },
    ]);

    expect(byTicket.get("t1").minutes).toBe(150);
    expect(byTicket.get("t1").last.Comment).toBe("Closed");
    expect(byTicket.get("t2").minutes).toBe(30);
  });

  it("counts a thread once when it comes for several people", () => {
    const byTicket = summarizeThreads([
      { Issue_Id: "t1", ThreadId: 1, EmployeeId: "a", EventAt: "2026-10-12T10:00:00", Minutes: 60 },
      { Issue_Id: "t1", ThreadId: 1, EmployeeId: "b", EventAt: "2026-10-12T10:00:00", Minutes: 60 },
      { Issue_Id: "t1", ThreadId: 2, EmployeeId: "b", EventAt: "2026-10-12T12:00:00", Minutes: 45 },
    ]);

    expect(byTicket.get("t1").minutes).toBe(105);
    expect(byTicket.get("t1").last.ThreadId).toBe(2);
  });
});
