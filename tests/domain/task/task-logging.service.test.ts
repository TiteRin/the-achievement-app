import { describe, expect, it } from "vitest";
import { TaskLoggingService } from "@/domain/task/task-logging.service";
import { Task } from "@/domain/task/task.entity";
import { TaskLog } from "@/domain/task/task-log.entity";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";
import { dayKey } from "@/domain/task/day-key";

class InMemoryTaskRepository implements TaskRepository {
  tasks: Task[] = [];

  async findByUserIdAndLabel(userId: string, label: string) {
    const key = label.trim().toLocaleLowerCase("fr-FR");
    return (
      this.tasks.find(
        (task) =>
          task.userId === userId &&
          task.label.trim().toLocaleLowerCase("fr-FR") === key
      ) ?? null
    );
  }

  async save(task: Task) {
    this.tasks = this.tasks.filter((t) => t.id !== task.id).concat(task);
  }
}

class InMemoryTaskLogRepository implements TaskLogRepository {
  logs: TaskLog[] = [];

  async save(log: TaskLog) {
    this.logs.push(log);
  }

  async findByTaskAndDay(taskId: string, timezone: string, reference: Date) {
    const referenceKey = dayKey(reference, timezone);
    return this.logs.filter(
      (log) => log.taskId === taskId && dayKey(log.loggedAt, timezone) === referenceKey
    );
  }

  async delete(logId: string) {
    this.logs = this.logs.filter((log) => log.id !== logId);
  }
}

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
