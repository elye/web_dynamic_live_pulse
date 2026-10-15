import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Asserts the page never scrolls sideways. */
export async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
