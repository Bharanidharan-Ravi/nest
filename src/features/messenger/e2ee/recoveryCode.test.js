import { describe, expect, it } from "vitest";
import {
  RECOVERY_ALPHABET,
  RECOVERY_CODE_LENGTH,
  formatRecoveryCode,
  generateRecoveryCode,
  isValidRecoveryCode,
  normalizeRecoveryCode,
} from "./recoveryCode";

describe("generateRecoveryCode", () => {
  it("produces a 24-character code grouped into dashed blocks of 4", () => {
    const code = generateRecoveryCode();

    expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/);
    expect(normalizeRecoveryCode(code)).toHaveLength(RECOVERY_CODE_LENGTH);
  });

  it("only uses the Crockford alphabet (no I, L, O, U)", () => {
    for (let i = 0; i < 50; i++) {
      const normalized = normalizeRecoveryCode(generateRecoveryCode());
      expect([...normalized].every((c) => RECOVERY_ALPHABET.includes(c))).toBe(true);
    }
    expect(RECOVERY_ALPHABET).not.toMatch(/[ILOU]/);
  });

  it("generates different codes each time", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRecoveryCode()));
    expect(codes.size).toBe(20);
  });

  it("always validates as generated", () => {
    for (let i = 0; i < 20; i++) {
      expect(isValidRecoveryCode(generateRecoveryCode())).toBe(true);
    }
  });
});

describe("normalizeRecoveryCode", () => {
  it("strips dashes and whitespace and upper-cases", () => {
    expect(normalizeRecoveryCode("wgn2-8f9k-m3np-7x4r-29tv-b8cq")).toBe("WGN28F9KM3NP7X4R29TVB8CQ");
    expect(normalizeRecoveryCode("  wgn2 8f9k m3np 7x4r 29tv b8cq  ")).toBe(
      "WGN28F9KM3NP7X4R29TVB8CQ",
    );
  });

  it("maps look-alike characters: I/L -> 1, O -> 0", () => {
    expect(normalizeRecoveryCode("ILOILO")).toBe("110110");
    expect(normalizeRecoveryCode("iloILO")).toBe("110110");
  });

  it("is idempotent — normalizing an already-normalized code is a no-op", () => {
    const code = generateRecoveryCode();
    const once = normalizeRecoveryCode(code);
    expect(normalizeRecoveryCode(once)).toBe(once);
  });

  it("handles null/undefined/empty without throwing", () => {
    expect(normalizeRecoveryCode(undefined)).toBe("");
    expect(normalizeRecoveryCode(null)).toBe("");
    expect(normalizeRecoveryCode("")).toBe("");
  });
});

describe("formatRecoveryCode", () => {
  it("groups a normalized code into dashed blocks of 4", () => {
    expect(formatRecoveryCode("WGN28F9KM3NP7X4R29TVB8CQ")).toBe(
      "WGN2-8F9K-M3NP-7X4R-29TV-B8CQ",
    );
  });

  it("re-normalizes messy input before grouping", () => {
    expect(formatRecoveryCode("wgn2 8f9k-m3np7x4r29tvb8cq")).toBe(
      "WGN2-8F9K-M3NP-7X4R-29TV-B8CQ",
    );
  });
});

describe("isValidRecoveryCode", () => {
  it("accepts a well-formed code in any casing/spacing", () => {
    expect(isValidRecoveryCode("WGN2-8F9K-M3NP-7X4R-29TV-B8CQ")).toBe(true);
    expect(isValidRecoveryCode("wgn28f9km3np7x4r29tvb8cq")).toBe(true);
    expect(isValidRecoveryCode(" wgn2 8f9k m3np 7x4r 29tv b8cq ")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidRecoveryCode("WGN2-8F9K")).toBe(false);
    expect(isValidRecoveryCode("WGN2-8F9K-M3NP-7X4R-29TV-B8CQ-EXTRA")).toBe(false);
    expect(isValidRecoveryCode("")).toBe(false);
  });

  it("rejects characters outside the Crockford alphabet", () => {
    // I, L, O, U are not in the alphabet and normalizeRecoveryCode only remaps I/L/O — U survives
    expect(isValidRecoveryCode("UUUU-UUUU-UUUU-UUUU-UUUU-UUUU")).toBe(false);
  });

  it("rejects garbage input types without throwing", () => {
    expect(isValidRecoveryCode(undefined)).toBe(false);
    expect(isValidRecoveryCode(null)).toBe(false);
    expect(isValidRecoveryCode(12345)).toBe(false);
  });
});
