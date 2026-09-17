import { describe, expect, it } from "vitest";
import { splitTaggedText, tagPath } from "./tagText";

const ticketTag = (display = "#TCK-1042") => ({ EntityType: "Ticket", EntityId: "t1", DisplayText: display });
const userTag = (display = "@bharani") => ({ EntityType: "User", EntityId: "u1", DisplayText: display });

describe("splitTaggedText", () => {
  it("returns the whole text as one plain segment when there are no tags", () => {
    expect(splitTaggedText("just plain text", [])).toEqual([{ text: "just plain text" }]);
    expect(splitTaggedText("just plain text", undefined)).toEqual([{ text: "just plain text" }]);
  });

  it("splits text into plain and tagged segments around a single tag token", () => {
    const tag = ticketTag();
    const result = splitTaggedText("please check #TCK-1042 today", [tag]);
    expect(result).toEqual([{ text: "please check " }, { text: "#TCK-1042", tag }, { text: " today" }]);
  });

  it("handles a tag at the very start and very end of the text", () => {
    const tag = userTag();
    const result = splitTaggedText("@bharani", [tag]);
    expect(result).toEqual([{ text: "@bharani", tag }]);
  });

  it("splits multiple distinct tags in one message", () => {
    const t = ticketTag();
    const u = userTag();
    const result = splitTaggedText("@bharani please look at #TCK-1042", [u, t]);
    expect(result).toEqual([
      { text: "@bharani", tag: u },
      { text: " please look at " },
      { text: "#TCK-1042", tag: t },
    ]);
  });

  it("matches the longest token first so a shorter tag can't shadow one that contains it", () => {
    const short = ticketTag("#TCK-104");
    const long = ticketTag("#TCK-1042");
    const result = splitTaggedText("see #TCK-1042", [short, long]);
    // Must match the full "#TCK-1042" token, not "#TCK-104" followed by a stray "2"
    expect(result).toEqual([{ text: "see " }, { text: "#TCK-1042", tag: long }]);
  });

  it("highlights every occurrence when the same token appears more than once", () => {
    const tag = ticketTag();
    const result = splitTaggedText("#TCK-1042 and #TCK-1042 again", [tag]);
    expect(result).toEqual([
      { text: "#TCK-1042", tag },
      { text: " and " },
      { text: "#TCK-1042", tag },
      { text: " again" },
    ]);
  });

  it("ignores tags whose DisplayText doesn't actually appear in the text (e.g. the token was deleted before sending)", () => {
    const tag = ticketTag("#TCK-9999");
    expect(splitTaggedText("nothing to see here", [tag])).toEqual([{ text: "nothing to see here" }]);
  });

  it("skips tags with an empty DisplayText instead of matching everything", () => {
    const blank = { EntityType: "Ticket", EntityId: "t1", DisplayText: "" };
    expect(splitTaggedText("hello world", [blank])).toEqual([{ text: "hello world" }]);
  });
});

describe("tagPath", () => {
  it("links Ticket/Project/Repo tags to their detail pages", () => {
    expect(tagPath("Ticket", "abc")).toBe("/tickets/abc");
    expect(tagPath("Project", "abc")).toBe("/projects/abc");
    expect(tagPath("Repo", "abc")).toBe("/repository/abc");
  });

  it("sends Meeting tags to the meeting list (no per-meeting detail route exists)", () => {
    expect(tagPath("Meeting", "abc")).toBe("/meeting");
  });

  it("returns null for User tags (no clickable profile route exists)", () => {
    expect(tagPath("User", "abc")).toBeNull();
  });
});
