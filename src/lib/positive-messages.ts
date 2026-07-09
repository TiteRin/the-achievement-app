const POSITIVE_MESSAGES = [
  "Génial !",
  "Félicitations !",
  "Incroyable !",
  "Superbe !",
  "Bravo !",
  "Awesome!",
  "Terrific!",
  "Incredible!",
] as const;

export function randomPositiveMessage(): string {
  const index = Math.floor(Math.random() * POSITIVE_MESSAGES.length);
  return POSITIVE_MESSAGES[index];
}
