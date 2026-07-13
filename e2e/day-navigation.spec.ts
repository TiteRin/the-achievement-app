import { test, expect } from "@playwright/test";
import { Client } from "pg";

const email = `e2e-day-nav-${Date.now()}@playwright.test.local`;
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
    client.query("DELETE FROM users WHERE email = $1", [email]).then(() => undefined)
  );
});

test("navigates to a past day, skipping empty days, with logging disabled there", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL("/");

  const input = page.getByLabel("Nouvelle tâche accomplie");
  await input.fill("Boire de l'eau");
  await page.getByRole("button", { name: "C'est fait !" }).click();
  await expect(page.getByText("Boire de l'eau")).toBeVisible();

  // Backdate a log to 5 days ago on the same task, so there's exactly one
  // non-empty past day to navigate to (the days in between stay empty).
  await withDb((client) =>
    client
      .query(
        `INSERT INTO task_logs (id, "taskId", "loggedAt")
         SELECT gen_random_uuid(), t.id, now() - interval '5 days'
         FROM tasks t JOIN users u ON u.id = t."userId"
         WHERE u.email = $1`,
        [email]
      )
      .then(() => undefined)
  );

  await page.reload();

  const previousDayButton = page.getByRole("button", { name: "Jour précédent" });
  await expect(previousDayButton).toBeVisible();
  await expect(page.getByRole("button", { name: "Jour suivant" })).toHaveCount(0);

  await previousDayButton.click();

  // The input is gone, replaced by a date; the task is visible but not
  // deletable (past logs are immutable).
  await expect(input).toHaveCount(0);
  await expect(page.getByText("Boire de l'eau")).toBeVisible();
  await expect(page.getByRole("button", { name: "Supprimer Boire de l'eau" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Jour précédent" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Jour suivant" })).toBeVisible();

  await page.getByRole("button", { name: "Jour suivant" }).click();

  // Back to today: input and delete button return.
  await expect(page.getByLabel("Nouvelle tâche accomplie")).toBeVisible();
  await expect(page.getByRole("button", { name: "Supprimer Boire de l'eau" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jour suivant" })).toHaveCount(0);
});
