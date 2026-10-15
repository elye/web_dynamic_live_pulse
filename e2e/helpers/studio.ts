import type { Page } from "@playwright/test";

/** The app opens on the workspace; open the first saved session in the studio. */
export async function openStudio(page: Page) {
  await page.locator(".session-card-open").first().click();
}

/** Load the host app and open the first session in the studio. */
export async function gotoStudio(page: Page) {
  await page.goto("/");
  await openStudio(page);
}
