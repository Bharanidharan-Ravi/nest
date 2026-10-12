import { describe, expect, it } from "vitest";
import { dueMeetings, phaseOf, reminderLabel, todaysMeetings } from "./reminders";

const at = (h, m) => new Date(2026, 9, 6, h, m); // Tue 6 Oct 2026
const meeting = (over = {}) => ({
  meeting_id: 1,
  title: "Sprint sync",
  status: "Active",
  recurrence_type: "ONETIME",
  Date: "2026-10-06",
  start_time: "10:00:00",
  end_time: "10:30:00",
  Organizer_Id: 7,
  Participants: JSON.stringify([{ participant_id: 42, participant_name: "Asha" }]),
  ...over,
});

describe("dueMeetings", () => {
  it("includes a meeting from 5 minutes before its start", () => {
    expect(dueMeetings([meeting()], at(9, 54))).toHaveLength(0);
    expect(dueMeetings([meeting()], at(9, 55))).toHaveLength(1);
    expect(dueMeetings([meeting()], at(10, 0))).toHaveLength(1);
  });

  it("keeps a running meeting but drops a finished one for a user who opens the app late", () => {
    const [running] = dueMeetings([meeting()], at(10, 12));
    expect(phaseOf(running, at(10, 12))).toBe("live");
    expect(reminderLabel(running, at(10, 12))).toBe("In progress, started 12 minutes ago");

    expect(dueMeetings([meeting()], at(11, 0))).toHaveLength(0);
  });

  it("moves through the phases as the clock runs", () => {
    const [item] = dueMeetings([meeting()], at(9, 56));
    expect(reminderLabel(item, at(9, 56))).toBe("Starts in 4 minutes");
    expect(phaseOf(item, at(10, 5))).toBe("live");
  });

  it("only includes meetings the user organizes or attends", () => {
    expect(dueMeetings([meeting()], at(9, 57), 7)).toHaveLength(1);
    expect(dueMeetings([meeting()], at(9, 57), 42)).toHaveLength(1);
    expect(dueMeetings([meeting()], at(9, 57), 99)).toHaveLength(0);
  });

  it("skips other days, cancelled and completed meetings", () => {
    expect(dueMeetings([meeting({ Date: "2026-10-07" })], at(9, 57))).toHaveLength(0);
    expect(dueMeetings([meeting({ status: "Cancelled" })], at(9, 57))).toHaveLength(0);
    expect(dueMeetings([meeting({ status: "Completed" })], at(11, 0))).toHaveLength(0);
  });

  it("only includes a weekly meeting on its weekdays", () => {
    const weekly = meeting({ recurrence_type: "WEEKLY", Date: "2026-10-01 - 2026-10-31", days_of_week: "0100000" });
    expect(dueMeetings([weekly], at(9, 57))).toHaveLength(0); // Monday only; today is Tuesday
    expect(dueMeetings([{ ...weekly, days_of_week: "0010000" }], at(9, 57))).toHaveLength(1);
  });

  it("falls back to the Time text and gives a per-day key", () => {
    const [found] = dueMeetings([meeting({ start_time: undefined, end_time: undefined, Time: "10:00 - 10:30" })], at(9, 57));
    expect(found.reminderKey).toBe("1|2026-10-06|600");
    expect(found.endsAt).toBe(630);
  });
});

describe("todaysMeetings", () => {
  it("counts today's open meetings of the user, at any time of day", () => {
    const list = [
      meeting(),
      meeting({ meeting_id: 2, Date: "2026-10-07" }),
      meeting({ meeting_id: 3, status: "Cancelled" }),
      meeting({ meeting_id: 4, status: "Completed" }),
      meeting({ meeting_id: 5, Organizer_Id: 8, Participants: "[]" }),
    ];
    expect(todaysMeetings(list, at(8, 0), 7).map((m) => m.meeting_id)).toEqual([1]);
    expect(todaysMeetings(list, at(23, 0), 7).map((m) => m.meeting_id)).toEqual([1]);
    expect(todaysMeetings(list, at(8, 0)).map((m) => m.meeting_id)).toEqual([1, 5]);
  });
});
