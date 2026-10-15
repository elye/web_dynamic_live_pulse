import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Asserts the canvas word cloud drew `count` words inside its frame without overlap. */
export async function checkCloudGeometry(page: Page | Locator, count: number) {
  await expect(page.locator(".cloud-word")).toHaveCount(count);
  const canvas = page.locator(".cloud-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveAttribute("data-words", String(count));
  const geometry = await canvas.evaluate((surface: HTMLCanvasElement) => {
    const pixels = surface
      .getContext("2d")!
      .getImageData(0, 0, surface.width, surface.height).data;
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
    const draws: { text: string; top: number; size: number }[] = JSON.parse(
      surface.dataset.testDraws || "[]",
    );
    return {
      rows: new Set(draws.map((word) => Math.round(word.top))).size,
      inside:
        bounds.left + left / ratio > frame.left &&
        bounds.left + right / ratio < frame.right &&
        bounds.top + top / ratio > frame.top &&
        bounds.top + bottom / ratio < frame.bottom,
      horizontalOffset: Math.abs(
        bounds.left +
          (left + right) / (2 * ratio) -
          (frame.left + frame.right) / 2,
      ),
      verticalOffset: Math.abs(
        bounds.top +
          (top + bottom) / (2 * ratio) -
          (frame.top + frame.bottom) / 2,
      ),
      overlappingPixels: Number(surface.dataset.testOverlap || 0),
      spacingViolations: Number(surface.dataset.testSpacingViolations || 0),
      drawn: draws.length,
      sizeRatio:
        Math.max(...draws.map((word) => word.size)) /
        Math.min(...draws.map((word) => word.size)),
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

/** Records every canvas draw so tests can measure the cloud. */
export async function installCloudProbe(page: Page) {
  await page.addInitScript(() => {
    const nativeFillText = CanvasRenderingContext2D.prototype.fillText;
    const nativeClearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.matches(".cloud-canvas")) {
        this.canvas.dataset.testOverlap = "0";
        this.canvas.dataset.testSpacingViolations = "0";
        this.canvas.dataset.testDraws = "[]";
      }
      nativeClearRect.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      left,
      top,
      maxWidth,
    ) {
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
        const padded = context.getImageData(
          0,
          0,
          stamp.width,
          stamp.height,
        ).data;
        let spacingViolations = Number(
          this.canvas.dataset.testSpacingViolations || 0,
        );
        for (let index = 3; index < before.length; index += 4) {
          if (before[index] >= 128 && padded[index] >= 128) spacingViolations++;
        }
        this.canvas.dataset.testSpacingViolations = String(spacingViolations);
        const draws = JSON.parse(this.canvas.dataset.testDraws || "[]");
        draws.push({
          text,
          top: this.getTransform().f,
          size: Number(this.font.match(/([\d.]+)px/)?.[1] || 0),
        });
        this.canvas.dataset.testDraws = JSON.stringify(draws);
      }
      if (maxWidth === undefined) nativeFillText.call(this, text, left, top);
      else nativeFillText.call(this, text, left, top, maxWidth);
    };
  });
}
