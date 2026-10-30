import { expect, test } from "./helpers/test";
import { gotoStudio } from "./helpers/studio";

test("match questions jumble the pairs, let players reorder them, and show the share right per pair", async ({
  page,
  browser,
}) => {
  await gotoStudio(page);
  await page
    .getByRole("button", { name: "Add question", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: /Put the second list in the order/ })
    .click();
  await expect(page.getByLabel("Item A 1", { exact: true })).toHaveValue(
    "Ada Lovelace",
  );
  await expect(page.getByLabel("Item B 1", { exact: true })).toHaveValue(
    "1815",
  );
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();

  await page.getByRole("button", { name: "Present live", exact: true }).click();
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
  const audience = await audienceContext.newPage();
  try {
    await audience.goto(`/join?code=${code}`);
    await audience.getByLabel("Your name", { exact: true }).fill("Avery");
    await audience
      .getByRole("button", { name: "Join the room", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start questions", exact: true })
      .click();

    // Advance through the two live questions, then the quiz's reveal/ranking steps.
    for (let index = 0; index < 2; index++) {
      await page
        .getByRole("button", { name: "Next question", exact: true })
        .last()
        .click();
    }
    await page
      .getByRole("button", { name: "Show results", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Show ranking", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .last()
      .click();
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .last()
      .click();
    await expect(
      audience.getByRole("heading", {
        name: "Match each person with their birth year",
        exact: true,
      }),
    ).toBeVisible();

    // Nobody starts with a free correct pair.
    const rows = audience.locator(".match-input-row");
    await expect(rows).toHaveCount(4);
    const startingOrder = await audience
      .locator(".match-input-answer > span")
      .allTextContents();
    const partners = ["1815", "1879", "1918", "1912"];
    startingOrder.forEach((year, row) => expect(year).not.toBe(partners[row]));

    // Put the right year beside Ada by dragging it there, then tap-to-swap the rest into place
    // (leaving the last two the wrong way round on purpose).
    const years = audience.locator(".match-input-answer");
    const yearOrder = () => years.locator("span").allTextContents();
    const wanted = ["1815", "1879", "1912", "1918"];
    for (const [row, year] of wanted.entries()) {
      const position = (await yearOrder()).indexOf(year);
      if (position === row) continue;
      if (row === 0) await years.nth(position).dragTo(years.nth(row));
      else {
        await years.nth(position).click();
        await years.nth(row).click();
      }
      await expect.poll(async () => (await yearOrder())[row]).toBe(year);
    }
    await expect(years.locator("span")).toHaveText(wanted);
    // The two tiles that just traded places stay highlighted for about a second.
    await expect(
      audience.locator(".match-input-answer.is-swapped"),
    ).toHaveCount(2);
    await expect(
      audience.locator(".match-input-answer.is-swapped"),
    ).toHaveCount(0, { timeout: 2500 });
    await audience
      .getByRole("button", { name: "Send response", exact: true })
      .click();

    await page
      .getByRole("button", { name: "Reveal results", exact: true })
      .click();
    await expect(audience.locator(".verdict")).toContainText("Partly right!");
    await expect(audience.locator(".verdict")).toContainText(
      "You earned 50% of the points.",
    );
    // Results are boxes on the left with an arrow to the right match and the share who got it.
    const resultRows = page.locator(".match-row");
    await expect(resultRows).toHaveCount(4);
    const expected = [
      ["Ada Lovelace", "100%", "1815"],
      ["Albert Einstein", "100%", "1879"],
      ["Katherine Johnson", "0%", "1918"],
      ["Alan Turing", "0%", "1912"],
    ];
    for (const [index, [name, share, year]] of expected.entries()) {
      const row = resultRows.nth(index);
      await expect(row.locator(".match-box").first()).toContainText(name);
      await expect(row.locator(".match-link")).toContainText(share);
      await expect(row.locator(".match-box-right")).toHaveText(year);
    }
  } finally {
    await audienceContext.close();
  }
});
