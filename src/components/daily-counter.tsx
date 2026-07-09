"use client";

import { motion, AnimatePresence } from "motion/react";

export function DailyCounter({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-cozy-sage-soft shadow-inner shadow-cozy-sage/20">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ scale: 0.5, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-4xl font-bold text-cozy-sage"
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="text-sm font-medium text-cozy-brown-soft">
        {count <= 1 ? "victoire aujourd'hui" : "victoires aujourd'hui"}
      </p>
    </div>
  );
}
