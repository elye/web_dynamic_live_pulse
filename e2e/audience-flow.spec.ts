import { expect, test } from "./helpers/test";
import { checkCloudGeometry, installCloudProbe } from "./helpers/cloud";
import { noOverflow } from "./helpers/layout";
import { gotoStudio } from "./helpers/studio";

test("two audiences answer all types, reconnect, receive reveals, and finish with scores and export", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await gotoStudio(page);
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await expect(
    page
      .locator(".host-lobby")
      .getByRole("heading", { name: "Team check-in", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
  const secondContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const audience = await audienceContext.newPage();
  const second = await secondContext.newPage();
  await installCloudProbe(audience);
  await installCloudProbe(second);
  audience.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const [participant, name] of [
      [audience, "Alex"],
      [second, "Sam"],
    ] as const) {
      await participant.goto(`/join?code=${code}`);
      await participant.getByLabel("Your name", { exact: true }).fill(name);
      await participant
        .getByRole("button", { name: "Join the room", exact: true })
        .click();
      await expect(
        participant.getByRole("heading", {
          name: "Welcome, everyone.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(participant.locator(".lobby-people")).toContainText(name);
      await expect(
        participant.getByRole("button", { name: "Send response", exact: true }),
      ).toHaveCount(0);
    }
    await expect(page.locator(".lobby-count strong")).toHaveText("2");
    await expect(page.locator(".lobby-people li")).toHaveText(["Alex", "Sam"]);
    await audience.reload();
    await expect(
      audience.getByRole("heading", {
        name: "Welcome, everyone.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(audience.locator(".lobby-count strong")).toHaveText("2");
    await noOverflow(audience);
    await audience.screenshot({
      path: "test-results/welcome-mobile.png",
      fullPage: true,
    });
    await page.screenshot({
      path: "test-results/welcome-desktop.png",
      fullPage: true,
    });
    await page.reload();
    await expect(page.locator(".lobby-count strong")).toHaveText("2");
    await expect(
      page.getByRole("button", { name: "Next question", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();
    for (const [participant, name] of [
      [audience, "Alex"],
      [second, "Sam"],
    ] as const) {
      await expect(
        participant.getByRole("heading", {
          name: "How are you feeling in one word?",
          exact: true,
        }),
      ).toBeVisible();
      await participant
        .getByRole("textbox", { name: /Your word or short phrase/ })
        .fill(name === "Alex" ? "Inspired" : "inspired");
      await participant
        .getByRole("button", { name: "Send response", exact: true })
        .click();
      await expect(
        participant.getByText("Live results", { exact: true }),
      ).toBeVisible();
    }
    await expect(page.locator(".cloud-word")).toContainText("inspired");
    await expect(page.locator(".cloud-word")).toHaveAttribute(
      "title",
      "2 responses",
    );
    await checkCloudGeometry(page, 1);
    await audience.reload();
    await expect(
      audience.getByText("Live results", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".audience-count strong")).toHaveText("2");
    // Word clouds show results live, so the host can hide them instead.
    await expect(audience.locator(".word-cloud")).toContainText("inspired");
    await checkCloudGeometry(audience, 1);
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .last()
      .click();
    await expect(
      audience.getByRole("heading", {
        name: "What should we focus on next?",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Pause responses", exact: true })
      .click();
    // Questions without an answer show live results by default, even when paused.
    await expect(
      audience.getByText("Live results", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Reopen responses", exact: true })
      .click();
    await audience
      .getByRole("button", { name: "A Fresh ideas", exact: true })
      .click();
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    // Polls without an answer show results live, so there is nothing to reveal.
    await expect(audience.locator(".poll-results")).toContainText("100%");
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .last()
      .click();
    await expect(
      audience.getByRole("heading", {
        name: "Which planet has the most moons?",
        exact: true,
      }),
    ).toBeVisible();
    await expect(audience.locator(".correct-answer")).toHaveCount(0);
    await audience
      .getByRole("button", { name: "B Saturn", exact: true })
      .click();
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    await expect(
      audience.getByRole("heading", { name: "Your voice is in.", exact: true }),
    ).toBeVisible();
    // Questions with an answer hide responses until revealed.
    // The options stay on the slide, but the counts and bars are hidden.
    await expect(
      page.locator(".poll-results.counts-hidden .poll-row"),
    ).toHaveCount(4);
    await expect(
      page.locator(".poll-results.counts-hidden .bar-track"),
    ).toHaveCount(0);
    await expect(page.locator(".poll-results.counts-hidden")).toContainText(
      "Saturn",
    );
    await expect(page.locator(".response-hidden-note")).toContainText("1");
    await page
      .getByRole("button", { name: "Reveal results", exact: true })
      .click();
    await expect(audience.locator(".correct-answer")).toContainText("Saturn");
    await noOverflow(audience);
    await audience.screenshot({
      path: "test-results/participant-mobile.png",
      fullPage: true,
    });
    await page.reload();
    await expect(page.getByText("LIVE SESSION", { exact: true })).toBeVisible();
    await expect(page.locator(".audience-count strong")).toHaveText("2");
    // The quiz has an answer: after its results come the top 10 ranking.
    await page
      .getByRole("button", { name: "Show ranking", exact: true })
      .click();
    await expect(page.locator(".leaderboard.compact")).toContainText(
      /9\d\d pts/,
    );
    await expect(audience.locator(".leaderboard.compact")).toContainText(
      "Alex",
    );
    await expect(
      audience.locator('.leaderboard.compact [aria-label="Provided name"]'),
    ).toHaveCount(2);
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .last()
      .click();
    await expect(
      audience.getByRole("heading", {
        name: "What is one thing we could do better?",
        exact: true,
      }),
    ).toBeVisible();
    await audience.getByRole("textbox").fill("More time to explore together.");
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();
    // Open responses show on the fly, so there is no separate show-results step.
    await expect(page.locator(".response-hidden")).toHaveCount(0);
    await expect(page.locator(".text-results")).toContainText(
      "More time to explore together.",
    );
    // The session has scored questions, so it ends on the podium.
    await expect(
      page.getByRole("button", { name: "Finish session", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Show podium", exact: true })
      .click();
    await expect(audience.locator(".podium-section")).toContainText("Alex");
    await expect(
      audience.locator('.podium-section [aria-label="Provided name"]'),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: "Finish session", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "End session", exact: true })
      .click();
    await expect(audience.locator(".leaderboard")).toContainText(/9\d\d pts/);
    await expect(
      page.getByRole("heading", {
        name: "Every response counts.",
        exact: true,
      }),
    ).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(`pulse-${code}-results.csv`);
    await download.saveAs(`test-results/${download.suggestedFilename()}`);
    expect(errors).toEqual([]);
  } finally {
    await audienceContext.close();
    await secondContext.close();
  }
});
