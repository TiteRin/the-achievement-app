import type { TaskLog } from "./task-log.entity";

export interface TaskLogRepository {
  findById(id: string): Promise<TaskLog | null>;
  save(log: TaskLog): Promise<void>;
  findByTaskAndDay(
    taskId: string,
    timezone: string,
    reference: Date
  ): Promise<TaskLog[]>;
  delete(logId: string): Promise<void>;
}
