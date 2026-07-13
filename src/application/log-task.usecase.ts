import { TaskLoggingService } from "@/domain/task/task-logging.service";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";

export type LoggedTaskDto = {
  taskId: string;
  label: string;
  countToday: number;
  logId: string;
  tags: string[];
};

export async function logTask(
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository,
  params: { userId: string; timezone: string; label: string; now: Date }
): Promise<LoggedTaskDto> {
  const service = new TaskLoggingService(taskRepository, taskLogRepository);
  const result = await service.logTask(params);

  return {
    taskId: result.task.id,
    label: result.task.label,
    countToday: result.countToday,
    logId: result.log.id,
    tags: result.task.tags,
  };
}
