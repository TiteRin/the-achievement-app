import type { InputHTMLAttributes } from "react";

export function AuthTextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-full bg-cozy-surface px-5 py-3 text-cozy-brown placeholder:text-cozy-brown-soft shadow-inner shadow-cozy-brown/5 outline-none ring-2 ring-transparent focus:ring-cozy-coral transition-shadow"
    />
  );
}
