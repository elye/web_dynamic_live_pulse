# Pulse

A real-time audience app for live word clouds, multiple-choice polls, quizzes, true-or-false questions, ranking exercises, slider estimates, live Q&A, 100-point allocations, 2x2 grid placements, open responses, and title-and-description slides. Built with React, TypeScript, Vite, Express, and Socket.IO.

## Run Locally

Requires Node.js 22.18+ and npm (the tests use native TypeScript stripping). Tested on Node.js 24.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The command starts Vite and the live server together. If 5173 is occupied, use the next port printed by Vite. The API and WebSocket server use port 3001; stop any conflicting process or change the backend port and Vite proxy together.

## Host a Session

1. Start in the studio with an editable four-question check-in, or create a session from the template library.
2. Edit questions, answer choices, and correct quiz answers. Duplicate, reorder, or delete questions and select a slide mood. Reorder by dragging a question's card in the question rail to a new position (drag handle on the right), or use the up/down arrows in the question details panel. Reordering is disabled while a session is live.
3. Select **Present live** to open the welcome screen. The QR code, room code, and selectable participant URL are always visible beside the live participant roster. Use the copy icon to copy the URL, or select the field to copy it manually.
  Select **Start questions** when everyone is ready. Participants wait in the welcome lobby until then.
4. Participants visit `/join`, enter the room code and a display name, and submit one response per question.
5. Pause or reopen voting, reveal results, and advance questions. Each correct quiz or true-or-false answer earns up to 1,000 points: the faster the answer, the more points.
6. End the session to view the summary and leaderboard. Export aggregated responses to CSV before stopping the server or starting another room.

### Player-made questions

Instead of building the questions yourself, select **New session**, then **Players write the questions**, and pick a question type (any type that collects a response, such as multiple choice, quiz, word cloud, or slider). Then:

1. Players join the lobby as usual.
2. Select **Ask players to write questions**. Every player's screen switches to a form for that question type (the quiz form includes the correct answer, the slider form the range, and so on). Players can edit their question until the game starts.
3. The host sees how many questions are in and who is still writing. Select **Start game** once at least one question is in. Players who have not submitted are skipped.
4. The submitted questions play in random order, like a normal session, with everyone answering. Each question shows the name of the player who wrote it on the stage, on participants' screens, and in the results. The host's usual controls (reveal, ranking, podium) all apply.

A quiz or true-or-false author does not earn points for their own question. Player-made rooms are not drawn from the saved session: the studio questions are ignored, and JSON backups are unaffected.

Add a **Title & description** question when you just need to show participants a title and a longer description without collecting any response, such as a welcome slide or a break announcement. Participants see only the title and description text and cannot submit anything; hosts see **Next question**/**Finish session** but no pause or reveal controls, since there is nothing to collect. Slide questions are skipped in the results summary.

Add a **True or false** question for a quick binary call. It behaves like a quiz with exactly two fixed options ("True"/"False", editable), a correct answer, and up to 1,000 points for a correct response (faster answers score more).

Add a **Ranking** question to have participants drag (or use the up/down controls) to sort 2 to 6 items from most to least important. Each participant submits a full ordering; results are aggregated with Borda-count scoring (an item earns more points the higher it's ranked) and shown sorted from highest to lowest. Ranking has no single correct answer, so it does not award leaderboard points.

Add a **Slider** question to have participants estimate a numeric value on a sliding scale. Set the minimum, maximum, and step in the question editor; participants drag a slider between those bounds and submit one value. Results show the average of all responses plus a histogram of how many participants chose each value. Slider has no single correct answer, so it does not award leaderboard points.

Add a **Q&A** question to let participants submit and upvote live questions, such as for an open floor or office hours. Each participant can submit one question of their own and upvote (or remove their upvote from) any submitted question, including their own, with one upvote per participant per entry. Unlike every other question type, Q&A results are visible to participants immediately as entries and upvotes arrive, not just after the host reveals them, so the host's **Reveal results** control does not apply to Q&A. Q&A has no single correct answer, so it does not award leaderboard points.

Add a **100 Points** question to have participants allocate 100 points across 2 to 6 options to show relative priorities. Each participant distributes exactly 100 points across the options (using a slider or a number field per option) and submits once their total reaches 100. Results show the summed points per option, sorted from highest to lowest. 100 Points has no single correct answer, so it does not award leaderboard points.

Add a **2x2 Grid** question to have participants rate something across two axes at once, such as urgency versus impact. Set 4 axis labels in the question editor (x-axis low/high and y-axis low/high); participants tap anywhere on the grid to place a point and submit. Results show the average point plus every individual response plotted as a dot on the same grid. 2x2 Grid has no single correct answer, so it does not award leaderboard points.

### Heart reactions

Every participant has a heart button next to the room status. Each tap sends a heart to the host: a heart shape pops up on the live dashboard, floats toward the top of the stage, and slowly fades away. Hearts work on every question type, including slides (the button appears once the host starts the questions), and are shown to the host only (participants see just a small tap animation). The server limits each participant to about five hearts per second, and hearts never count toward votes, scores, or exported results. Hearts are not part of the session JSON. With reduced-motion settings, floating hearts are not shown.

### Competition mode

Quiz and True or False questions have a **Faster answers score more** checkbox in the question editor (other types have no correct answer, so they can't compete). It is **on by default** and is stored per question as `"competitive": true` or `false` in exported JSON; a missing value counts as on.

- A competitive question scores **500 points for the right answer plus up to 500 for speed**. The speed bonus falls linearly to zero over 20 seconds, measured from when the question first opened to answers (pausing and resuming does not restart the clock). Wrong or missing answers score 0.
- If the box is unticked, the question awards a flat 1,000 points for a correct answer regardless of speed.
- Scores are calculated on the server and appear on the leaderboard only after the host reveals results.
- Response times are kept in memory for the live room only; they are never exported.
- **Final podium:** when the session has at least one question with an answer and someone scored, the host's last step before **Finish session** is **Show podium**: a Kahoot-style podium of the top 3 players (gold, silver, and bronze medals, names, and points) with large names, revealed one place at a time (3rd, then 2nd, then 1st) before the confetti bursts, shown on the host stage and every participant's screen. It also appears on the wrap-up screen and at the top of the host's **Results** page, above the full leaderboard. Sessions with no answered questions keep the plain leaderboard and no confetti. With reduced-motion settings, the confetti and podium animations are turned off.

### Question groups

The question picker and the editor's type menu split question types in two groups:

1. **Without an answer** (title & description, word cloud, multiple choice, ranking, slider, Q&A, 100 Points, 2x2 Grid, open response): responses default to **Show on the fly** and nothing is scored.
2. **With an answer** (Quiz, True or False): responses default to **Hide until done**, players are scored, and after **Show results** the host can click **Show ranking** to show the top 10 players to everyone before the next question. Untick **Show the top 10 ranking** in the editor to skip that step for a question (stored as `showRanking` in exported JSON; the ranking is never shown after the final question, which goes to the podium instead).

The host's main button therefore steps through: **Show results** → **Show ranking** → **Next question**, and at the end **Show podium** → **Finish session**. Steps that don't apply to a question are skipped.

### Reveal mode

Every question that collects responses (everything except title-and-description slides and Q&A, which is always live) has a **When should responses show?** setting in the question editor:

- **Hide until done** (default for questions with an answer: Quiz and True or False): the host dashboard and participants see only how many people have responded. Click **Reveal results** to show the answers.
- **Show on the fly** (default for every other type): responses appear live as people answer, for both the host and the audience. Correct answers and leaderboard scores for quizzes still wait for **Reveal results**.

While a question's results are still hidden, the host's main button reads **Show results**: the first click reveals them, and only then does it become **Next question** (or **Finish session** on the last question). This prevents skipping past a question before the audience has seen the answers. Slides, Q&A, and questions set to **Show on the fly** have nothing left to reveal, so they go straight to the next question. The exception is Quiz and True or False, whose correct answer and scores still wait for **Show results** even in live mode. The small arrow in the slide controls still jumps directly.

The choice is stored per question as `revealMode` (`"live"` or `"onDone"`) in exported JSON.

The editor's sample responses are labeled and never become live submissions. Live sessions always start empty. Quiz answers and audience results stay hidden from participants until the host reveals them. Participants and hosts can refresh and reconnect to their existing session.

Word clouds use WordCloud2's canvas glyph-occupancy layout: frequent responses appear larger, smaller words pack around them with occasional vertical rotations, and the finished cloud is centered in its frame. The renderer adapts to screen size and high-DPI displays, uses a bundled Manrope font to keep measurement and drawing consistent, and provides hover counts plus an accessible text list.

Each word reserves an invisible margin around its letters, with extra spacing for small clouds. Dense mobile clouds use a taller drawing area to preserve readable gaps. This relies on the tracked WordCloud2 patch in `patches/`, applied automatically by `npm install` via `patch-package`; installations that skip lifecycle scripts must run `npm run postinstall` before building.

### Quick Word Cloud Simulation

Select a word-cloud question in the studio and click the flask icon (**Simulate word cloud**) above the slide preview. The simulator opens with 60 sample words. Adjust **Distinct words** from 10 to 60, choose popular or equal frequencies, and use **Regenerate sample** to try another mix. It uses the real cloud renderer but never creates a live room, adds votes, or modifies saved questions. Close the dialog to return to the usual preview.

## Back Up, Restore, and Delete Sessions

- **Export:** Select the download icon on a session in **My sessions**, or **Export session JSON** in the studio. This downloads a `.pulse.json` file containing the session title, theme, questions, choices, and correct quiz answers. Keep this file private if quiz answers are sensitive.
- **Import:** In **My sessions**, select **Import JSON**, choose an exported file or paste its contents, then select **Import session**. Each import creates a new editable draft with new IDs, without replacing existing sessions. Import is disabled while hosting a live session.
- **Delete:** Select the trash icon on a session card or **Delete session** in the studio. The confirmation includes an **Export JSON** button for making a backup first. Confirming deletes all questions and linked hosted rooms, including live or ended rooms and their responses. Participants in deleted rooms are notified and can no longer submit or rejoin. Deleting the last session leaves an empty library, including after refresh.
- Deleting a hosted session requires a connection to the server; if deletion fails, the local session is kept. Already expired or missing rooms do not prevent deletion. Draft-only sessions can be deleted without a server connection.

JSON backups contain reusable content, not participant identities, responses, scores, room codes, host tokens, or internal IDs. Use **Export CSV** separately for response data before deleting. Import accepts files up to 128 KB and validates every question before creating a session.

The versioned format is:

```json
{
  "format": "pulse-session",
  "version": 1,
  "title": "Team check-in",
  "theme": "mint",
  "questions": [
    {
      "type": "quiz",
      "title": "Which planet has the most moons?",
      "options": ["Jupiter", "Saturn", "Neptune", "Mars"],
      "correct": 1,
      "competitive": true,
      "revealMode": "onDone"
    },
    {
      "type": "truefalse",
      "title": "The sky is blue.",
      "options": ["True", "False"],
      "correct": 0,
      "competitive": false
    },
    {
      "type": "ranking",
      "title": "Rank these from most to least important",
      "options": ["Speed", "Quality", "Cost", "Communication"],
      "correct": null
    },
    {
      "type": "slider",
      "title": "How many hours a day do you spend in meetings?",
      "options": [],
      "correct": null,
      "sliderMin": 0,
      "sliderMax": 10,
      "sliderStep": 1
    },
    {
      "type": "qna",
      "title": "Ask us anything",
      "options": [],
      "correct": null
    },
    {
      "type": "points100",
      "title": "Allocate 100 points across what matters most to you",
      "options": ["Design", "Performance", "Reliability", "Cost"],
      "correct": null
    },
    {
      "type": "grid2x2",
      "title": "Place your priority on the grid",
      "options": ["Low urgency", "High urgency", "Low impact", "High impact"],
      "correct": null
    }
  ]
}
```

Supported types are `slide`, `cloud`, `poll`, `quiz`, `truefalse`, `ranking`, `slider`, `qna`, `points100`, `grid2x2`, and `text`; supported themes are `mint`, `peach`, `lilac`, and `sky`. `correct` is a zero-based option index for quizzes and true-or-false questions, and `null` otherwise (including for ranking, slider, Q&A, 100 Points, and 2x2 Grid, which have no single correct answer). Word clouds, open responses, Q&A, and slides use an empty `options` array; true-or-false questions require exactly 2 options; polls, quizzes, ranking, and 100 Points require 2 to 6; 2x2 Grid questions require exactly 4 options, used as axis labels in a fixed order (x-axis low, x-axis high, y-axis low, y-axis high) up to 40 characters each rather than selectable choices; slider questions also use an empty `options` array and instead require `sliderMin`, `sliderMax`, and `sliderStep` (`sliderMax` must exceed `sliderMin`, `sliderStep` must be positive, and the range must divide into at most 1000 steps). Slide questions require a non-empty `description` (up to 280 characters); other types omit it. Every type except `slide` and `qna` carries `revealMode`: `"onDone"` hides results (showing only the response count) until the host clicks Reveal results, and `"live"` shows responses as they arrive. It is optional on import and defaults to `"live"` for word clouds and `"onDone"` otherwise; any other value is rejected. Existing question and option limits apply to imports.

Newly hosted rooms are tracked with their source session, even across multiple runs. For sessions hosted before this feature, the currently recoverable host room is linked when its title and questions match the draft; older rooms whose host credentials were not retained cannot be recovered or deleted through the library and expire normally.

## Join From Phones

Devices must be on the same Wi-Fi, with network access to the host computer. The share dialog automatically uses the computer's LAN address when opened through localhost. Use that link or its QR code on a phone. A room code alone does not discover the host computer: participants must first open this app on that computer's network URL.

Local HTTP hosting works without `crypto.randomUUID`. Clipboard access may require HTTPS; the share-link field remains selectable for manual copying. Firewalls or Wi-Fi client isolation can block device-to-device connections.

## Build and Serve

```sh
npm run build
npm start
```

Open http://localhost:3001. Express serves the production build, API, and Socket.IO from the same origin. `PORT` changes the production listening port. `npm run preview` previews only the frontend; it is not the complete live app.

## Checks

```sh
npm test
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
```

Server tests cover authorization, hidden answers, input validation, duplicate votes, stale question IDs, scoring, case-insensitive word aggregation, real WebSocket traffic, room deletion, and JSON backup validation. Browser tests exercise editing, two independent participants, every question type, pause/reveal controls, refresh recovery, CSV and JSON downloads, file/paste restoration, draft/live/ended session deletion, invalid codes, and 390/768/1440px layouts. Browser screenshots and failure traces are written to the ignored `test-results` directory. The browser suite can start the development servers automatically.

`npm run format` formats source and documentation.

## Storage and Limits

- Draft sessions are saved in this browser's local storage. There is no account, cloud sync, or cross-device draft recovery.
- Live rooms and responses are held in server memory. They expire after 24 hours and are lost when the server restarts, including development-server restarts after backend edits.
- The results view shows the most recently hosted room. Export it before creating another room.
- Each room supports at most 30 questions and 500 participant identities. A participant token permits one response per question. Clearing browser storage creates a new identity; this is not a verified-person voting system.
- Word clouds accept up to 30 characters and display the 60 most frequent distinct responses. Open responses, Q&A questions, and slide descriptions accept up to 280 characters. Polls, quizzes, ranking, and 100 Points questions support 2 to 6 options. 2x2 Grid questions require exactly 4 axis labels, up to 40 characters each, and each submitted point is constrained to -100 to 100 on both axes. Slider questions use a configurable numeric range (minimum, maximum, and step) instead of options, with at most 1000 steps across the range.
- Host controls require a server-generated bearer token. Keep host browser storage private. All visitors can create their own rooms; room codes are invitation codes, not confidential access controls.

## Before Public Deployment

This is a working single-server prototype for trusted groups, not a production-hardened hosted service. Public deployment needs HTTPS, account authentication, persistent storage and retention rules, origin restrictions, per-IP rate limiting and abuse controls, moderation, and appropriate privacy policies. Multi-instance deployment also needs shared room state and a Socket.IO adapter. The existing per-socket event limit and payload limits do not replace those protections.

Fonts are loaded from Google Fonts, with local sans-serif fallbacks. The included workshop image is from [Unsplash](https://images.unsplash.com/photo-1522071820081-009f0129c71c).
