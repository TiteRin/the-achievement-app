import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { PrismaTaskRepository } from "@/infrastructure/prisma/prisma-task.repository";
import { PrismaTaskLogRepository } from "@/infrastructure/prisma/prisma-task-log.repository";

export const userRepository = new PrismaUserRepository(prisma);
export const taskRepository = new PrismaTaskRepository(prisma);
export const taskLogRepository = new PrismaTaskLogRepository(prisma);
