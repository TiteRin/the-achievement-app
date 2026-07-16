"use server";

import { refresh } from "next/cache";
import { auth, signOut } from "@/infrastructure/auth/auth";
import { taskRepository, taskLogRepository } from "@/infrastructure/prisma/repositories";
import { logTask, type LoggedTaskDto } from "@/application/log-task.usecase";
import { removeTodayLog } from "@/application/remove-today-log.usecase";
import { viewDay, type ViewDayDto } from "@/application/view-day.usecase";
import { listAllTasks, type ListAllTasksDto } from "@/application/list-all-tasks.usecase";

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

export async function viewDayAction(day: string): Promise<ViewDayDto> {
  const session = await requireSession();

  return viewDay(taskRepository, taskLogRepository, {
    userId: session.user.id,
    timezone: session.user.timezone,
    now: new Date(),
    day,
  });
}

export async function listAllTasksAction(): Promise<ListAllTasksDto> {
  const session = await requireSession();

  return listAllTasks(taskRepository, taskLogRepository, {
    userId: session.user.id,
    timezone: session.user.timezone,
  });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
