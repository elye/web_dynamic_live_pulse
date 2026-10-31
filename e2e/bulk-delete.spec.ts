import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("selected questions can be deleted in bulk", async ({ page }) => {
  await gotoStudio(page);
  const thumbnails = page.locator(".question-thumbnail");
  const total = await thumbnails.count();
  expect(total).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Select questions" }).click();
  await thumbnails.first().click();
  await expect(thumbnails.first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Delete \(1\)/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete question" })
    .click();
  await expect(thumbnails).toHaveCount(total - 1);

  await page.getByRole("button", { name: "Select questions" }).click();
  await page.getByLabel("Select all").check();
  await page.getByRole("button", { name: /^Delete \(/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete questions" })
    .click();
  await expect(thumbnails).toHaveCount(1);
});

test("selected questions can switch between hide first and show live", async ({
  page,
}) => {
  await gotoStudio(page);
  const thumbnails = page.locator(".question-thumbnail");
  await page.getByRole("button", { name: "Select questions" }).click();
  await page.getByLabel("Select all").check();

  await page.getByRole("button", { name: "Show live", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Responses hidden first" }),
  ).toHaveCount(0);
  const live = await page
    .getByRole("img", { name: "Responses show live" })
    .count();
  expect(live).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Hide first", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Responses show live" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "Responses hidden first" }),
  ).toHaveCount(live);
  await expect(thumbnails.first()).toBeVisible();
});
