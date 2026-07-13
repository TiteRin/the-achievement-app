import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { readThemePreference } from "@/lib/theme.server";
import { resolveLocale } from "@/lib/locale.server";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("appName"),
    description: t("tagline"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await readThemePreference();
  const locale = await resolveLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      // Omitted for "system" on purpose: the CSS media query already
      // handles that case, and omitting the attribute lets the OS
      // preference apply live (e.g. an OS dark-mode schedule) instead of
      // freezing whatever it was at render time.
      data-theme={theme === "system" ? undefined : theme}
      className={`${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
