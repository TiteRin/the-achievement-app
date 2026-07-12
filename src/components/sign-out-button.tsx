import { signOutAction } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-sm text-cozy-brown-soft underline decoration-dotted underline-offset-4 hover:text-cozy-coral"
      >
        Se déconnecter
      </button>
    </form>
  );
}
