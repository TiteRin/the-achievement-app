export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p role="alert" className="text-center text-sm text-cozy-coral">
      {message}
    </p>
  );
}
