// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaTaskRepository } from "@/infrastructure/prisma/prisma-task.repository";
import { Task } from "@/domain/task/task.entity";

const EMAIL_SUFFIX = "@task-repo.test.local";
const repository = new PrismaTaskRepository(prisma);
let userId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: { email: `${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
  });
  userId = user.id;
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaTaskRepository", () => {
  it("returns null when no task matches the user and label", async () => {
    const result = await repository.findByUserIdAndLabel(userId, "Lire");
    expect(result).toBeNull();
  });

  it("saves a task and finds it back by label, case-insensitively", async () => {
    const task = Task.create({
      id: crypto.randomUUID(),
      userId,
      label: "Boire de l'eau",
      createdAt: new Date(),
    });

    await repository.save(task);
    const found = await repository.findByUserIdAndLabel(userId, "boire de l'eau");

    expect(found).toBeInstanceOf(Task);
    expect(found?.id).toBe(task.id);
    expect(found?.label).toBe("Boire de l'eau");
  });

  it("does not find a task belonging to a different user", async () => {
    const otherUser = await prisma.user.create({
      data: { email: `other-${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
    });
    await repository.save(
      Task.create({ id: crypto.randomUUID(), userId: otherUser.id, label: "Lire", createdAt: new Date() })
    );

    const result = await repository.findByUserIdAndLabel(userId, "Lire");

    expect(result).toBeNull();
  });

  it("enforces one task per user and label at the database level", async () => {
    const now = new Date();
    await repository.save(Task.create({ id: crypto.randomUUID(), userId, label: "Lire", createdAt: now }));

    await expect(
      repository.save(Task.create({ id: crypto.randomUUID(), userId, label: "lire", createdAt: now }))
    ).rejects.toThrow();
  });

  describe("tags", () => {
    it("defaults to an empty array when omitted", async () => {
      const task = Task.create({ id: crypto.randomUUID(), userId, label: "Lire", createdAt: new Date() });
      await repository.save(task);

      const found = await repository.findById(task.id);

      expect(found?.tags).toEqual([]);
    });

    it("round-trips tags on save and find", async () => {
      const task = Task.create({
        id: crypto.randomUUID(),
        userId,
        label: "Faire la vaisselle",
        tags: ["corvées", "maison"],
        createdAt: new Date(),
      });
      await repository.save(task);

      const found = await repository.findById(task.id);

      expect(found?.tags).toEqual(["corvées", "maison"]);
    });

    it("persists updated tags when saving over an existing id", async () => {
      const id = crypto.randomUUID();
      await repository.save(
        Task.create({ id, userId, label: "Faire la vaisselle", tags: ["corvées"], createdAt: new Date() })
      );

      await repository.save(
        Task.create({
          id,
          userId,
          label: "Faire la vaisselle",
          tags: ["corvées", "maison"],
          createdAt: new Date(),
        })
      );
      const found = await repository.findById(id);

      expect(found?.tags).toEqual(["corvées", "maison"]);
    });
  });

  describe("findById", () => {
    it("returns null when no task matches the id", async () => {
      const result = await repository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it("finds a task by id", async () => {
      const task = Task.create({ id: crypto.randomUUID(), userId, label: "Lire", createdAt: new Date() });
      await repository.save(task);

      const found = await repository.findById(task.id);

      expect(found).toBeInstanceOf(Task);
      expect(found?.id).toBe(task.id);
    });
  });

  describe("findAllByUserId", () => {
    it("returns an empty array when the user has no task", async () => {
      const result = await repository.findAllByUserId(userId);
      expect(result).toEqual([]);
    });

    it("returns only the requesting user's tasks", async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
      });
      await repository.save(Task.create({ id: crypto.randomUUID(), userId, label: "Lire", createdAt: new Date() }));
      await repository.save(Task.create({ id: crypto.randomUUID(), userId, label: "Courir", createdAt: new Date() }));
      await repository.save(
        Task.create({ id: crypto.randomUUID(), userId: otherUser.id, label: "Lire", createdAt: new Date() })
      );

      const result = await repository.findAllByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result.every((task) => task.userId === userId)).toBe(true);
    });
  });

  describe("findAll", () => {
    it("includes tasks across every user", async () => {
      const otherUser = await prisma.user.create({
        data: { email: `all-${crypto.randomUUID()}${EMAIL_SUFFIX}`, timezone: "Europe/Paris" },
      });
      const taskA = Task.create({ id: crypto.randomUUID(), userId, label: "Lire", createdAt: new Date() });
      const taskB = Task.create({
        id: crypto.randomUUID(),
        userId: otherUser.id,
        label: "Courir",
        createdAt: new Date(),
      });
      await repository.save(taskA);
      await repository.save(taskB);

      const result = await repository.findAll();
      const ids = result.map((task) => task.id);

      expect(ids).toEqual(expect.arrayContaining([taskA.id, taskB.id]));
    });
  });
});
