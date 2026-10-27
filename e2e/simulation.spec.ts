import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("presenting with a simulation fills the lobby with simulated players over about 10 seconds", async ({
  page,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Present with simulation", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("slider", { name: "Simulated players" }).fill("40");
  await dialog
    .getByRole("button", { name: "Present with 40 players", exact: true })
    .click();
  const names = page.locator(".lobby-people li");
  await expect(page.locator(".host-lobby")).toBeVisible();
  expect(await names.count()).toBeLessThan(40);
  await expect(names).toHaveCount(40, { timeout: 15000 });
});
