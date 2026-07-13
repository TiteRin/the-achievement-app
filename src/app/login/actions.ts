"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/infrastructure/auth/auth";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const t = await getTranslations("auth.errors");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: t("invalidForm") };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("invalidCredentials") };
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
  const t = await getTranslations("auth.errors");
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { error: t("invalidForm") };
  }

  try {
    await signIn("nodemailer", { email, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("genericError") };
    }
    throw error;
  }

  return { error: null };
}
