import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";

export type TodayTaskDto = {
  taskId: string;
  label: string;
  countToday: number;
  latestLogId: string;
  tags: string[];
};

export async function listTodayTasks(
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository,
  params: { userId: string; timezone: string; now: Date }
): Promise<TodayTaskDto[]> {
  const tasks = await taskRepository.findAllByUserId(params.userId);

  const withLogs = await Promise.all(
    tasks.map(async (task) => {
      const logs = await taskLogRepository.findByTaskAndDay(
        task.id,
        params.timezone,
        params.now
      );
      return { task, logs };
    })
  );

  return withLogs
    .filter(({ logs }) => logs.length > 0)
    .map(({ task, logs }) => ({
      taskId: task.id,
      label: task.label,
      countToday: logs.length,
      latestLogId: logs[logs.length - 1].id,
      tags: task.tags,
    }));
}
