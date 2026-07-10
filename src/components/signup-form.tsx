"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "@/app/signup/actions";
import { TimezoneField } from "@/components/timezone-field";

const initialState: SignupState = { error: null };

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input
        type="email"
        name="email"
        required
        placeholder="Email"
        aria-label="Email"
        className="rounded-full bg-cozy-surface px-5 py-3 text-cozy-brown placeholder:text-cozy-brown-soft shadow-inner shadow-cozy-brown/5 outline-none ring-2 ring-transparent focus:ring-cozy-coral transition-shadow"
      />
      <input
        type="password"
        name="password"
        required
        minLength={8}
        placeholder="Mot de passe (8 caractères min.)"
        aria-label="Mot de passe"
        className="rounded-full bg-cozy-surface px-5 py-3 text-cozy-brown placeholder:text-cozy-brown-soft shadow-inner shadow-cozy-brown/5 outline-none ring-2 ring-transparent focus:ring-cozy-coral transition-shadow"
      />
      <TimezoneField />

      {state.error && (
        <p role="alert" className="text-center text-sm text-cozy-coral">
          {state.error}
        </p>
      )}

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
