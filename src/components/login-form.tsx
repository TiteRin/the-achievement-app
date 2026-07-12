"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/login/actions";
import { AuthTextField } from "@/components/auth-text-field";
import { FormError } from "@/components/form-error";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <AuthTextField type="email" name="email" required placeholder="Email" aria-label="Email" />
      <AuthTextField
        type="password"
        name="password"
        required
        placeholder="Mot de passe"
        aria-label="Mot de passe"
      />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-cozy-coral px-6 py-3 font-semibold text-white shadow-md shadow-cozy-coral/30 disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>

      <p className="text-center text-sm text-cozy-brown-soft">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-semibold text-cozy-coral">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
