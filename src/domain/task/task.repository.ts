import type { Task } from "./task.entity";

export interface TaskRepository {
  findByUserIdAndLabel(userId: string, label: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
}
