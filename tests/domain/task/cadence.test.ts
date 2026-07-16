import { describe, expect, it } from "vitest";
import { adaptiveStreak, estimateCadence } from "@/domain/task/cadence";

describe("estimateCadence", () => {
  it("returns a 1-day default when there's not enough history to compute a gap", () => {
    expect(estimateCadence([])).toEqual({ intervalDays: 1 });
    expect(estimateCadence(["2026-01-01"])).toEqual({ intervalDays: 1 });
  });

  it("estimates a daily cadence from consecutive days", () => {
    expect(
      estimateCadence(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"])
    ).toEqual({ intervalDays: 1 });
  });

  it("estimates a weekly cadence from 7-day gaps", () => {
    expect(estimateCadence(["2026-01-01", "2026-01-08", "2026-01-15"])).toEqual({
      intervalDays: 7,
    });
  });

  it("uses the median so a single outlier gap doesn't skew the estimate", () => {
    // Gaps are 1, 1, 10 — median (sorted [1,1,10], middle value) is 1, not
    // pulled toward the one-off 10-day gap the way a mean would be.
    expect(
      estimateCadence(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-13"])
    ).toEqual({ intervalDays: 1 });
  });

  it("ignores input order and duplicate entries", () => {
    expect(
      estimateCadence(["2026-01-08", "2026-01-01", "2026-01-01", "2026-01-15"])
    ).toEqual({ intervalDays: 7 });
  });
});

describe("adaptiveStreak", () => {
  it("returns a zero-value day streak for no history at all", () => {
    expect(adaptiveStreak([])).toEqual({ value: 0, unit: "day" });
  });

  it("reports 1 day for a single log", () => {
    expect(adaptiveStreak(["2026-01-01"])).toEqual({ value: 1, unit: "day" });
  });

  it("breaks a tie between equal-value units in favor of the smallest one", () => {
    // A single log has a tail run of exactly 1 at every granularity (day,
    // week, and month all contain that one entry) — day must win the tie,
    // not whichever unit happens to be checked first for some other reason.
    const result = adaptiveStreak(["2026-06-15"]);
    expect(result.value).toBe(1);
    expect(result.unit).toBe("day");
  });

  it("reports a day streak when every calendar day in the history is logged", () => {
    expect(
      adaptiveStreak([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
      ])
    ).toEqual({ value: 5, unit: "day" });
  });

  it("reports a week streak for a task logged exactly once a week, even though it never has two consecutive days", () => {
    // Consecutive entries exactly 7 days apart always land in adjacent
    // week-buckets (floor((n+7)/7) === floor(n/7)+1 for any n), regardless
    // of which day of the week they fall on — so this is true for any
    // 4-week span, not just this specific date. The day-granularity tail
    // run never grows past 1 since no two logs are ever on adjacent days.
    expect(
      adaptiveStreak(["2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22"])
    ).toEqual({ value: 4, unit: "week" });
  });

  it("reports a month streak when logs land once a month with no weekly or daily rhythm", () => {
    expect(
      adaptiveStreak(["2026-01-15", "2026-02-15", "2026-03-15"])
    ).toEqual({ value: 3, unit: "month" });
  });

  it("prefers a genuine day-level streak over an incidental month-bucket adjacency", () => {
    // Jan 1 is isolated (3 months back), but Apr 1-2 are two literal
    // consecutive days — day's tail run (2) beats month's tail run (1,
    // since Jan and Apr aren't adjacent months), even though "January and
    // April both have a log" might look month-relevant at a glance.
    expect(adaptiveStreak(["2026-01-01", "2026-04-01", "2026-04-02"])).toEqual({
      value: 2,
      unit: "day",
    });
  });

  it("ignores input order and duplicate entries", () => {
    const ordered = adaptiveStreak([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    const shuffledWithDupes = adaptiveStreak([
      "2026-01-02",
      "2026-01-01",
      "2026-01-03",
      "2026-01-02",
    ]);
    expect(shuffledWithDupes).toEqual(ordered);
  });
});

// These scenarios are deliberately redundant with the more surgical tests
// above — they exist to document, in plain language, what streak a
// realistic logging pattern produces, so the behavior can be understood
// without reading the implementation.
describe("adaptiveStreak — plain-language scenarios (documentation)", () => {
  it("Given a task logged once a day for 10 days straight, then the streak is 10 days", () => {
    const tenDaysInARow = [
      "2026-02-01",
      "2026-02-02",
      "2026-02-03",
      "2026-02-04",
      "2026-02-05",
      "2026-02-06",
      "2026-02-07",
      "2026-02-08",
      "2026-02-09",
      "2026-02-10",
    ];
    expect(adaptiveStreak(tenDaysInARow)).toEqual({ value: 10, unit: "day" });
  });

  it("Given a task logged twice a week (Monday and Thursday) for 4 weeks, then the streak is 4 weeks", () => {
    const twiceAWeekForFourWeeks = [
      "2026-01-05",
      "2026-01-08", // week 1: Mon, Thu
      "2026-01-12",
      "2026-01-15", // week 2
      "2026-01-19",
      "2026-01-22", // week 3
      "2026-01-26",
      "2026-01-29", // week 4
    ];
    expect(adaptiveStreak(twiceAWeekForFourWeeks)).toEqual({
      value: 4,
      unit: "week",
    });
  });

  it("Given a task logged once a month for 6 months, then the streak is 6 months", () => {
    const onceAMonthForSixMonths = [
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
      "2026-05-15",
      "2026-06-15",
    ];
    expect(adaptiveStreak(onceAMonthForSixMonths)).toEqual({
      value: 6,
      unit: "month",
    });
  });

  it("Given a task logged daily for 10 days then missed one day, then the streak still reflects the still-consecutive tail", () => {
    // The single miss breaks the day-level chain, but the last 4 days are
    // still an unbroken run — day still wins here (4) since week's own tail
    // run over this short a span never grows large enough to overtake it.
    const tenDaysThenAGapThenFourMore = [
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
      // 2026-03-11 missed
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ];
    expect(adaptiveStreak(tenDaysThenAGapThenFourMore)).toEqual({
      value: 4,
      unit: "day",
    });
  });
});
