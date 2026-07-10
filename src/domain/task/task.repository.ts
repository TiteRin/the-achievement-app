import type { Task } from "./task.entity";

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByUserIdAndLabel(userId: string, label: string): Promise<Task | null>;
  findAllByUserId(userId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
}
