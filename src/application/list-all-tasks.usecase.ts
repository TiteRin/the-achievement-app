import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";
import { adaptiveStreak, type Streak } from "@/domain/task/cadence";

export type AllTaskDto = {
  taskId: string;
  label: string;
  tags: string[];
  allTimeCount: number;
  bestStreak: Streak;
};

export type TagStreakDto = {
  tag: string;
  bestStreak: Streak;
};

export type ListAllTasksDto = {
  tasks: AllTaskDto[];
  tagStreaks: TagStreakDto[];
};

export async function listAllTasks(
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository,
  params: { userId: string; timezone: string }
): Promise<ListAllTasksDto> {
  const tasks = await taskRepository.findAllByUserId(params.userId);

  const taskDtos = await Promise.all(
    tasks.map(async (task): Promise<AllTaskDto> => {
      const [dayKeys, allTimeCount] = await Promise.all([
        taskLogRepository.findLoggedDayKeys([task.id], params.timezone),
        taskLogRepository.countByTaskId(task.id),
      ]);
      return {
        taskId: task.id,
        label: task.label,
        tags: task.tags,
        allTimeCount,
        bestStreak: adaptiveStreak(dayKeys),
      };
    })
  );

  const uniqueTags = [...new Set(tasks.flatMap((task) => task.tags))].sort();
  const tagStreaks = await Promise.all(
    uniqueTags.map(async (tag): Promise<TagStreakDto> => {
      const dayKeys = await taskLogRepository.findLoggedDayKeysByUserAndTag(
        params.userId,
        tag,
        params.timezone
      );
      return { tag, bestStreak: adaptiveStreak(dayKeys) };
    })
  );

  return { tasks: taskDtos, tagStreaks };
}
