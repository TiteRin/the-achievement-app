"use client";

import { motion, AnimatePresence } from "motion/react";

const SPARKLES = ["✨", "🌟", "🎉", "💫", "⭐"];

function particleOffset(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2;
  const distance = 46 + (index % 3) * 10;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

export function CelebrationAnimation({ burstId }: { burstId: number | null }) {
  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <AnimatePresence>
        {burstId !== null && (
          <motion.div key={burstId} className="relative h-0 w-0">
            {particles.map((i) => {
              const { x, y } = particleOffset(i, particles.length);
              return (
                <motion.span
                  key={i}
                  className="absolute text-xl"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                  animate={{ x, y, opacity: 0, scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  {SPARKLES[i % SPARKLES.length]}
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
