import { parseChoice, simulateChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  describeLetters,
  parseMultiple,
  tallyChoices,
} from "../../platform/define.ts";
import type { PollDisplay } from "../../platform/types.ts";

export const pollDisplays: PollDisplay[] = ["list", "pie", "stacked", "bar"];

export const poll = defineQuestion({
  kind: "poll",
  label: "Multiple choice",
  hint: "Let everyone pick their favorite",
  tagline: "Different perspectives. One shared picture.",
  traits: { optionsVisibleWhenHidden: true },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty answer options, up to 100 characters each.",
  },
  settings: ["multiple", "pollDisplay"],
  create: () => ({
    title: "What should we focus on next?",
    options: [
      "Fresh ideas",
      "Team connection",
      "Learning something new",
      "Making things happen",
    ],
    correct: null,
    multiple: false,
    pollDisplay: "list",
  }),
  parse({ multiple, pollDisplay }) {
    if (
      pollDisplay !== undefined &&
      !(pollDisplays as unknown[]).includes(pollDisplay)
    )
      throw new Error("pollDisplay must be list, pie, stacked, or bar.");
    return {
      multiple: parseMultiple(multiple),
      pollDisplay: (pollDisplay as PollDisplay | undefined) ?? "list",
    };
  },
  serialize: ({ multiple, pollDisplay }) => ({
    multiple: multiple === true,
    pollDisplay: pollDisplay ?? "list",
  }),
  answer: {
    parse: (question, value) =>
      parseChoice(value, question.options.length, question.multiple === true),
    describe: describeLetters,
    simulate: simulateChoice,
  },
  results: {
    aggregate: (question, values) => tallyChoices(question.options, values),
  },
  author: {
    toRaw: (input) => ({
      options: input.options,
      multiple: input.multiple === true,
    }),
  },
  prompt: {
    purpose:
      "Multiple choice poll with no correct answer. Participants pick one option, or several when multiple is true.",
    rules:
      'options: 2-6 strings (max 100 characters each). correct: null. Optional: multiple (boolean, default false; true lets participants select more than one option). Optional pollDisplay ("list", "pie", "stacked", or "bar", default "list") controls the results visualization.',
  },
});
