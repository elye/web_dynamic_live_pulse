import { expect, test } from "./helpers/test";
import { readFile } from "node:fs/promises";
import { noOverflow } from "./helpers/layout";

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
