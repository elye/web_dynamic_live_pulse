import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("participants can submit an alternative slider answer", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Start from scratch", exact: true })
    .click();
  await page
    .locator(".rail-heading")
    .getByRole("button", { name: "Add question", exact: true })
    .click();
  await page.getByRole("button", { name: /Slider/ }).click();
  await page.getByRole("button", { name: "Add alternative answer" }).click();
  await page
    .getByRole("textbox", { name: "Alternative answer 1", exact: true })
    .fill("I don't know");
  await page.getByRole("button", { name: "Add alternative answer" }).click();
  await page
    .getByRole("textbox", { name: "Alternative answer 2", exact: true })
    .fill("More than 10");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(page.locator(".slider-alternative-results")).toContainText(
    "I don't know",
  );
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page
    .getByRole("button", { name: "Invite audience", exact: true })
    .click();
  const link = await page
    .getByRole("dialog")
    .getByLabel("Participant link", { exact: true })
    .inputValue();
  const code = new URL(link).searchParams.get("code")!;
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();

  const audienceContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const audience = await audienceContext.newPage();
  try {
    await audience.goto(`/join?code=${code}`);
    await audience.getByLabel("Your name", { exact: true }).fill("Alex");
    await audience
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();
    await expect(
      audience.getByRole("heading", {
        name: "How many hours a day do you spend in meetings?",
        exact: true,
      }),
    ).toBeVisible();
    const slider = audience.locator('.slider-input input[type="range"]');
    const sliderAnswer = audience.getByRole("radio", {
      name: "Use slider answer",
    });
    const alternative = audience.getByRole("radio", { name: "I don't know" });
    await expect(sliderAnswer).toBeChecked();
    await alternative.check();
    await expect(slider).toBeDisabled();
    await expect(audience.locator(".slider-control-muted")).toBeVisible();
    await audience.getByRole("radio", { name: "Use slider answer" }).check();
    await expect(slider).toBeEnabled();
    await expect(alternative).not.toBeChecked();
    await alternative.check();
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    await expect(page.locator(".slider-alternative-results")).toContainText(
      "I don't know",
    );
    await expect(
      page
        .locator(".slider-alternative-results li")
        .filter({
          hasText: "I don't know",
        })
        .locator("strong"),
    ).toHaveText("1");
  } finally {
    await audienceContext.close();
  }
});

test("slider simulator previews up to 300 high-biased participants", async ({
  page,
}) => {
  await gotoStudio(page);
  await page
    .locator(".rail-heading")
    .getByRole("button", { name: "Add question", exact: true })
    .click();
  await page.getByRole("button", { name: /Slider/ }).click();
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
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
