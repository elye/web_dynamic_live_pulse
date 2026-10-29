import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("full screen shows only the slide, with session data on it", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Start questions" }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();

  await expect(page.locator(".slide-only")).toBeVisible();
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(page.locator(".studio-heading")).toHaveCount(0);
  await expect(page.locator(".canvas-footer")).toHaveCount(0);
  const stage = await page.locator(".question-stage").boundingBox();
  const viewport = page.viewportSize()!;
  expect(stage!.width).toBeGreaterThanOrEqual(viewport.width - 1);
  expect(stage!.height).toBeGreaterThanOrEqual(viewport.height - 1);
  await expect(page.locator(".stage-bottom")).toContainText("0 joined");
  await expect(page.locator(".join-qr")).toBeVisible();

  const bar = page.locator(".fullscreen-bar");
  await expect(bar).not.toHaveClass(/visible/);
  await page.mouse.move(50, 50);
  await expect(bar).toHaveClass(/visible/);
  await expect(bar).not.toHaveClass(/visible/, { timeout: 5000 });
  await page.mouse.move(60, 60);
  await page.getByRole("button", { name: "Next question" }).first().click();
  await expect(page.locator(".stage-bottom")).toContainText("02 / 04");

  await page.getByRole("button", { name: /Exit full screen/ }).click();
  await expect(page.locator(".slide-only")).toHaveCount(0);
  await expect(page.locator(".topbar")).toBeVisible();
});

test("the full screen panel hides again while participants keep joining", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Start questions" }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();
  const code = (await page.locator(".join-qr strong").innerText()).replace(
    /\s/g,
    "",
  );

  const bar = page.locator(".fullscreen-bar");
  await page.mouse.move(50, 50);
  await expect(bar).toHaveClass(/visible/);

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const audience = await context.newPage();
    await audience.goto(`/join?code=${code}`);
    await audience.getByLabel("Your name", { exact: true }).fill("Alex");
    await audience
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await expect(page.locator(".stage-bottom")).toContainText("1 joined");
    await expect(bar).not.toHaveClass(/visible/, { timeout: 5000 });
  } finally {
    await context.close();
  }
});

test("a draft opens full screen from the toolbar and pages with the keyboard", async ({
  page,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Present full screen", exact: true })
    .click();
  await expect(page.locator(".slide-only")).toBeVisible();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect(page.locator(".stage-bottom")).toContainText("01 / 04");
  await expect(page.locator(".join-qr")).toHaveCount(0);

  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".stage-bottom")).toContainText("02 / 04");
  await page.keyboard.press("PageDown");
  await expect(page.locator(".stage-bottom")).toContainText("03 / 04");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".stage-bottom")).toContainText("02 / 04");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".stage-bottom")).toContainText("01 / 04");

  await page.mouse.move(50, 50);
  await page.getByRole("button", { name: /Exit full screen/ }).click();
  await expect(page.locator(".slide-only")).toHaveCount(0);
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await expect(page.locator(".studio.presenting")).toBeVisible();
});

test("exiting full screen keeps the presentation, and ending it clears full screen", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();

  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator(".slide-only")).toHaveCount(0);
  await expect(page.locator(".topbar")).toBeVisible();

  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await page.getByRole("button", { name: "Back to studio" }).click();
  await expect(page.locator(".studio.presenting")).toHaveCount(0);
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
});

test("the host runs the live session from the full screen panel", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Start questions" }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();

  await page.mouse.move(50, 50);
  await page.getByRole("button", { name: "Pause responses" }).click();
  await expect(page.locator(".stage-bottom")).toContainText("Responses paused");
  await page.mouse.move(60, 60);
  await page.getByRole("button", { name: "Reopen responses" }).click();
  await expect(page.locator(".stage-bottom")).not.toContainText(
    "Responses paused",
  );

  await page.mouse.move(50, 50);
  await page.getByRole("button", { name: "Next question" }).last().click();
  await expect(page.locator(".stage-bottom")).toContainText("02 / 04");
  await expect(page.locator(".slide-only")).toBeVisible();
});

for (const [width, height] of [
  [1920, 1080],
  [1024, 768],
  [2560, 1000],
  [800, 1200],
]) {
  test(`full screen fills a ${width}x${height} screen without scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await gotoStudio(page);
    await page
      .getByRole("button", { name: "Present live", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Full screen", exact: true })
      .click();
    await expect(page.locator(".slide-only")).toBeVisible();
    for (const selector of [".welcome-lobby", ".question-stage"]) {
      if (selector === ".question-stage")
        await page.getByRole("button", { name: "Start questions" }).click();
      const box = await page.locator(selector).first().boundingBox();
      expect(Math.round(box!.width)).toBe(width);
      expect(Math.round(box!.height)).toBe(height);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
    }
  });
}

test("full screen shows a larger join QR than the normal presentation", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Start questions" }).click();
  const qr = page.locator(".join-qr svg");
  const normal = (await qr.boundingBox())!.width;
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();
  const scaled = (await qr.boundingBox())!.width;
  expect(scaled / normal).toBeGreaterThan(1.2);
});

test("a long full screen title shrinks to fit two lines", async ({ page }) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Edit question", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your question", exact: true })
    .fill(
      "What is the single most important thing our team could change next quarter to work better together?",
    );
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  const title = page.locator(".question-stage h2");
  const lines = () =>
    title.evaluate(
      (el) => el.offsetHeight / parseFloat(getComputedStyle(el).lineHeight),
    );

  await page
    .getByRole("button", { name: "Present full screen", exact: true })
    .click();
  await expect(page.locator(".slide-only")).toBeVisible();
  expect(Math.round(await lines())).toBeLessThanOrEqual(2);
  const long = parseFloat(
    await title.evaluate((el) => getComputedStyle(el).fontSize),
  );

  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".stage-bottom")).toContainText("02 / 04");
  const short = parseFloat(
    await title.evaluate((el) => getComputedStyle(el).fontSize),
  );
  expect(Math.round(await lines())).toBeLessThanOrEqual(2);
  expect(short).toBeGreaterThan(long);
});

test("the arrow keys follow the same steps as the host's main button", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Start questions" }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();
  const bottom = page.locator(".stage-bottom");
  const main = page.locator(".fullscreen-bar .button.primary");

  await page.keyboard.press("ArrowRight");
  await expect(bottom).toContainText("02 / 04");
  await page.keyboard.press("ArrowRight");
  await expect(bottom).toContainText("03 / 04");
  await expect(main).toContainText("Show results");

  await page.keyboard.press("ArrowRight");
  await expect(main).toContainText("Show ranking");
  await expect(bottom).toContainText("03 / 04");

  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Top 10 players")).toBeVisible();
  await expect(main).toContainText("Next question");

  await page.keyboard.press("ArrowRight");
  await expect(bottom).toContainText("04 / 04");
});
