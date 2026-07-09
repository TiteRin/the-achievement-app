import { EmptyTaskLabelError, normalizeLabel } from "./label";

export class Task {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly label: string,
    readonly createdAt: Date
  ) {}

  static create(params: {
    id: string;
    userId: string;
    label: string;
    createdAt: Date;
  }): Task {
    const label = normalizeLabel(params.label);
    if (!label) throw new EmptyTaskLabelError();
    return new Task(params.id, params.userId, label, params.createdAt);
  }
}
