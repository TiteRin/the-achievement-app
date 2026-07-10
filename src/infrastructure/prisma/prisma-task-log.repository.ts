import type { TaskLogRepository } from "@/domain/task/task-log.repository";
import { TaskLog } from "@/domain/task/task-log.entity";
import { dayKey } from "@/domain/task/day-key";
import type { PrismaClient } from "./generated/client";

// Widened by a day on each side to safely cover any IANA timezone offset
// (-12:00..+14:00) around the reference instant. The exact boundary is
// then decided precisely by `dayKey`, the same function the domain uses.
const WINDOW_MARGIN_MS = 26 * 60 * 60 * 1000;

export class PrismaTaskLogRepository implements TaskLogRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<TaskLog | null> {
    const record = await this.client.taskLog.findUnique({ where: { id } });
    if (!record) return null;
    return toDomain(record);
  }

  async save(log: TaskLog): Promise<void> {
    await this.client.taskLog.create({
      data: { id: log.id, taskId: log.taskId, loggedAt: log.loggedAt },
    });
  }

  async findByTaskAndDay(
    taskId: string,
    timezone: string,
    reference: Date
  ): Promise<TaskLog[]> {
    const referenceKey = dayKey(reference, timezone);
    const records = await this.client.taskLog.findMany({
      where: {
        taskId,
        loggedAt: {
          gte: new Date(reference.getTime() - WINDOW_MARGIN_MS),
          lte: new Date(reference.getTime() + WINDOW_MARGIN_MS),
        },
      },
    });

    return records
      .filter((record) => dayKey(record.loggedAt, timezone) === referenceKey)
      .map(toDomain);
  }

  async countByTaskId(taskId: string): Promise<number> {
    return this.client.taskLog.count({ where: { taskId } });
  }

  async delete(logId: string): Promise<void> {
    await this.client.taskLog.delete({ where: { id: logId } });
  }
}

function toDomain(record: { id: string; taskId: string; loggedAt: Date }): TaskLog {
  return TaskLog.create({
    id: record.id,
    taskId: record.taskId,
    loggedAt: record.loggedAt,
  });
}
