# Agent guide

Pulse is a live-polling app (React/Vite + Express/Socket.IO). Read the "Question Architecture" section of `README.md` before touching question code.

## Adding a question type

A question type is one folder, `src/questions/types/<kind>/`, on top of the shared platform in `src/questions/platform/`. Always use the scaffold. Never copy a folder by hand.

1. Choose the template that is closest:
   - `text`: participants submit free text.
   - `choice`: participants pick one option from a list, unscored.

   ```sh
   npm run new:question -- <kind> --label "Display name" --template text|choice
   ```

   `<kind>` is lower-case letters and digits, 2–24 characters, and must be new. The script creates the six files and adds the kind to `registry.ts` and to the five UI registries (`meta`, `results`, `input`, `editor`, `author`). Do not edit the registries yourself.

2. Resolve every `TODO(new-question)` in `src/questions/types/<kind>/`. `npm test` fails while any remain. Do not delete a marker without doing what it asks.

3. Work through this checklist. Each line is something that has been missed before.

   **Definition (`definition.ts`)**
   - [ ] `label`, `hint`, `tagline` are specific and unique.
   - [ ] `create()` returns a valid sample question.
   - [ ] Every field the type adds is declared in `QuestionRecord` (`platform/types.ts`), listed in `settings`, validated in `parse()` and written in `serialize()`. Use the same names everywhere.
   - [ ] `traits` differ from the defaults (`platform/define.ts`) only where the type needs it: scoring, reveal mode, upvotes, player authoring, and so on.
   - [ ] `prompt.purpose` says what the slide is and when to use it. `prompt.rules` names every field the importer accepts, its allowed values, and its limits. The contract test fails if an exported field is not named.
   - [ ] `answer.parse` rejects bad input with a player-readable error; `answer.describe`, `answer.simulate` and `results.aggregate` are consistent with it.

   **UI (`ui.tsx`, `results.tsx`, `input.tsx`, `editor.tsx`, `author.tsx`)**
   - [ ] `ui.tsx`: icon and thumbnail. `results.tsx`: the host and stage view, including the empty state and the simulator.
   - [ ] `input.tsx`: the participant's answer control, with disabled and already-answered states.
   - [ ] `editor.tsx`: a field for every setting. `author.tsx`: the player-authoring form, or an explicit "not authorable".
   - [ ] New styles go in `src/styles/`. Check that it works at 390px wide.

   **AI import and export**
   - [ ] `src/aiPrompt.ts` builds the prompt and its JSON example from the definitions, including the survey/quiz split (from the `scored` trait) and the list of scored types. Two parts are hand-written: the "GENERAL GUIDANCE" lines and `promptExamples` (the starter requests in the "Generate AI prompt" dialog). Read both. Add a starter example only if the type enables a use case the existing four don't show.
   - [ ] Export then import of a session containing the type gives the same session.
   - [ ] Never rename a stored field. Saved sessions and `pulse-session` v1 exports must keep loading.

4. Run these. All must pass with no new warnings:

   ```sh
   npx tsc -b
   npm run lint
   npm test
   npm run build
   npm run test:e2e
   ```

   The contract tests (`server/questions.contract.test.mjs`) pick the new kind up on their own. They check that the six files exist, create/export/import round-trip, answers, results and simulation, that the AI prompt describes the type and each field it exports, that the prompt's example JSON imports, that JSON import rejects a malformed value in each of the type's fields, and that no `TODO(new-question)` remains.

5. Add a Playwright spec in `e2e/` only for behaviour unique to the type. The existing "every question type" specs already cover the basics.

6. Update `README.md` if the type adds anything a user must know about.

## Rules

- Do not branch on a kind literal (`type === "poll"`) outside `src/questions/`. Ask for a trait instead, or add one in `platform/`. A boundary test enforces this.
- If a new type needs a change outside `src/questions/` (apart from `QuestionRecord`), the platform is missing a hook. Add the hook to `platform/` and keep it generic.
- Do not regenerate `server/fixtures/questions.golden.json` unless you mean to change existing behaviour.
- Run `npx prettier --write` only on files you changed. Do not run it over `src` or `server`.
