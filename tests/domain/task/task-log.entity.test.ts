import { describe, expect, it } from "vitest";
import { TaskLog } from "@/domain/task/task-log.entity";

describe("TaskLog.isDeletableAsOf", () => {
  it("is deletable while it still falls on the same day as now, in the user's timezone", () => {
    const log = TaskLog.create({
      id: "log-1",
      taskId: "task-1",
      loggedAt: new Date("2026-03-05T09:00:00Z"),
    });
    const laterSameDay = new Date("2026-03-05T20:00:00Z");
    expect(log.isDeletableAsOf(laterSameDay, "Europe/Paris")).toBe(true);
  });

  it("is not deletable once the day has rolled over in the user's timezone", () => {
    const log = TaskLog.create({
      id: "log-1",
      taskId: "task-1",
      loggedAt: new Date("2026-03-05T09:00:00Z"),
    });
    const nextDay = new Date("2026-03-06T09:00:00Z");
    expect(log.isDeletableAsOf(nextDay, "Europe/Paris")).toBe(false);
  });

  it("uses the user's timezone, not UTC, to decide the boundary", () => {
    const log = TaskLog.create({
      id: "log-1",
      taskId: "task-1",
      // 23:30 UTC on March 5th is already March 6th in Paris.
      loggedAt: new Date("2026-03-05T23:30:00Z"),
    });
    const stillMarch6InParis = new Date("2026-03-05T23:45:00Z");
    expect(log.isDeletableAsOf(stillMarch6InParis, "Europe/Paris")).toBe(true);
    expect(log.isDeletableAsOf(stillMarch6InParis, "America/Los_Angeles")).toBe(
      true
    );
  });
});
