import { describe, expect, it } from "vitest";
import { getUnreadTotal, incrementUnreadCount } from "./unreadCount";
import { formatNotificationTitle } from "./useDocumentTitle";

describe("getUnreadTotal", () => {
  it("sums only the clearable notification types", () => {
    expect(getUnreadTotal({ TICKET: 3, MEETING: 1, LEAVE_REQUEST: 2, THREAD: 9 })).toBe(6);
  });

  it("treats missing or malformed data as zero", () => {
    expect(getUnreadTotal(undefined)).toBe(0);
    expect(getUnreadTotal(null)).toBe(0);
    expect(getUnreadTotal({})).toBe(0);
  });
});

describe("incrementUnreadCount", () => {
  it("bumps the bucket for the notification's entity type", () => {
    expect(incrementUnreadCount({ TICKET: 2, MEETING: 1 }, "ticket")).toEqual({
      TICKET: 3,
      MEETING: 1,
    });
  });

  it("creates the bucket when it doesn't exist yet", () => {
    expect(incrementUnreadCount({ TICKET: 2 }, "MEETING")).toEqual({ TICKET: 2, MEETING: 1 });
  });

  it("leaves data untouched when the type is unknown", () => {
    const data = { TICKET: 2 };
    expect(incrementUnreadCount(data, undefined)).toBe(data);
  });
});

describe("formatNotificationTitle", () => {
  it("prefixes the unread count", () => {
    expect(formatNotificationTitle(1, "MyApp")).toBe("(1) MyApp");
    expect(formatNotificationTitle(10, "MyApp")).toBe("(10) MyApp");
  });

  it("returns the plain title when nothing is unread", () => {
    expect(formatNotificationTitle(0, "MyApp")).toBe("MyApp");
  });

  it("caps very large counts", () => {
    expect(formatNotificationTitle(150, "MyApp")).toBe("(99+) MyApp");
  });
});
