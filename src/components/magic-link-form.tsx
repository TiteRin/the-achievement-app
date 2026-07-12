"use client";

import { useActionState } from "react";
import { requestMagicLinkAction, type MagicLinkState } from "@/app/login/actions";

const initialState: MagicLinkState = { error: null };

export function MagicLinkForm() {
  const [state, action, pending] = useActionState(requestMagicLinkAction, initialState);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input
        type="email"
        name="email"
        required
        placeholder="Email"
        aria-label="Email pour le lien de connexion"
        className="rounded-full bg-cozy-surface px-5 py-3 text-cozy-brown placeholder:text-cozy-brown-soft shadow-inner shadow-cozy-brown/5 outline-none ring-2 ring-transparent focus:ring-cozy-coral transition-shadow"
      />

      {state.error && (
        <p role="alert" className="text-center text-sm text-cozy-coral">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-cozy-coral px-6 py-3 font-semibold text-cozy-coral disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Recevoir un lien de connexion"}
      </button>
    </form>
  );
}
