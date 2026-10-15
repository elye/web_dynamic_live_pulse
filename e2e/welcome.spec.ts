import { expect, test } from "./helpers/test";
import { noOverflow } from "./helpers/layout";

test("welcome screen keeps QR, copyable URL, and roster visible without a dialog", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/network", (route) =>
    route.fulfill({ json: { address: "192.168.0.3" } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Present live", exact: true }).click();
  const lobby = page.getByRole("region", { name: "Welcome lobby" });
  const link = lobby.getByRole("textbox", {
    name: "Participant link",
    exact: true,
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(link).toHaveValue(
    /^http:\/\/192\.168\.0\.3:5173\/join\?code=\d{6}$/,
  );
  const url = await link.inputValue();
  await expect(lobby.locator(".qr-frame svg")).toBeVisible();
  await expect(lobby.locator(".lobby-count strong")).toHaveText("0");
  await lobby
    .getByRole("button", { name: "Copy participant link", exact: true })
    .click();
  await expect(
    lobby.getByRole("status").filter({ hasText: "Link copied" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await link.focus();
  expect(
    await link.evaluate((element: HTMLInputElement) =>
      element.value.slice(element.selectionStart!, element.selectionEnd!),
    ),
  ).toBe(url);
  await expect(
    lobby.getByRole("link", { name: "Open participant view" }),
  ).toHaveAttribute(
    "href",
    `/join?code=${new URL(url).searchParams.get("code")}`,
  );
  await page
    .getByRole("button", { name: "Invite audience", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByLabel("Participant link", { exact: true }),
  ).toHaveValue(url);
  expect(await dialog.locator(".qr-frame svg").innerHTML()).toBe(
    await lobby.locator(".qr-frame svg").innerHTML(),
  );
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    await expect(link).toBeVisible();
    const bounds = await lobby.locator(".qr-frame svg").boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(180);
    const layout = await lobby.evaluate((element) => {
      const join = element
        .querySelector(".lobby-join")!
        .getBoundingClientRect();
      const roster = element
        .querySelector(".lobby-roster")!
        .getBoundingClientRect();
      return join.right <= roster.left + 1 || join.bottom <= roster.top + 1;
    });
    expect(layout).toBe(true);
    await page.screenshot({
      path: `test-results/welcome-sharing-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.reject(new Error("Clipboard blocked")),
      configurable: true,
    }),
  );
  await lobby
    .getByRole("button", { name: "Copy participant link", exact: true })
    .click();
  await expect(lobby.locator(".copy-feedback")).toContainText("Copy the link");
  await expect(link).toBeFocused();
  expect(
    await link.evaluate(
      (element: HTMLInputElement) =>
        element.selectionEnd! - element.selectionStart!,
    ),
  ).toBe(url.length);
});
