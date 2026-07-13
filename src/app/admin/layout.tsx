import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/infrastructure/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { readThemePreference } from "@/lib/theme.server";
import { readLocalePreference } from "@/lib/locale.server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const theme = await readThemePreference();
  const localePreference = await readLocalePreference();
  const tCommon = await getTranslations("common");
  const tAdmin = await getTranslations("admin");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cozy-cream">
      <header className="flex items-center justify-between border-b border-cozy-brown/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-cozy-brown">{tCommon("backOffice")}</span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin/accounts"
              className="text-cozy-brown-soft hover:text-cozy-coral"
            >
              {tAdmin("nav.accounts")}
            </Link>
            <Link
              href="/admin/tasks"
              className="text-cozy-brown-soft hover:text-cozy-coral"
            >
              {tAdmin("nav.tasks")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LocaleToggle initial={localePreference} />
          <ThemeToggle initial={theme} />
          <Link href="/" className="text-sm text-cozy-brown-soft hover:text-cozy-coral">
            {tAdmin("backToApp")}
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
