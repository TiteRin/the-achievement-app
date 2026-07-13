export function dayKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Day-keys are "YYYY-MM-DD" strings, which sort correctly with plain string
// comparison — no date parsing needed here.
export function findAdjacentDayKey(
  dayKeys: string[],
  reference: string,
  direction: "previous" | "next"
): string | null {
  const sorted = [...dayKeys].sort();

  if (direction === "previous") {
    return sorted.filter((key) => key < reference).at(-1) ?? null;
  }
  return sorted.find((key) => key > reference) ?? null;
}
