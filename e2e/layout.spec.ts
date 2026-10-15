import { expect, test } from "./helpers/test";
import { checkCloudGeometry } from "./helpers/cloud";
import { noOverflow } from "./helpers/layout";
import { gotoStudio } from "./helpers/studio";

for (const width of [390, 768, 1440]) {
  test(`studio and participant join layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await gotoStudio(page);
    await expect(
      page.getByRole("button", { name: "Present live", exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await expect(page.locator(".question-stage")).toBeVisible();
    await checkCloudGeometry(page, 11);
    if (width === 1440)
      expect(
        await page
          .locator(".workspace-photo img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      ).toBe(true);
    await page.screenshot({
      path: `test-results/studio-${width}.png`,
      fullPage: true,
    });
    await page.goto("/join");
    await noOverflow(page);
    await expect(
      page.getByRole("button", { name: "Join the room", exact: true }),
    ).toBeDisabled();
    await page.screenshot({
      path: `test-results/join-${width}.png`,
      fullPage: true,
    });
    await page.getByLabel("Room code", { exact: true }).fill("000000");
    await page.getByLabel("Your name", { exact: true }).fill("Taylor");
    await page
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("Room not found");
  });
}
