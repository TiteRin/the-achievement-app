"use server";

import { refresh } from "next/cache";
import { auth, signOut } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaTaskRepository } from "@/infrastructure/prisma/prisma-task.repository";
import { PrismaTaskLogRepository } from "@/infrastructure/prisma/prisma-task-log.repository";
import { logTask, type LoggedTaskDto } from "@/application/log-task.usecase";
import { removeTodayLog } from "@/application/remove-today-log.usecase";

const taskRepository = new PrismaTaskRepository(prisma);
const taskLogRepository = new PrismaTaskLogRepository(prisma);

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function logTaskAction(label: string): Promise<LoggedTaskDto> {
  const session = await requireSession();

  const result = await logTask(taskRepository, taskLogRepository, {
    userId: session.user.id,
    timezone: session.user.timezone,
    label,
    now: new Date(),
  });

  refresh();
  return result;
}

export async function removeTodayLogAction(logId: string): Promise<void> {
  const session = await requireSession();

  await removeTodayLog(taskRepository, taskLogRepository, {
    userId: session.user.id,
    logId,
    timezone: session.user.timezone,
    now: new Date(),
  });

  refresh();
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
