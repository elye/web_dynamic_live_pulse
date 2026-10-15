import { test as base } from "@playwright/test";
import { installCloudProbe } from "./cloud";

export { expect } from "@playwright/test";

/** Playwright `test` whose pages always have the cloud probe installed. */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await installCloudProbe(page);
    await provide(page);
  },
});
