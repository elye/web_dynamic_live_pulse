import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("a finished session can be restarted from its results page", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  const code = async () => {
    await page
      .getByRole("button", { name: "Invite audience", exact: true })
      .click();
    const value = new URL(
      await page
        .getByRole("dialog")
        .getByLabel("Participant link", { exact: true })
        .inputValue(),
    ).searchParams.get("code")!;
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    return value;
  };
  const first = await code();
  await page.getByRole("button", { name: "End session", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End session", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Every response counts.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restart session", exact: true })
    .click();
  await expect(page.getByText("LIVE SESSION", { exact: true })).toBeVisible();
  expect(await code()).not.toBe(first);
});

test("resetting a question clears responses and lets players answer again", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page
    .getByRole("button", { name: "Invite audience", exact: true })
    .click();
  const code = new URL(
    await page
      .getByRole("dialog")
      .getByLabel("Participant link", { exact: true })
      .inputValue(),
  ).searchParams.get("code")!;
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const audience = await context.newPage();
  try {
    await audience.goto(`/join?code=${code}`);
    await audience.getByLabel("Your name", { exact: true }).fill("Alex");
    await audience
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();
    await audience
      .getByRole("textbox", { name: /Your word or short phrase/ })
      .fill("Inspired");
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    await expect(page.locator(".audience-count strong")).toHaveText("1");
    await expect(page.locator(".cloud-word")).toContainText("inspired");
    await page
      .getByRole("button", { name: "Reset question", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reset question", exact: true })
      .click();
    await expect(page.locator(".cloud-word")).toHaveCount(0);
    await expect(
      audience.getByRole("textbox", { name: /Your word or short phrase/ }),
    ).toBeVisible();
    await audience
      .getByRole("textbox", { name: /Your word or short phrase/ })
      .fill("Again");
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    await expect(page.locator(".cloud-word")).toContainText("again");
  } finally {
    await context.close();
  }
});
