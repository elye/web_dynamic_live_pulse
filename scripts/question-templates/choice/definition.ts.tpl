import { parseChoice, simulateChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  describeLetters,
  tallyChoices,
} from "../../platform/define.ts";

export const __KIND__ = defineQuestion({
  kind: "__KIND__",
  // TODO(new-question): label and hint appear in the add-question menu and the editor.
  label: "__LABEL__",
  hint: "TODO(new-question): one line shown when adding this question",
  tagline: "TODO(new-question): one line under the title on the stage.",
  // TODO(new-question): set `traits` only where this type differs from the defaults in
  // platform/define.ts (scored, revealMode, resultsAlwaysVisible, playerAuthorable, ...).
  traits: { optionsVisibleWhenHidden: true },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty answer options, up to 100 characters each.",
  },
  // TODO(new-question): `settings`, `parse()` and `serialize()` are needed only if this type
  // adds fields. Add each field to QuestionRecord in platform/types.ts, list it in
  // `settings`, validate it in parse() and write it in serialize(). See AGENTS.md.
  create: () => ({
    title: "TODO(new-question): a sample question title",
    options: ["First option", "Second option", "Third option"],
    correct: null,
  }),
  answer: {
    parse: (question, value) =>
      parseChoice(value, question.options.length, false),
    describe: describeLetters,
    simulate: simulateChoice,
  },
  results: {
    aggregate: (question, values) => tallyChoices(question.options, values),
  },
  author: { toRaw: (input) => ({ options: input.options }) },
  // TODO(new-question): the AI prompt text. Name every field the importer accepts and its
  // limits. The example JSON in the prompt is generated from create(), so keep it valid.
  prompt: {
    purpose:
      "TODO(new-question): what this slide does and when an author should use it.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
});
