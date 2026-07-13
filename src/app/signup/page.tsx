import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/signup-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { readThemePreference } from "@/lib/theme.server";
import { readLocalePreference } from "@/lib/locale.server";

export default async function SignupPage() {
  const theme = await readThemePreference();
  const localePreference = await readLocalePreference();
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-cozy-cream px-5 py-8">
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <LocaleToggle initial={localePreference} />
        <ThemeToggle initial={theme} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-cozy-brown">{t("signup.title")}</h1>
        <p className="text-sm text-cozy-brown-soft">{tCommon("boardTagline")}</p>
      </div>
      <SignupForm />
    </main>
  );
}
