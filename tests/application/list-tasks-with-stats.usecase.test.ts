import { describe, expect, it } from "vitest";
import { User } from "@/domain/user/user.entity";
import { Task } from "@/domain/task/task.entity";
import { TaskLog } from "@/domain/task/task-log.entity";
import { listTasksWithStats } from "@/application/list-tasks-with-stats.usecase";
import {
  InMemoryUserRepository,
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  return {
    userRepository: new InMemoryUserRepository(),
    taskRepository: new InMemoryTaskRepository(),
    taskLogRepository: new InMemoryTaskLogRepository(),
  };
}

describe("listTasksWithStats", () => {
  it("returns an empty list when there are no tasks", async () => {
    const { userRepository, taskRepository, taskLogRepository } = setup();

    const result = await listTasksWithStats(
      userRepository,
      taskRepository,
      taskLogRepository
    );

    expect(result).toEqual([]);
  });

  it("returns each task with its owner's email and total log count", async () => {
    const { userRepository, taskRepository, taskLogRepository } = setup();
    const createdAt = new Date("2026-03-05T09:00:00Z");

    await userRepository.save(
      User.create({
        id: "user-1",
        email: "marine@example.com",
        timezone: "Europe/Paris",
        createdAt,
      })
    );
    const task = Task.create({
      id: "task-1",
      userId: "user-1",
      label: "Faire la lessive",
      createdAt,
    });
    await taskRepository.save(task);
    await taskLogRepository.save(
      TaskLog.create({ id: "log-1", taskId: "task-1", loggedAt: createdAt })
    );
    await taskLogRepository.save(
      TaskLog.create({ id: "log-2", taskId: "task-1", loggedAt: createdAt })
    );

    const result = await listTasksWithStats(
      userRepository,
      taskRepository,
      taskLogRepository
    );

    expect(result).toEqual([
      {
        taskId: "task-1",
        label: "Faire la lessive",
        ownerEmail: "marine@example.com",
        totalLogs: 2,
        createdAt,
      },
    ]);
  });

  it("falls back to a placeholder when the owning user can't be found", async () => {
    const { userRepository, taskRepository, taskLogRepository } = setup();
    const createdAt = new Date("2026-03-05T09:00:00Z");
    await taskRepository.save(
      Task.create({ id: "task-1", userId: "ghost-user", label: "Lire", createdAt })
    );

    const result = await listTasksWithStats(
      userRepository,
      taskRepository,
      taskLogRepository
    );

    expect(result[0].ownerEmail).toBe("(compte supprimé)");
  });
});
