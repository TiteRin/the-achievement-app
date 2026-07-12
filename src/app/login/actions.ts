"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/infrastructure/auth/auth";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Formulaire invalide." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }

  return { error: null };
}

export type MagicLinkState = { error: string | null };

export async function requestMagicLinkAction(
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { error: "Formulaire invalide." };
  }

  try {
    await signIn("nodemailer", { email, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Une erreur est survenue, réessaie plus tard." };
    }
    throw error;
  }

  return { error: null };
}
