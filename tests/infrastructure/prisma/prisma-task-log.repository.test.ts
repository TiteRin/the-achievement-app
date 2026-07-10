// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaTaskLogRepository } from "@/infrastructure/prisma/prisma-task-log.repository";
import { TaskLog } from "@/domain/task/task-log.entity";

const EMAIL_SUFFIX = "@task-log-repo.test.local";
const repository = new PrismaTaskLogRepository(prisma);
let taskId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: { email: `${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
  });
  const task = await prisma.task.create({
    data: { userId: user.id, label: "Lire", labelKey: "lire" },
  });
  taskId = task.id;
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaTaskLogRepository", () => {
  it("saves a log and finds it back for the same day", async () => {
    const log = TaskLog.create({
      id: crypto.randomUUID(),
      taskId,
      loggedAt: new Date("2026-03-05T09:00:00Z"),
    });
    await repository.save(log);

    const logsToday = await repository.findByTaskAndDay(
      taskId,
      "Europe/Paris",
      new Date("2026-03-05T18:00:00Z")
    );

    expect(logsToday).toHaveLength(1);
    expect(logsToday[0]).toBeInstanceOf(TaskLog);
    expect(logsToday[0].id).toBe(log.id);
  });

  it("excludes logs from a different day", async () => {
    await repository.save(
      TaskLog.create({
        id: crypto.randomUUID(),
        taskId,
        loggedAt: new Date("2026-03-04T09:00:00Z"),
      })
    );

    const logsToday = await repository.findByTaskAndDay(
      taskId,
      "Europe/Paris",
      new Date("2026-03-05T09:00:00Z")
    );

    expect(logsToday).toHaveLength(0);
  });

  it("respects the user's timezone for the day boundary near midnight", async () => {
    // 23:30 UTC on March 5th is already March 6th in Paris, but still March 5th in UTC.
    await repository.save(
      TaskLog.create({
        id: crypto.randomUUID(),
        taskId,
        loggedAt: new Date("2026-03-05T23:30:00Z"),
      })
    );

    const logsInParisMarch6 = await repository.findByTaskAndDay(
      taskId,
      "Europe/Paris",
      new Date("2026-03-05T23:45:00Z")
    );
    const logsInUtcMarch5 = await repository.findByTaskAndDay(
      taskId,
      "UTC",
      new Date("2026-03-05T10:00:00Z")
    );

    expect(logsInParisMarch6).toHaveLength(1);
    expect(logsInUtcMarch5).toHaveLength(1);
  });

  it("deletes a log", async () => {
    const log = TaskLog.create({
      id: crypto.randomUUID(),
      taskId,
      loggedAt: new Date("2026-03-05T09:00:00Z"),
    });
    await repository.save(log);

    await repository.delete(log.id);

    const logsToday = await repository.findByTaskAndDay(
      taskId,
      "Europe/Paris",
      new Date("2026-03-05T09:00:00Z")
    );
    expect(logsToday).toHaveLength(0);
  });

  describe("findById", () => {
    it("returns null when no log matches the id", async () => {
      const result = await repository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it("finds a log by id", async () => {
      const log = TaskLog.create({
        id: crypto.randomUUID(),
        taskId,
        loggedAt: new Date("2026-03-05T09:00:00Z"),
      });
      await repository.save(log);

      const found = await repository.findById(log.id);

      expect(found).toBeInstanceOf(TaskLog);
      expect(found?.id).toBe(log.id);
      expect(found?.taskId).toBe(taskId);
    });
  });
});
