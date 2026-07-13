import { describe, expect, it } from "vitest";
import { dayKey, findAdjacentDayKey } from "@/domain/task/day-key";

describe("dayKey", () => {
  it("formats an instant as YYYY-MM-DD in the given timezone", () => {
    // 2026-03-05T12:00:00Z is unambiguously March 5th everywhere.
    expect(dayKey(new Date("2026-03-05T12:00:00Z"), "Europe/Paris")).toBe(
      "2026-03-05"
    );
  });

  it("rolls over to the next calendar day when local time has passed midnight", () => {
    // 00:30 in Paris (UTC+1 in March before DST) is already the next day.
    expect(dayKey(new Date("2026-03-05T23:30:00Z"), "Europe/Paris")).toBe(
      "2026-03-06"
    );
  });

  it("can land on a different day than UTC depending on the timezone", () => {
    // 2026-03-05T23:30:00Z is 2026-03-05T15:30 in Los Angeles (UTC-8), still the same day.
    expect(dayKey(new Date("2026-03-05T23:30:00Z"), "America/Los_Angeles")).toBe(
      "2026-03-05"
    );
    // But it's already 2026-03-06T00:30 in Paris.
    expect(dayKey(new Date("2026-03-05T23:30:00Z"), "Europe/Paris")).toBe(
      "2026-03-06"
    );
  });
});

describe("findAdjacentDayKey", () => {
  const days = ["2026-03-01", "2026-03-05", "2026-03-10"];

  it("finds the closest previous day", () => {
    expect(findAdjacentDayKey(days, "2026-03-10", "previous")).toBe("2026-03-05");
  });

  it("finds the closest next day", () => {
    expect(findAdjacentDayKey(days, "2026-03-01", "next")).toBe("2026-03-05");
  });

  it("returns null when there is no previous day", () => {
    expect(findAdjacentDayKey(days, "2026-03-01", "previous")).toBeNull();
  });

  it("returns null when there is no next day", () => {
    expect(findAdjacentDayKey(days, "2026-03-10", "next")).toBeNull();
  });

  it("skips over days not in the set (gaps are just absent, not empty placeholders)", () => {
    expect(findAdjacentDayKey(days, "2026-03-07", "previous")).toBe("2026-03-05");
    expect(findAdjacentDayKey(days, "2026-03-07", "next")).toBe("2026-03-10");
  });

  it("ignores a key equal to the reference itself", () => {
    expect(findAdjacentDayKey(days, "2026-03-05", "previous")).toBe("2026-03-01");
    expect(findAdjacentDayKey(days, "2026-03-05", "next")).toBe("2026-03-10");
  });

  it("works regardless of input order", () => {
    const shuffled = ["2026-03-10", "2026-03-01", "2026-03-05"];
    expect(findAdjacentDayKey(shuffled, "2026-03-10", "previous")).toBe("2026-03-05");
  });

  it("returns null for an empty set", () => {
    expect(findAdjacentDayKey([], "2026-03-05", "previous")).toBeNull();
  });
});
