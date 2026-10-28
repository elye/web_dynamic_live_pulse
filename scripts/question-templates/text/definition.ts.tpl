import {
  defineQuestion,
  parseText,
  pick,
  tallyText,
} from "../../platform/define.ts";
import { sentences } from "../../platform/samples.ts";

export const __KIND__ = defineQuestion({
  kind: "__KIND__",
  // TODO(new-question): label and hint appear in the add-question menu and the editor.
  label: "__LABEL__",
  hint: "TODO(new-question): one line shown when adding this question",
  tagline: "TODO(new-question): one line under the title on the stage.",
  // TODO(new-question): set `traits` only where this type differs from the defaults in
  // platform/define.ts (scored, revealMode, resultsAlwaysVisible, playerAuthorable, ...).
  options: null,
  // TODO(new-question): `settings`, `parse()` and `serialize()` are needed only if this type
  // adds fields. Add each field to QuestionRecord in platform/types.ts, list it in
  // `settings`, validate it in parse() and write it in serialize(). See AGENTS.md.
  create: () => ({
    title: "TODO(new-question): a sample question title",
    options: [],
    correct: null,
  }),
  answer: {
    parse: (_question, value) => parseText(value, 280),
    describe: (_question, answer) => String(answer),
    simulate: (_question, random) => pick(random, sentences),
  },
  results: { aggregate: (_question, values) => tallyText(values) },
  // TODO(new-question): the AI prompt text. Name every field the importer accepts and its
  // limits. The example JSON in the prompt is generated from create(), so keep it valid.
  prompt: {
    purpose:
      "TODO(new-question): what this slide does and when an author should use it.",
    rules: "options: []. correct: null.",
  },
});
