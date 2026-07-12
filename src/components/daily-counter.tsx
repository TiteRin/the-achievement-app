"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation } from "motion/react";

export function DailyCounter({ count }: { count: number }) {
  const controls = useAnimation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void controls.start({
      scale: [1, 1.25, 1],
      transition: { duration: 0.4, ease: "easeOut" },
    });
  }, [count, controls]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-cozy-sage-soft shadow-inner shadow-cozy-sage/20">
        <motion.span
          data-testid="daily-counter"
          animate={controls}
          className="text-4xl font-bold text-cozy-sage"
        >
          {count}
        </motion.span>
      </div>
      <p className="text-sm font-medium text-cozy-brown-soft">
        {count <= 1 ? "victoire aujourd'hui" : "victoires aujourd'hui"}
      </p>
    </div>
  );
}
