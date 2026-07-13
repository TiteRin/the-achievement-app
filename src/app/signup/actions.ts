"use server";

import { getTranslations } from "next-intl/server";
import { registerUser, EmailAlreadyRegisteredError } from "@/infrastructure/auth/register-user";
import { prisma } from "@/infrastructure/prisma/client";
import { signIn } from "@/infrastructure/auth/auth";

export type SignupState = { error: string | null };

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const t = await getTranslations("auth.errors");
  const email = formData.get("email");
  const password = formData.get("password");
  const timezone = formData.get("timezone");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof timezone !== "string" ||
    !email ||
    !timezone
  ) {
    return { error: t("invalidForm") };
  }
  if (password.length < 8) {
    return { error: t("passwordTooShort") };
  }

  try {
    await registerUser(prisma, { email, password, timezone, now: new Date() });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return { error: t("emailAlreadyRegistered") };
    }
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/" });
  return { error: null };
}
