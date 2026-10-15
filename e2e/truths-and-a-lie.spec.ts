import { expect, test } from "./helpers/test";

test("two truths and a lie uses a fixed question and shows the statements in a single column", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Two truths and a lie/ })
    .click();
  const editor = page.getByRole("dialog");
  await expect(
    editor.getByText("Pick the one that is not true."),
  ).toBeVisible();
  await expect(
    editor.getByRole("textbox", { name: "Your question", exact: true }),
  ).toHaveCount(0);
  const long = (text: string) =>
    `${text} and this statement is intentionally long so it needs the full width of the screen`;
  await editor
    .getByLabel("Option 1", { exact: true })
    .fill(long("I once met a president"));
  await editor
    .getByLabel("Option 2", { exact: true })
    .fill(long("I have run a marathon"));
  await editor
    .getByLabel("Option 3", { exact: true })
    .fill(long("I have never eaten pizza"));
  await editor.getByLabel("Option 3 is the lie", { exact: true }).check();
  await expect(
    editor.getByRole("button", { name: /Remove option/ }),
  ).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Pick the one that is not true.",
      exact: true,
    }),
  ).toBeVisible();
  for (let step = 0; step < 4; step++)
    await page
      .getByRole("button", { name: "Move question up", exact: true })
      .click();
  await expect(
    page.locator(".question-thumbnail.selected .thumbnail-number"),
  ).toHaveText("01");

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
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const player = await context.newPage();
  await player.goto(`/join?code=${code}`);
  await player.getByLabel("Your name", { exact: true }).fill("Alex");
  await player
    .getByRole("button", { name: "Join the room", exact: true })
    .click();
  await expect(page.locator(".lobby-count strong")).toHaveText("1");
  await page
    .getByRole("button", { name: "Start questions", exact: true })
    .click();
  await expect(
    player.getByRole("heading", { name: "Pick the one that is not true." }),
  ).toBeVisible();
  const options = player.locator(".answer-option");
  await expect(options).toHaveCount(3);
  await expect(player.locator(".answer-options.two-col")).toHaveCount(0);
  const boxes = await options.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect()),
  );
  expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1);
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom - 1);
  expect(boxes[2].top).toBeGreaterThan(boxes[1].bottom - 1);
  await options.nth(2).click();
  await player
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reveal results", exact: true })
    .click();
  await expect(page.locator(".answer-badge")).toHaveText(/The lie/);
  await expect(player.getByText(/The lie: .*never eaten pizza/)).toBeVisible();
});
