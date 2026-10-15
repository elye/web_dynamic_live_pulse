import { expect, test } from "./helpers/test";
import { readFile } from "node:fs/promises";
import { gotoStudio } from "./helpers/studio";

for (const ended of [false, true]) {
  test(`delete ${ended ? "ended" : "live"} session removes its room and notifies participants`, async ({
    page,
    browser,
  }) => {
    await gotoStudio(page);
    await page
      .getByRole("button", { name: "Present live", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Invite audience", exact: true })
      .click();
    const code = new URL(
      await page
        .getByRole("dialog")
        .getByLabel("Participant link", { exact: true })
        .inputValue(),
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
