"use client";

import { motion } from "motion/react";

export type LoggedTask = { id: string; label: string; count: number };

export function TaskListItem({
  task,
  onDelete,
}: {
  task: LoggedTask;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="flex items-center justify-between gap-3 rounded-2xl bg-cozy-surface px-4 py-3 shadow-sm shadow-cozy-brown/5"
    >
      <span className="flex items-center gap-2 text-cozy-brown">
        {task.label}
        {task.count > 1 && (
          <span className="rounded-full bg-cozy-coral-soft px-2 py-0.5 text-xs font-semibold text-cozy-coral">
            x{task.count}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label={`Supprimer ${task.label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-cozy-brown-soft transition-colors hover:bg-cozy-cream-soft hover:text-cozy-coral"
      >
        ×
      </button>
    </motion.li>
  );
}
