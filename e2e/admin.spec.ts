import { test, expect } from "@playwright/test";
import { Client } from "pg";

const adminEmail = `e2e-admin-${Date.now()}@playwright.test.local`;
const regularEmail = `e2e-regular-${Date.now()}@playwright.test.local`;
const password = "correcthorsebatterystaple";

async function withDb(fn: (client: Client) => Promise<void>) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end();
  }
}

test.afterAll(async () => {
  await withDb((client) =>
    client
      .query("DELETE FROM users WHERE email = ANY($1)", [[adminEmail, regularEmail]])
      .then(() => undefined)
  );
});

test("redirects a non-admin user away from /admin", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(regularEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Back-office" })).toHaveCount(0);

  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("lets an admin view accounts and tasks", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(adminEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL("/");

  await withDb((client) =>
    client
      .query("UPDATE users SET role = 'admin' WHERE email = $1", [adminEmail])
      .then(() => undefined)
  );

  // The role is baked into the JWT at sign-in, so it only takes effect
  // after signing out and back in.
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Email", { exact: true }).fill(adminEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");

  await page.getByLabel("Nouvelle tâche accomplie").fill("Faire la vaisselle #corvées");
  await page.getByRole("button", { name: "C'est fait !" }).click();
  await expect(page.getByText("Faire la vaisselle")).toBeVisible();

  await page.getByRole("link", { name: "Back-office" }).click();
  await expect(page).toHaveURL("/admin/accounts");
  await expect(page.getByText(adminEmail)).toBeVisible();

  await page.getByRole("link", { name: "Tâches" }).click();
  await expect(page).toHaveURL("/admin/tasks");
  const row = page.getByRole("row").filter({ hasText: "Faire la vaisselle" });
  await expect(row.getByText("#corvées")).toBeVisible();
});
