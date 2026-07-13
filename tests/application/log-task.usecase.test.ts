import { describe, expect, it } from "vitest";
import { logTask } from "@/application/log-task.usecase";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  return { taskRepository, taskLogRepository };
}

describe("logTask", () => {
  it("returns a plain DTO with the task label and today's count", async () => {
    const { taskRepository, taskLogRepository } = setup();

    const result = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(result).toEqual({
      taskId: expect.any(String),
      label: "Boire de l'eau",
      countToday: 1,
      logId: expect.any(String),
      tags: [],
    });
  });

  it("increments the count when logging the same task again the same day", async () => {
    const { taskRepository, taskLogRepository } = setup();
    const params = {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    };

    await logTask(taskRepository, taskLogRepository, params);
    const second = await logTask(taskRepository, taskLogRepository, params);

    expect(second.countToday).toBe(2);
  });

  it("returns the tags parsed from the label", async () => {
    const { taskRepository, taskLogRepository } = setup();

    const result = await logTask(taskRepository, taskLogRepository, {
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Faire la vaisselle #corvées #maison",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(result.label).toBe("Faire la vaisselle");
    expect(result.tags).toEqual(["corvées", "maison"]);
  });
});
