import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { readThemePreference } from "@/lib/theme.server";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Achievement App",
  description: "Célèbre chaque petite victoire du jour.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await readThemePreference();

  return (
    <html
      lang="fr"
      // Omitted for "system" on purpose: the CSS media query already
      // handles that case, and omitting the attribute lets the OS
      // preference apply live (e.g. an OS dark-mode schedule) instead of
      // freezing whatever it was at render time.
      data-theme={theme === "system" ? undefined : theme}
      className={`${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
