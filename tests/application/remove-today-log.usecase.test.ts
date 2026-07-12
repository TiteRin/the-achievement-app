import { describe, expect, it } from "vitest";
import { logTask } from "@/application/log-task.usecase";
import {
  removeTodayLog,
  TaskLogNotFoundError,
  TaskLogNotOwnedError,
  TaskLogNotDeletableError,
} from "@/application/remove-today-log.usecase";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  return { taskRepository, taskLogRepository };
}

describe("removeTodayLog", () => {
  it("deletes a log that belongs to the requesting user and is still today", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-05T09:00:00Z");
    const logged = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now,
    });

    await removeTodayLog(taskRepository, taskLogRepository, {
      userId: "user-1",
      logId: logged.logId,
      timezone: "Europe/Paris",
      now,
    });

    expect(await taskLogRepository.findById(logged.logId)).toBeNull();
  });

  it("throws when the log does not exist", async () => {
    const { taskRepository, taskLogRepository } = setup();

    await expect(
      removeTodayLog(taskRepository, taskLogRepository, {
        userId: "user-1",
        logId: "unknown-log",
        timezone: "Europe/Paris",
        now: new Date(),
      })
    ).rejects.toThrow(TaskLogNotFoundError);
  });

  it("throws when the log belongs to another user's task", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const now = new Date("2026-03-05T09:00:00Z");
    const logged = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now,
    });

    await expect(
      removeTodayLog(taskRepository, taskLogRepository, {
        userId: "user-2",
        logId: logged.logId,
        timezone: "Europe/Paris",
        now,
      })
    ).rejects.toThrow(TaskLogNotOwnedError);
  });

  it("throws when the log is no longer today", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const logged = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-04T09:00:00Z"),
    });

    await expect(
      removeTodayLog(taskRepository, taskLogRepository, {
        userId: "user-1",
        logId: logged.logId,
        timezone: "Europe/Paris",
        now: new Date("2026-03-05T09:00:00Z"),
      })
    ).rejects.toThrow(TaskLogNotDeletableError);
  });
});
