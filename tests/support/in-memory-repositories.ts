import { Task } from "@/domain/task/task.entity";
import { TaskLog } from "@/domain/task/task-log.entity";
import { User } from "@/domain/user/user.entity";
import type { TaskRepository } from "@/domain/task/task.repository";
import type { TaskLogRepository } from "@/domain/task/task-log.repository";
import type { UserRepository } from "@/domain/user/user.repository";
import { labelKey } from "@/domain/task/label";
import { dayKey } from "@/domain/task/day-key";

export class InMemoryUserRepository implements UserRepository {
  users: User[] = [];

  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findAll() {
    return this.users;
  }

  async save(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id).concat(user);
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  tasks: Task[] = [];

  async findById(id: string) {
    return this.tasks.find((task) => task.id === id) ?? null;
  }

  async findByUserIdAndLabel(userId: string, label: string) {
    const key = labelKey(label);
    return (
      this.tasks.find(
        (task) => task.userId === userId && labelKey(task.label) === key
      ) ?? null
    );
  }

  async findAllByUserId(userId: string) {
    return this.tasks.filter((task) => task.userId === userId);
  }

  async findAll() {
    return this.tasks;
  }

  async save(task: Task) {
    this.tasks = this.tasks.filter((t) => t.id !== task.id).concat(task);
  }
}

export class InMemoryTaskLogRepository implements TaskLogRepository {
  logs: TaskLog[] = [];

  // Optional: a TaskLog only knows its taskId, not the owning task's userId
  // or tags, so resolving "which tasks carry this tag, for this user" needs
  // a reference to where tasks live — mirroring how the real Prisma
  // implementation resolves the same thing via the DB relation instead of
  // duplicating userId/tags onto every log.
  constructor(private readonly taskRepository?: InMemoryTaskRepository) {}

  async findById(id: string) {
    return this.logs.find((log) => log.id === id) ?? null;
  }

  async save(log: TaskLog) {
    this.logs.push(log);
  }

  async findByTaskAndDay(taskId: string, timezone: string, reference: Date) {
    const referenceKey = dayKey(reference, timezone);
    return this.logs.filter(
      (log) => log.taskId === taskId && dayKey(log.loggedAt, timezone) === referenceKey
    );
  }

  async findByTaskAndDayKey(taskId: string, dayKeyStr: string, timezone: string) {
    return this.logs.filter(
      (log) => log.taskId === taskId && dayKey(log.loggedAt, timezone) === dayKeyStr
    );
  }

  async findLoggedDayKeys(taskIds: string[], timezone: string) {
    const keys = this.logs
      .filter((log) => taskIds.includes(log.taskId))
      .map((log) => dayKey(log.loggedAt, timezone));
    return [...new Set(keys)].sort();
  }

  async findLoggedDayKeysByUserAndTag(userId: string, tag: string, timezone: string) {
    const taskIds = new Set(
      (this.taskRepository?.tasks ?? [])
        .filter((task) => task.userId === userId && task.tags.includes(tag))
        .map((task) => task.id)
    );
    const keys = this.logs
      .filter((log) => taskIds.has(log.taskId))
      .map((log) => dayKey(log.loggedAt, timezone));
    return [...new Set(keys)].sort();
  }

  async countByTaskId(taskId: string) {
    return this.logs.filter((log) => log.taskId === taskId).length;
  }

  async delete(logId: string) {
    this.logs = this.logs.filter((log) => log.id !== logId);
  }
}
