"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TaskInput } from "@/components/task-input";
import { DailyCounter } from "@/components/daily-counter";
import { TaskListItem, type LoggedTask } from "@/components/task-list-item";
import { FeedbackMessage, type FeedbackToast } from "@/components/feedback-message";
import { CelebrationAnimation } from "@/components/celebration-animation";
import { labelKey, normalizeLabel } from "@/lib/normalize-label";
import { randomPositiveMessage } from "@/lib/positive-messages";

// Mock, in-memory persistence for the Phase 1 visual prototype.
// Replaced by real Server Actions + repositories in later phases.
async function saveLogMock(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 350));
}

export function DailyLogBoard() {
  const [tasks, setTasks] = useState<LoggedTask[]>([]);
  const [toast, setToast] = useState<FeedbackToast | null>(null);
  const [burstId, setBurstId] = useState<number | null>(null);

  const dailyTotal = tasks.reduce((sum, task) => sum + task.count, 0);

  const handleLog = useCallback((rawLabel: string) => {
    const label = normalizeLabel(rawLabel);
    const key = labelKey(label);
    const eventId = Date.now();

    setTasks((current) => {
      const existing = current.find((task) => labelKey(task.label) === key);
      if (existing) {
        return current.map((task) =>
          task.id === existing.id ? { ...task, count: task.count + 1 } : task
        );
      }
      return [{ id: key, label, count: 1 }, ...current];
    });

    setToast({ id: eventId, text: randomPositiveMessage() });
    setBurstId(eventId);

    // Optimistic UI: the entry above is already applied. This call stands
    // in for the future Server Action round-trip.
    void saveLogMock();
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTasks((current) =>
      current
        .map((task) =>
          task.id === id ? { ...task, count: task.count - 1 } : task
        )
        .filter((task) => task.count > 0)
    );
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col items-center gap-4">
        <div>
          <h1 className="text-center text-2xl font-bold text-cozy-brown">
            The Achievement App
          </h1>
          <p className="text-center text-sm text-cozy-brown-soft">
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
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} onDelete={handleDelete} />
          ))}
        </AnimatePresence>
      </motion.ul>

      {tasks.length === 0 && (
        <p className="text-center text-sm text-cozy-brown-soft">
          Rien loggé pour l&apos;instant — commence par une petite victoire ✨
        </p>
      )}
    </div>
  );
}
