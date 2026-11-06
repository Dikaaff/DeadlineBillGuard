import { expect, test, type Page } from "@playwright/test";

const DEMO_EMAIL = "you@billguard.app";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Name").fill("Playwright Runner");
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page).toHaveURL(/\/app\/?$/, { timeout: 30_000 });
}

/** Reminder switches save automatically; wait for the inline "Saved" status. */
async function expectSaved(page: Page) {
  await expect(page.getByRole("status")).toContainText("Saved", { timeout: 30_000 });
}

async function setReminders(page: Page, prefs: { enabled: boolean; hour?: string }) {
  const toggle = page.getByRole("switch", { name: "Email reminders" });
  const isOn = (await toggle.getAttribute("aria-checked")) === "true";
  if (isOn !== prefs.enabled) {
    await toggle.click();
    await expectSaved(page);
  }
  if (prefs.hour) {
    await page.getByRole("combobox", { name: "Send at" }).click();
    const option = page.getByRole("option", { name: prefs.hour });
    // Re-selecting the current value fires no change event (and no auto-save), so skip it.
    if ((await option.getAttribute("aria-selected")) === "true") {
      await page.keyboard.press("Escape");
    } else {
      await option.click();
      await expectSaved(page);
    }
  }
}

test("create, pay and delete a bill", async ({ page }) => {
  await signIn(page);

  const merchant = `Playwright ${Date.now()}`;

  await page.goto("/app/bills/new");
  await page.getByLabel("Merchant").fill(merchant);
  await page.getByLabel("Amount", { exact: true }).fill("7.77");
  await page.getByLabel("Due date").fill("2026-12-30");
  await page.getByRole("button", { name: "Add bill" }).click();

  await expect(page).toHaveURL(/\/app\/bills\/bill_[^/?]+$/);
  await expect(page.getByRole("heading", { name: merchant })).toBeVisible();

  // Pay through the demo PayPal checkout (SIM- orders, no credentials needed).
  await page.getByRole("button", { name: /with PayPal/ }).click();
  await expect(page).toHaveURL(/\/app\/checkout\/SIM-/, { timeout: 30_000 });
  await expect(page.getByRole("button", { name: /Approve payment/ })).toBeVisible();

  await page.getByRole("button", { name: /Approve payment/ }).click();
  await expect(page).toHaveURL(/paypal=success/, { timeout: 30_000 });
  await expect(page.getByText("Payment captured")).toBeVisible();
  await expect(page.getByText(/^Capture CAP-SIM-/)).toBeVisible();

  // Delete goes through a confirm dialog.
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete bill" }).click();
  await expect(page).toHaveURL(/\/app\/bills$/);
  await expect(page.getByText(merchant)).toHaveCount(0);
});

test("reminder settings persist and drive new reminder times", async ({ page }) => {
  await signIn(page);
  await page.goto("/app/settings");

  // Normalise first: earlier runs or manual poking may have paused reminders.
  await setReminders(page, { enabled: true });

  // 1. Send time moves to 07:00 and survives a reload.
  await setReminders(page, { enabled: true, hour: "07:00" });
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Send at" })).toContainText("07:00");

  // 2. A bill created now gets reminders at the configured hour.
  const merchant = `Reminder ${Date.now()}`;
  await page.goto("/app/bills/new");
  await page.getByLabel("Merchant").fill(merchant);
  await page.getByLabel("Amount", { exact: true }).fill("12.00");
  await page.getByLabel("Due date").fill("2026-12-30");
  await page.getByRole("button", { name: "Add bill" }).click();
  await expect(page).toHaveURL(/\/app\/bills\/bill_[^/?]+$/);
  await expect(page.getByText("7:00 AM").first()).toBeVisible();

  // Clean up the throwaway bill.
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete bill" }).click();
  await expect(page).toHaveURL(/\/app\/bills$/);

  // 3. Pausing reminders persists too, then everything is restored.
  await page.goto("/app/settings");
  await setReminders(page, { enabled: false });
  await page.reload();
  await expect(page.getByRole("switch", { name: "Email reminders" })).toHaveAttribute(
    "aria-checked",
    "false",
  );

  await setReminders(page, { enabled: true, hour: "09:00" });
  await page.reload();
  await expect(page.getByRole("switch", { name: "Email reminders" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
