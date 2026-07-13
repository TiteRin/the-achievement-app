import { EmptyTaskLabelError, normalizeLabel } from "./label";
import { normalizeTags } from "./tag";

export class Task {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly label: string,
    readonly createdAt: Date,
    readonly tags: string[]
  ) {}

  static create(params: {
    id: string;
    userId: string;
    label: string;
    createdAt: Date;
    tags?: string[];
  }): Task {
    const label = normalizeLabel(params.label);
    if (!label) throw new EmptyTaskLabelError();
    return new Task(
      params.id,
      params.userId,
      label,
      params.createdAt,
      normalizeTags(params.tags ?? [])
    );
  }
}
