import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function checkCloudGeometry(page: Page, count: number) {
  await expect(page.locator(".cloud-word")).toHaveCount(count);
  const geometry = await page.locator(".word-cloud").evaluate((element) => {
    const frame = element.getBoundingClientRect();
    const words = [...element.querySelectorAll(".cloud-word")].map((word) => word.getBoundingClientRect());
    const left = Math.min(...words.map((word) => word.left));
    const right = Math.max(...words.map((word) => word.right));
    const top = Math.min(...words.map((word) => word.top));
    const bottom = Math.max(...words.map((word) => word.bottom));
    return {
      rows: new Set(words.map((word) => Math.round(word.top))).size,
      inside: left >= frame.left && right <= frame.right && top >= frame.top && bottom <= frame.bottom,
      horizontalOffset: Math.abs((left + right) / 2 - (frame.left + frame.right) / 2),
      verticalOffset: Math.abs((top + bottom) / 2 - (frame.top + frame.bottom) / 2),
      overlaps: words.some((first, index) => words.slice(index + 1).some((second) => first.left < second.right - 1 && first.right > second.left + 1 && first.top < second.bottom - 1 && first.bottom > second.top + 1)),
    };
  });
  expect(geometry.inside).toBe(true);
  expect(geometry.overlaps).toBe(false);
  expect(geometry.horizontalOffset).toBeLessThan(25);
  expect(geometry.verticalOffset).toBeLessThan(25);
  if (count > 2) expect(geometry.rows).toBeGreaterThan(2);
}

test("welcome screen keeps QR, copyable URL, and roster visible without a dialog", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/network", (route) => route.fulfill({ json: { address: "192.168.0.3" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  const lobby = page.getByRole("region", { name: "Welcome lobby" });
  const link = lobby.getByRole("textbox", { name: "Participant link", exact: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(link).toHaveValue(/^http:\/\/192\.168\.0\.3:5173\/join\?code=\d{6}$/);
  const url = await link.inputValue();
  await expect(lobby.locator(".qr-frame svg")).toBeVisible();
  await expect(lobby.locator(".lobby-count strong")).toHaveText("0");
  await lobby.getByRole("button", { name: "Copy participant link", exact: true }).click();
  await expect(lobby.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await link.focus();
  expect(await link.evaluate((element: HTMLInputElement) => element.value.slice(element.selectionStart!, element.selectionEnd!))).toBe(url);
  await expect(lobby.getByRole("link", { name: "Open participant view" })).toHaveAttribute("href", `/join?code=${new URL(url).searchParams.get("code")}`);
  await page.getByRole("button", { name: "Invite audience", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Participant link", { exact: true })).toHaveValue(url);
  expect(await dialog.locator(".qr-frame svg").innerHTML()).toBe(await lobby.locator(".qr-frame svg").innerHTML());
  await dialog.getByRole("button", { name: "Close dialog", exact: true }).click();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    await expect(link).toBeVisible();
    const bounds = await lobby.locator(".qr-frame svg").boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(180);
    const layout = await lobby.evaluate((element) => {
      const join = element.querySelector(".lobby-join")!.getBoundingClientRect();
      const roster = element.querySelector(".lobby-roster")!.getBoundingClientRect();
      return join.right <= roster.left + 1 || join.bottom <= roster.top + 1;
    });
    expect(layout).toBe(true);
    await page.screenshot({ path: `test-results/welcome-sharing-${width}.png`, fullPage: true });
  }
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, "writeText", { value: () => Promise.reject(new Error("Clipboard blocked")), configurable: true }));
  await lobby.getByRole("button", { name: "Copy participant link", exact: true }).click();
  await expect(lobby.locator(".copy-feedback")).toContainText("Copy the link");
  await expect(link).toBeFocused();
  expect(await link.evaluate((element: HTMLInputElement) => element.selectionEnd! - element.selectionStart!)).toBe(url.length);
});

test("session JSON backup restores a deleted draft from a file or pasted JSON", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Session title", { exact: true })
    .fill("Portable workshop");
  await page.getByRole("button", { name: "peach theme", exact: true }).click();
  const originalId = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pulse:sessions")!)[0].id,
  );
  await page.getByRole("button", { name: "My sessions", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Export Portable workshop as JSON",
      exact: true,
    })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("Portable-workshop.pulse.json");
  const json = await readFile((await download.path())!, "utf8");
  const backup = JSON.parse(json);
  expect(backup.questions).toHaveLength(4);
  expect(backup.questions[2].correct).toBe(1);
  expect(backup.theme).toBe("peach");
  expect(backup.hostedRooms).toBeUndefined();
  await page
    .getByRole("button", { name: "Delete Portable workshop", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".session-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Delete Portable workshop", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete session", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No sessions yet", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No sessions yet", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import JSON", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Session JSON", exact: true })
    .fill("{");
  await page
    .getByRole("button", { name: "Import session", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Invalid JSON",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pulse:sessions")!).length,
    ),
  ).toBe(0);
  await page.getByLabel("JSON file", { exact: true }).setInputFiles({
    name: "session.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await page
    .getByRole("button", { name: "Import session", exact: true })
    .click();
  await expect(page.getByLabel("Session title", { exact: true })).toHaveValue(
    "Portable workshop",
  );
  await expect(page.locator(".question-thumbnail")).toHaveCount(4);
  await expect(page.locator(".question-stage")).toHaveClass(/theme-peach/);
  const restored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pulse:sessions")!)[0],
  );
  expect(restored.id).not.toBe(originalId);
  expect(
    restored.questions.map(
      ({
        type,
        title,
        options,
        correct,
      }: {
        type: string;
        title: string;
        options: string[];
        correct: number | null;
      }) => ({ type, title, options, correct }),
    ),
  ).toEqual(backup.questions);
  await page.getByRole("button", { name: "My sessions", exact: true }).click();
  await page.getByRole("button", { name: "Import JSON", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Session JSON", exact: true })
    .fill(json);
  await page
    .getByRole("button", { name: "Import session", exact: true })
    .click();
  await expect(page.getByLabel("Session title", { exact: true })).toHaveValue(
    "Portable workshop",
  );
  const ids = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pulse:sessions")!).map(
      (item: { id: string }) => item.id,
    ),
  );
  expect(new Set(ids).size).toBe(2);
  await page.reload();
  await page.getByRole("button", { name: "My sessions", exact: true }).click();
  await expect(page.locator(".session-card")).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({
    path: "test-results/session-library-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete Portable workshop", exact: true })
    .first()
    .click();
  await noOverflow(page);
  await page.screenshot({
    path: "test-results/session-delete-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete session", exact: true })
    .click();
  await expect(page.locator(".session-card")).toHaveCount(1);
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pulse:sessions")!).map(
        (item: { id: string }) => item.id,
      ),
    ),
  ).toEqual([ids[1]]);
});

for (const ended of [false, true]) {
  test(`delete ${ended ? "ended" : "live"} session removes its room and notifies participants`, async ({
    page,
    browser,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Present live", exact: true })
      .click();
    await page.getByRole("button", { name: "Invite audience", exact: true }).click();
    const code = new URL(
      await page.getByRole("dialog").getByLabel("Participant link", { exact: true }).inputValue(),
    ).searchParams.get("code")!;
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    const participantContext = await browser.newContext();
    const participant = await participantContext.newPage();
    try {
      await participant.goto(`/join?code=${code}`);
      await participant.getByLabel("Your name", { exact: true }).fill("Alex");
      await participant
        .getByRole("button", { name: "Join the room", exact: true })
        .click();
      await expect(
        participant.getByRole("heading", {
          name: "Welcome, everyone.",
          exact: true,
        }),
      ).toBeVisible();
      if (ended) {
        await page
          .getByRole("button", { name: "End session", exact: true })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: "End session", exact: true })
          .click();
        await expect(
          page.getByRole("heading", {
            name: "Every response counts.",
            exact: true,
          }),
        ).toBeVisible();
      }
      if (!ended) {
        await page.evaluate(() => {
          const credentials = JSON.parse(localStorage.getItem("pulse:host")!);
          delete credentials.sessionId;
          localStorage.setItem("pulse:host", JSON.stringify(credentials));
          const sessions = JSON.parse(localStorage.getItem("pulse:sessions")!);
          delete sessions[0].hostedRooms;
          localStorage.setItem("pulse:sessions", JSON.stringify(sessions));
        });
      }
      await page.reload();
      await expect(
        page.getByText(ended ? "DRAFT SESSION" : "LIVE SESSION", {
          exact: true,
        }),
      ).toBeVisible();
      if (ended) {
        await page
          .getByRole("button", { name: "My sessions", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Delete Team check-in", exact: true })
          .click();
      } else {
        await page
          .getByRole("button", { name: "Delete session", exact: true })
          .click();
      }
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Export JSON", exact: true })
        .click();
      const exported = JSON.parse(
        await readFile((await (await downloadEvent).path())!, "utf8"),
      );
      expect(exported.questions).toHaveLength(4);
      expect(exported.hostedRooms).toBeUndefined();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete session", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "No sessions yet", exact: true }),
      ).toBeVisible();
      await expect(participant.getByRole("alert")).toContainText(
        "host deleted this session",
      );
      await participant.getByLabel("Your name", { exact: true }).fill("Alex");
      await participant
        .getByRole("button", { name: "Join the room", exact: true })
        .click();
      await expect(participant.getByRole("alert")).toContainText(
        "Room not found",
      );
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "No sessions yet", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("pulse:host") || "null"),
        ),
      ).toBeNull();
      await page.getByRole("button", { name: "Results", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "A fresh start.", exact: true }),
      ).toBeVisible();
    } finally {
      await participantContext.close();
    }
  });
}

test("edit, duplicate, reorder, delete, and save a question on a LAN-compatible host", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Present live", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Edit question", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your question", exact: true })
    .fill("What brings you energy today?");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "What brings you energy today?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Move question down", exact: true })
    .click();
  await expect(
    page.locator(".question-thumbnail.selected .thumbnail-number"),
  ).toHaveText("03");
  await page
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(4);
  await page.getByRole("button", { name: "peach theme", exact: true }).click();
  await page.reload();
  await expect(page.locator(".question-stage")).toHaveClass(/theme-peach/);
  await expect(
    page.getByRole("heading", {
      name: "What brings you energy today?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: /Quiz A correct answer/ }).click();
  await page.getByLabel("Option 1", { exact: true }).fill("Updated answer");
  await page.getByLabel("Option 1 is correct", { exact: true }).check();
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(page.locator(".question-thumbnail")).toHaveCount(5);
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByRole("button", { name: /The big team quiz/ }).click();
  await expect(page.getByLabel("Session title", { exact: true })).toHaveValue(
    "The big team quiz",
  );
  await expect(page.locator(".question-thumbnail")).toHaveCount(3);
});

test("two audiences answer all types, reconnect, receive reveals, and finish with scores and export", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await expect(page.locator(".host-lobby").getByRole("heading", { name: "Team check-in", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Invite audience", exact: true }).click();
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
      await expect(participant.getByRole("button", { name: "Send response", exact: true })).toHaveCount(0);
    }
    await expect(page.locator(".lobby-count strong")).toHaveText("2");
    await expect(page.locator(".lobby-people li")).toHaveText(["AAlex", "SSam"]);
    await audience.reload();
    await expect(audience.getByRole("heading", { name: "Welcome, everyone.", exact: true })).toBeVisible();
    await expect(audience.locator(".lobby-count strong")).toHaveText("2");
    await noOverflow(audience);
    await audience.screenshot({ path: "test-results/welcome-mobile.png", fullPage: true });
    await page.screenshot({ path: "test-results/welcome-desktop.png", fullPage: true });
    await page.reload();
    await expect(page.locator(".lobby-count strong")).toHaveText("2");
    await expect(page.getByRole("button", { name: "Next question", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Start questions", exact: true }).click();
    for (const [participant, name] of [[audience, "Alex"], [second, "Sam"]] as const) {
      await expect(participant.getByRole("heading", { name: "How are you feeling in one word?", exact: true })).toBeVisible();
      await participant
        .getByRole("textbox", { name: /Your word or short phrase/ })
        .fill(name === "Alex" ? "Inspired" : "inspired");
      await participant
        .getByRole("button", { name: "Send response", exact: true })
        .click();
      await expect(
        participant.getByRole("heading", {
          name: "Your voice is in.",
          exact: true,
        }),
      ).toBeVisible();
    }
    await expect(page.locator(".cloud-word")).toContainText("inspired");
    await expect(page.locator(".cloud-word title")).toHaveText("2 responses");
    await checkCloudGeometry(page, 1);
    await audience.reload();
    await expect(
      audience.getByRole("heading", { name: "Your voice is in.", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".audience-count strong")).toHaveText("2");
    await page
      .getByRole("button", { name: "Reveal results", exact: true })
      .click();
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
    await expect(
      audience.getByRole("heading", { name: "A little pause.", exact: true }),
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
    await page
      .getByRole("button", { name: "Reveal results", exact: true })
      .click();
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
    await expect(page.locator(".text-results")).toContainText(
      "More time to explore together.",
    );
    await page
      .getByRole("button", { name: "Finish session", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "End session", exact: true })
      .click();
    await expect(audience.locator(".leaderboard")).toContainText("1,000 pts");
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

for (const width of [390, 768, 1440]) {
  test(`studio and participant join layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Present live", exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await expect(page.locator(".question-stage")).toBeVisible();
    await checkCloudGeometry(page, 11);
    if (width === 1440)
      expect(
        await page
          .locator(".workspace-photo img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      ).toBe(true);
    await page.screenshot({
      path: `test-results/studio-${width}.png`,
      fullPage: true,
    });
    await page.goto("/join");
    await noOverflow(page);
    await expect(
      page.getByRole("button", { name: "Join the room", exact: true }),
    ).toBeDisabled();
    await page.screenshot({
      path: `test-results/join-${width}.png`,
      fullPage: true,
    });
    await page.getByLabel("Room code", { exact: true }).fill("000000");
    await page.getByLabel("Your name", { exact: true }).fill("Taylor");
    await page
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("Room not found");
  });
}
