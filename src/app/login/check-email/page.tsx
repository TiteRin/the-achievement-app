import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-cozy-cream px-5 py-8 text-center">
      <p className="text-4xl">✨</p>
      <h1 className="text-2xl font-bold text-cozy-brown">Vérifie ta boîte mail</h1>
      <p className="max-w-sm text-sm text-cozy-brown-soft">
        Si un compte existe avec cette adresse, un lien de connexion vient de
        lui être envoyé.
      </p>
      <Link href="/login" className="text-sm font-semibold text-cozy-coral">
        Retour à la connexion
      </Link>
    </main>
  );
}
