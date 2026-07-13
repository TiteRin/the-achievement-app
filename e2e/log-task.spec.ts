import { test, expect } from "@playwright/test";
import { Client } from "pg";

const email = `e2e-${Date.now()}@playwright.test.local`;
const password = "correcthorsebatterystaple";
const tagsEmail = `e2e-tags-${Date.now()}@playwright.test.local`;

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DELETE FROM users WHERE email = $1", [email]);
  await client.query("DELETE FROM users WHERE email = $1", [tagsEmail]);
  await client.end();
});

test("signup, log a task twice, delete one occurrence, sign out, sign back in", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(email);
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

  await page.getByLabel("Email", { exact: true }).fill(email);
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

test("extracts #tags from the task text and shows them as chips", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(tagsEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL("/");

  const input = page.getByLabel("Nouvelle tâche accomplie");
  await input.fill("Faire la vaisselle #corvées #maison");
  await page.getByRole("button", { name: "C'est fait !" }).click();

  const item = page.getByRole("listitem").filter({ hasText: "Faire la vaisselle" });
  await expect(item).toBeVisible();
  await expect(item.getByText("#corvées")).toBeVisible();
  await expect(item.getByText("#maison")).toBeVisible();
  // The delete button's aria-label is `Supprimer ${task.label}` — this only
  // matches if the label is exactly "Faire la vaisselle", proving the tags
  // were stripped out rather than leaking into the label text.
  await expect(
    page.getByRole("button", { name: "Supprimer Faire la vaisselle" })
  ).toBeVisible();
});
