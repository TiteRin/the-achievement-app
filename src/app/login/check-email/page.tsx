import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function CheckEmailPage() {
  const t = await getTranslations("auth.checkEmail");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-cozy-cream px-5 py-8 text-center">
      <p className="text-4xl">✨</p>
      <h1 className="text-2xl font-bold text-cozy-brown">{t("title")}</h1>
      <p className="max-w-sm text-sm text-cozy-brown-soft">{t("body")}</p>
      <Link href="/login" className="text-sm font-semibold text-cozy-coral">
        {t("backToLogin")}
      </Link>
    </main>
  );
}
