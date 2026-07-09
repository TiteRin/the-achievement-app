import { dayKey } from "./day-key";

export class TaskLog {
  private constructor(
    readonly id: string,
    readonly taskId: string,
    readonly loggedAt: Date
  ) {}

  static create(params: { id: string; taskId: string; loggedAt: Date }): TaskLog {
    return new TaskLog(params.id, params.taskId, params.loggedAt);
  }

  isDeletableAsOf(now: Date, timezone: string): boolean {
    return dayKey(this.loggedAt, timezone) === dayKey(now, timezone);
  }
}
