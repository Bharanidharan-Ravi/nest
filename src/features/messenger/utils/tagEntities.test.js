import { describe, expect, it } from "vitest";
import { normalizeMeeting, normalizePerson, normalizeProject, normalizeRepo, normalizeTicket } from "./tagEntities";

describe("normalizeTicket", () => {
  it("maps a ticket into a #tag entry keyed by Issue_Code, with the assignee as the notify target", () => {
    const assigneeId = "assignee-1";
    expect(
      normalizeTicket({ Issue_Id: "t1", Issue_Code: "TCK-1042", Title: "Fix the thing", Assignee_Id: assigneeId }),
    ).toEqual({
      entityType: "Ticket",
      entityId: "t1",
      displayText: "#TCK-1042",
      label: "TCK-1042 — Fix the thing",
      notifyUserId: assigneeId,
    });
  });

  it("falls back to just the code as the label when there's no title, and null when there's no assignee", () => {
    expect(normalizeTicket({ Issue_Id: "t2", Issue_Code: "TCK-2" })).toEqual({
      entityType: "Ticket",
      entityId: "t2",
      displayText: "#TCK-2",
      label: "TCK-2",
      notifyUserId: null,
    });
  });
});

describe("normalizeProject", () => {
  it("maps a project keyed by ProjectKey, with Responsible as the notify target", () => {
    expect(normalizeProject({ Id: "p1", ProjectKey: "PROJ", Project_Name: "The Project", Responsible: "owner-1" })).toEqual({
      entityType: "Project",
      entityId: "p1",
      displayText: "#PROJ",
      label: "The Project",
      notifyUserId: "owner-1",
    });
  });

  it("falls back to Project_Name for the display token and label when there's no ProjectKey", () => {
    const result = normalizeProject({ Id: "p2", Project_Name: "Untitled" });
    expect(result.displayText).toBe("#Untitled");
    expect(result.label).toBe("Untitled");
    expect(result.notifyUserId).toBeNull();
  });
});

describe("normalizeRepo", () => {
  it("maps a repo keyed by RepoKey, and never sets a notify target (no owner-user-id field exists)", () => {
    expect(normalizeRepo({ Repo_Id: "r1", RepoKey: "REPO", Title: "My Repo" })).toEqual({
      entityType: "Repo",
      entityId: "r1",
      displayText: "#REPO",
      label: "My Repo",
      notifyUserId: null,
    });
  });
});

describe("normalizeMeeting", () => {
  it("maps a meeting keyed by its Title (no code field exists), with Host_Id as the notify target", () => {
    expect(normalizeMeeting({ Meeting_Id: "m1", Title: "Sprint Planning", Host_Id: "host-1" })).toEqual({
      entityType: "Meeting",
      entityId: "m1",
      displayText: "#Sprint Planning",
      label: "Sprint Planning",
      notifyUserId: "host-1",
    });
  });
});

describe("normalizePerson", () => {
  it("maps an employee into an @tag entry with no notify target (the tag itself IS the target)", () => {
    expect(normalizePerson({ UserID: "u1", UserName: "bharanidharan" })).toEqual({
      entityType: "User",
      entityId: "u1",
      displayText: "@bharanidharan",
      label: "bharanidharan",
      notifyUserId: null,
    });
  });
});
