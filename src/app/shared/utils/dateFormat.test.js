import { describe, expect, it } from "vitest";
import { formatDate, formatDateRange, formatDateTime, formatTime } from "./dateFormat";

describe("dateFormat", () => {
  const stamp = new Date(2026, 9, 7, 14, 5, 9);

  it("shows date and time as DD/MM/YYYY HH:mm:ss", () => {
    expect(formatDateTime(stamp)).toBe("07/10/2026 14:05:09");
    expect(formatDateTime("2026-10-07T09:30:00")).toBe("07/10/2026 09:30:00");
  });

  it("reads day-first server strings without swapping day and month", () => {
    expect(formatDate("05/10/2026")).toBe("05/10/2026");
    expect(formatDate("05-10-2026")).toBe("05/10/2026");
    expect(formatDate("5 Oct 2026")).toBe("05/10/2026");
    expect(formatDateTime("05/10/2026 08:01:02")).toBe("05/10/2026 08:01:02");
  });

  it("shows times as HH:mm:ss", () => {
    expect(formatTime("9:30")).toBe("09:30:00");
    expect(formatTime("14:30:15")).toBe("14:30:15");
    expect(formatTime("2:15 PM")).toBe("14:15:00");
    expect(formatTime("12:00 AM")).toBe("00:00:00");
    expect(formatTime(stamp)).toBe("14:05:09");
  });

  it("falls back on empty or invalid values", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDate("", "")).toBe("");
    expect(formatDateTime("not a date", "—")).toBe("—");
  });

  it("formats ranges", () => {
    expect(formatDateRange("2026-10-07", "2026-10-07")).toBe("07/10/2026");
    expect(formatDateRange("2026-10-07", "2026-10-09")).toBe("07/10/2026 - 09/10/2026");
  });
});
