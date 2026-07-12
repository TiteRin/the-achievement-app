import { test, expect } from "@playwright/test";

// Only the "unknown email" path is exercised here: it never reaches the
// SMTP transport (see sendMagicLinkEmail), so it's deterministic without a
// real/fake mail server in CI. The "known email actually triggers a send"
// behavior is covered where SMTP is mocked instead:
// tests/infrastructure/auth/send-magic-link-email.test.ts.
test("requesting a magic link lands on the same confirmation page regardless of the email", async ({
  page,
}) => {
  await page.goto("/login");

  await page
    .getByLabel("Email pour le lien de connexion")
    .fill(`unknown-${Date.now()}@playwright.test.local`);
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();

  // Not asserting the URL here on purpose: the redirect chain is
  // Server Action -> /api/auth/verify-request -> pages.verifyRequest. The
  // second hop is a real HTTP 302 (confirmed with curl) and the right page
  // does render, but Next.js's client router doesn't update the visible
  // address bar for this Server-Action-redirect-into-an-API-route case —
  // see CLAUDE.md. The rendered content is what actually matters here.
  await expect(page.getByText("Vérifie ta boîte mail")).toBeVisible();
  await expect(
    page.getByText("Si un compte existe avec cette adresse")
  ).toBeVisible();
});
