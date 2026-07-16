export type StreakUnit = "day" | "week" | "month";
export type Streak = { value: number; unit: StreakUnit };

function toEpochDay(dayKeyValue: string): number {
  return Math.floor(new Date(`${dayKeyValue}T00:00:00Z`).getTime() / 86_400_000);
}

function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function estimateCadence(dayKeys: string[]): { intervalDays: number } {
  const days = [...new Set(dayKeys)].map(toEpochDay).sort((a, b) => a - b);
  if (days.length < 2) return { intervalDays: 1 };

  const gaps = days.slice(1).map((day, index) => day - days[index]);
  return { intervalDays: median(gaps) };
}

// "week" buckets must be aligned to real Monday-start calendar weeks, not
// an arbitrary fixed-size 7-day window anchored at the Unix epoch — an
// epoch-anchored window's boundary falls on a different weekday than a
// real week's, so two logs within the same real week (e.g. Monday and
// Thursday) can straddle that boundary and get miscounted as two separate,
// merely-adjacent buckets instead of one, inflating a multi-log-per-week
// task's tail run by a phantom extra bucket. Snapping each date to its own
// Monday first (via ISO day-of-week, Mon=0..Sun=6) before dividing by 7
// guarantees every date within the same real week lands in the same
// bucket, and consecutive real weeks always differ by exactly 1.
// Months use real calendar months since they're not fixed-length and users
// do implicitly think in terms of "this month" vs "last month".
function toBucket(epochDay: number, unit: StreakUnit): number {
  if (unit === "day") return epochDay;
  const date = new Date(epochDay * 86_400_000);
  if (unit === "week") {
    const isoDayOfWeek = (date.getUTCDay() + 6) % 7;
    return Math.floor((epochDay - isoDayOfWeek) / 7);
  }
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function uniqueSortedBuckets(days: number[], unit: StreakUnit): number[] {
  return [...new Set(days.map((day) => toBucket(day, unit)))].sort((a, b) => a - b);
}

// The run of consecutive buckets ending at the most recent one — this is
// what makes the streak "anchored to now" rather than a frozen historical
// max: it always reflects whether the user is *currently* keeping up
// whatever rhythm this granularity represents.
function tailRun(buckets: number[]): number {
  if (buckets.length === 0) return 0;
  let run = 1;
  for (let i = buckets.length - 1; i > 0; i--) {
    if (buckets[i] === buckets[i - 1] + 1) run++;
    else break;
  }
  return run;
}

// Computes the tail run independently at each granularity and reports
// whichever is largest — a weekly-rhythm task naturally wins on "week"
// because its day-level tail run never grows past 1 (no two logs ever land
// on adjacent calendar days), with no need to first prove the *entire*
// history is gap-free at that granularity. Ties prefer the finer unit: "1
// day" and "1 week" carry the same value, and the finer one is more
// precise for no cost in magnitude. Always non-zero for any task with at
// least one log, since every unit's tail run is at least 1 in that case.
export function adaptiveStreak(dayKeys: string[]): Streak {
  const days = [...new Set(dayKeys)].map(toEpochDay).sort((a, b) => a - b);
  if (days.length === 0) return { value: 0, unit: "day" };

  const candidates = (["day", "week", "month"] as const).map((unit) => ({
    unit,
    value: tailRun(uniqueSortedBuckets(days, unit)),
  }));

  return candidates.reduce((best, candidate) =>
    candidate.value > best.value ? candidate : best
  );
}
