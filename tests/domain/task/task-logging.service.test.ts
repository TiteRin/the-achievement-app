import { describe, expect, it, vi } from "vitest";
import { TaskLoggingService } from "@/domain/task/task-logging.service";
import { EmptyTaskLabelError } from "@/domain/task/label";
import {
  InMemoryTaskRepository,
  InMemoryTaskLogRepository,
} from "../../support/in-memory-repositories";

function setup() {
  const taskRepository = new InMemoryTaskRepository();
  const taskLogRepository = new InMemoryTaskLogRepository();
  const service = new TaskLoggingService(taskRepository, taskLogRepository);
  return { service, taskRepository, taskLogRepository };
}

describe("TaskLoggingService.logTask", () => {
  it("creates a new task on the first log", async () => {
    const { service, taskRepository } = setup();

    const result = await service.logTask({
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(taskRepository.tasks).toHaveLength(1);
    expect(result.task.label).toBe("Boire de l'eau");
    expect(result.countToday).toBe(1);
  });

  it("reuses the existing task when the same label is logged again the same day", async () => {
    const { service, taskRepository, taskLogRepository } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const second = await service.logTask({
      userId: "user-1",
      timezone,
      label: "  boire   de l'eau ",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(taskRepository.tasks).toHaveLength(1);
    expect(taskLogRepository.logs).toHaveLength(2);
    expect(second.countToday).toBe(2);
  });

  it("does not count logs from a previous day towards today's count", async () => {
    const { service } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-04T09:00:00Z"),
    });
    const today = await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(today.countToday).toBe(1);
  });

  it("keeps tasks with the same label but different users separate", async () => {
    const { service, taskRepository } = setup();
    const timezone = "Europe/Paris";
    const now = new Date("2026-03-05T09:00:00Z");

    await service.logTask({ userId: "user-1", timezone, label: "Lire", now });
    await service.logTask({ userId: "user-2", timezone, label: "Lire", now });

    expect(taskRepository.tasks).toHaveLength(2);
  });

  it("creates the task with the tags parsed from the label", async () => {
    const { service } = setup();

    const result = await service.logTask({
      userId: "user-1",
      timezone: "Europe/Paris",
      label: "Faire la vaisselle #corvées",
      now: new Date("2026-03-05T09:00:00Z"),
    });

    expect(result.task.label).toBe("Faire la vaisselle");
    expect(result.task.tags).toEqual(["corvées"]);
  });

  it("unions new tags into an existing task's tags on relog", async () => {
    const { service } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle #corvées",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const second = await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle #maison",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(second.task.tags).toEqual(["corvées", "maison"]);
  });

  it("does not duplicate tags already present when relogged with the same tag", async () => {
    const { service } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle #corvées",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const second = await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle #corvées",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(second.task.tags).toEqual(["corvées"]);
  });

  it("keeps previously accumulated tags when relogged without any tag", async () => {
    const { service } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle #corvées",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const second = await service.logTask({
      userId: "user-1",
      timezone,
      label: "Faire la vaisselle",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(second.task.tags).toEqual(["corvées"]);
  });

  it("throws EmptyTaskLabelError when the input is only tags", async () => {
    const { service } = setup();

    await expect(
      service.logTask({
        userId: "user-1",
        timezone: "Europe/Paris",
        label: "#corvées",
        now: new Date("2026-03-05T09:00:00Z"),
      })
    ).rejects.toThrow(EmptyTaskLabelError);
  });

  it("does not re-save the task when relogged with no new tags", async () => {
    const { service, taskRepository } = setup();
    const timezone = "Europe/Paris";

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T09:00:00Z"),
    });
    const saveSpy = vi.spyOn(taskRepository, "save");

    await service.logTask({
      userId: "user-1",
      timezone,
      label: "Boire de l'eau",
      now: new Date("2026-03-05T14:00:00Z"),
    });

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
