"use client";

import { useState } from "react";
import { motion } from "motion/react";

export function TaskInput({
  onSubmit,
}: {
  onSubmit: (label: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Qu'as-tu fait ?"
        aria-label="Nouvelle tâche accomplie"
        className="flex-1 rounded-full bg-cozy-surface px-5 py-3 text-cozy-brown placeholder:text-cozy-brown-soft shadow-inner shadow-cozy-brown/5 outline-none ring-2 ring-transparent focus:ring-cozy-coral transition-shadow"
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.92 }}
        className="whitespace-nowrap rounded-full bg-cozy-coral px-5 py-3 font-semibold text-cozy-cream shadow-md shadow-cozy-coral/30"
      >
        C&apos;est fait !
      </motion.button>
    </form>
  );
}
