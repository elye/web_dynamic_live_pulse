# Question Architecture Plan

Goal: adding a question type means adding **one folder**. No existing function, switch, or list grows. Anything a new type forgets is a compile error or a failing contract test, not a runtime surprise.

Status: **implemented** (phases 0–4 and the acceptance test; see "Outcome" at the end). The README section "Question Architecture" describes the architecture as built. The sections below are the original plan and keep their original wording, so names such as `ui.tsx` and `registry.ui.tsx` were refined during the work: the UI is split into five seams (see Outcome).

## 1. Problem today

Question behaviour is spread across ~25 files as `type === "..."` chains. Each new type touches every one of them, and the client and server keep separate copies of the same rules.

| Concern                                                                                      | Where it lives today                                                                     | Shape                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| Kind list, labels, hints, icons, groups                                                      | `model.ts`, `constants/kinds.ts`, `server/rooms.mjs` (`kinds`)                           | Three parallel lists                    |
| Default sample question                                                                      | `model.ts` `newQuestion`                                                                 | Nested ternaries per field              |
| Capability flags (`hasRevealMode`, `canCompete`, `optionKinds`, `frameKinds`, crowd-allowed) | `model.ts`, `kinds.ts`, `rooms.mjs`                                                      | Hand-kept lists, duplicated             |
| Import / room-create validation and normalising                                              | `model.ts` `importSession` (~300 lines) and `rooms.mjs` (~150 lines)                     | Same rules written twice                |
| Export                                                                                       | `model.ts` `serializeSession`                                                            | One spread per type                     |
| Answer validation                                                                            | `rooms.mjs` `submitVote`                                                                 | `if / else if` chain                    |
| Result aggregation                                                                           | `rooms.mjs` `results`                                                                    | `if` chain                              |
| Scoring, start-up work, upvotes, peer assignment                                             | `rooms.mjs`                                                                              | Inline `type` checks                    |
| Simulated players                                                                            | `server/simulation.mjs`                                                                  | `switch`                                |
| Participant input and draft state                                                            | `AnswerForm.tsx`, `useParticipantController.ts`, `describeAnswer.ts`                     | Chains, plus per-type state in one hook |
| Stage results and previews                                                                   | `ResultsVisual.tsx` (331 lines)                                                          | Chains                                  |
| Editor, validity, player authoring                                                           | `QuestionEditor.tsx`, `editorTypes.ts`, `AuthorQuestion.tsx` (383 lines), `authoring.ts` | Per-type booleans                       |
| Host chrome                                                                                  | `QuestionDetails`, `QuestionRail` thumbnails, `AddQuestionModal`, `CanvasToolbar`        | Nested ternaries                        |
| AI prompt, CSS                                                                               | `aiPrompt.ts`, `type-*` and `art-*` classes                                              | Per-type text and rules                 |

Root causes:

1. `Question` is one wide object with optional fields for every type.
2. Knowledge about a type is organised by **concern** (validation, results, UI) instead of by **type**.
3. Server and client cannot share code, so the rules are copied.

## 2. Target design

Organise by type. Each type is a folder with a **definition** (pure logic, shared by browser and server) and a **UI** (React, browser only). A **platform layer** owns what every question shares and calls the type through a fixed contract.

```text
src/questions/
  platform/                 Shared by every type; never mentions a specific kind
    types.ts                QuestionBase, QuestionDefinition, QuestionUI contracts
    define.ts               defineQuestion() / defineQuestionUI() helpers
    fields.ts               Common fields: id, title, description, revealMode, competitive, showRanking
    errors.ts               QuestionError with the user-facing message
    envelope.ts             Session export / import wrapper, limits (30 questions, 128 KB)
    scoring.ts              Flat and speed-weighted scoring helpers
  registry.ts               Imports every definition; exports Kind, definitions, lookup
  registry.ui.tsx           Imports every UI; typed so each Kind must have one
  types/
    poll/
      definition.ts         Isomorphic logic (no React, no DOM)
      ui.tsx                Input, Results, Thumbnail, Editor sections, icon
      poll.test.ts          Optional extras; contract tests run automatically
    quiz/  truefalse/  twotruths/  manyoptions/  ranking/  points100/
    slider/  grid2x2/  cloud/  text/  qna/  peerpraise/  slide/
  _template/                Copy to start a new type
```

`Kind` is **derived** from the registry (`keyof typeof definitions`), never written by hand.

### 2.1 Platform layer (shared, type-agnostic)

- Session and room lifecycle: start, select, pause, reveal, hide, ranking, podium, end.
- Participants, tokens, one-answer-per-question rule, timing, leaderboard, reactions.
- Common question fields and the export / import envelope.
- Crowd (player-made) session flow, which asks the registry which kinds are authorable.
- Host and participant shells: rail, canvas, toolbar, stage frame, answer form frame, submit button, result frame.
- It dispatches through the registry only. It must not compare `question.type` to a literal.

### 2.2 Definition contract (`definition.ts`, isomorphic)

```ts
export const poll = defineQuestion({
  kind: "poll",
  meta: { label, hint, group: "opinion" | "scored" | "content" },
  traits: {
    collectsAnswers: true,
    revealMode: "host" | "live" | "none",   // replaces hasRevealMode / defaultRevealMode
    scoring: false,                         // replaces canCompete
    optionsVisibleWhenHidden: true,         // replaces optionKinds
    frameVisibleWhenHidden: false,          // replaces frameKinds
    playerAuthorable: true,                 // replaces the crowd exclusions
    submissions: "one" | "many",            // cloud allows several
  },
  create(): Poll,                           // sample question (replaces newQuestion branch)
  parse(raw, ctx): Poll,                    // validate + normalise; the ONLY validator, used by
                                            // import, room create, and player authoring
  serialize(q): Record<string, unknown>,    // type-specific export fields
  answer: {
    parse(q, raw): PollAnswer,              // replaces the submitVote branch
    describe(q, a): string,                 // replaces describeAnswer branch
    simulate(q, rng): PollAnswer,           // replaces simulation.mjs case
  },
  results: {
    aggregate(q, answers, ctx): ResultRow[],// replaces the results() branch
    preview(q): ResultRow[],                // replaces ResultsVisual sample data
  },
  score?(q, answer, timing): number,        // only scored types
  server?: { onStart?, actions? },          // narrow hooks for room-bound behaviour
  prompt: { fields: "...", example: {...} },// feeds the AI prompt
});
```

Type-specific settings (`pollDisplay`, `maxSubmissions`, `voteColors`, `sliderMin`...) live in that type's own interface. `Question` becomes a discriminated union generated from the registry, so a poll no longer carries slider fields.

Hooks for rare room-bound behaviour (Q&A upvotes, peer-praise assignment, multi-submit cloud) are optional members of `server`. The platform calls them if present. No `if (type === "qna")` in the platform.

### 2.3 UI contract (`ui.tsx`, browser only)

```ts
export const pollUI = defineQuestionUI<"poll">({
  icon: BarChart3,
  Thumbnail,                 // rail art (replaces QuestionRail ternary)
  Input,                     // participant input; owns its draft, reports onChange(answer | undefined)
  Results,                   // stage visual; also renders the preview and concealed states
  editor: [PollOptions, PollDisplay],   // sections appended to the editor
  author?: ...,              // optional player-authoring form; defaults to the editor sections
  emptyMessage?: string,
});
```

`registry.ui.tsx` is typed `{ [K in Kind]: QuestionUI<K> }`. A definition without a UI fails `tsc -b`.

The participant controller stops holding per-type draft state. `Input` owns it and calls `onChange(answer)`; `undefined` means "not ready to submit". The platform renders the submit button and sends the value.

### 2.4 Server and browser sharing

The server is plain `.mjs` and today cannot import TypeScript, which is why rules were copied. Node 22.18+ and 24 strip types by default, and `tsconfig.app.json` already sets `allowImportingTsExtensions` and `erasableSyntaxOnly`. So `server/*.mjs` imports `src/questions/registry.ts` directly with explicit `.ts` extensions.

Rules for `definition.ts` and `platform/`:

- Erasable TypeScript only (already enforced by `erasableSyntaxOnly`).
- No React, DOM, or browser globals, enforced by a `tsconfig.shared.json` with `lib: ["ES2023"]` and no DOM types.
- Relative imports use `.ts` extensions.

Fallback if the Node requirement is unacceptable: emit the shared folder to `.mjs` in a build step. Decide in Phase 1.

## 3. Guarantees: no missed pieces

1. **Compile time:** `Kind` comes from the registry and the UI map is `Record<Kind, QuestionUI>`. `defineQuestion` requires every contract member.
2. **Contract test** (`src/questions/registry.test.ts`, run by `npm test`) loops over every registered type and asserts:
   - `create()` passes its own `parse()`;
   - export, import, and export again is stable;
   - `simulate()` output passes `answer.parse()`;
   - `aggregate()` over simulated answers returns well-formed rows;
   - invalid answers are rejected with a message;
   - `describe()` and `preview()` return non-empty values;
   - traits are consistent (`scoring` implies a `score()` and a `correct` field).
3. **Boundary check:** a test fails if any file outside `src/questions/` compares `.type` or `.kind` to a question-kind literal. This stops the old pattern from creeping back.
4. **Wire format frozen:** saved sessions, exports (`pulse-session` v1), and localStorage keep working. Golden fixtures enforce it.

## 4. Migration phases

Each phase is behaviour-preserving and ends with `npm test`, `npm run build`, `npm run lint`, and `npm run test:e2e` green. Use a strangler approach: the registry answers first, the legacy chain handles anything not migrated yet.

| Phase                          | Work                                                                                                                                                                                                                                               | Exit check                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 0. Safety net                  | Record baseline test results. Add golden fixtures: export JSON, `results()` output, and `submitVote` accept/reject cases for all 14 kinds.                                                                                                         | Fixtures pass on current code                                            |
| 1. Skeleton                    | Create `src/questions/platform`, `registry.ts`, `defineQuestion`, the contract test, and `tsconfig.shared.json`. Prove `server/*.mjs` can import `.ts` (spike). Add `engines.node`.                                                                | Empty registry builds; server boots; contract test runs                  |
| 2. Pilot: `truefalse`          | Move one simple type through every seam (definition and UI). Switch each seam to "registry first, legacy fallback".                                                                                                                                | All suites green; the seam list in section 1 is fully wired for one type |
| 3. Migrate the rest in batches | Choice: `poll`, `quiz`, `twotruths`, `manyoptions`. Ordering: `ranking`, `points100`. Numeric: `slider`, `grid2x2`. Text: `cloud`, `text`, `qna`, `peerpraise`. Content: `slide`. One PR per batch, each deleting the legacy branches it replaces. | Per batch: fixtures and e2e green; legacy code for those kinds removed   |
| 4. Retire legacy               | Remove the fallback paths. Shrink `model.ts` to session and room types. Delete `constants/kinds.ts` per-kind tables and `rooms.mjs` duplicates. Make `Question` the discriminated union.                                                           | Boundary check passes with zero exceptions                               |
| 5. Authoring and unification   | Reuse editor sections for player authoring (`mode: "host" \| "player"`). Move per-type CSS into each type folder. Add the `npm run new:question <kind>` scaffold from `_template/`. Final README pass.                                             | A dummy type added from the scaffold works end to end                    |

Suggested batch order inside Phase 3 follows increasing special-casing, so the contract is stressed gradually: `truefalse`, `poll`, `quiz`, `twotruths`, `ranking`, `points100`, `slider`, `grid2x2`, `manyoptions`, `cloud`, `text`, `slide`, `peerpraise`, `qna`.

## 5. Acceptance test for the whole effort

Add a throwaway 15th type (for example `rating`) using only the scaffold. It must appear in the add menu, edit, export / import, run live, simulate, score if flagged, and show results with **zero edits outside `src/questions/types/rating/` and `registry*.ts`** (the two registry lines). Then delete it.

## 6. Risks and open decisions

| Item                         | Notes                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node version                 | Direct `.ts` imports need Node 22.18+ or 24. Local is 24.3. Add `engines` and check the deploy target. Fallback: build step.                                                          |
| Server importing from `src/` | Acceptable because `src/questions` is isomorphic. If preferred, move it to a top-level `shared/` folder; it is a path change only.                                                    |
| `Question` as a union        | Touches every consumer type. Land it in Phase 4 after the code paths are already per-type.                                                                                            |
| Participant draft ownership  | Moving draft state out of `useParticipantController` changes component lifecycles. Cover with the existing e2e flows (`audience-flow`, `slider`, `many-options`, `multiple-options`). |
| Crowd authoring              | `AuthorQuestion` has its own per-type forms. Phase 5 decides between reusing editor sections and keeping a small `author` UI per type.                                                |
| Per-type CSS                 | The README requires global CSS in `styles/`. Phase 5 may allow a CSS file per type folder, imported by its `ui.tsx`.                                                                  |
| Wire compatibility           | Never rename stored fields. Defaults for missing fields must match today's.                                                                                                           |

## 7. Outcome

What was built, and where it differs from the plan above.

- **Logic layer:** `src/questions/platform/` plus one `definition.ts` per kind. `server/rooms.mjs`, `server/simulation.mjs`, `server/index.mjs`, `src/model.ts` (about 800 lines down to about 190) and `src/aiPrompt.ts` read only from the registry.
- **UI layer:** instead of one `ui.tsx`, the browser side has five seams, each typed `Record<Kind, …>` in `src/questions/ui/`: meta (`ui.tsx`), results, input, editor and crowd author. A type that skips a seam does not compile.
- **Capabilities are traits** (`collectsAnswers`, `scored`, `revealMode`, `resultsAlwaysVisible`, `playerAuthorable`, `assignsTargets`, `upvotes`, `optionsVisibleWhenHidden`, `frameVisibleWhenHidden`) so generic screens ask "does this type do X" instead of naming types.
- **Safety nets:** `server/questions.golden.test.mjs` (old behaviour recorded before the migration) and `server/questions.contract.test.mjs` (per-kind contract plus the boundary check, now with no exceptions).
- **Acceptance test passed:** a throwaway 15th type (a copy of `text`) needed only its own folder plus two lines in each of six registries. Leaving out a UI seam gave exactly one compile error per missing seam. Its contract tests ran automatically. The type was then removed.
- **Scaffold:** `npm run new:question -- <kind> --template text|choice` (`scripts/new-question.mjs`, templates in `scripts/question-templates/`). Open items are marked `TODO(new-question)` and `npm test` fails until they are resolved. The AI procedure is in `AGENTS.md`.
- **Not done:** `Question` is still a wide record rather than a discriminated union; per-type CSS stays in `styles/`.
- **E2E:** all 22 specs pass. `e2e/backup.spec.ts` was updated to also compare `pollDisplay` and `maxSubmissions`, which the export has always carried.
