import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("multiple option questions can use the simulator", async ({ page }) => {
  await gotoStudio(page);
  await page
    .locator(".rail-heading")
    .getByRole("button", { name: "Add question", exact: true })
    .click();
  await page.getByRole("button", { name: /Quiz A correct answer/ }).click();
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();

  await page
    .getByRole("button", { name: "Switch slides to dark mode" })
    .click();
  await page
    .getByRole("button", { name: "Simulate multiple choice", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Multiple choice simulator",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".modal-heading h2")).toHaveCSS(
    "color",
    "rgb(33, 62, 52)",
  );
  await expect(dialog.locator(".simulation-stage")).toHaveCSS(
    "background-color",
    "rgb(26, 42, 35)",
  );

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
