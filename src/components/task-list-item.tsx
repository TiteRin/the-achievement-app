"use client";

import { motion } from "motion/react";
import { TagList } from "@/components/tag-list";

export type LoggedTask = {
  id: string;
  label: string;
  count: number;
  latestLogId: string;
  tags: string[];
};

export function TaskListItem({
  task,
  onDelete,
}: {
  task: LoggedTask;
  // Omitted entirely (not just disabled) when viewing a past day — past
  // logs are immutable, so offering a delete button that would just fail
  // server-side is worse UX than not showing one.
  onDelete?: (task: LoggedTask) => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="flex flex-col gap-1.5 rounded-2xl bg-cozy-surface px-4 py-3 shadow-sm shadow-cozy-brown/5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-cozy-brown">
          {task.label}
          {task.count > 1 && (
            <span className="rounded-full bg-cozy-coral-soft px-2 py-0.5 text-xs font-semibold text-cozy-coral">
              x{task.count}
            </span>
          )}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Supprimer ${task.label}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-cozy-brown-soft transition-colors hover:bg-cozy-cream-soft hover:text-cozy-coral"
          >
            ×
          </button>
        )}
      </div>
      <TagList tags={task.tags} />
    </motion.li>
  );
}
