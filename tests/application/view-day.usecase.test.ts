import { describe, expect, it } from "vitest";
import { logTask } from "@/application/log-task.usecase";
import { viewDay } from "@/application/view-day.usecase";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  return { taskRepository, taskLogRepository };
}

const timezone = "Europe/Paris";

describe("viewDay", () => {
  it("defaults to today when no day is given, with no adjacent days", async () => {
    const { taskRepository, taskLogRepository } = setup();

    const result = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now: new Date("2026-03-10T09:00:00Z"),
    });

    expect(result).toEqual({
      day: "2026-03-10",
      isToday: true,
      tasks: [],
      previousDay: null,
      nextDay: null,
    });
  });

  it("lists tasks logged on the viewed day, with tags", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-10T09:00:00Z");

    const logged = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      label: "Boire de l'eau #santé",
      now,
    });
    await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now,
    });

    const result = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now,
    });

    expect(result.tasks).toEqual([
      {
        taskId: logged.taskId,
        label: "Boire de l'eau",
        count: 2,
        latestLogId: expect.any(String),
        tags: ["santé"],
      },
    ]);
  });

  it("does not return another user's tasks", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-10T09:00:00Z");

    await logTask(taskRepository, taskLogRepository, {
      userId: "user-2",
      timezone,
      label: "Lire",
      now,
    });

    const result = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now,
    });

    expect(result.tasks).toEqual([]);
  });

  it("navigates to a specific past day and skips empty days when finding neighbors", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const today = new Date("2026-03-10T09:00:00Z");

    await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      label: "Lire",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      label: "Courir",
      now: new Date("2026-03-08T09:00:00Z"),
    });

    const viewedMar8 = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now: today,
      day: "2026-03-08",
    });
    expect(viewedMar8.isToday).toBe(false);
    expect(viewedMar8.tasks).toHaveLength(1);
    expect(viewedMar8.tasks[0].label).toBe("Courir");
    expect(viewedMar8.previousDay).toBe("2026-03-05");
    // Today has no logs but is still reachable as the forward endpoint.
    expect(viewedMar8.nextDay).toBe("2026-03-10");

    const viewedMar5 = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now: today,
      day: "2026-03-05",
    });
    expect(viewedMar5.previousDay).toBeNull();
    expect(viewedMar5.nextDay).toBe("2026-03-08");

    const viewedToday = await viewDay(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone,
      now: today,
    });
    expect(viewedToday.isToday).toBe(true);
    expect(viewedToday.previousDay).toBe("2026-03-08");
    expect(viewedToday.nextDay).toBeNull();
  });
});
