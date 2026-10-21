import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("nameless sessions hide the roster and let people join without a name", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Ask for names", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Nameless session", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page
    .getByRole("button", { name: "Invite audience", exact: true })
    .click();
  const link = await page
    .getByRole("dialog")
    .getByLabel("Participant link", { exact: true })
    .inputValue();
  const code = new URL(link).searchParams.get("code");
  expect(new URL(link).searchParams.get("nameless")).toBe("1");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();

  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  try {
    for (const [index, participant] of [first, second].entries()) {
      await participant.goto(`/join?code=${code}`);
      await expect(
        participant.getByLabel("Your name", { exact: true }),
      ).toHaveCount(0);
      await participant
        .getByRole("button", { name: "Join the room", exact: true })
        .click();
      await expect(
        participant.getByRole("heading", {
          name: "Welcome, everyone.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(participant.locator(".lobby-people li")).toHaveCount(0);
      await expect(participant.locator(".participant-identity")).toHaveAttribute(
        "aria-label",
        /Generated name/,
      );
      if (index === 0) {
        await participant
          .getByRole("button", { name: /Change name once/ })
          .click();
        await participant
          .getByLabel("Choose a provided name", { exact: true })
          .fill("Jordan");
        await participant
          .getByRole("button", { name: "Save name", exact: true })
          .click();
        await expect(participant.getByRole("alert")).toHaveCount(0);
        await expect(
          participant.locator(".participant-identity"),
        ).toContainText("Jordan");
        await expect(
          participant.locator(".participant-identity"),
        ).toHaveAttribute("aria-label", /Provided name/);
        await expect(
          participant.getByRole("button", {
            name: "Change name once",
            exact: true,
          }),
        ).toHaveCount(0);
      }
    }
    await expect(page.locator(".host-lobby .lobby-count strong")).toHaveText(
      "2",
    );
    await expect(page.locator(".host-lobby .lobby-people li")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();
    await expect(first.locator(".participant-identity")).toContainText(
      "Jordan",
    );
    await expect(second.locator(".participant-identity")).toHaveAttribute(
      "aria-label",
      /Generated name/,
    );
    await second.getByRole("button", { name: /Change name once/ }).click();
    await second
      .getByLabel("Choose a provided name", { exact: true })
      .fill("Riley");
    await second
      .getByRole("button", { name: "Save name", exact: true })
      .click();
    await expect(second.getByRole("alert")).toHaveCount(0);
    await expect(second.locator(".participant-identity")).toContainText(
      "Riley",
    );
    await expect(second.locator(".participant-identity")).toHaveAttribute(
      "aria-label",
      /Provided name/,
    );
  } finally {
    await firstContext.close();
    await secondContext.close();
  }
});