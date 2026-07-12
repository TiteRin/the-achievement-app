"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { TaskInput } from "@/components/task-input";
import { DailyCounter } from "@/components/daily-counter";
import { TaskListItem, type LoggedTask } from "@/components/task-list-item";
import { FeedbackMessage, type FeedbackToast } from "@/components/feedback-message";
import { CelebrationAnimation } from "@/components/celebration-animation";
import { SignOutButton } from "@/components/sign-out-button";
import { labelKey, normalizeLabel } from "@/domain/task/label";
import { randomPositiveMessage } from "@/lib/positive-messages";
import { logTaskAction, removeTodayLogAction } from "@/app/actions";
import type { TodayTaskDto } from "@/application/list-today-tasks.usecase";

type OptimisticAction =
  | { type: "log"; label: string }
  | { type: "remove"; id: string };

// `id` is the normalized label key, not the database task id: it's the one
// identity that's already known and stable *before* the server round-trip,
// so the optimistic placeholder and the confirmed server item share the same
// React key instead of being treated as two different list items.
function toLoggedTask(dto: TodayTaskDto): LoggedTask {
  return {
    id: labelKey(dto.label),
    label: dto.label,
    count: dto.countToday,
    latestLogId: dto.latestLogId,
  };
}

function reducer(state: LoggedTask[], action: OptimisticAction): LoggedTask[] {
  if (action.type === "log") {
    const key = labelKey(action.label);
    const existing = state.find((task) => task.id === key);
    if (existing) {
      return state.map((task) =>
        task.id === key ? { ...task, count: task.count + 1 } : task
      );
    }
    return [
      { id: key, label: normalizeLabel(action.label), count: 1, latestLogId: "" },
      ...state,
    ];
  }

  return state
    .map((task) =>
      task.id === action.id ? { ...task, count: task.count - 1 } : task
    )
    .filter((task) => task.count > 0);
}

export function DailyLogBoard({
  initialTasks,
  isAdmin,
  themeToggle,
}: {
  initialTasks: TodayTaskDto[];
  isAdmin: boolean;
  themeToggle: React.ReactNode;
}) {
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    initialTasks.map(toLoggedTask),
    reducer
  );
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<FeedbackToast | null>(null);
  const [burstId, setBurstId] = useState<number | null>(null);

  const dailyTotal = optimisticTasks.reduce((sum, task) => sum + task.count, 0);

  const handleLog = useCallback(
    (label: string) => {
      const eventId = Date.now();
      setToast({ id: eventId, text: randomPositiveMessage() });
      setBurstId(eventId);

      startTransition(async () => {
        applyOptimistic({ type: "log", label });
        await logTaskAction(label);
      });
    },
    [applyOptimistic]
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

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col items-center gap-4">
        <div className="flex w-full justify-end">{themeToggle}</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cozy-brown">
            The Achievement App
          </h1>
          <p className="text-sm text-cozy-brown-soft">
            Chaque petite victoire compte.
          </p>
        </div>
        <DailyCounter count={dailyTotal} />
      </header>

      <div className="relative">
        <TaskInput onSubmit={handleLog} />
        <CelebrationAnimation burstId={burstId} />
      </div>

      <FeedbackMessage toast={toast} onDismiss={() => setToast(null)} />

      <motion.ul layout className="flex flex-col gap-2">
        {optimisticTasks.map((task) => (
          <TaskListItem key={task.id} task={task} onDelete={handleDelete} />
        ))}
      </motion.ul>

      {optimisticTasks.length === 0 && (
        <p className="text-center text-sm text-cozy-brown-soft">
          Rien loggé pour l&apos;instant — commence par une petite victoire ✨
        </p>
      )}

      <footer className="mt-auto flex flex-col items-center gap-2 pt-6">
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-cozy-brown-soft underline decoration-dotted underline-offset-4 hover:text-cozy-coral"
          >
            Back-office
          </Link>
        )}
        <SignOutButton />
      </footer>
    </div>
  );
}
