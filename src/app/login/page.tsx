import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-cozy-cream px-5 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-cozy-brown">Content de te revoir</h1>
        <p className="text-sm text-cozy-brown-soft">
          Chaque petite victoire compte.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
