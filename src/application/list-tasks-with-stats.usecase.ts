import type { UserRepository } from "@/domain/user/user.repository";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";

export type TaskStatsDto = {
  taskId: string;
  label: string;
  ownerEmail: string;
  totalLogs: number;
  createdAt: Date;
};

const DELETED_ACCOUNT_PLACEHOLDER = "(compte supprimé)";

export async function listTasksWithStats(
  userRepository: UserRepository,
  taskRepository: TaskRepository,
  taskLogRepository: TaskLogRepository
): Promise<TaskStatsDto[]> {
  const [tasks, users] = await Promise.all([
    taskRepository.findAll(),
    userRepository.findAll(),
  ]);
  const emailByUserId = new Map(users.map((user) => [user.id, user.email]));

  return Promise.all(
    tasks.map(async (task) => ({
      taskId: task.id,
      label: task.label,
      ownerEmail: emailByUserId.get(task.userId) ?? DELETED_ACCOUNT_PLACEHOLDER,
      totalLogs: await taskLogRepository.countByTaskId(task.id),
      createdAt: task.createdAt,
    }))
  );
}
