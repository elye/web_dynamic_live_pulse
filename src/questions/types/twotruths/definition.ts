import { parseChoice, simulateChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  describeLetters,
  tallyChoices,
} from "../../platform/define.ts";

/** Two truths and a lie always asks the same question. */
export const twoTruthsTitle = "Pick the one that is not true.";

export const twotruths = defineQuestion({
  kind: "twotruths",
  label: "Two truths and a lie",
  hint: "Two true statements and one lie. Spot the lie",
  tagline: "Two truths and a lie. Who can spot it?",
  traits: {
    scored: true,
    defaultRevealMode: "onDone",
    optionsVisibleWhenHidden: true,
  },
  fixedTitle: twoTruthsTitle,
  options: {
    min: 3,
    max: 3,
    maxLength: 200,
    message:
      "Two truths and a lie needs exactly 3 nonempty statements, up to 200 characters each.",
  },
  create: () => ({
    title: twoTruthsTitle,
    options: [
      "I have climbed a mountain.",
      "I speak three languages.",
      "I have met a famous person.",
    ],
    correct: 2,
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
  author: {
    toRaw: (input) => ({ options: input.options, correct: input.correct }),
  },
  prompt: {
    purpose:
      "Two truths and a lie. Participants pick the statement that is not true. Scored and ranked.",
    rules:
      'title must be exactly "Pick the one that is not true." options: exactly 3 statements (max 200 characters each). "correct": zero-based index of the false statement (REQUIRED). Optional competitive, showRanking, revealMode as for quiz.',
  },
});
