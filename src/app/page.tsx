import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaTaskRepository } from "@/infrastructure/prisma/prisma-task.repository";
import { PrismaTaskLogRepository } from "@/infrastructure/prisma/prisma-task-log.repository";
import { listTodayTasks } from "@/application/list-today-tasks.usecase";
import { DailyLogBoard } from "@/components/daily-log-board";
import { ThemeToggle } from "@/components/theme-toggle";
import { readThemePreference } from "@/lib/theme.server";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const taskRepository = new PrismaTaskRepository(prisma);
  const taskLogRepository = new PrismaTaskLogRepository(prisma);
  const todayTasks = await listTodayTasks(taskRepository, taskLogRepository, {
    userId: session.user.id,
    timezone: session.user.timezone,
    now: new Date(),
  });
  const theme = await readThemePreference();

  return (
    <main className="flex flex-1 flex-col bg-cozy-cream">
      <DailyLogBoard
        initialTasks={todayTasks}
        isAdmin={session.user.role === "admin"}
        themeToggle={<ThemeToggle initial={theme} />}
      />
    </main>
  );
}
