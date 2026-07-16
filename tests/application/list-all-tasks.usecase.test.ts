import { describe, expect, it } from "vitest";
import { Task } from "@/domain/task/task.entity";
import { TaskLog } from "@/domain/task/task-log.entity";
import { listAllTasks } from "@/application/list-all-tasks.usecase";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository(taskRepository);
  return { taskRepository, taskLogRepository };
}

const timezone = "Europe/Paris";
const userId = "user-1";
const createdAt = new Date("2026-01-01T09:00:00Z");

async function logOn(
  taskLogRepository: InMemoryTaskLogRepository,
  taskId: string,
  isoDates: string[]
) {
  for (const iso of isoDates) {
    await taskLogRepository.save(
      TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date(iso) })
    );
  }
}

describe("listAllTasks", () => {
  it("returns empty tasks and tagStreaks for a user with no tasks", async () => {
    const { taskRepository, taskLogRepository } = setup();

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result).toEqual({ tasks: [], tagStreaks: [] });
  });

  it("returns each task's all-time count and best streak", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const task = Task.create({
      id: "task-1",
      userId,
      label: "Boire de l'eau",
      createdAt,
    });
    await taskRepository.save(task);
    await logOn(taskLogRepository, "task-1", [
      "2026-03-01T09:00:00Z",
      "2026-03-02T09:00:00Z",
      "2026-03-03T09:00:00Z",
    ]);

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result.tasks).toEqual([
      {
        taskId: "task-1",
        label: "Boire de l'eau",
        tags: [],
        allTimeCount: 3,
        bestStreak: { value: 3, unit: "day" },
      },
    ]);
  });

  it("counts every log even when the streak is smaller than the all-time count", async () => {
    // Logged 3 times total, but with a gap in the middle — allTimeCount and
    // bestStreak are genuinely different numbers, on purpose.
    const { taskRepository, taskLogRepository } = setup();
    await taskRepository.save(
      Task.create({ id: "task-1", userId, label: "Courir", createdAt })
    );
    await logOn(taskLogRepository, "task-1", [
      "2026-03-01T09:00:00Z",
      "2026-03-15T09:00:00Z",
      "2026-03-16T09:00:00Z",
    ]);

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result.tasks[0].allTimeCount).toBe(3);
    expect(result.tasks[0].bestStreak).toEqual({ value: 2, unit: "day" });
  });

  it("computes a tag's streak from the union of every task carrying that tag", async () => {
    const { taskRepository, taskLogRepository } = setup();
    await taskRepository.save(
      Task.create({
        id: "task-1",
        userId,
        label: "Faire la vaisselle",
        tags: ["chores"],
        createdAt,
      })
    );
    await taskRepository.save(
      Task.create({
        id: "task-2",
        userId,
        label: "Passer l'aspirateur",
        tags: ["chores"],
        createdAt,
      })
    );
    await logOn(taskLogRepository, "task-1", ["2026-03-01T09:00:00Z"]);
    await logOn(taskLogRepository, "task-2", ["2026-03-02T09:00:00Z"]);

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result.tagStreaks).toEqual([
      { tag: "chores", bestStreak: { value: 2, unit: "day" } },
    ]);
  });

  it("excludes tags from the result when no task carries any", async () => {
    const { taskRepository, taskLogRepository } = setup();
    await taskRepository.save(
      Task.create({ id: "task-1", userId, label: "Lire", createdAt })
    );
    await logOn(taskLogRepository, "task-1", ["2026-03-01T09:00:00Z"]);

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result.tagStreaks).toEqual([]);
  });

  it("only includes tasks belonging to the requesting user", async () => {
    const { taskRepository, taskLogRepository } = setup();
    await taskRepository.save(
      Task.create({ id: "task-1", userId, label: "Lire", createdAt })
    );
    await taskRepository.save(
      Task.create({
        id: "task-2",
        userId: "someone-else",
        label: "Courir",
        createdAt,
      })
    );

    const result = await listAllTasks(taskRepository, taskLogRepository, {
      userId,
      timezone,
    });

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].taskId).toBe("task-1");
  });
});
