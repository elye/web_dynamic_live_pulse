import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("multiple option questions can use the simulator", async ({ page }) => {
  await gotoStudio(page);
  await page
    .locator(".rail-heading")
    .getByRole("button", { name: "Add question", exact: true })
    .click();
  await page.getByRole("button", { name: /Quiz A correct answer/ }).click();
  await page.getByRole("button", { name: "Save question", exact: true }).click();

  await page
    .getByRole("button", { name: "Simulate multiple choice", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Multiple choice simulator",
  });
  await expect(dialog).toBeVisible();

  const responses = dialog.getByRole("slider", {
    name: "Responses",
    exact: true,
  });
  await expect(responses).toHaveAttribute("max", "300");
  await responses.fill("300");
  await expect(
    dialog.getByText("300 sample players", { exact: true }),
  ).toBeVisible();
});