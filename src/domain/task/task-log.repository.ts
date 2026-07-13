import type { TaskLog } from "./task-log.entity";

export interface TaskLogRepository {
  findById(id: string): Promise<TaskLog | null>;
  save(log: TaskLog): Promise<void>;
  findByTaskAndDay(
    taskId: string,
    timezone: string,
    reference: Date
  ): Promise<TaskLog[]>;
  findByTaskAndDayKey(
    taskId: string,
    dayKey: string,
    timezone: string
  ): Promise<TaskLog[]>;
  findLoggedDayKeys(taskIds: string[], timezone: string): Promise<string[]>;
  countByTaskId(taskId: string): Promise<number>;
  delete(logId: string): Promise<void>;
}
