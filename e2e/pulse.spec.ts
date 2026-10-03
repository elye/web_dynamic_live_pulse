import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { io as connect } from "socket.io-client";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function checkCloudGeometry(page: Page | Locator, count: number) {
  await expect(page.locator(".cloud-word")).toHaveCount(count);
  const canvas = page.locator(".cloud-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveAttribute("data-words", String(count));
  const geometry = await canvas.evaluate((surface: HTMLCanvasElement) => {
    const pixels = surface.getContext("2d")!.getImageData(0, 0, surface.width, surface.height).data;
    let left = surface.width;
    let right = 0;
    let top = surface.height;
    let bottom = 0;
    let painted = 0;
    for (let index = 0; index < pixels.length / 4; index++) {
      if (pixels[index * 4 + 3] < 128) continue;
      const column = index % surface.width;
      const row = Math.floor(index / surface.width);
      left = Math.min(left, column);
      right = Math.max(right, column);
      top = Math.min(top, row);
      bottom = Math.max(bottom, row);
      painted++;
    }
    const ratio = surface.width / surface.getBoundingClientRect().width;
    const frame = surface.parentElement!.getBoundingClientRect();
    const bounds = surface.getBoundingClientRect();
    const draws: { text: string; top: number; size: number }[] = JSON.parse(surface.dataset.testDraws || "[]");
    return {
      rows: new Set(draws.map((word) => Math.round(word.top))).size,
      inside: bounds.left + left / ratio > frame.left && bounds.left + right / ratio < frame.right && bounds.top + top / ratio > frame.top && bounds.top + bottom / ratio < frame.bottom,
      horizontalOffset: Math.abs(bounds.left + (left + right) / (2 * ratio) - (frame.left + frame.right) / 2),
      verticalOffset: Math.abs(bounds.top + (top + bottom) / (2 * ratio) - (frame.top + frame.bottom) / 2),
      overlappingPixels: Number(surface.dataset.testOverlap || 0),
      spacingViolations: Number(surface.dataset.testSpacingViolations || 0),
      drawn: draws.length,
      sizeRatio: Math.max(...draws.map((word) => word.size)) / Math.min(...draws.map((word) => word.size)),
      fontLoaded: document.fonts.check('700 78px "Pulse Cloud"'),
      painted,
    };
  });
  expect(geometry.painted).toBeGreaterThan(100);
  expect(geometry.fontLoaded).toBe(true);
  expect(geometry.drawn).toBe(count);
  expect(geometry.inside).toBe(true);
  expect(geometry.overlappingPixels).toBe(0);
  expect(geometry.horizontalOffset).toBeLessThan(25);
  expect(geometry.verticalOffset).toBeLessThan(25);
  if (count > 5) expect(geometry.rows).toBeGreaterThan(2);
  if (count === 11) expect(geometry.sizeRatio).toBeGreaterThan(2);
  if (count > 1) expect(geometry.spacingViolations).toBe(0);
}

async function installCloudProbe(page: Page) {
  await page.addInitScript(() => {
    const nativeFillText = CanvasRenderingContext2D.prototype.fillText;
    const nativeClearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.matches(".cloud-canvas")) {
        this.canvas.dataset.testOverlap = "0";
        this.canvas.dataset.testSpacingViolations = "0";
        this.canvas.dataset.testDraws = "[]";
      }
      nativeClearRect.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function(text, left, top, maxWidth) {
      if (this.canvas.matches(".cloud-canvas")) {
        const stamp = document.createElement("canvas");
        stamp.width = this.canvas.width;
        stamp.height = this.canvas.height;
        const context = stamp.getContext("2d")!;
        context.setTransform(this.getTransform());
        context.font = this.font;
        context.textAlign = this.textAlign;
        context.textBaseline = this.textBaseline;
        nativeFillText.call(context, text, left, top);
        const before = this.getImageData(0, 0, stamp.width, stamp.height).data;
        const next = context.getImageData(0, 0, stamp.width, stamp.height).data;
        let overlaps = Number(this.canvas.dataset.testOverlap || 0);
        for (let index = 3; index < before.length; index += 4) {
          if (before[index] >= 128 && next[index] >= 128) overlaps++;
        }
        this.canvas.dataset.testOverlap = String(overlaps);
        const ratio = this.canvas.width / this.canvas.clientWidth;
        context.lineWidth = 16 * ratio;
        context.lineJoin = "round";
        context.strokeText(text, left, top);
        const padded = context.getImageData(0, 0, stamp.width, stamp.height).data;
        let spacingViolations = Number(this.canvas.dataset.testSpacingViolations || 0);
        for (let index = 3; index < before.length; index += 4) {
          if (before[index] >= 128 && padded[index] >= 128) spacingViolations++;
        }
        this.canvas.dataset.testSpacingViolations = String(spacingViolations);
        const draws = JSON.parse(this.canvas.dataset.testDraws || "[]");
        draws.push({ text, top: this.getTransform().f, size: Number(this.font.match(/([\d.]+)px/)?.[1] || 0) });
        this.canvas.dataset.testDraws = JSON.stringify(draws);
      }
      if (maxWidth === undefined) nativeFillText.call(this, text, left, top);
      else nativeFillText.call(this, text, left, top, maxWidth);
    };
  });
}

test.beforeEach(async ({ page }) => installCloudProbe(page));

test("cloud simulator previews many words without changing the session", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cloud-canvas")).toHaveAttribute("data-ready", "true");
  const saved = await page.evaluate(() => localStorage.getItem("pulse:sessions"));
  await page.getByRole("button", { name: "Simulate word cloud", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Word cloud simulator" });
  await checkCloudGeometry(dialog, 60);
  await expect(dialog.getByText("60 distinct words", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/cloud-simulator-desktop.png", fullPage: true });
  const original = await dialog.locator(".cloud-word").first().textContent();
  await dialog.getByRole("button", { name: "Regenerate sample", exact: true }).click();
  await expect(dialog.locator(".cloud-word").first()).not.toHaveText(original!);
  await checkCloudGeometry(dialog, 60);
  const slider = dialog.getByRole("slider", { name: "Distinct words", exact: true });
  await slider.fill("30");
  await checkCloudGeometry(dialog, 30);
  await dialog.getByLabel("Frequency distribution", { exact: true }).selectOption("equal");
  await expect(dialog.getByText("150 sample responses", { exact: true })).toBeVisible();
  await checkCloudGeometry(dialog, 30);
  await page.setViewportSize({ width: 390, height: 844 });
  await slider.fill("60");
  await checkCloudGeometry(dialog, 60);
  await noOverflow(page);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: "test-results/cloud-simulator-mobile.png", fullPage: true });
  await dialog.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await checkCloudGeometry(page, 11);
  expect(await page.evaluate(() => localStorage.getItem("pulse:sessions"))).toBe(saved);
  expect(await page.evaluate(() => localStorage.getItem("pulse:host"))).toBeNull();
});

test("dense canvas cloud handles long phrases, live updates, and resizing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  const url = await page.getByLabel("Participant link", { exact: true }).inputValue();
  const code = new URL(url).searchParams.get("code")!;
  await page.getByRole("button", { name: "Start questions", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause responses", exact: true })).toBeVisible();
  const clients: ReturnType<typeof connect>[] = [];
  try {
    for (let index = 0; index < 60; index++) {
      const client = connect("http://localhost:5173", { transports: ["websocket"], forceNew: true });
      clients.push(client);
      const joined = await client.timeout(3000).emitWithAck("room:join", { code, name: `Guest ${index + 1}` });
      expect(joined.ok).toBe(true);
      const value = index === 0 ? "a wonderfully creative day" : `idea ${index + 1}`;
      const voted = await client.timeout(3000).emitWithAck("room:vote", { code, token: joined.token, questionId: joined.state.questions[0].id, value });
      expect(voted.ok, voted.error).toBe(true);
      if (index === 1 || index === 4) {
        await checkCloudGeometry(page, index + 1);
        await page.screenshot({ path: `test-results/cloud-${index + 1}-words.png`, fullPage: true });
      }
    }
    await checkCloudGeometry(page, 60);
    await page.screenshot({ path: "test-results/cloud-dense-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 1000 });
    await expect.poll(() => page.locator(".cloud-canvas").evaluate((surface: HTMLCanvasElement) => Math.abs(surface.width - surface.clientWidth))).toBeLessThan(2);
    await checkCloudGeometry(page, 60);
    await noOverflow(page);
    await page.screenshot({ path: "test-results/cloud-dense-mobile.png", fullPage: true });
  } finally {
    clients.forEach((client) => client.disconnect());
  }
});

test("canvas cloud stays crisp and collision-free on high-DPI phones", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  try {
    const page = await context.newPage();
    await installCloudProbe(page);
    await page.goto("/");
    await checkCloudGeometry(page, 11);
    expect(await page.locator(".cloud-canvas").evaluate((surface: HTMLCanvasElement) => surface.width / surface.clientWidth)).toBe(2);
    await page.screenshot({ path: "test-results/cloud-retina-mobile.png", fullPage: true });
  } finally {
    await context.close();
  }
});

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
        revealMode,
        competitive,
        showRanking,
      }: {
        type: string;
        title: string;
        options: string[];
        correct: number | null;
        revealMode?: string;
        competitive?: boolean;
        showRanking?: boolean;
      }) => ({
        type,
        title,
        options,
        correct,
        ...(revealMode ? { revealMode } : {}),
        ...(competitive !== undefined ? { competitive } : {}),
        ...(showRanking !== undefined ? { showRanking } : {}),
      }),
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

test("title-and-description slides show no input to participants or reveal controls to hosts", async ({
  page,
  context,
}) => {
  await page.goto("/");
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
  await page.getByRole("button", { name: "Invite audience", exact: true }).click();
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
  await page.getByRole("button", { name: "Start questions", exact: true }).click();
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
      await expect(participant.getByRole("button", { name: "Send response", exact: true })).toHaveCount(0);
    }
    await expect(page.locator(".lobby-count strong")).toHaveText("2");
    await expect(page.locator(".lobby-people li")).toHaveText(["Alex", "Sam"]);
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
      await expect(participant.getByText("Live results", { exact: true })).toBeVisible();
    }
    await expect(page.locator(".cloud-word")).toContainText("inspired");
    await expect(page.locator(".cloud-word")).toHaveAttribute("title", "2 responses");
    await checkCloudGeometry(page, 1);
    await audience.reload();
    await expect(audience.getByText("Live results", { exact: true })).toBeVisible();
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
    // Questions with an answer hide responses until revealed.
    // The options stay on the slide, but the counts and bars are hidden.
    await expect(page.locator(".poll-results.counts-hidden .poll-row")).toHaveCount(4);
    await expect(page.locator(".poll-results.counts-hidden .bar-track")).toHaveCount(0);
    await expect(page.locator(".poll-results.counts-hidden")).toContainText("Saturn");
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
    await expect(page.locator(".leaderboard.compact")).toContainText(/9\d\d pts/);
    await expect(audience.locator(".leaderboard.compact")).toContainText("Alex");
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
    await page.getByRole("button", { name: "Show podium", exact: true }).click();
    await expect(audience.locator(".podium-section")).toContainText("Alex");
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
  await page.getByRole("dialog").getByRole("button", { name: /Multiple choice/ }).click();
  await expect(page.locator(".host-lobby")).toBeVisible();
  await page.getByRole("button", { name: "Invite audience", exact: true }).click();
  const link = await page
    .getByRole("dialog")
    .getByLabel("Participant link", { exact: true })
    .inputValue();
  const code = new URL(link).searchParams.get("code")!;
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const players: { name: string; page: Page }[] = [];
  for (const name of ["Alex", "Sam"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const player = await context.newPage();
    await player.goto(`/join?code=${code}`);
    await player.getByLabel("Your name", { exact: true }).fill(name);
    await player.getByRole("button", { name: "Join the room", exact: true }).click();
    await expect(player.getByRole("heading", { name: "Welcome, everyone.", exact: true })).toBeVisible();
    players.push({ name, page: player });
  }
  await expect(page.locator(".lobby-count strong")).toHaveText("2");
  await page.getByRole("button", { name: "Ask players to write questions", exact: true }).click();
  for (const { name, page: player } of players) {
    await expect(player.getByRole("heading", { name: "Write a question for everyone" })).toBeVisible();
    await player.getByRole("textbox", { name: /Your question/ }).fill(`${name}'s favourite?`);
    await player.getByRole("textbox", { name: "Option 1", exact: true }).fill(`${name} one`);
    await player.getByRole("textbox", { name: "Option 2", exact: true }).fill(`${name} two`);
    await player.getByRole("button", { name: "Submit my question", exact: true }).click();
    await expect(player.getByText(/Your question is in/)).toBeVisible();
  }
  await expect(page.locator(".crowd-writing .lobby-count strong")).toHaveText("2");
  // A refresh keeps what the player already submitted in the form.
  await players[0].page.reload();
  await expect(players[0].page.getByText(/Your question is in/)).toBeVisible();
  await expect(players[0].page.getByRole("textbox", { name: /Your question/ })).toHaveValue("Alex's favourite?");
  await expect(players[0].page.getByRole("textbox", { name: "Option 1", exact: true })).toHaveValue("Alex one");
  await expect(players[0].page.getByRole("textbox", { name: "Option 2", exact: true })).toHaveValue("Alex two");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const seen: string[] = [];
  for (let step = 0; step < 2; step++) {
    if (step > 0) await expect(page.locator(".question-eyebrow .author-name").first()).not.toHaveText(seen[0]);
    const author = (await page.locator(".question-eyebrow .author-name").first().innerText()).trim();
    seen.push(author);
    const name = author.charAt(0) + author.slice(1).toLowerCase();
    await expect(page.getByRole("heading", { name: `${name}'s favourite?` })).toBeVisible();
    for (const { page: player } of players) {
      await expect(player.getByRole("heading", { name: `${name}'s favourite?` })).toBeVisible();
      await expect(player.locator(".participant-author .author-name")).toHaveText(name);
    }
    if (step === 0) await page.getByRole("button", { name: "Next question", exact: true }).last().click();
  }
  expect(new Set(seen).size).toBe(2);
});

test("two truths and a lie uses a fixed question and shows the statements in a single column", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add question", exact: true }).last().click();
  await page.getByRole("dialog").getByRole("button", { name: /Two truths and a lie/ }).click();
  const editor = page.getByRole("dialog");
  await expect(editor.getByText("Pick the one that is not true.")).toBeVisible();
  await expect(editor.getByRole("textbox", { name: "Your question", exact: true })).toHaveCount(0);
  const long = (text: string) => `${text} and this statement is intentionally long so it needs the full width of the screen`;
  await editor.getByLabel("Option 1", { exact: true }).fill(long("I once met a president"));
  await editor.getByLabel("Option 2", { exact: true }).fill(long("I have run a marathon"));
  await editor.getByLabel("Option 3", { exact: true }).fill(long("I have never eaten pizza"));
  await editor.getByLabel("Option 3 is the lie", { exact: true }).check();
  await expect(editor.getByRole("button", { name: /Remove option/ })).toHaveCount(0);
  await editor.getByRole("button", { name: "Save question", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pick the one that is not true.", exact: true })).toBeVisible();
  for (let step = 0; step < 4; step++)
    await page.getByRole("button", { name: "Move question up", exact: true }).click();
  await expect(page.locator(".question-thumbnail.selected .thumbnail-number")).toHaveText("01");

  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await page.getByRole("button", { name: "Invite audience", exact: true }).click();
  const link = await page.getByRole("dialog").getByLabel("Participant link", { exact: true }).inputValue();
  const code = new URL(link).searchParams.get("code")!;
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const player = await context.newPage();
  await player.goto(`/join?code=${code}`);
  await player.getByLabel("Your name", { exact: true }).fill("Alex");
  await player.getByRole("button", { name: "Join the room", exact: true }).click();
  await expect(page.locator(".lobby-count strong")).toHaveText("1");
  await page.getByRole("button", { name: "Start questions", exact: true }).click();
  await expect(player.getByRole("heading", { name: "Pick the one that is not true." })).toBeVisible();
  const options = player.locator(".answer-option");
  await expect(options).toHaveCount(3);
  await expect(player.locator(".answer-options.two-col")).toHaveCount(0);
  const boxes = await options.evaluateAll((items) => items.map((item) => item.getBoundingClientRect()));
  expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1);
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom - 1);
  expect(boxes[2].top).toBeGreaterThan(boxes[1].bottom - 1);
  await options.nth(2).click();
  await player.getByRole("button", { name: "Send response", exact: true }).click();
  await page.getByRole("button", { name: "Reveal results", exact: true }).click();
  await expect(page.locator(".answer-badge")).toHaveText(/The lie/);
  await expect(player.getByText(/The lie: .*never eaten pizza/)).toBeVisible();
});
