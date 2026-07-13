"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { TaskInput } from "@/components/task-input";
import { DailyCounter } from "@/components/daily-counter";
import { TaskListItem, type LoggedTask } from "@/components/task-list-item";
import { FeedbackMessage, type FeedbackToast } from "@/components/feedback-message";
import { CelebrationAnimation } from "@/components/celebration-animation";
import { SignOutButton } from "@/components/sign-out-button";
import { labelKey } from "@/domain/task/label";
import { extractTags, mergeTags } from "@/domain/task/tag";
import { randomPositiveMessage } from "@/lib/positive-messages";
import { logTaskAction, removeTodayLogAction, viewDayAction } from "@/app/actions";
import type { DayTaskDto, ViewDayDto } from "@/application/view-day.usecase";

type OptimisticAction =
  | { type: "log"; label: string; tags: string[] }
  | { type: "remove"; id: string };

type NavDirection = "previous" | "next";

// `id` is the normalized label key, not the database task id: it's the one
// identity that's already known and stable *before* the server round-trip,
// so the optimistic placeholder and the confirmed server item share the same
// React key instead of being treated as two different list items.
function toLoggedTask(dto: DayTaskDto): LoggedTask {
  return {
    id: labelKey(dto.label),
    label: dto.label,
    count: dto.count,
    latestLogId: dto.latestLogId,
    tags: dto.tags,
  };
}

function reducer(state: LoggedTask[], action: OptimisticAction): LoggedTask[] {
  if (action.type === "log") {
    const key = labelKey(action.label);
    const existing = state.find((task) => task.id === key);
    if (existing) {
      return state.map((task) =>
        task.id === key
          ? { ...task, count: task.count + 1, tags: mergeTags(task.tags, action.tags) }
          : task
      );
    }
    return [
      { id: key, label: action.label, count: 1, latestLogId: "", tags: action.tags },
      ...state,
    ];
  }

  return state
    .map((task) =>
      task.id === action.id ? { ...task, count: task.count - 1 } : task
    )
    .filter((task) => task.count > 0);
}

function NavArrow({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: NavDirection;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cozy-brown-soft transition-colors hover:bg-cozy-cream-soft hover:text-cozy-coral disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d={direction === "previous" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function DailyLogBoard({
  initialView,
  isAdmin,
  themeToggle,
  localeToggle,
}: {
  initialView: ViewDayDto;
  isAdmin: boolean;
  themeToggle: React.ReactNode;
  localeToggle: React.ReactNode;
}) {
  // `initialView` is only ever the *today* view (see page.tsx) and stays
  // live across re-renders (logTaskAction/removeTodayLogAction call
  // `refresh()` server-side, which re-fetches it) — so it must keep being
  // used directly rather than copied into local state once, which would
  // freeze it after the first render. `navigatedView` holds a past day's
  // data instead, fetched on demand, and is cleared back to null whenever
  // navigation returns to today so that source-of-truth handoff happens
  // automatically instead of needing to sync two pieces of state.
  const [navigatedView, setNavigatedView] = useState<ViewDayDto | null>(null);
  const dayView = navigatedView ?? initialView;
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    dayView.tasks.map(toLoggedTask),
    reducer
  );
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<FeedbackToast | null>(null);
  const [burstId, setBurstId] = useState<number | null>(null);
  const [navDirection, setNavDirection] = useState<NavDirection>("next");

  const t = useTranslations("board");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const positiveMessages = t.raw("positiveMessages") as string[];

  const dailyTotal = optimisticTasks.reduce((sum, task) => sum + task.count, 0);

  // Explicit UTC formatting of a UTC midnight instant so the displayed date
  // never shifts by a day depending on the *browser's* local timezone —
  // `dayView.day` is already the correct calendar date, resolved server-side.
  const dayLabel = format.dateTime(new Date(`${dayView.day}T00:00:00Z`), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const capitalizedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

  const handleLog = useCallback(
    (rawLabel: string) => {
      const { label, tags } = extractTags(rawLabel);
      if (!label) return;

      const eventId = Date.now();
      setToast({ id: eventId, text: randomPositiveMessage(positiveMessages) });
      setBurstId(eventId);

      startTransition(async () => {
        applyOptimistic({ type: "log", label, tags });
        await logTaskAction(rawLabel);
      });
    },
    [applyOptimistic, positiveMessages]
  );

  const handleDelete = useCallback(
    (task: LoggedTask) => {
      startTransition(async () => {
        applyOptimistic({ type: "remove", id: task.id });
        if (task.latestLogId) await removeTodayLogAction(task.latestLogId);
      });
    },
    [applyOptimistic]
  );

  const navigateDay = useCallback(
    (direction: NavDirection) => {
      const targetDay = direction === "previous" ? dayView.previousDay : dayView.nextDay;
      if (!targetDay) return;

      setNavDirection(direction);
      startTransition(async () => {
        const next = await viewDayAction(targetDay);
        setNavigatedView(next.isToday ? null : next);
      });
    },
    [dayView.previousDay, dayView.nextDay]
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col items-center gap-4">
        <div className="flex w-full justify-end gap-2">
          {localeToggle}
          {themeToggle}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cozy-brown">{tCommon("appName")}</h1>
          <p className="text-sm text-cozy-brown-soft">{tCommon("boardTagline")}</p>
        </div>
        <DailyCounter
          label={t("victoryCount", { count: dailyTotal, when: dayView.isToday ? "today" : "past" })}
          count={dailyTotal}
        />
      </header>

      <div className="flex items-center gap-2">
        {dayView.previousDay && (
          <NavArrow
            direction="previous"
            label={t("previousDay")}
            onClick={() => navigateDay("previous")}
            disabled={isPending}
          />
        )}

        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={dayView.day}
              initial={{ x: navDirection === "next" ? 24 : -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: navDirection === "next" ? -24 : 24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {dayView.isToday ? (
                <TaskInput onSubmit={handleLog} />
              ) : (
                <p className="rounded-full bg-cozy-surface px-5 py-3 text-center text-cozy-brown shadow-inner shadow-cozy-brown/5">
                  {capitalizedDayLabel}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
          {dayView.isToday && <CelebrationAnimation burstId={burstId} />}
        </div>

        {dayView.nextDay && (
          <NavArrow
            direction="next"
            label={t("nextDay")}
            onClick={() => navigateDay("next")}
            disabled={isPending}
          />
        )}
      </div>

      <FeedbackMessage toast={toast} onDismiss={() => setToast(null)} />

      <motion.ul layout className="flex flex-col gap-2">
        {optimisticTasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onDelete={dayView.isToday ? handleDelete : undefined}
          />
        ))}
      </motion.ul>

      {optimisticTasks.length === 0 && (
        <p className="text-center text-sm text-cozy-brown-soft">{t("empty")}</p>
      )}

      <footer className="mt-auto flex flex-col items-center gap-2 pt-6">
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-cozy-brown-soft underline decoration-dotted underline-offset-4 hover:text-cozy-coral"
          >
            {tCommon("backOffice")}
          </Link>
        )}
        <SignOutButton />
      </footer>
    </div>
  );
}
