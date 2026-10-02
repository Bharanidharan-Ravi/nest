import { describe, expect, it } from "vitest";
import {
  MAIN_ASSIGNEE_TYPE,
  normalizeTicket,
  normalizeTicketListRow,
} from "./normalizer";

// Same contract as useMasterLookup(): case-insensitive id → master item
const makeLookup = (masters) => ({
  get: (key, id) =>
    id == null
      ? null
      : (masters[key] ?? []).find(
          (m) => String(m.id).toLowerCase() === String(id).toLowerCase(),
        ) ?? null,
});

const lookup = makeLookup({
  employee: [
    { id: "aaaa", name: "Owner One", Team: 1 },
    { id: "bbbb", name: "Helper Two", Team: 2 },
  ],
  team: [
    { id: 1, name: "Functional" },
    { id: 2, name: "Technical" },
  ],
  label: [{ id: 10, name: "Development", color: "#048a35" }],
  repo: [{ id: "rrrr", name: "Tunga Aerospace" }],
  status: [{ id: 5, name: "In Development" }],
});

const row = {
  Issue_Id: "t1",
  Issue_Code: "T488",
  Title: "Title",
  StatusId: 5,
  Assignee_Id: "AAAA",
  CreatedBy: "bbbb",
  TotalConsumeMinutes: 245,
  TeamConsumeMinutes: 185,
  Label_Ids: "10",
  Assignee_Ids: "bbbb,aaaa",
  Handler_Ids: "rrrr,00000000-0000-0000-0000-000000000000",
};

describe("normalizeTicketListRow", () => {
  it("maps ids to master names in the normalizeTicket shape", () => {
    const t = normalizeTicketListRow(row, lookup);

    expect(t.id).toBe("t1");
    expect(t.ticketKey).toBe("T488");
    expect(t.statusId).toBe(5);
    expect(t.status).toBe("In Development");
    expect(t.assignedTo).toBe("AAAA");
    expect(t.assginedName).toBe("Owner One");
    expect(t.teamId).toBe(1);
    expect(t.teamName).toBe("Functional");
    expect(t.ticketCreater).toBe("Helper Two");
    expect(t.EntireWorkingTime).toBe("4:05");
    expect(t.teamWorkingTime).toBe("3:05");
    expect(t.label).toEqual([
      { LABEL_ID: 10, LABEL_TITLE: "Development", LABEL_COLOR: "#048a35" },
    ]);
    expect(t.handlers).toEqual([
      { id: "rrrr", name: "Tunga Aerospace" },
      { id: "00000000-0000-0000-0000-000000000000", name: "WorkGlow Solutions" },
    ]);
  });

  it("puts the owner first as main assignee, then work-stream assignees", () => {
    const t = normalizeTicketListRow(row, lookup);

    expect(t.multiAssignees.map((a) => [a.Assignee_Name, a.Assignee_Type])).toEqual([
      ["Owner One", MAIN_ASSIGNEE_TYPE],
      ["Helper Two", "Assignee"],
      ["Owner One", "Assignee"],
    ]);
    expect(t.multiAssignees[1].Assignee_TeamName).toBe("Technical");
  });

  it("falls back to all logged hours when the API has no TeamConsumeMinutes", () => {
    const { TeamConsumeMinutes, ...oldRow } = row;
    expect(normalizeTicketListRow(oldRow, lookup).teamWorkingTime).toBe("4:05");
  });

  it("does not crash on empty ids or ids missing from the masters", () => {
    const t = normalizeTicketListRow(
      { Issue_Id: "t2", Assignee_Id: null, Label_Ids: "99", TotalConsumeMinutes: null, TeamConsumeMinutes: 0 },
      lookup,
    );

    expect(t.multiAssignees).toEqual([]);
    expect(t.assginedName).toBeUndefined();
    expect(t.EntireWorkingTime).toBeNull();
    expect(t.teamWorkingTime).toBeNull();
    expect(t.label).toEqual([{ LABEL_ID: 99, LABEL_TITLE: undefined, LABEL_COLOR: undefined }]);
    expect(t.handlers).toEqual([]);
  });
});

describe("normalizeTicket handlers", () => {
  it("parses Move_toJson into handlers", () => {
    expect(
      normalizeTicket({ Move_toJson: '[{"Move_to":"R1","Title":"Melwa"}]' }).handlers,
    ).toEqual([{ id: "R1", name: "Melwa" }]);
    expect(normalizeTicket({}).handlers).toEqual([]);
  });
});
