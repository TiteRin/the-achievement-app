"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export type FeedbackToast = { id: number; text: string };

export function FeedbackMessage({
  toast,
  onDismiss,
}: {
  toast: FeedbackToast | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(onDismiss, 1400);
    return () => clearTimeout(timeout);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-none flex h-14 items-center justify-center"
    >
      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.id}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-2xl font-bold text-cozy-coral"
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
