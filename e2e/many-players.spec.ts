import { io } from "socket.io-client";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("a crowded lobby scrolls instead of cutting names off", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
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

  const crowd = Array.from({ length: 150 }, () =>
    io("http://localhost:5173", { transports: ["websocket"] }),
  );
  try {
    await Promise.all(
      crowd.map((socket, index) =>
        socket.emitWithAck("room:join", {
          code,
          name: `Crowd member number ${index + 1}`,
        }),
      ),
    );
    const names = page.locator(".host-lobby .lobby-people");
    await expect(names).toHaveClass(/scrolling/);
    const scrollable = await names.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    );
    expect(scrollable).toBe(true);
    await names.evaluate((element) =>
      element.scrollTo(0, element.scrollHeight),
    );
    await expect(
      names.locator("li", { hasText: "Crowd member number 150" }),
    ).toBeInViewport();

    const player = await (
      await browser.newContext({ viewport: { width: 390, height: 844 } })
    ).newPage();
    await player.goto(`/join?code=${code}`);
    await player.getByLabel("Your name", { exact: true }).fill("Zed");
    await player
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await expect(player.locator(".lobby-people")).toHaveClass(/scrolling/);
  } finally {
    crowd.forEach((socket) => socket.close());
  }
});

async function joinAs(page: Page, code: string, name: string) {
  await page.goto(`/join?code=${code}`);
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Join the room", exact: true })
    .click();
}

test("players always see their own rank, and the podium waits for a click", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
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

  const winner = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await joinAs(winner, code, "Zed");
  const crowd = Array.from({ length: 12 }, () =>
    io("http://localhost:5173", { transports: ["websocket"] }),
  );
  try {
    await Promise.all(
      crowd.map((socket, index) =>
        socket.emitWithAck("room:join", { code, name: `Filler ${index + 1}` }),
      ),
    );
    const last = await (
      await browser.newContext({ viewport: { width: 390, height: 844 } })
    ).newPage();
    await joinAs(last, code, "Quinn");
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();
    const quiz = { name: "Which planet has the most moons?", exact: true };
    while (!(await page.getByRole("heading", quiz).isVisible())) {
      await page
        .getByRole("button", { name: "Next question", exact: true })
        .last()
        .click();
      await page.waitForTimeout(500);
    }
    await winner.getByRole("button", { name: "B Saturn", exact: true }).click();
    await winner
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reveal results", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Show ranking", exact: true })
      .click();

    const mine = winner.locator(".leader-row.mine");
    await expect(mine).toHaveCount(1);
    await expect(mine).toContainText("Zed");
    await expect(mine).toHaveCSS("font-weight", "800");
    await expect(last.locator(".leader-position")).toContainText("#14");
    await expect(last.locator(".leader-position")).toBeVisible();
    await expect(winner.locator(".leader-position")).toContainText("#1");
    const above =
      (await last.locator(".leader-position").boundingBox())!.y <
      (await last.locator(".leader-fit").boundingBox())!.y;
    expect(above).toBe(true);
    await expect(page.locator(".leader-position")).toHaveCount(0);
    await expect(page.locator(".leader-row.mine")).toHaveCount(0);
  } finally {
    crowd.forEach((socket) => socket.close());
  }
});
