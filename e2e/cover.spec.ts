import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("the background image can open and close the session without a wash", async ({
  page,
}) => {
  await gotoStudio(page);
  await expect(
    page.getByRole("button", { name: "First screen", exact: true }),
  ).toHaveCount(0);
  await page.locator('input[aria-label="Background image"]').setInputFiles({
    name: "bg.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "First screen", exact: true }).click();
  await page.getByRole("button", { name: "Last screen", exact: true }).click();
  await page.getByRole("button", { name: "Present live", exact: true }).click();

  const cover = page.locator(".stage-cover");
  const lobby = page.locator(".host-lobby");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveCSS("background-image", /url\("blob:/);
  await expect(cover).toHaveCSS("opacity", "1");
  await expect(lobby).toBeAttached();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(cover).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Start questions", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start questions", exact: true })
    .click();

  const advance = page.locator(".live-controls .button.primary");
  const reveal = page.getByRole("button", {
    name: "Reveal the final podium",
    exact: true,
  });
  await expect(async () => {
    if (await reveal.isVisible()) await reveal.click();
    else if (await advance.isEnabled()) {
      if (/closing image/i.test((await advance.textContent()) ?? "")) return;
      await advance.click();
    }
    await expect(advance).toHaveText(/Show closing image/, { timeout: 500 });
  }).toPass({ timeout: 30000 });
  await expect(advance).toHaveText(/Show closing image/);
  await advance.click();
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAccessibleName("Closing image");
  await expect(advance).toHaveText(/Finish session/);

  await page
    .getByRole("button", { name: "Previous question", exact: true })
    .first()
    .click();
  await expect(cover).toBeHidden();
});
