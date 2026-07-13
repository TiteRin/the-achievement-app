import { dayKey, findAdjacentDayKey } from "@/domain/task/day-key";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";

export type DayTaskDto = {
  taskId: string;
  label: string;
  count: number;
  latestLogId: string;
  tags: string[];
};

export type ViewDayDto = {
  day: string;
  isToday: boolean;
  tasks: DayTaskDto[];
  previousDay: string | null;
  nextDay: string | null;
};

export async function viewDay(
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository,
  params: { userId: string; timezone: string; now: Date; day?: string }
): Promise<ViewDayDto> {
  const todayKey = dayKey(params.now, params.timezone);
  const viewedDay = params.day ?? todayKey;

  const tasks = await taskRepository.findAllByUserId(params.userId);
  const taskIds = tasks.map((task) => task.id);

  const loggedDayKeys = await taskLogRepository.findLoggedDayKeys(taskIds, params.timezone);
  const navigableDays = [...new Set([...loggedDayKeys, todayKey])];

  const withLogs = await Promise.all(
    tasks.map(async (task) => {
      const logs = await taskLogRepository.findByTaskAndDayKey(
        task.id,
        viewedDay,
        params.timezone
      );
      return { task, logs };
    })
  );

  const dayTasks = withLogs
    .filter(({ logs }) => logs.length > 0)
    .map(({ task, logs }) => ({
      taskId: task.id,
      label: task.label,
      count: logs.length,
      latestLogId: logs[logs.length - 1].id,
      tags: task.tags,
    }));

  return {
    day: viewedDay,
    isToday: viewedDay === todayKey,
    tasks: dayTasks,
    previousDay: findAdjacentDayKey(navigableDays, viewedDay, "previous"),
    nextDay: findAdjacentDayKey(navigableDays, viewedDay, "next"),
  };
}
