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

  describe("findByTaskAndDayKey", () => {
    it("finds logs matching the given day-key", async () => {
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-05T09:00:00Z") })
      );

      const logs = await repository.findByTaskAndDayKey(taskId, "2026-03-05", "Europe/Paris");

      expect(logs).toHaveLength(1);
    });

    it("excludes logs from a different day-key", async () => {
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-04T09:00:00Z") })
      );

      const logs = await repository.findByTaskAndDayKey(taskId, "2026-03-05", "Europe/Paris");

      expect(logs).toHaveLength(0);
    });

    it("respects the timezone for the day boundary near midnight", async () => {
      // 23:30 UTC on March 5th is already March 6th in Paris.
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-05T23:30:00Z") })
      );

      const logsMarch6Paris = await repository.findByTaskAndDayKey(taskId, "2026-03-06", "Europe/Paris");
      const logsMarch5Paris = await repository.findByTaskAndDayKey(taskId, "2026-03-05", "Europe/Paris");

      expect(logsMarch6Paris).toHaveLength(1);
      expect(logsMarch5Paris).toHaveLength(0);
    });

    it("finds a day-key far in the past, well outside any instant-centered window", async () => {
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2020-01-15T09:00:00Z") })
      );

      const logs = await repository.findByTaskAndDayKey(taskId, "2020-01-15", "Europe/Paris");

      expect(logs).toHaveLength(1);
    });
  });

  describe("findLoggedDayKeys", () => {
    it("returns an empty array when there are no logs", async () => {
      const keys = await repository.findLoggedDayKeys([taskId], "Europe/Paris");
      expect(keys).toEqual([]);
    });

    it("returns the distinct sorted day-keys across the given tasks", async () => {
      const otherTask = await prisma.task.create({
        data: {
          userId: (await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).userId,
          label: "Courir",
          labelKey: "courir",
        },
      });

      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-05T09:00:00Z") })
      );
      await repository.save(
        // Same day as above, same task — should not produce a duplicate key.
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-05T18:00:00Z") })
      );
      await repository.save(
        TaskLog.create({
          id: crypto.randomUUID(),
          taskId: otherTask.id,
          loggedAt: new Date("2026-03-01T09:00:00Z"),
        })
      );

      const keys = await repository.findLoggedDayKeys([taskId, otherTask.id], "Europe/Paris");

      expect(keys).toEqual(["2026-03-01", "2026-03-05"]);
    });

    it("ignores logs belonging to tasks outside the given set", async () => {
      const otherTask = await prisma.task.create({
        data: {
          userId: (await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).userId,
          label: "Courir",
          labelKey: "courir",
        },
      });
      await repository.save(
        TaskLog.create({
          id: crypto.randomUUID(),
          taskId: otherTask.id,
          loggedAt: new Date("2026-03-01T09:00:00Z"),
        })
      );

      const keys = await repository.findLoggedDayKeys([taskId], "Europe/Paris");

      expect(keys).toEqual([]);
    });
  });

  describe("findLoggedDayKeysByUserAndTag", () => {
    it("returns the distinct sorted day-keys across every task carrying the given tag", async () => {
      const user = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      const workTaskA = await prisma.task.create({
        data: { userId: user.userId, label: "Faire la vaisselle", labelKey: "faire la vaisselle", tags: ["work"] },
      });
      const workTaskB = await prisma.task.create({
        data: { userId: user.userId, label: "Répondre aux emails", labelKey: "répondre aux emails", tags: ["work"] },
      });
      const personalTask = await prisma.task.create({
        data: { userId: user.userId, label: "Lire un livre", labelKey: "lire un livre", tags: ["personal"] },
      });

      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: workTaskA.id, loggedAt: new Date("2026-03-01T09:00:00Z") })
      );
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: workTaskB.id, loggedAt: new Date("2026-03-03T09:00:00Z") })
      );
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: personalTask.id, loggedAt: new Date("2026-03-02T09:00:00Z") })
      );

      const workKeys = await repository.findLoggedDayKeysByUserAndTag(user.userId, "work", "Europe/Paris");
      const personalKeys = await repository.findLoggedDayKeysByUserAndTag(user.userId, "personal", "Europe/Paris");

      expect(workKeys).toEqual(["2026-03-01", "2026-03-03"]);
      expect(personalKeys).toEqual(["2026-03-02"]);
    });

    it("returns an empty array for a tag no task of this user carries", async () => {
      const keys = await repository.findLoggedDayKeysByUserAndTag(
        (await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).userId,
        "nonexistent",
        "Europe/Paris"
      );

      expect(keys).toEqual([]);
    });

    it("dedupes same-day logs from two different tasks sharing the tag", async () => {
      const user = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      const taskA = await prisma.task.create({
        data: { userId: user.userId, label: "Ranger", labelKey: "ranger", tags: ["chores"] },
      });
      const taskB = await prisma.task.create({
        data: { userId: user.userId, label: "Passer l'aspirateur", labelKey: "passer l'aspirateur", tags: ["chores"] },
      });

      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: taskA.id, loggedAt: new Date("2026-03-05T08:00:00Z") })
      );
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: taskB.id, loggedAt: new Date("2026-03-05T18:00:00Z") })
      );

      const keys = await repository.findLoggedDayKeysByUserAndTag(user.userId, "chores", "Europe/Paris");

      expect(keys).toEqual(["2026-03-05"]);
    });

    it("ignores logs belonging to a different user's task, even with the same tag", async () => {
      const otherUser = await prisma.user.create({
        data: { email: `${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
      });
      const otherUserTask = await prisma.task.create({
        data: { userId: otherUser.id, label: "Courir", labelKey: "courir", tags: ["sport"] },
      });
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: otherUserTask.id, loggedAt: new Date("2026-03-05T09:00:00Z") })
      );

      const requestingUser = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      const keys = await repository.findLoggedDayKeysByUserAndTag(requestingUser.userId, "sport", "Europe/Paris");

      expect(keys).toEqual([]);
    });

    it("respects the user's timezone for the day boundary near midnight", async () => {
      const user = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      const tagged = await prisma.task.create({
        data: { userId: user.userId, label: "Méditer", labelKey: "méditer", tags: ["wellbeing"] },
      });
      // 23:30 UTC on March 5th is already March 6th in Paris.
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId: tagged.id, loggedAt: new Date("2026-03-05T23:30:00Z") })
      );

      const keysParis = await repository.findLoggedDayKeysByUserAndTag(user.userId, "wellbeing", "Europe/Paris");
      const keysUtc = await repository.findLoggedDayKeysByUserAndTag(user.userId, "wellbeing", "UTC");

      expect(keysParis).toEqual(["2026-03-06"]);
      expect(keysUtc).toEqual(["2026-03-05"]);
    });
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

  describe("countByTaskId", () => {
    it("returns 0 when the task has no log", async () => {
      const count = await repository.countByTaskId(taskId);
      expect(count).toBe(0);
    });

    it("counts all logs for the task, regardless of day", async () => {
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-04T09:00:00Z") })
      );
      await repository.save(
        TaskLog.create({ id: crypto.randomUUID(), taskId, loggedAt: new Date("2026-03-05T09:00:00Z") })
      );

      const count = await repository.countByTaskId(taskId);

      expect(count).toBe(2);
    });
  });
});
