import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";

export class TaskLogNotFoundError extends Error {
  constructor() {
    super("Task log not found");
    this.name = "TaskLogNotFoundError";
  }
}

export class TaskLogNotOwnedError extends Error {
  constructor() {
    super("Task log does not belong to this user");
    this.name = "TaskLogNotOwnedError";
  }
}

export class TaskLogNotDeletableError extends Error {
  constructor() {
    super("Task log can only be deleted on the day it was logged");
    this.name = "TaskLogNotDeletableError";
  }
}

export async function removeTodayLog(
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository,
  params: { userId: string; logId: string; timezone: string; now: Date }
): Promise<void> {
  const log = await taskLogRepository.findById(params.logId);
  if (!log) throw new TaskLogNotFoundError();

  const task = await taskRepository.findById(log.taskId);
  if (!task || task.userId !== params.userId) {
    throw new TaskLogNotOwnedError();
  }

  if (!log.isDeletableAsOf(params.now, params.timezone)) {
    throw new TaskLogNotDeletableError();
  }

  await taskLogRepository.delete(log.id);
}
