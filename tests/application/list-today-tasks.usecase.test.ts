import { describe, expect, it } from "vitest";
import { logTask } from "@/application/log-task.usecase";
import { listTodayTasks } from "@/application/list-today-tasks.usecase";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  return { taskRepository, taskLogRepository };
}

describe("listTodayTasks", () => {
  it("returns an empty list when nothing was logged today", async () => {
    const { taskRepository, taskLogRepository } = setup();

    const result = await listTodayTasks(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(result).toEqual([]);
  });

  it("lists tasks logged today with their count and a deletable log id", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-05T09:00:00Z");

    await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now,
    });
    const secondLog = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now,
    });

    const result = await listTodayTasks(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      now,
    });

    expect(result).toEqual([
      {
        taskId: secondLog.taskId,
        label: "Boire de l'eau",
        countToday: 2,
        latestLogId: expect.any(String),
      },
    ]);
  });

  it("excludes tasks with no log today", async () => {
    const { taskRepository, taskLogRepository } = setup();

    await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-04T09:00:00Z"),
    });

    const result = await listTodayTasks(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(result).toEqual([]);
  });

  it("does not return another user's tasks", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-05T09:00:00Z");

    await logTask(taskRepository, taskLogRepository, {
      userId: "user-2",
      timezone: "Europe/Paris",
      label: "Lire",
      now,
    });

    const result = await listTodayTasks(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      now,
    });

    expect(result).toEqual([]);
  });
});
