import { describe, expect, it } from "vitest";
import { birthMonthDay, birthdaysOn, isBirthdayOn } from "./birthday";

const oct7 = new Date(2026, 9, 7, 9, 0); // Wed 7 Oct 2026
const emp = (over = {}) => ({ id: 1, name: "Bharani", isActive: true, Role: 2, DoB: "1998-10-07", ...over });

describe("birthMonthDay", () => {
  it("reads ISO, ISO timestamp and DD-MM-YYYY dates without a timezone shift", () => {
    expect(birthMonthDay("1998-10-07")).toEqual({ month: 10, day: 7 });
    expect(birthMonthDay("1998-10-07T00:00:00Z")).toEqual({ month: 10, day: 7 });
    expect(birthMonthDay("07-10-1998")).toEqual({ month: 10, day: 7 });
  });

  it("returns null for an empty or invalid DoB", () => {
    expect(birthMonthDay(null)).toBeNull();
    expect(birthMonthDay("")).toBeNull();
    expect(birthMonthDay("not a date")).toBeNull();
  });
});

describe("isBirthdayOn", () => {
  it("matches month and day, ignoring the year", () => {
    expect(isBirthdayOn("1998-10-07", oct7)).toBe(true);
    expect(isBirthdayOn("1998-10-08", oct7)).toBe(false);
    expect(isBirthdayOn("1998-07-10", oct7)).toBe(false);
  });

  it("celebrates 29 Feb on 28 Feb in non-leap years only", () => {
    expect(isBirthdayOn("2000-02-29", new Date(2026, 1, 28))).toBe(true);
    expect(isBirthdayOn("2000-02-29", new Date(2028, 1, 28))).toBe(false);
    expect(isBirthdayOn("2000-02-29", new Date(2028, 1, 29))).toBe(true);
  });
});

describe("birthdaysOn", () => {
  it("keeps active Admins and Employees with a birthday today", () => {
    const list = [emp(), emp({ id: 2, Role: 1 }), emp({ id: 3, Role: 4 }), emp({ id: 4, DoB: "1998-01-01" })];
    expect(birthdaysOn(list, oct7).map((e) => e.id)).toEqual([1, 2, 3]);
  });

  it("drops inactive employees and Client logins", () => {
    expect(birthdaysOn([emp({ isActive: false }), emp({ Role: 3 })], oct7)).toEqual([]);
  });
});
