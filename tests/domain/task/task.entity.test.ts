import { describe, expect, it } from "vitest";
import { Task } from "@/domain/task/task.entity";
import { EmptyTaskLabelError } from "@/domain/task/label";

const baseParams = {
  id: "task-1",
  userId: "user-1",
  createdAt: new Date("2026-03-05T10:00:00Z"),
};

describe("Task.create", () => {
  it("normalizes the label", () => {
    const task = Task.create({ ...baseParams, label: "  Boire   de l'eau  " });
    expect(task.label).toBe("Boire de l'eau");
  });

  it("keeps the given id, userId and createdAt", () => {
    const task = Task.create({ ...baseParams, label: "Lire" });
    expect(task.id).toBe("task-1");
    expect(task.userId).toBe("user-1");
    expect(task.createdAt).toEqual(new Date("2026-03-05T10:00:00Z"));
  });

  it("rejects a blank label", () => {
    expect(() => Task.create({ ...baseParams, label: "   " })).toThrow(
      EmptyTaskLabelError
    );
  });
});
