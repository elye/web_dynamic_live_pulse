import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/test";

test("players write their own questions, which are then played in random order with the author's name", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My sessions" }).click();
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Players write the questions", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Multiple choice/ })
    .click();
  await expect(page.locator(".host-lobby")).toBeVisible();
  await page
    .getByRole("button", { name: "Invite audience", exact: true })
    .click();
  const link = await page
    .getByRole("dialog")
    .getByLabel("Participant link", { exact: true })
    .inputValue();
  const code = new URL(link).searchParams.get("code")!;
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const players: { name: string; page: Page }[] = [];
  for (const name of ["Alex", "Sam"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const player = await context.newPage();
    await player.goto(`/join?code=${code}`);
    await player.getByLabel("Your name", { exact: true }).fill(name);
    await player
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await expect(
      player.getByRole("heading", { name: "Welcome, everyone.", exact: true }),
    ).toBeVisible();
    players.push({ name, page: player });
  }
  await expect(page.locator(".lobby-count strong")).toHaveText("2");
  await page
    .getByRole("button", {
      name: "Ask players to write questions",
      exact: true,
    })
    .click();
  for (const { name, page: player } of players) {
    await expect(
      player.getByRole("heading", { name: "Write a question for everyone" }),
    ).toBeVisible();
    await player
      .getByRole("textbox", { name: /Your question/ })
      .fill(`${name}'s favourite?`);
    await player
      .getByRole("textbox", { name: "Option 1", exact: true })
      .fill(`${name} one`);
    await player
      .getByRole("textbox", { name: "Option 2", exact: true })
      .fill(`${name} two`);
    await player
      .getByRole("button", { name: "Submit my question", exact: true })
      .click();
    await expect(player.getByText(/Your question is in/)).toBeVisible();
  }
  await expect(page.locator(".crowd-writing .lobby-count strong")).toHaveText(
    "2",
  );
  // A refresh keeps what the player already submitted in the form.
  await players[0].page.reload();
  await expect(players[0].page.getByText(/Your question is in/)).toBeVisible();
  await expect(
    players[0].page.getByRole("textbox", { name: /Your question/ }),
  ).toHaveValue("Alex's favourite?");
  await expect(
    players[0].page.getByRole("textbox", { name: "Option 1", exact: true }),
  ).toHaveValue("Alex one");
  await expect(
    players[0].page.getByRole("textbox", { name: "Option 2", exact: true }),
  ).toHaveValue("Alex two");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const seen: string[] = [];
  for (let step = 0; step < 2; step++) {
    if (step > 0)
      await expect(
        page.locator(".question-eyebrow .author-name").first(),
      ).not.toHaveText(seen[0]);
    const author = (
      await page.locator(".question-eyebrow .author-name").first().innerText()
    ).trim();
    seen.push(author);
    const name = author.charAt(0) + author.slice(1).toLowerCase();
    await expect(
      page.getByRole("heading", { name: `${name}'s favourite?` }),
    ).toBeVisible();
    for (const { page: player } of players) {
      await expect(
        player.getByRole("heading", { name: `${name}'s favourite?` }),
      ).toBeVisible();
      await expect(
        player.locator(".participant-author .author-name"),
      ).toHaveText(name);
    }
    if (step === 0)
      await page
        .getByRole("button", { name: "Next question", exact: true })
        .last()
        .click();
  }
  expect(new Set(seen).size).toBe(2);
});
