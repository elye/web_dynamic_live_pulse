import { expect, test } from "./helpers/test";
import { io as connect } from "socket.io-client";
import { checkCloudGeometry, installCloudProbe } from "./helpers/cloud";
import { noOverflow } from "./helpers/layout";

test("cloud simulator previews many words without changing the session", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".cloud-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const saved = await page.evaluate(() =>
    localStorage.getItem("pulse:sessions"),
  );
  await page
    .getByRole("button", { name: "Simulate word cloud", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Word cloud simulator" });
  await checkCloudGeometry(dialog, 60);
  await expect(
    dialog.getByText("60 distinct words", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/cloud-simulator-desktop.png",
    fullPage: true,
  });
  const original = await dialog.locator(".cloud-word").first().textContent();
  await dialog
    .getByRole("button", { name: "Regenerate sample", exact: true })
    .click();
  await expect(dialog.locator(".cloud-word").first()).not.toHaveText(original!);
  await checkCloudGeometry(dialog, 60);
  const slider = dialog.getByRole("slider", {
    name: "Distinct words",
    exact: true,
  });
  await slider.fill("30");
  await checkCloudGeometry(dialog, 30);
  await dialog
    .getByLabel("Frequency distribution", { exact: true })
    .selectOption("equal");
  await expect(
    dialog.getByText("150 sample responses", { exact: true }),
  ).toBeVisible();
  await checkCloudGeometry(dialog, 30);
  await page.setViewportSize({ width: 390, height: 844 });
  await slider.fill("60");
  await checkCloudGeometry(dialog, 60);
  await noOverflow(page);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/cloud-simulator-mobile.png",
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await checkCloudGeometry(page, 11);
  expect(
    await page.evaluate(() => localStorage.getItem("pulse:sessions")),
  ).toBe(saved);
  expect(
    await page.evaluate(() => localStorage.getItem("pulse:host")),
  ).toBeNull();
});

test("dense canvas cloud handles long phrases, live updates, and resizing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  const url = await page
    .getByLabel("Participant link", { exact: true })
    .inputValue();
  const code = new URL(url).searchParams.get("code")!;
  await page
    .getByRole("button", { name: "Start questions", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause responses", exact: true }),
  ).toBeVisible();
  const clients: ReturnType<typeof connect>[] = [];
  try {
    for (let index = 0; index < 60; index++) {
      const client = connect("http://localhost:5173", {
        transports: ["websocket"],
        forceNew: true,
      });
      clients.push(client);
      const joined = await client
        .timeout(3000)
        .emitWithAck("room:join", { code, name: `Guest ${index + 1}` });
      expect(joined.ok).toBe(true);
      const value =
        index === 0 ? "a wonderfully creative day" : `idea ${index + 1}`;
      const voted = await client.timeout(3000).emitWithAck("room:vote", {
        code,
        token: joined.token,
        questionId: joined.state.questions[0].id,
        value,
      });
      expect(voted.ok, voted.error).toBe(true);
      if (index === 1 || index === 4) {
        await checkCloudGeometry(page, index + 1);
        await page.screenshot({
          path: `test-results/cloud-${index + 1}-words.png`,
          fullPage: true,
        });
      }
    }
    await checkCloudGeometry(page, 60);
    await page.screenshot({
      path: "test-results/cloud-dense-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 1000 });
    await expect
      .poll(() =>
        page
          .locator(".cloud-canvas")
          .evaluate((surface: HTMLCanvasElement) =>
            Math.abs(surface.width - surface.clientWidth),
          ),
      )
      .toBeLessThan(2);
    await checkCloudGeometry(page, 60);
    await noOverflow(page);
    await page.screenshot({
      path: "test-results/cloud-dense-mobile.png",
      fullPage: true,
    });
  } finally {
    clients.forEach((client) => client.disconnect());
  }
});

test("canvas cloud stays crisp and collision-free on high-DPI phones", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  try {
    const page = await context.newPage();
    await installCloudProbe(page);
    await page.goto("/");
    await checkCloudGeometry(page, 11);
    expect(
      await page
        .locator(".cloud-canvas")
        .evaluate(
          (surface: HTMLCanvasElement) => surface.width / surface.clientWidth,
        ),
    ).toBe(2);
    await page.screenshot({
      path: "test-results/cloud-retina-mobile.png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});
