import { describe, expect, it } from "vitest";
import { TaskLoggingService } from "@/domain/task/task-logging.service";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  const service = new TaskLoggingService(taskRepository, taskLogRepository);
  return { service, taskRepository, taskLogRepository };
}

describe("TaskLoggingService.logTask", () => {
  it("creates a new task on the first log", async () => {
    const { service, taskRepository } = setup();

    const result = await service.logTask({
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(taskRepository.tasks).toHaveLength(1);
    expect(result.task.label).toBe("Boire de l'eau");
    expect(result.countToday).toBe(1);
  });

  it("reuses the existing task when the same label is logged again the same day", async () => {
    const { service, taskRepository, taskLogRepository } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const second = await service.logTask({
      userId: "user-1",
      timezone,
      label: "  boire   de l'eau ",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(taskRepository.tasks).toHaveLength(1);
    expect(taskLogRepository.logs).toHaveLength(2);
    expect(second.countToday).toBe(2);
  });

  it("does not count logs from a previous day towards today's count", async () => {
    const { service } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-04T09:00:00Z"),
    });
    const today = await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(today.countToday).toBe(1);
  });

  it("keeps tasks with the same label but different users separate", async () => {
    const { service, taskRepository } = setup();
    const timezone = "Europe/Paris";
    const now = new Date("2026-03-05T09:00:00Z");

    await service.logTask({ userId: "user-1", timezone, label: "Lire", now });
    await service.logTask({ userId: "user-2", timezone, label: "Lire", now });

    expect(taskRepository.tasks).toHaveLength(2);
  });
});
