import { EmptyTaskLabelError } from "./label";
import { extractTags, mergeTags } from "./tag";
import { Task } from "./task.entity";
import { TaskLog } from "./task-log.entity";
import type { TaskRepository } from "./task.repository";
import type { TaskLogRepository } from "./task-log.repository";

export type LogTaskResult = { task: Task; log: TaskLog; countToday: number };

function sameTags(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((tag, index) => tag === b[index]);
}

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
    const { label, tags: parsedTags } = extractTags(params.label);
    if (!label) throw new EmptyTaskLabelError();

    const existingTask = await this.taskRepository.findByUserIdAndLabel(
      params.userId,
      label
    );
    const mergedTags = mergeTags(existingTask?.tags ?? [], parsedTags);

    let task = existingTask;
    if (!task || !sameTags(task.tags, mergedTags)) {
      task = Task.create({
        id: task?.id ?? crypto.randomUUID(),
        userId: params.userId,
        label,
        tags: mergedTags,
        createdAt: task?.createdAt ?? params.now,
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
