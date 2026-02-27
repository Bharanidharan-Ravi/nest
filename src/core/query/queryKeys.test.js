import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

describe("queryKeys.ticket.list", () => {
  it("builds a scoped key with repoId and projectId", () => {
    expect(
      queryKeys.ticket.list({ repoId: "repo-1", projectId: "proj-1" })
    ).toEqual(["ticket", "list", "repo-1", "proj-1"]);
  });

  it("falls back to global/all when scope values are missing", () => {
    expect(queryKeys.ticket.list({})).toEqual(["ticket", "list", "global", "all"]);
  });

  it("keeps backward compatibility with legacy repoId string input", () => {
    expect(queryKeys.ticket.list("repo-legacy")).toEqual([
      "ticket",
      "list",
      "repo-legacy",
      "all",
    ]);
  });
});
