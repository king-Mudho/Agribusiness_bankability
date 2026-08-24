import { expect, test } from "@playwright/test";

test("offline scenario: answer mid-wizard while offline, reconnect, sync and submit successfully", async ({
  page,
  context,
}) => {
  await page.goto("/assessment/new");
  // A cold Next.js dev server compiles /assessment/new and /assessment/[id]
  // on demand on the very first hit, which can exceed the default 5s expect
  // timeout -- match the longer timeout used for the other cross-navigation
  // assertions below.
  await expect(page).toHaveURL(/\/assessment\/local-/, { timeout: 20000 });

  // Enterprise intake + consent while online -- this is the one moment that
  // needs connectivity to create the backend Enterprise/Assessment (see
  // docs/25_AGENT_EXECUTION_PLAN.md § Open questions, Phase 8 note).
  await page.getByLabel("Firm / organisation name").fill("Offline Test Farm");
  await page.getByLabel("Organisation type").selectOption("COOPERATIVE");
  await page.getByLabel("Value chain").selectOption("GRAIN");
  await page.getByLabel("Province").selectOption("HARARE");
  await page.getByLabel("Years operating").fill("5");
  await page.getByLabel("Number of workers / members").fill("12");
  await page.getByLabel("Turnover band").selectOption("USD_10K_50K");
  await page.getByLabel("Finance required (USD)").fill("20000");
  await page.getByLabel("Finance type sought").selectOption("WORKING_CAPITAL");
  await page.getByLabel("Preferred financier type").selectOption("BANK");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/I have read the above/).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/assessment\/(?!local-)[0-9a-f-]+/, { timeout: 15000 });

  const assessmentUrl = page.url();

  // Go offline mid-wizard.
  await context.setOffline(true);
  await expect(page.getByText(/You're offline/)).toBeVisible();

  // Answer the first two dimensions (8 questions) while offline -- the UI
  // must not block, and answers must not be lost.
  for (let dimension = 0; dimension < 2; dimension++) {
    const radios = page.getByRole("radio", { name: "To a large extent" });
    const count = await radios.count();
    for (let i = 0; i < count; i++) await radios.nth(i).click();
    await page.getByRole("button", { name: "Continue" }).click();
  }

  await expect(page).toHaveURL(assessmentUrl);
  await expect(page.getByRole("heading", { name: "Market Strength" })).toBeVisible();

  // Come back online -- OfflineBanner should flush the queued writes.
  await context.setOffline(false);
  await expect(page.getByText(/You're offline/)).not.toBeVisible({ timeout: 10000 });

  // Finish the remaining four dimensions, gates, and submit.
  for (let dimension = 0; dimension < 4; dimension++) {
    const radios = page.getByRole("radio", { name: "To a large extent" });
    const count = await radios.count();
    for (let i = 0; i < count; i++) await radios.nth(i).click();
    await page.getByRole("button", { name: "Continue" }).click();
  }
  const passRadios = page.getByRole("radio", { name: "Pass", exact: true });
  const gateCount = await passRadios.count();
  for (let i = 0; i < gateCount; i++) await passRadios.nth(i).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Review step must show every question answered (none lost from the
  // offline portion) before submit is enabled.
  await expect(page.getByText(/question\(s\) still need an answer/)).not.toBeVisible();
  const submitButton = page.getByRole("button", { name: "Submit assessment" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page).toHaveURL(/\/results\//, { timeout: 15000 });
  // All 24 answers were "To a large extent" (score_value 75) -> ABI 75.
  await expect(page.getByText("75", { exact: true }).first()).toBeVisible();
});
