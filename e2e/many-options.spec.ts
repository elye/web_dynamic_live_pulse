import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("many options: host sets it up, players filter and pick, the stage shows counts", async ({
  page,
  context,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: /Many options/ }).click();
  await page
    .getByRole("textbox", { name: "Your question", exact: true })
    .fill("Which snack?");
  await expect(page.getByLabel("Option 12", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Option 1", { exact: true })).toHaveAttribute(
    "maxlength",
    "30",
  );
  await page
    .getByRole("button", { name: "More settings", exact: true })
    .click();
  await page.getByLabel("Allow multiple answers").check();
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Which snack?", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".many-box")).toHaveCount(13);

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
  const participant = await context.newPage();
  await participant.setViewportSize({ width: 390, height: 844 });
  await participant.goto(`/join?code=${code}`);
  await participant.getByLabel("Your name", { exact: true }).fill("Alex");
  await participant
    .getByRole("button", { name: "Join the room", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start questions", exact: true })
    .click();
  for (let step = 0; step < 4; step++) {
    if (await page.getByRole("heading", { name: "Which snack?" }).count())
      break;
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .first()
      .click();
  }
  await expect(
    participant.getByRole("heading", { name: "Which snack?", exact: true }),
  ).toBeVisible();
  await expect(participant.locator(".many-options .answer-option")).toHaveCount(
    13,
  );
  await participant.getByLabel("Search options").fill("ing");
  const visible = participant.locator(".many-options .answer-option");
  await expect(visible.last()).toHaveText("Others");
  expect(await visible.count()).toBeLessThan(13);
  await visible.first().click();
  await visible.last().click();
  await expect(participant.locator(".many-selected li")).toHaveCount(2);
  await participant
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await expect(participant.getByText(/Your answers/)).toBeVisible();
  const first = page.locator(".many-box").first();
  await expect(first).toContainText("1");
  await expect(first).toHaveCSS("background-color", "rgb(48, 164, 108)");
  await expect(page.locator(".many-box").nth(1)).toHaveCSS(
    "background-color",
    "rgb(229, 72, 77)",
  );
});
