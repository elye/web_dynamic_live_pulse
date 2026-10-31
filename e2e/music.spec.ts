import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

/** One second of silence as a WAV file, so the browser can really play it. */
function silentWav() {
  const rate = 8000;
  const data = Buffer.alloc(rate * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

test("music fades in over 2 seconds on start, can be adjusted live, and fades out on end", async ({
  page,
}) => {
  await gotoStudio(page);
  await page.getByLabel("Session music", { exact: true }).setInputFiles({
    name: "theme.wav",
    mimeType: "audio/wav",
    buffer: silentWav(),
  });
  await expect(page.locator(".music-name")).toHaveText("theme.wav");
  await page.getByRole("slider", { name: "Music volume" }).fill("50");

  const audio = page.locator("audio[data-testid=session-music]");
  await expect(audio).toHaveCount(1);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);

  await page.getByRole("button", { name: "Present live", exact: true }).click();
  await expect(page.locator(".welcome-lobby")).toBeVisible();
  const volume = () => audio.evaluate((el: HTMLAudioElement) => el.volume);
  await expect.poll(volume, { timeout: 1000 }).toBeLessThan(0.5);
  await expect.poll(volume, { timeout: 4000 }).toBeCloseTo(0.5, 2);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(false);

  await page.getByRole("slider", { name: "Music volume" }).fill("20");
  await expect.poll(volume).toBeCloseTo(0.2, 2);

  await page.getByRole("button", { name: "Start questions" }).click();
  await page.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(page.locator(".slide-only")).toBeVisible();
  const bar = page.locator(".fullscreen-bar");
  await page.mouse.move(50, 50);
  await expect(bar).toHaveClass(/visible/);
  await bar.getByRole("slider", { name: "Music volume" }).fill("60");
  await expect.poll(volume).toBeCloseTo(0.6, 2);
  await bar.getByRole("button", { name: "Mute music" }).click();
  await expect.poll(volume).toBe(0);
  await bar.getByRole("button", { name: "Unmute music" }).click();
  await expect.poll(volume).toBeCloseTo(0.6, 2);
  await page.getByRole("button", { name: /Exit full screen/ }).click();

  await page.getByRole("button", { name: "End session", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End session", exact: true })
    .click();
  await expect.poll(volume, { timeout: 1000 }).toBeGreaterThan(0);
  await expect.poll(volume, { timeout: 4000 }).toBe(0);
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.paused))
    .toBe(true);
});

test("a non-audio file is refused", async ({ page }) => {
  await gotoStudio(page);
  await page.getByLabel("Session music", { exact: true }).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(page.getByText("Choose an audio file.")).toBeVisible();
  await expect(page.locator(".music-name")).toHaveCount(0);
});
