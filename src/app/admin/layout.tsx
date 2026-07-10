import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cozy-cream">
      <header className="flex items-center justify-between border-b border-cozy-brown/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-cozy-brown">Back-office</span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin/accounts"
              className="text-cozy-brown-soft hover:text-cozy-coral"
            >
              Comptes
            </Link>
            <Link
              href="/admin/tasks"
              className="text-cozy-brown-soft hover:text-cozy-coral"
            >
              Tâches
            </Link>
          </nav>
        </div>
        <Link href="/" className="text-sm text-cozy-brown-soft hover:text-cozy-coral">
          ← Retour à l&apos;app
        </Link>
      </header>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
