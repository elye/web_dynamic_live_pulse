import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("slider simulator previews up to 300 high-biased participants", async ({
  page,
}) => {
  await gotoStudio(page);
  await page
    .locator(".rail-heading")
    .getByRole("button", { name: "Add question", exact: true })
    .click();
  await page.getByRole("button", { name: /Slider/ }).click();
  await page.getByRole("button", { name: "Save question", exact: true }).click();
  await page
    .getByRole("button", { name: "Simulate slider", exact: true })
    .click();

  const dialog = page.getByRole("dialog", { name: "Slider simulator" });
  const participants = dialog.getByRole("slider", {
    name: "Participants",
    exact: true,
  });
  await participants.fill("300");
  await expect(
    dialog.getByText("300 sample participants", { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator(".slider-dot")).toHaveCount(300);

  const average = await dialog.locator(".slider-average strong").textContent();
  expect(Number(average?.replace("Average: ", ""))).toBeGreaterThan(6);
});