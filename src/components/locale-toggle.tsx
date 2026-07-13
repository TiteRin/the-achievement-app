"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyLocale, type LocalePreference } from "@/lib/locale";

const OPTIONS: { value: LocalePreference; label: string }[] = [
  { value: "system", label: "Système / System" },
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 12h17M12 3.5c2.5 2.3 3.9 5.3 3.9 8.5s-1.4 6.2-3.9 8.5c-2.5-2.3-3.9-5.3-3.9-8.5S9.5 5.8 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LocaleToggle({ initial }: { initial: LocalePreference }) {
  const [preference, setPreference] = useState(initial);
  const router = useRouter();

  function select(next: LocalePreference) {
    setPreference(next);
    applyLocale(next);
    // Unlike the theme toggle, the choice here changes server-rendered
    // content (translated strings, formatted dates) rather than a CSS
    // custom property, so it needs an actual refetch to take effect.
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className="inline-flex items-center gap-0.5 rounded-full bg-cozy-cream-soft p-1"
    >
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => select(option.value)}
            className={`flex h-7 items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-cozy-surface text-cozy-coral shadow-sm"
                : "text-cozy-brown-soft hover:text-cozy-coral"
            }`}
          >
            {option.value === "system" ? <GlobeIcon /> : option.value.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
