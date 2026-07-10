import type { TaskRepository } from "@/domain/task/task.repository";
import { Task } from "@/domain/task/task.entity";
import { labelKey } from "@/domain/task/label";
import type { PrismaClient } from "./generated/client";

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    const record = await this.client.task.findUnique({ where: { id } });
    if (!record) return null;
    return toDomain(record);
  }

  async findByUserIdAndLabel(userId: string, label: string): Promise<Task | null> {
    const record = await this.client.task.findUnique({
      where: { userId_labelKey: { userId, labelKey: labelKey(label) } },
    });
    if (!record) return null;
    return toDomain(record);
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    const records = await this.client.task.findMany({ where: { userId } });
    return records.map(toDomain);
  }

  async save(task: Task): Promise<void> {
    await this.client.task.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        userId: task.userId,
        label: task.label,
        labelKey: labelKey(task.label),
        createdAt: task.createdAt,
      },
      update: {
        label: task.label,
        labelKey: labelKey(task.label),
      },
    });
  }
}

function toDomain(record: {
  id: string;
  userId: string;
  label: string;
  createdAt: Date;
}): Task {
  return Task.create({
    id: record.id,
    userId: record.userId,
    label: record.label,
    createdAt: record.createdAt,
  });
}
