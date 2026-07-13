import type { TaskLogRepository } from "@/domain/task/task-log.repository";
import { TaskLog } from "@/domain/task/task-log.entity";
import { dayKey } from "@/domain/task/day-key";
import type { PrismaClient } from "./generated/client";

// Widened by a day on each side to safely cover any IANA timezone offset
// (-12:00..+14:00) around the reference instant. The exact boundary is
// then decided precisely by `dayKey`, the same function the domain uses.
const WINDOW_MARGIN_MS = 26 * 60 * 60 * 1000;

// A day-key (e.g. "2026-03-05") isn't tied to a specific instant, so its
// safe UTC window is computed from the calendar date itself rather than
// from a reference instant: someone at UTC+14 starts that local day 14h
// before UTC midnight, someone at UTC-12 doesn't finish it until 36h after.
const HOUR_MS = 60 * 60 * 1000;
const DAY_KEY_WINDOW_BEFORE_MS = 14 * HOUR_MS;
const DAY_KEY_WINDOW_AFTER_MS = 36 * HOUR_MS;

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

  async findByTaskAndDayKey(
    taskId: string,
    dayKeyStr: string,
    timezone: string
  ): Promise<TaskLog[]> {
    const dayStart = new Date(`${dayKeyStr}T00:00:00Z`);
    const records = await this.client.taskLog.findMany({
      where: {
        taskId,
        loggedAt: {
          gte: new Date(dayStart.getTime() - DAY_KEY_WINDOW_BEFORE_MS),
          lte: new Date(dayStart.getTime() + DAY_KEY_WINDOW_AFTER_MS),
        },
      },
    });

    return records
      .filter((record) => dayKey(record.loggedAt, timezone) === dayKeyStr)
      .map(toDomain);
  }

  async findLoggedDayKeys(taskIds: string[], timezone: string): Promise<string[]> {
    if (taskIds.length === 0) return [];

    const records = await this.client.taskLog.findMany({
      where: { taskId: { in: taskIds } },
      select: { loggedAt: true },
    });

    const keys = new Set(records.map((record) => dayKey(record.loggedAt, timezone)));
    return [...keys].sort();
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
