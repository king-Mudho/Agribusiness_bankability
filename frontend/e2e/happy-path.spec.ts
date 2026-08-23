import { expect, test } from "@playwright/test";

test("full assessment happy path: intake -> consent -> 24 questions -> gates -> submit -> results", async ({
  page,
}) => {
  await page.goto("/assessment/new");
  await expect(page).toHaveURL(/\/assessment\/local-/);

  // Step 1: Enterprise intake.
  await page.getByLabel("Firm / organisation name").fill("Playwright Test Farm");
  await page.getByLabel("Organisation type").selectOption("COOPERATIVE");
  await page.getByLabel("Value chain").selectOption("GRAIN");
  await page.getByLabel("Province").selectOption("HARARE");
  await page.getByLabel("District").fill("Chitungwiza");
  await page.getByLabel("Years operating").fill("5");
  await page.getByLabel("Number of workers / members").fill("12");
  await page.getByLabel("Turnover band").selectOption("USD_10K_50K");
  await page.getByLabel("Finance required (USD)").fill("20000");
  await page.getByLabel("Finance type sought").selectOption("WORKING_CAPITAL");
  await page.getByLabel("Preferred financier type").selectOption("BANK");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: Consent.
  await expect(page.getByText("2. Consent")).toBeVisible();
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeDisabled();
  await page.getByLabel(/I have read the above/).click();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  // Should be promoted to a real backend assessment id.
  await expect(page).toHaveURL(/\/assessment\/(?!local-)[0-9a-f-]+/, { timeout: 15000 });

  // Steps 3-8: six dimension screens, four questions each -- answer "To a large extent".
  for (let dimension = 0; dimension < 6; dimension++) {
    const radios = page.getByRole("radio", { name: "To a large extent" });
    const count = await radios.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      await radios.nth(i).click();
    }
    await page.getByRole("button", { name: "Continue" }).click();
  }

  // Step 9: gates & evidence.
  await expect(page.getByText("9. Critical bankability gates")).toBeVisible();
  const passRadios = page.getByRole("radio", { name: "Pass", exact: true });
  const gateCount = await passRadios.count();
  expect(gateCount).toBe(5);
  for (let i = 0; i < gateCount; i++) {
    await passRadios.nth(i).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 10: review & submit.
  await expect(page.getByText("10. Review & submit")).toBeVisible();
  const submitButton = page.getByRole("button", { name: "Submit assessment" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page).toHaveURL(/\/results\//, { timeout: 15000 });

  // Results screen renders real, backend-sourced content -- all responses
  // were "To a large extent" (score_value 75) across the board, so the ABI
  // score must be exactly 75 and the band Finance Ready with Conditions.
  await expect(page.getByText("75", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Finance Ready with Conditions").first()).toBeVisible();
  await expect(page.getByText("Bankability Certificate")).toBeVisible();
  await expect(page.getByText(/Research prototype:/)).toBeVisible();
});
