import { test, expect } from "@playwright/test";
import { Client } from "pg";

const email = `e2e-${Date.now()}@playwright.test.local`;
const password = "correcthorsebatterystaple";

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DELETE FROM users WHERE email = $1", [email]);
  await client.end();
});

test("signup, log a task twice, delete one occurrence, sign out, sign back in", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("daily-counter")).toHaveText("0");

  const input = page.getByLabel("Nouvelle tâche accomplie");
  const submit = page.getByRole("button", { name: "C'est fait !" });

  await input.fill("Boire de l'eau");
  await submit.click();
  await expect(page.getByText("Boire de l'eau")).toBeVisible();
  await expect(page.getByTestId("daily-counter")).toHaveText("1");

  await input.fill("Boire de l'eau");
  await submit.click();
  await expect(page.getByText("x2")).toBeVisible();
  await expect(page.getByTestId("daily-counter")).toHaveText("2");

  await page.getByRole("button", { name: "Supprimer Boire de l'eau" }).click();
  await expect(page.getByText("x2")).toHaveCount(0);
  await expect(page.getByTestId("daily-counter")).toHaveText("1");

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Boire de l'eau")).toBeVisible();
  await expect(page.getByTestId("daily-counter")).toHaveText("1");
});

test("redirects an unauthenticated visitor from / to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
});
