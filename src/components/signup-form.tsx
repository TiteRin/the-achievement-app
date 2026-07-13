"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signupAction, type SignupState } from "@/app/signup/actions";
import { TimezoneField } from "@/components/timezone-field";
import { AuthTextField } from "@/components/auth-text-field";
import { FormError } from "@/components/form-error";

const initialState: SignupState = { error: null };

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);
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
        minLength={8}
        placeholder={t("passwordMinPlaceholder")}
        aria-label={t("passwordLabel")}
      />
      <TimezoneField />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-cozy-coral px-6 py-3 font-semibold text-cozy-cream shadow-md shadow-cozy-coral/30 disabled:opacity-60"
      >
        {pending ? t("signup.submitPending") : t("signup.submit")}
      </button>

      <p className="text-center text-sm text-cozy-brown-soft">
        {t("signup.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-cozy-coral">
          {t("signup.login")}
        </Link>
      </p>
    </form>
  );
}
