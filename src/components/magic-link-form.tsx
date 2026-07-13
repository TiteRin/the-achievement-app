"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestMagicLinkAction, type MagicLinkState } from "@/app/login/actions";
import { AuthTextField } from "@/components/auth-text-field";
import { FormError } from "@/components/form-error";

const initialState: MagicLinkState = { error: null };

export function MagicLinkForm() {
  const [state, action, pending] = useActionState(requestMagicLinkAction, initialState);
  const t = useTranslations("auth");

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <AuthTextField
        type="email"
        name="email"
        required
        placeholder={t("emailLabel")}
        aria-label={t("magicLink.emailLabel")}
      />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-cozy-coral px-6 py-3 font-semibold text-cozy-coral disabled:opacity-60"
      >
        {pending ? t("magicLink.submitPending") : t("magicLink.submit")}
      </button>
    </form>
  );
}
