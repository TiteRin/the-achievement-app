import { describe, expect, it } from "vitest";
import { dayKey } from "@/domain/task/day-key";

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
