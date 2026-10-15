import { expect, test } from "./helpers/test";
import { gotoStudio, openStudio } from "./helpers/studio";

test("edit, duplicate, reorder, delete, and save a question on a LAN-compatible host", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    }),
  );
  await gotoStudio(page);
  await expect(
    page.getByRole("button", { name: "Present live", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Edit question", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your question", exact: true })
    .fill("What brings you energy today?");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "What brings you energy today?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Move question down", exact: true })
    .click();
  await expect(
    page.locator(".question-thumbnail.selected .thumbnail-number"),
  ).toHaveText("03");
  await page
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(4);
  await page.getByRole("button", { name: "peach theme", exact: true }).click();
  await page.reload();
  await openStudio(page);
  await expect(page.locator(".question-stage")).toHaveClass(/theme-peach/);
  await expect(
    page.getByRole("heading", {
      name: "What brings you energy today?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: /Quiz A correct answer/ }).click();
  await page.getByLabel("Option 1", { exact: true }).fill("Updated answer");
  await page.getByLabel("Option 1 is correct", { exact: true }).check();
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(5);
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByRole("button", { name: /The big team quiz/ }).click();
  await expect(page.getByLabel("Session title", { exact: true })).toHaveValue(
    "The big team quiz",
  );
  await expect(page.locator(".question-thumbnail")).toHaveCount(3);
});
