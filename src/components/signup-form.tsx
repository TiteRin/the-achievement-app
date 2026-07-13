"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "@/app/signup/actions";
import { TimezoneField } from "@/components/timezone-field";
import { AuthTextField } from "@/components/auth-text-field";
import { FormError } from "@/components/form-error";

const initialState: SignupState = { error: null };

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <AuthTextField type="email" name="email" required placeholder="Email" aria-label="Email" />
      <AuthTextField
        type="password"
        name="password"
        required
        minLength={8}
        placeholder="Mot de passe (8 caractères min.)"
        aria-label="Mot de passe"
      />
      <TimezoneField />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-cozy-coral px-6 py-3 font-semibold text-white shadow-md shadow-cozy-coral/30 disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-cozy-brown-soft">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-cozy-coral">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
