import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildTicketListPreview } from "./ticketListPreview";

const A = "aaaaaaaa-0000-0000-0000-000000000001";
const B = "bbbbbbbb-0000-0000-0000-000000000002";

const row = (id, extra = {}) => ({
  Issue_Id: id,
  Issue_Code: `T-${id}`,
  Title: `Ticket ${id}`,
  StatusId: 1,
  UpdatedAt: "2026-10-01T10:00:00",
  ...extra,
});

const lookup = { get: (type, id) => (type === "employee" && id === A ? { Team: 7 } : null) };

const clientWith = (pagesByRequest) => {
  const qc = new QueryClient();
  pagesByRequest.forEach(([request, rows]) =>
    qc.setQueryData(queryKeys.ticket.page(request), { pages: [rows], pageParams: [1] }),
  );
  return qc;
};

const preview = (qc, f, sort = [], repoId = null) =>
  buildTicketListPreview(qc, { repoId, f, sort, size: 20 }, { lookup, userId: A })?.pages[0];

describe("buildTicketListPreview", () => {
  it("filters every cached page of the same repo scope, one row per ticket", () => {
    const qc = clientWith([
      [{ repoId: null, f: { status: ["1"] } }, [row("1"), row("2", { StatusId: 2 })]],
      [{ repoId: null, f: { status: ["2"] } }, [row("2", { StatusId: 2 }), row("3", { StatusId: 2 })]],
      [{ repoId: "other", f: {} }, [row("4", { StatusId: 2 })]],
    ]);
    expect(preview(qc, { status: ["2"] }).map((r) => r.Issue_Id).sort()).toEqual(["2", "3"]);
  });

  it("matches csv id columns, flags, battery, search and owner team", () => {
    const qc = clientWith([
      [
        { repoId: null, f: {} },
        [
          row("1", { Label_Ids: "5,9", Assignee_Id: A, OverallPercentage: 10 }),
          row("2", { Assignee_Ids: B.toUpperCase(), WebResponse: true, OverallPercentage: 50 }),
        ],
      ],
    ]);
    const ids = (f) => preview(qc, f)?.map((r) => r.Issue_Id) ?? [];
    expect(ids({ label: ["9"] })).toEqual(["1"]);
    expect(ids({ member: [B] })).toEqual(["2"]);
    expect(ids({ flag: ["allFlags"] })).toEqual(["2"]);
    expect(ids({ flag: ["webResponse"] })).toEqual(["2"]);
    expect(ids({ battery: ["0-20"] })).toEqual(["1"]);
    expect(ids({ search: ["T-2"] })).toEqual(["2"]);
    expect(ids({ team: ["7"] })).toEqual(["1"]);
  });

  it("sorts like the SP (flagged first, then updatedAt desc)", () => {
    const qc = clientWith([
      [
        { repoId: null, f: {} },
        [
          row("1", { UpdatedAt: "2026-10-01" }),
          row("2", { UpdatedAt: "2026-10-03" }),
          row("3", { UpdatedAt: "2026-09-01", PriorityRequest: true }),
        ],
      ],
    ]);
    const sort = [
      { key: "flagsFirst", dir: "desc" },
      { key: "updatedAt", dir: "desc" },
    ];
    expect(preview(qc, {}, sort).map((r) => r.Issue_Id)).toEqual(["3", "2", "1"]);
  });

  it("gives no preview for an unknown filter key or no match", () => {
    const qc = clientWith([[{ repoId: null, f: {} }, [row("1")]]]);
    expect(preview(qc, { somethingNew: ["x"] })).toBeUndefined();
    expect(preview(qc, { status: ["9"] })).toBeUndefined();
  });
});
