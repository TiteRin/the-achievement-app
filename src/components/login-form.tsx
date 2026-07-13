"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { loginAction, type LoginState } from "@/app/login/actions";
import { AuthTextField } from "@/components/auth-text-field";
import { FormError } from "@/components/form-error";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const t = useTranslations("auth");

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <AuthTextField
        type="email"
        name="email"
        required
        placeholder={t("emailLabel")}
        aria-label={t("emailLabel")}
      />
      <AuthTextField
        type="password"
        name="password"
        required
        placeholder={t("passwordPlaceholder")}
        aria-label={t("passwordLabel")}
      />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-cozy-coral px-6 py-3 font-semibold text-cozy-cream shadow-md shadow-cozy-coral/30 disabled:opacity-60"
      >
        {pending ? t("login.submitPending") : t("login.submit")}
      </button>

      <p className="text-center text-sm text-cozy-brown-soft">
        {t("login.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-cozy-coral">
          {t("login.createAccount")}
        </Link>
      </p>
    </form>
  );
}
