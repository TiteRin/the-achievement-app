// The message pool itself lives in messages/{locale}.json (board.positiveMessages)
// rather than here, so every piece of user-facing text stays in one place —
// callers fetch it via `t.raw("positiveMessages")` and pass it in. This stays
// a plain array-in, string-out function so it's trivial to test without
// pulling in next-intl.
export function randomPositiveMessage(messages: readonly string[]): string {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}
