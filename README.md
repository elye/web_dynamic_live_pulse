# Pulse

A real-time audience app for live word clouds, multiple-choice polls, quizzes, and open responses. Built with React, TypeScript, Vite, Express, and Socket.IO.

## Run Locally

Requires Node.js 22.18+ and npm (the tests use native TypeScript stripping). Tested on Node.js 24.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The command starts Vite and the live server together. If 5173 is occupied, use the next port printed by Vite. The API and WebSocket server use port 3001; stop any conflicting process or change the backend port and Vite proxy together.

## Host a Session

1. Start in the studio with an editable four-question check-in, or create a session from the template library.
2. Edit questions, answer choices, and correct quiz answers. Duplicate, reorder, or delete questions and select a slide mood.
3. Select **Present live** to open the welcome screen. The QR code, room code, and selectable participant URL are always visible beside the live participant roster. Use the copy icon to copy the URL, or select the field to copy it manually.
  Select **Start questions** when everyone is ready. Participants wait in the welcome lobby until then.
4. Participants visit `/join`, enter the room code and a display name, and submit one response per question.
5. Pause or reopen voting, reveal results, and advance questions. Each correct quiz answer earns 1,000 points.
6. End the session to view the summary and leaderboard. Export aggregated responses to CSV before stopping the server or starting another room.

The editor's sample responses are labeled and never become live submissions. Live sessions always start empty. Quiz answers and audience results stay hidden from participants until the host reveals them. Participants and hosts can refresh and reconnect to their existing session.

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
      "correct": 1
    }
  ]
}
```

Supported types are `cloud`, `poll`, `quiz`, and `text`; supported themes are `mint`, `peach`, `lilac`, and `sky`. `correct` is a zero-based option index for quizzes and `null` otherwise. Word clouds and open responses use an empty `options` array. Existing question and option limits apply to imports.

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
- Word clouds accept up to 30 characters and display the 60 most frequent distinct responses. Open responses accept up to 280 characters. Polls and quizzes support 2 to 6 options.
- Host controls require a server-generated bearer token. Keep host browser storage private. All visitors can create their own rooms; room codes are invitation codes, not confidential access controls.

## Before Public Deployment

This is a working single-server prototype for trusted groups, not a production-hardened hosted service. Public deployment needs HTTPS, account authentication, persistent storage and retention rules, origin restrictions, per-IP rate limiting and abuse controls, moderation, and appropriate privacy policies. Multi-instance deployment also needs shared room state and a Socket.IO adapter. The existing per-socket event limit and payload limits do not replace those protections.

Fonts are loaded from Google Fonts, with local sans-serif fallbacks. The included workshop image is from [Unsplash](https://images.unsplash.com/photo-1522071820081-009f0129c71c).
