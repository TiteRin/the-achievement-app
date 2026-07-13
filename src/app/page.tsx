import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { taskRepository, taskLogRepository } from "@/infrastructure/prisma/repositories";
import { viewDay } from "@/application/view-day.usecase";
import { DailyLogBoard } from "@/components/daily-log-board";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { readThemePreference } from "@/lib/theme.server";
import { readLocalePreference } from "@/lib/locale.server";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initialView = await viewDay(taskRepository, taskLogRepository, {
    userId: session.user.id,
    timezone: session.user.timezone,
    now: new Date(),
  });
  const theme = await readThemePreference();
  const localePreference = await readLocalePreference();

  return (
    <main className="flex flex-1 flex-col bg-cozy-cream">
      <DailyLogBoard
        initialView={initialView}
        isAdmin={session.user.role === "admin"}
        themeToggle={<ThemeToggle initial={theme} />}
        localeToggle={<LocaleToggle initial={localePreference} />}
      />
    </main>
  );
}
