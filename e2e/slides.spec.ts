import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("title-and-description slides show no input to participants or reveal controls to hosts", async ({
  page,
  context,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: /Title & description/ }).click();
  await page
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Welcome aboard");
  await page
    .getByRole("textbox", { name: /Description/ })
    .fill("Grab a coffee and settle in. We'll begin shortly.");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome aboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No responses needed")).toBeVisible();
  await expect(page.locator(".question-thumbnail")).toHaveCount(5);
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
  await participant.goto(`/join?code=${code}`);
  await participant.getByLabel("Your name", { exact: true }).fill("Alex");
  await participant
    .getByRole("button", { name: "Join the room", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start questions", exact: true })
    .click();
  // The arrow beside the counter skips ahead without revealing results first.
  for (let step = 0; step < 4; step++)
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .first()
      .click();
  await expect(
    page.getByRole("heading", { name: "Welcome aboard", exact: true }),
  ).toBeVisible();
  await expect(
    participant.getByRole("heading", { name: "Welcome aboard", exact: true }),
  ).toBeVisible();
  await expect(participant.getByText(/Grab a coffee/)).toBeVisible();
  await expect(
    participant.getByRole("button", { name: "Send response", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pause responses", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reveal results", exact: true }),
  ).toHaveCount(0);
  // The default session has a quiz, so it closes on the podium before finishing.
  await page.getByRole("button", { name: "Show podium", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Finish session", exact: true }),
  ).toBeVisible();
});
