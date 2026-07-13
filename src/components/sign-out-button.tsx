"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "@/app/actions";

export function SignOutButton() {
  const t = useTranslations("common");

  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-sm text-cozy-brown-soft underline decoration-dotted underline-offset-4 hover:text-cozy-coral"
      >
        {t("signOut")}
      </button>
    </form>
  );
}
