import { EmptyTaskLabelError, normalizeLabel } from "./label";
import { Task } from "./task.entity";
import { TaskLog } from "./task-log.entity";
import type { TaskRepository } from "./task.repository";
import type { TaskLogRepository } from "./task-log.repository";

export type LogTaskResult = { task: Task; log: TaskLog; countToday: number };

export class TaskLoggingService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskLogRepository: TaskLogRepository
  ) {}

  async logTask(params: {
    userId: string;
    timezone: string;
    label: string;
    now: Date;
  }): Promise<LogTaskResult> {
    const label = normalizeLabel(params.label);
    if (!label) throw new EmptyTaskLabelError();

    let task = await this.taskRepository.findByUserIdAndLabel(
      params.userId,
      label
    );
    if (!task) {
      task = Task.create({
        id: crypto.randomUUID(),
        userId: params.userId,
        label,
        createdAt: params.now,
      });
      await this.taskRepository.save(task);
    }

    const log = TaskLog.create({
      id: crypto.randomUUID(),
      taskId: task.id,
      loggedAt: params.now,
    });
    await this.taskLogRepository.save(log);

    const logsToday = await this.taskLogRepository.findByTaskAndDay(
      task.id,
      params.timezone,
      params.now
    );

    return { task, log, countToday: logsToday.length };
  }
}
