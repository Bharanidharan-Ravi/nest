import { describe, expect, it } from "vitest";
import { detectTrigger } from "./tagTrigger";

describe("detectTrigger", () => {
  it("detects an @ trigger at the start of the text", () => {
    expect(detectTrigger("@bha", 4)).toEqual({ type: "@", query: "bha", start: 0 });
  });

  it("detects a # trigger after other text, separated by a space", () => {
    const value = "check #TCK";
    expect(detectTrigger(value, value.length)).toEqual({ type: "#", query: "TCK", start: 6 });
  });

  it("detects a trigger with an empty query (just typed the trigger character)", () => {
    expect(detectTrigger("hello @", 7)).toEqual({ type: "@", query: "", start: 6 });
  });

  it("returns null when there's no trigger character before the cursor", () => {
    expect(detectTrigger("just plain text", 16)).toBeNull();
  });

  it("returns null once a space follows the trigger's query", () => {
    expect(detectTrigger("@bharani hello", 14)).toBeNull();
  });

  it("returns null when the trigger is preceded by a non-whitespace character (email-like text)", () => {
    expect(detectTrigger("foo@bar", 7)).toBeNull();
  });

  it("uses the cursor position, not the end of the string, so trailing text after the cursor is ignored", () => {
    const value = "@bha and more text";
    expect(detectTrigger(value, 4)).toEqual({ type: "@", query: "bha", start: 0 });
  });

  it("re-triggers on a second # later in the same message", () => {
    const value = "#TCK-1 and also #TCK-2";
    expect(detectTrigger(value, value.length)).toEqual({ type: "#", query: "TCK-2", start: 16 });
  });

  it("finds no trigger when a second trigger character follows the first with no whitespace between them", () => {
    // A known limitation: only a whitespace boundary (or start-of-text) opens a trigger, so
    // "@foo#" has no whitespace before the "#" and nothing detects it.
    expect(detectTrigger("@foo#", 5)).toBeNull();
  });
});
