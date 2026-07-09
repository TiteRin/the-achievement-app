import type { TaskLog } from "./task-log.entity";

export interface TaskLogRepository {
  save(log: TaskLog): Promise<void>;
  findByTaskAndDay(
    taskId: string,
    timezone: string,
    reference: Date
  ): Promise<TaskLog[]>;
  delete(logId: string): Promise<void>;
}
